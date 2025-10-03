const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { hashPassword, verifyPassword, generateToken, generateInviteToken } = require('../utils/auth')
// const nodemailer = require('nodemailer')
const prisma = require('../lib/prisma')
const router = express.Router()

// Email transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// })

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('inviteToken').notEmpty(),
  body('languagePref').optional().isIn(['en', 'es']),
]

const validateLogin = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()]

// @route   POST /api/auth/register
// @desc    Register new user (invite-only)
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, name, inviteToken, languagePref = 'en' } = req.body

    // Find user with valid invite token
    const inviter = await prisma.user.findFirst({
      where: {
        inviteToken: inviteToken,
        inviteTokenExpires: {
          gt: new Date(),
        },
      },
    })

    if (!inviter) {
      return res.status(400).json({ error: 'Invalid or expired invite token' })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'viewer', // Default role
        invitedById: inviter.id,
        languagePref,
      },
    })

    // Clear the used invite token
    await prisma.user.update({
      where: { id: inviter.id },
      data: {
        inviteToken: null,
        inviteTokenExpires: null,
      },
    })

    // Generate JWT
    const token = generateToken(user)

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        languagePref: user.languagePref,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findFirst({ where: { email, isActive: true } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        languagePref: user.languagePref,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// @route   POST /api/auth/invite
// @desc    Send invitation (admin only)
// @access  Private (Admin)
router.post(
  '/invite',
  authenticateToken,
  requireRole(['admin']),
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email } = req.body
      const inviterId = req.user.id

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered or invited' })
      }

      // Generate invite token
      const inviteToken = generateInviteToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Store token in the inviter's record
      await prisma.user.update({
        where: { id: inviterId },
        data: {
          inviteToken,
          inviteTokenExpires: expiresAt,
        },
      })

      // TODO: Send invitation email with token

      res.json({
        message: 'Invitation token generated and assigned to you. Share it with the user.',
        inviteToken,
        expiresAt,
      })
    } catch (error) {
      console.error('Invite error:', error)
      res.status(500).json({ error: 'Failed to generate invitation' })
    }
  }
)

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      languagePref: req.user.languagePref,
      createdAt: req.user.createdAt,
    },
  })
})

module.exports = router
