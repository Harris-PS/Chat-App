import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome Back</h2>
        <p className="text-gray-600 mb-8">Sign in to start chatting</p>
        
        <button 
          onClick={login}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold py-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-3"
        >
          <span>🔐</span> Log In / Sign Up
        </button>
      </div>
    </div>
  )
}

export default Login
