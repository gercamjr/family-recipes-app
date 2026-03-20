const express = require('express')
const multer = require('multer')
const { Readable } = require('stream')
const cloudinary = require('cloudinary').v2
const { authenticateToken } = require('../middleware/auth')
const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true)
    }
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'))
  },
})

// @route   POST /api/recipes/ocr
// @desc    Upload a recipe image for OCR processing
// @access  Private
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'family-recipes/ocr',
        resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
        transformation:
          req.file.mimetype !== 'application/pdf'
            ? [{ width: 2000, height: 2000, crop: 'limit' }]
            : undefined,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary OCR upload error:', error)
          return res.status(500).json({ error: 'Failed to upload file' })
        }

        res.status(200).json({
          url: result.secure_url,
          publicId: result.public_id,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          type: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
          // ocrData reserved for future Google Vision API integration
          ocrData: null,
        })
      },
    )

    const bufferStream = Readable.from(req.file.buffer)
    bufferStream.pipe(uploadStream)
  } catch (error) {
    console.error('OCR upload error:', error)
    res.status(500).json({ error: 'Failed to process file' })
  }
})

module.exports = router
