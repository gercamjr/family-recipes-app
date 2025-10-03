const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://family-recipes-app-geracamodev.vercel.app', 'https://family-recipes-app.vercel.app']
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
)

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes (to be implemented)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/recipes', require('./routes/recipes'))
// app.use('/api/comments', require('./routes/comments'));
// app.use('/api/favorites', require('./routes/favorites'));
// app.use('/api/upload', require('./routes/upload'));
// app.use('/api/share', require('./routes/share'));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Error handling middleware
app.use((err, req, res) => {
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
