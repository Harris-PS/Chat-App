const express = require('express')
const router = express.Router()

const { getAllUsers } = require('../controllers/user.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// router.post('/register', registerUser) // Handled by Auth0
// router.post('/login', loginUser) // Handled by Auth0

router.get('/', authMiddleware, getAllUsers)

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    userId: req.userId,
  })
})


module.exports = router
