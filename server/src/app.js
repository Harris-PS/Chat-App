const express = require('express')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())

const healthRoutes = require('./routes/health.routes')

app.use('/api', healthRoutes)

module.exports = app