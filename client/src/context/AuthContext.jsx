import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { 
    user, 
    loginWithRedirect, 
    logout: auth0Logout, 
    getAccessTokenSilently, 
    isAuthenticated,
    isLoading 
  } = useAuth0()
  
  const [token, setToken] = useState(null)

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently()
          setToken(accessToken)
        } catch (error) {
          console.error('Error getting access token:', error)
        }
      } else {
        setToken(null)
      }
    }
    getToken()
  }, [isAuthenticated, getAccessTokenSilently])

  const login = async () => {
    console.log("Login button clicked")
    try {
      await loginWithRedirect()
      console.log("Redirect initiated")
    } catch (e) {
      console.error("Login redirect error:", e)
    }
  }
  
  const logout = () => {
    setToken(null)
    auth0Logout({ logoutParams: { returnTo: window.location.origin } })
  }

  // Show nothing while loading SDK
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Auth0...</div>
  }

  return (
    <AuthContext.Provider value={{ token, user: user ? { ...user, id: user.sub } : null, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
