require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const runSchema = async () => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    console.log('Running schema update...')
    await pool.query(schemaSql)
    console.log('Database schema updated successfully!')
  } catch (err) {
    console.error('Error running schema:', err)
  } finally {
    await pool.end()
  }
}

runSchema()
