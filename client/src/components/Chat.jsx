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

  const [showChatOnMobile, setShowChatOnMobile] = useState(false)

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser)
    const newRoomId = createRoomId(user.id, selectedUser.id)
    setRoomId(newRoomId)
    setMessages([]) 
    setShowChatOnMobile(true) // Show chat on mobile when user selected
  }

  const handleBackToUsers = () => {
    setShowChatOnMobile(false)
    setSelectedUser(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 md:p-4">
      <div className="max-w-6xl mx-auto flex gap-0 h-screen md:h-[calc(100vh-2rem)] bg-white md:bg-transparent shadow-none md:shadow-xl rounded-none md:rounded-lg overflow-hidden">
        
        {/* User List Sidebar - Hidden on mobile if chat is active */}
        <div className={`w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-200 md:flex flex-col ${showChatOnMobile ? 'hidden' : 'flex'}`}>
          <UserList onSelectUser={handleSelectUser} selectedUserId={selectedUser?.id} />
        </div>
        
        {/* Chat Area - Hidden on mobile if no user selected */}
        <div className={`flex-1 flex flex-col bg-white ${!showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="bg-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-gray-200 shadow-sm z-10">
            <div className="flex items-center gap-3">
              {/* Back Button for Mobile */}
              <button 
                onClick={handleBackToUsers}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-800"
              >
                ←
              </button>
              
              {selectedUser ? (
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">{selectedUser.email.split('@')[0]}</h2>
                  <p className="text-xs text-gray-500">Chat</p>
                </div>
              ) : (
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Select a user</h2>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:inline text-gray-600 text-sm">👤 {user?.email}</span>
              <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition duration-200 text-xs md:text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`mb-3 p-3 rounded-lg max-w-[85%] md:max-w-[70%] text-sm md:text-base shadow-sm ${
                        msg.sender_id === user?.id || msg.userId === user?.id
                          ? 'bg-indigo-500 text-white ml-auto rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="break-words">{msg.message || msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
                <div className="flex gap-2 md:gap-3">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 md:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm md:text-base"
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full font-semibold transition duration-200 text-sm md:text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!message.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400 p-8">
                <p className="text-4xl mb-4">💬</p>
                <p className="text-lg">Select a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
