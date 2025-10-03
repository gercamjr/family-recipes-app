const request = require('supertest')
const app = require('../server')
const { verifyPassword } = require('../utils/auth')
const jwt = require('jsonwebtoken')

jest.mock('../lib/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  recipe: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}))
const prisma = require('../lib/prisma')

jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(() => 'hashed-password'),
  generateToken: jest.fn(() => 'fake-token'),
}))

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}))

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('POST /api/auth/register', () => {
    it('should register a new user with a valid invite token', async () => {
      const inviteToken = 'valid-invite-token'
      const inviter = {
        id: 2,
        email: 'inviter@example.com',
        name: 'Inviter User',
        role: 'EDITOR',
        inviteToken: inviteToken,
        inviteTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      }
      const newUser = {
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'VIEWER',
      }

      // Mock the database calls
      // 1. Find the inviter by token
      prisma.user.findFirst.mockResolvedValueOnce(inviter)
      // 2. Check if new user's email already exists
      prisma.user.findFirst.mockResolvedValueOnce(null)
      // 3. Create the new user
      prisma.user.create.mockResolvedValue(newUser)
      // 4. Update the inviter's token
      prisma.user.update.mockResolvedValue(inviter)

      const res = await request(app).post('/api/auth/register').send({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        inviteToken: inviteToken,
      })

      expect(res.statusCode).toEqual(201)
      expect(res.body).toHaveProperty('token')
      expect(res.body.user).toEqual({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      })
    })

    it('should return 400 if the invite token is invalid or expired', async () => {
      const inviteToken = 'invalid-invite-token'

      // Mock the database to find no user with the given token
      prisma.user.findFirst.mockResolvedValue(null)

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        inviteToken: inviteToken,
      })

      expect(res.statusCode).toEqual(400)
      expect(res.body).toHaveProperty('error', 'Invalid or expired invite token')
    })

    it('should return 400 if the email is already in use', async () => {
      const inviteToken = 'valid-invite-token'
      const inviter = {
        id: 2,
        email: 'inviter@example.com',
        name: 'Inviter User',
        role: 'EDITOR',
        inviteToken: inviteToken,
        inviteTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
      const existingUser = {
        id: 3,
        email: 'test@example.com',
        name: 'Existing User',
      }

      // 1. Find the inviter by token
      prisma.user.findFirst.mockResolvedValueOnce(inviter)
      // 2. Find the existing user by email
      prisma.user.findUnique.mockResolvedValueOnce(existingUser)

      const res = await request(app).post('/api/auth/register').send({
        email: existingUser.email,
        password: 'password123',
        name: 'Test User',
        inviteToken: inviteToken,
      })

      expect(res.statusCode).toEqual(400)
      expect(res.body).toHaveProperty('error', 'Email already registered')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login a user with correct credentials and return a token', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'VIEWER',
        languagePref: 'en',
        isActive: true,
      }

      // Mock findFirst to return the user
      prisma.user.findFirst.mockResolvedValue(user)
      // Mock password verification to succeed
      verifyPassword.mockResolvedValue(true)

      const res = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'password123',
      })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('message', 'Login successful')
      expect(res.body.user).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
        languagePref: user.languagePref,
      })
      // Ensure password verification was called correctly
      expect(verifyPassword).toHaveBeenCalledWith('password123', user.passwordHash)
    })

    it('should return 401 for a non-existent user', async () => {
      // Mock findFirst to return null
      prisma.user.findFirst.mockResolvedValue(null)

      const res = await request(app).post('/api/auth/login').send({
        email: 'nouser@example.com',
        password: 'password123',
      })

      expect(res.statusCode).toEqual(401)
      expect(res.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should return 401 for incorrect password', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        isActive: true,
      }

      // Mock findFirst to return the user
      prisma.user.findFirst.mockResolvedValue(user)
      // Mock password verification to fail
      verifyPassword.mockResolvedValue(false)

      const res = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'wrongpassword',
      })

      expect(res.statusCode).toEqual(401)
      expect(res.body).toHaveProperty('error', 'Invalid credentials')
      expect(verifyPassword).toHaveBeenCalledWith('wrongpassword', user.passwordHash)
    })

    it('should return 401 for an inactive user', async () => {
      // The route logic looks for `isActive: true`, so an inactive user will not be found.
      prisma.user.findFirst.mockResolvedValue(null)

      const res = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: 'password123',
      })

      expect(res.statusCode).toEqual(401)
      expect(res.body).toHaveProperty('error', 'Invalid credentials')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return the current user profile for an authenticated user', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        role: 'viewer',
        languagePref: 'en',
        createdAt: new Date().toISOString(),
        isActive: true,
      }
      const token = 'fake-valid-token'

      // Mock jwt.verify to return the decoded payload
      jwt.verify.mockReturnValue({ id: user.id })

      // Mock prisma to find the full user object
      prisma.user.findUnique.mockResolvedValue(user)

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'viewer',
        languagePref: 'en',
        createdAt: expect.any(String),
      })
    })

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me')

      expect(res.statusCode).toEqual(401)
    })

    it('should return 403 if the token is invalid', async () => {
      const token = 'fake-invalid-token'

      // Mock jwt.verify to throw an error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

      expect(res.statusCode).toEqual(403)
    })
  })

  describe('POST /api/auth/invite', () => {
    it('should return 400 for invalid email in invite', async () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
      }
      const token = 'fake-admin-token'

      // Mock jwt.verify to return the decoded payload
      jwt.verify.mockReturnValue({ id: adminUser.id })
      // Mock prisma to find the admin user
      prisma.user.findUnique.mockResolvedValue(adminUser)

      const res = await request(app).post('/api/auth/invite').set('Authorization', `Bearer ${token}`).send({
        email: 'invalid-email',
      })

      expect(res.statusCode).toEqual(400)
      expect(res.body).toHaveProperty('errors')
    })

    it('should generate invite token successfully', async () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
      }
      const token = 'fake-admin-token'
      const inviteEmail = 'newuser@example.com'

      // Mock jwt.verify to return the decoded payload
      jwt.verify.mockReturnValue({ id: adminUser.id })
      // Mock prisma to find the admin user
      prisma.user.findUnique.mockResolvedValueOnce(adminUser)
      // Mock check for existing user (should return null)
      prisma.user.findUnique.mockResolvedValueOnce(null)
      // Mock update for storing the token
      prisma.user.update.mockResolvedValue({
        ...adminUser,
        inviteToken: 'generated-token',
        inviteTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const res = await request(app).post('/api/auth/invite').set('Authorization', `Bearer ${token}`).send({
        email: inviteEmail,
      })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty('message', 'Invitation sent successfully')
      expect(res.body).toHaveProperty('expiresAt')
    })
  })
})
