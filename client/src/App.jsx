
import Chat from './components/Chat.jsx'
import Login from './components/Login.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function AppContent() {
  const { token } = useAuth()
  
  return token ? <Chat /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
