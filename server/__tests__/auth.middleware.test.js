const authMiddleware = require('../src/middlewares/auth.middleware')

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

const jwt = require('jsonwebtoken')

function createMockRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('auth.middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  test('responds 401 when Authorization header is missing', () => {
    const req = { headers: {} }
    const res = createMockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' })
    expect(next).not.toHaveBeenCalled()
  })

  test('responds 401 when token is invalid (jwt.verify throws)', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } }
    const res = createMockRes()
    const next = jest.fn()

    jwt.verify.mockImplementation(() => { throw new Error('invalid') })

    authMiddleware(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('badtoken', process.env.JWT_SECRET)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(next).not.toHaveBeenCalled()
  })

  test('sets req.userId and calls next when token is valid', () => {
    const req = { headers: { authorization: 'Bearer goodtoken' } }
    const res = createMockRes()
    const next = jest.fn()

    jwt.verify.mockReturnValue({ userId: 123 })

    authMiddleware(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('goodtoken', process.env.JWT_SECRET)
    expect(req.userId).toBe(123)
    expect(next).toHaveBeenCalled()
  })

  test('uses the second segment of the Authorization header as token', () => {
    const req = { headers: { authorization: 'Token gpfx abc.def.ghi' } }
    const res = createMockRes()
    const next = jest.fn()

    jwt.verify.mockReturnValue({ userId: 7 })

    authMiddleware(req, res, next)

    // Should split on space and take index 1
    expect(jwt.verify).toHaveBeenCalledWith('gpfx', process.env.JWT_SECRET)
    expect(req.userId).toBe(7)
    expect(next).toHaveBeenCalled()
  })

  test('handles unexpected decoded payload without userId by calling next without setting req.userId', () => {
    const req = { headers: { authorization: 'Bearer token' } }
    const res = createMockRes()
    const next = jest.fn()

    jwt.verify.mockReturnValue({})

    authMiddleware(req, res, next)

    expect(req.userId).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })
})
