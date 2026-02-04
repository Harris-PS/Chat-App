const express = require('express')
const cors = require('cors')
const app = express()
const pool = require('./config/db')

app.use(express.json())
app.use(cors())

const userRoutes = require('./routes/user.routes')
app.use('/api/users', userRoutes)

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  })
})

app.use((err, req, res, next) => {
  console.error(err.stack)

  res.status(500).json({
    message: err.message || 'Something went wrong',
  })
})



module.exports = app