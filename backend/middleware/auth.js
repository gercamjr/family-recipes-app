const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({ where: { id: decoded.id } })
      if (user && user.isActive) {
        req.user = user
      }
    } catch (error) {
      // Invalid token, but don't fail - just continue without user
      console.error('Optional auth JWT verification error:', error)
    }
  }

  next()
}

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
}
