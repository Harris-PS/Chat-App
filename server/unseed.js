require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const unseedUsers = async () => {
  try {
    console.log('Removing dummy users...')
    // Delete by the specific dummy IDs we used
    await pool.query("DELETE FROM users WHERE id IN ('auth0|dummy_alice', 'auth0|dummy_bob')")
    console.log('Dummy users removed.')
  } catch (err) {
    console.error('Error cleaning users:', err)
  } finally {
    await pool.end()
  }
}

unseedUsers()
