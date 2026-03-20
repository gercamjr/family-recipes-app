const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const path = require('path')

// Load environment variables from root .env.local if available (dev), then .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
require('dotenv').config()

const app = express()

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://family-recipes-app-geracamodev.vercel.app',
      'https://family-recipes-app.vercel.app',
      'https://family-recipes-app-blue.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ]

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) === -1) {
      // Check if it's a vercel preview deployment
      if (origin.endsWith('.vercel.app') && origin.includes('family-recipes-app')) {
        return callback(null, true)
      }

      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true,
}

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Enable pre-flight across-the-board

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes (to be implemented)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/recipes', require('./routes/recipes'))
app.use('/api/comments', require('./routes/comments'))
app.use('/api/favorites', require('./routes/favorites'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/share', require('./routes/share'))
app.use('/api/recipes/ocr', require('./routes/ocr'))

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
  })
})

const PORT = process.env.PORT || 5001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

module.exports = app
