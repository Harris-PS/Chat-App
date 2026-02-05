import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

function UserList({ onSelectUser, selectedUserId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-l-lg shadow-lg p-4 w-64 border-r border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Users</h3>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-l-lg shadow-lg p-4 w-64 border-r border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">💬 Chats</h3>
      
      {users.length === 0 ? (
        <div className="text-gray-500 text-sm">No users available</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full text-left px-3 py-3 rounded-lg transition duration-200 ${
                selectedUserId === user.id
                  ? 'bg-indigo-100 border-2 border-indigo-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserList
