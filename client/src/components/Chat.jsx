import { useEffect, useRef, useState } from 'react'
import createSocket from '../socket'
import { useAuth } from '../context/AuthContext'
import UserList from './UserList'

function Chat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [socket, setSocket] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const bottomRef = useRef(null)
  const { token, user } = useAuth()

  // Helper function to create consistent room ID for 1-1 chat
  const createRoomId = (userId1, userId2) => {
    const ids = [userId1, userId2].sort()
    return `chat_${ids[0]}_${ids[1]}`
  }

  useEffect(() => {
    // Only connect if we have a token
    if (!token) {
      console.log('No token available, cannot connect to socket')
      return
    }

    // Create authenticated socket connection
    const newSocket = createSocket(token, user?.email)
    setSocket(newSocket)

    // Handle connection errors
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [token])

  useEffect(() => {
    if (!socket || !roomId) return

    // Join room when socket is ready and user is selected
    socket.emit('join_room', roomId)
    
    // Request chat history
    socket.emit('load_messages', roomId)

    const handleReceive = (data) => {
      setMessages((prev) => [...prev, data])
    }

    const handleChatHistory = (messages) => {
      setMessages(messages)
    }

    socket.on('receive_message', handleReceive)
    socket.on('chat_history', handleChatHistory)

    return () => {
      socket.off('receive_message', handleReceive)
      socket.off('chat_history', handleChatHistory)
    }
  }, [socket, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser)
    const newRoomId = createRoomId(user.id, selectedUser.id)
    setRoomId(newRoomId)
    setMessages([]) // Clear messages when switching users
  }

  const sendMessage = () => {
    if (!message.trim() || !socket) return

    socket.emit('send_message', {
      message: message,
      roomId: roomId,
    })

    setMessage('')
  }

  // Show login prompt if no token
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Real-time Chat</h2>
          <p className="text-gray-600">Please log in to use the chat.</p>
        </div>
      </div>
    )
  }
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto flex gap-0 h-[calc(100vh-2rem)]">
        {/* User List Sidebar */}
        <UserList onSelectUser={handleSelectUser} selectedUserId={selectedUser?.id} />
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white rounded-tr-lg shadow-lg px-6 py-4 flex justify-between items-center border-b border-gray-200">
            <div>
              {selectedUser ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedUser.email}</h2>
                  <p className="text-sm text-gray-500">1-1 Chat</p>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-gray-800">Select a user to start chatting</h2>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">👤 {user?.email}</span>
              <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 transform hover:scale-105 text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {selectedUser ? (
            <>
              <div className="bg-white px-6 py-4 flex-1 overflow-y-auto shadow-lg">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`mb-3 p-3 rounded-lg max-w-[70%] ${
                        msg.sender_id === user?.id || msg.userId === user?.id
                          ? 'bg-indigo-500 text-white ml-auto'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="break-words">{msg.message || msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white rounded-br-lg shadow-lg px-6 py-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 transform hover:scale-105"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white flex-1 shadow-lg rounded-br-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-2xl mb-2">👋</p>
                <p>Select a user from the left to start a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
