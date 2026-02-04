const express = require('express')
const router = express.Router()

const { registerUser, loginUser } = require('../controllers/user.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/register', registerUser)
router.post('/login', loginUser)

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    userId: req.userId,
  })
})


module.exports = router
