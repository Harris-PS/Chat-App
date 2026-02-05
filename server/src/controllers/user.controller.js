const pool = require('../config/db')

const getAllUsers = async (req, res, next) => {
  try {
    // req.auth is populated by express-oauth2-jwt-bearer
    const currentUserId = req.auth.payload.sub 
    
    // We want to exclude the current user from the list
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id != $1 ORDER BY email',
      [currentUserId]
    )
    
    res.json({
      users: result.rows
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllUsers,
}