const { registerUser, loginUser } = require('../src/controllers/user.controller')

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

const pool = require('../src/config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

function createMockRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('user.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default env
    process.env.JWT_SECRET = 'test-secret'
  })

  describe('registerUser', () => {
    test('returns 400 when email is missing', async () => {
      const req = { body: { password: 'pass' } }
      const res = createMockRes()
      const next = jest.fn()

      await registerUser(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email and password are required',
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('returns 400 when password is missing', async () => {
      const req = { body: { email: 'a@b.com' } }
      const res = createMockRes()
      const next = jest.fn()

      await registerUser(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email and password are required',
      })
    })

    test('hashes password, inserts user, and returns 201 with user', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      bcrypt.hash.mockResolvedValue('hashed')
      pool.query.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com' }] })

      await registerUser(req, res, next)

      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10)
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
        ['a@b.com', 'hashed']
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: { id: 1, email: 'a@b.com' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('returns 409 when email already exists (error code 23505)', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      bcrypt.hash.mockResolvedValue('hashed')
      const err = new Error('duplicate')
      err.code = '23505'
      pool.query.mockRejectedValue(err)

      await registerUser(req, res, next)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' })
      expect(next).not.toHaveBeenCalled()
    })

    test('delegates unexpected errors to next(error)', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      bcrypt.hash.mockResolvedValue('hashed')
      const err = new Error('db down')
      pool.query.mockRejectedValue(err)

      await registerUser(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })

  describe('loginUser', () => {
    test('returns 400 when email or password missing', async () => {
      const res = createMockRes()
      const next = jest.fn()

      await loginUser({ body: { email: '', password: '' } }, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' })
    })

    test('returns 401 when user not found', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      pool.query.mockResolvedValue({ rows: [] })

      await loginUser(req, res, next)

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, email, password FROM users WHERE email = $1',
        ['a@b.com']
      )
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
    })

    test('returns 401 when password does not match', async () => {
      const req = { body: { email: 'a@b.com', password: 'wrong' } }
      const res = createMockRes()
      const next = jest.fn()

      pool.query.mockResolvedValue({ rows: [{ id: 1, email: 'a@b.com', password: 'hashed' }] })
      bcrypt.compare.mockResolvedValue(false)

      await loginUser(req, res, next)

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hashed')
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
    })

    test('signs JWT and returns token and user on success', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      pool.query.mockResolvedValue({ rows: [{ id: 42, email: 'a@b.com', password: 'hashed' }] })
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue('jwt-token')

      await loginUser(req, res, next)

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 42 },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'jwt-token',
        user: { id: 42, email: 'a@b.com' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('delegates db errors to next(error)', async () => {
      const req = { body: { email: 'a@b.com', password: 'secret' } }
      const res = createMockRes()
      const next = jest.fn()

      const err = new Error('db error')
      pool.query.mockRejectedValue(err)

      await loginUser(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })
})
