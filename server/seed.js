require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const seedUsers = async () => {
  try {
    console.log('Seeding dummy users...')
    
    // Insert Alice
    await pool.query(
      `INSERT INTO users (id, email) 
       VALUES ($1, $2) 
       ON CONFLICT (id) DO UPDATE SET email = $2`,
      ['auth0|dummy_alice', 'alice@example.com']
    )
    console.log('Added Alice (alice@example.com)')

    // Insert Bob
    await pool.query(
      `INSERT INTO users (id, email) 
       VALUES ($1, $2) 
       ON CONFLICT (id) DO UPDATE SET email = $2`,
      ['auth0|dummy_bob', 'bob@example.com']
    )
    console.log('Added Bob (bob@example.com)')

    console.log('Seeding complete! You will see these users in the list.')
  } catch (err) {
    console.error('Error seeding users:', err)
  } finally {
    await pool.end()
  }
}

seedUsers()
