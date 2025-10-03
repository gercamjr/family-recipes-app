const express = require('express')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Custom multer storage for Cloudinary v2
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})

// @route   POST /api/upload/:recipeId
// @desc    Upload media for a recipe
// @access  Private (recipe owner or editor/admin)
router.post('/:recipeId', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    const canUpload = req.user.role === 'admin' || req.user.role === 'editor' || req.user.id === recipe.authorId
    if (!canUpload) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'family-recipes',
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          return res.status(500).json({ error: 'Failed to upload file' })
        }

        // Determine media type
        const isVideo = result.resource_type === 'video'
        const mediaType = isVideo ? 'video' : 'image'

        // Save media record to database
        const media = await prisma.media.create({
          data: {
            url: result.secure_url,
            type: mediaType,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            recipeId,
          },
        })

        res.status(201).json({
          message: 'File uploaded successfully',
          media,
        })
      }
    )

    // Pipe the buffer to Cloudinary
    const bufferStream = require('stream').Readable.from(req.file.buffer)
    bufferStream.pipe(uploadStream)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// @route   DELETE /api/upload/:mediaId
// @desc    Delete media
// @access  Private (recipe owner or admin)
router.delete('/:mediaId', authenticateToken, async (req, res) => {
  try {
    const mediaId = parseInt(req.params.mediaId)

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { recipe: true },
    })

    if (!media) {
      return res.status(404).json({ error: 'Media not found' })
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || req.user.id === media.recipe.authorId
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete from Cloudinary
    const publicId = media.url.split('/').pop().split('.')[0]
    await cloudinary.uploader.destroy(`family-recipes/${publicId}`)

    // Delete from database
    await prisma.media.delete({ where: { id: mediaId } })

    res.json({ message: 'Media deleted successfully' })
  } catch (error) {
    console.error('Delete media error:', error)
    res.status(500).json({ error: 'Failed to delete media' })
  }
})

module.exports = router
