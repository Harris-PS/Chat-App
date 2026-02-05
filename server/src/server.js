require('dotenv').config()

const http = require('http')
const app = require('./app')
const pool = require('./config/db')
const jwt = require('jsonwebtoken')

const server = http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server, {
  cors: { origin: '*' },
})

// Socket.IO JWT Authentication Middleware
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://dev-75hmnmpo5heusns5.us.auth0.com/.well-known/jwks.json'
});

function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Socket.IO JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  // We trust the client to send their email for display purposes
  // In a production app, fetch this from Auth0 /userinfo
  const email = socket.handshake.auth.email 

  if (!token) {
    return next(new Error('Authentication error: No token provided'))
  }

  jwt.verify(token, getKey, { 
    algorithms: ['RS256'],
    audience: 'http://localhost:3000',
    issuer: 'https://dev-75hmnmpo5heusns5.us.auth0.com/'
  }, async (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message)
      return next(new Error('Authentication error: Invalid token'))
    }
    
    socket.userId = decoded.sub // Auth0 User ID
    
    // Sync user to DB
    try {
      await pool.query(
        'INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [decoded.sub, email || decoded.sub]
      )
    } catch (dbErr) {
      console.error('Error syncing user:', dbErr)
    }

    next()
  })
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'UserId:', socket.userId)

  socket.on('join_room', (roomId) => {
    socket.join(roomId)
    console.log(`Socket ${socket.id} joined room ${roomId}`)
  })

  socket.on('send_message', async (data) => {
    const { roomId, message } = data

    try {
      // Save message to database using authenticated userId
      await pool.query(
        'INSERT INTO messages (content, sender_id, room_id) VALUES ($1, $2, $3)',
        [message, socket.userId, roomId]
      )

      io.to(roomId).emit('receive_message', {
        message,
        roomId,
        userId: socket.userId,
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  })

  socket.on('load_messages', async (roomId) => {
    try {
      const result = await pool.query(
        'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at',
        [roomId]
      )

      socket.emit('chat_history', result.rows)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  })

socket.on('disconnect', () => {
  console.log('User disconnected:', socket.id)
})
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

