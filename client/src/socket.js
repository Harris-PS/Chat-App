import { io } from 'socket.io-client'

// Create socket connection with JWT authentication
const createSocket = (token, email) => {
  return io('http://localhost:3000', {
    auth: {
      token: token,
      email: email
    }
  })
}

export default createSocket