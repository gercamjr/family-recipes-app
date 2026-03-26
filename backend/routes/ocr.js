const express = require('express')
const multer = require('multer')
const { Readable } = require('stream')
const crypto = require('crypto')
const cloudinary = require('cloudinary').v2
const vision = require('@google-cloud/vision')
const sharp = require('sharp')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In-memory store for OCR jobs (keyed by UUID imageId)
const ocrJobs = new Map()

// Cleanup completed/failed jobs older than 1 hour to prevent memory leaks
const JOB_TTL_MS = 60 * 60 * 1000
const cleanupInterval = setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [id, job] of ocrJobs) {
    if ((job.status === 'completed' || job.status === 'failed') && new Date(job.startedAt).getTime() < cutoff) {
      ocrJobs.delete(id)
    }
  }
}, 10 * 60 * 1000) // run every 10 minutes

// Allow process to exit even if interval is still pending (e.g. during tests)
if (cleanupInterval.unref) cleanupInterval.unref()

// OCR-specific rate limiter (stricter than global)
const ocrRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many OCR requests, please try again later.' },
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

// Create Google Vision client from env credentials
function createVisionClient() {
  if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
    let credentials
    try {
      credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS, 'base64').toString('utf8'))
    } catch {
      throw new Error(
        'GOOGLE_CLOUD_VISION_CREDENTIALS must contain valid base64-encoded JSON service account credentials',
      )
    }
    return new vision.ImageAnnotatorClient({ credentials })
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path or ADC
  return new vision.ImageAnnotatorClient()
}

// Calculate average confidence score from Vision API result
function calculateConfidence(result) {
  const pages = result.fullTextAnnotation?.pages || []
  if (!pages.length) return 0
  let total = 0
  let count = 0
  for (const page of pages) {
    for (const block of page.blocks || []) {
      for (const para of block.paragraphs || []) {
        for (const word of para.words || []) {
          if (word.confidence != null) {
            total += word.confidence
            count++
          }
        }
      }
    }
  }
  return count > 0 ? Math.round((total / count) * 100) / 100 : 0
}

// Detect dominant language from Vision API result
function detectLanguage(result) {
  const pages = result.fullTextAnnotation?.pages || []
  const langCounts = {}
  for (const page of pages) {
    for (const prop of page.property?.detectedLanguages || []) {
      const tag = prop.languageCode
      langCounts[tag] = (langCounts[tag] || 0) + (prop.confidence || 1)
    }
  }
  let dominant = 'en'
  let maxScore = 0
  for (const [lang, score] of Object.entries(langCounts)) {
    if (score > maxScore) {
      maxScore = score
      dominant = lang
    }
  }
  return dominant
}

// Basic heuristic parser: extract title, ingredients, and instructions from raw OCR text
function parseRecipeFromText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (!lines.length) return { title: null, ingredients: [], instructions: null }

  const title = lines[0] || null

  // Lines that look like ingredients: start with a number/fraction/bullet or contain a unit
  const ingredientPattern = /^(\d[\d/.]*\s|[•\-*]\s|[½⅓¼⅔¾]\s)/i
  const unitPattern = /\b(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|clove|cloves)\b/i
  const ingredients = []
  const instructionLines = []
  let inInstructions = false

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Detect a section header for instructions
    if (/^(instructions?|directions?|method|steps?|preparation|preparaci[oó]n|instrucciones?)$/i.test(line)) {
      inInstructions = true
      continue
    }
    if (!inInstructions && (ingredientPattern.test(line) || unitPattern.test(line))) {
      ingredients.push(line)
    } else {
      inInstructions = true
      instructionLines.push(line)
    }
  }

  return {
    title,
    ingredients,
    instructions: instructionLines.join('\n') || null,
  }
}

// Core OCR processing function (runs asynchronously after upload)
async function processImageWithOCR(imageId, imageBuffer, mimeType) {
  const job = ocrJobs.get(imageId)
  if (!job) return

  const startMs = Date.now()
  console.log(`[OCR] Starting processing for job ${imageId}`)

  try {
    ocrJobs.set(imageId, { ...ocrJobs.get(imageId), status: 'processing', progress: 10 })

    // Pre-process image with Sharp (skip for PDFs)
    let processedBuffer = imageBuffer
    if (mimeType !== 'application/pdf') {
      processedBuffer = await sharp(imageBuffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // fill transparency with white
        .jpeg({ quality: 90 })
        .toBuffer()
    }
    ocrJobs.set(imageId, { ...ocrJobs.get(imageId), progress: 30 })

    // Call Google Vision API
    const client = createVisionClient()
    const [result] = await client.documentTextDetection({
      image: { content: processedBuffer.toString('base64') },
      imageContext: { languageHints: ['en', 'es'] },
    })

    ocrJobs.set(imageId, { ...ocrJobs.get(imageId), progress: 70 })

    const rawText = result.fullTextAnnotation?.text || ''
    const confidence = calculateConfidence(result)
    const language = detectLanguage(result)
    const recipe = parseRecipeFromText(rawText)

    const processingTimeMs = Date.now() - startMs

    ocrJobs.set(imageId, {
      ...ocrJobs.get(imageId),
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      results: {
        rawText,
        confidence,
        language,
        recipe,
        metadata: {
          processedAt: new Date().toISOString(),
          imageId,
          processingTimeMs,
        },
      },
    })

    console.log(`[OCR] Job ${imageId} completed in ${processingTimeMs}ms`)
  } catch (error) {
    console.error(`[OCR] Job ${imageId} failed:`, error)
    ocrJobs.set(imageId, {
      ...ocrJobs.get(imageId),
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: error.message,
    })
  }
}

// Helper: upload buffer to Cloudinary and return result
function uploadToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'family-recipes/ocr',
        resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
        transformation: mimeType !== 'application/pdf' ? [{ width: 2000, height: 2000, crop: 'limit' }] : undefined,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )
    Readable.from(buffer).pipe(stream)
  })
}

// @route   POST /api/recipes/ocr
// @desc    Upload a recipe image and trigger async OCR processing
// @access  Private
router.post('/', ocrRateLimiter, authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    let cloudinaryResult
    try {
      cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype)
    } catch (uploadError) {
      console.error('[OCR] Cloudinary upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload file' })
    }

    const imageId = crypto.randomUUID()

    // Store job metadata
    ocrJobs.set(imageId, {
      status: 'pending',
      progress: 0,
      imageUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      userId: req.user.id,
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: null,
      error: null,
    })

    // Start OCR processing asynchronously (do not await)
    processImageWithOCR(imageId, req.file.buffer, req.file.mimetype).catch((err) =>
      console.error(`[OCR] Unhandled error for job ${imageId}:`, err),
    )

    console.log(`[OCR] Job ${imageId} queued for processing`)

    res.status(202).json({
      imageId,
      status: 'pending',
      message: 'File uploaded. OCR processing has started.',
      imageUrl: cloudinaryResult.secure_url,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
    })
  } catch (error) {
    console.error('[OCR] Upload error:', error)
    res.status(500).json({ error: 'Failed to process file' })
  }
})

// @route   GET /api/recipes/ocr/:imageId/status
// @desc    Check the current OCR processing status for an image
// @access  Private
router.get('/:imageId/status', authenticateToken, (req, res) => {
  const { imageId } = req.params
  const job = ocrJobs.get(imageId)

  if (!job) {
    return res.status(404).json({ error: 'OCR job not found' })
  }

  // Calculate estimated time remaining based on progress and elapsed time
  let estimatedTimeRemaining = null
  if (job.status === 'processing' && job.progress > 0) {
    const elapsedMs = Date.now() - new Date(job.startedAt).getTime()
    const rate = job.progress / elapsedMs // progress per ms
    estimatedTimeRemaining = rate > 0 ? Math.round((100 - job.progress) / rate / 1000) : null
  }

  res.json({
    imageId,
    status: job.status,
    progress: job.progress,
    estimatedTimeRemaining,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error || undefined,
  })
})

// @route   GET /api/recipes/ocr/:imageId/results
// @desc    Get the OCR results for a completed job
// @access  Private
router.get('/:imageId/results', authenticateToken, (req, res) => {
  const { imageId } = req.params
  const job = ocrJobs.get(imageId)

  if (!job) {
    return res.status(404).json({ error: 'OCR job not found' })
  }

  if (job.status === 'processing' || job.status === 'pending') {
    return res.status(202).json({ error: 'OCR processing is not yet complete', status: job.status, progress: job.progress })
  }

  if (job.status === 'failed') {
    return res.status(500).json({ error: 'OCR processing failed', details: job.error })
  }

  res.json({
    imageId,
    status: job.status,
    results: job.results,
    imageUrl: job.imageUrl,
    filename: job.filename,
  })
})

// @route   PATCH /api/recipes/ocr/:imageId/edit
// @desc    Save manual corrections to the extracted OCR data
// @access  Private
router.patch('/:imageId/edit', authenticateToken, (req, res) => {
  const { imageId } = req.params
  const job = ocrJobs.get(imageId)

  if (!job) {
    return res.status(404).json({ error: 'OCR job not found' })
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Cannot edit results before OCR processing is complete' })
  }

  const { rawText, recipe } = req.body

  // Basic validation of provided fields
  if (rawText !== undefined && typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText must be a string' })
  }
  if (recipe !== undefined) {
    if (typeof recipe !== 'object' || Array.isArray(recipe)) {
      return res.status(400).json({ error: 'recipe must be an object' })
    }
    if (recipe.ingredients !== undefined && !Array.isArray(recipe.ingredients)) {
      return res.status(400).json({ error: 'recipe.ingredients must be an array' })
    }
    if (recipe.title !== undefined && typeof recipe.title !== 'string') {
      return res.status(400).json({ error: 'recipe.title must be a string' })
    }
    if (recipe.instructions !== undefined && typeof recipe.instructions !== 'string') {
      return res.status(400).json({ error: 'recipe.instructions must be a string' })
    }
  }

  // Merge user corrections into existing results
  const updatedResults = {
    ...job.results,
    rawText: rawText !== undefined ? rawText : job.results.rawText,
    recipe: recipe !== undefined ? { ...job.results.recipe, ...recipe } : job.results.recipe,
    metadata: {
      ...job.results.metadata,
      editedAt: new Date().toISOString(),
      editedBy: req.user.id,
    },
  }

  ocrJobs.set(imageId, { ...job, results: updatedResults })

  console.log(`[OCR] Job ${imageId} results edited by user ${req.user.id}`)

  res.json({
    imageId,
    status: 'completed',
    results: updatedResults,
  })
})

// @route   POST /api/recipes/ocr/:imageId/reprocess
// @desc    Re-run OCR on an already-uploaded image
// @access  Private
router.post('/:imageId/reprocess', ocrRateLimiter, authenticateToken, async (req, res) => {
  const { imageId } = req.params
  const job = ocrJobs.get(imageId)

  if (!job) {
    return res.status(404).json({ error: 'OCR job not found' })
  }

  // Download the image from Cloudinary for reprocessing
  // Validate that the URL is from the expected Cloudinary domain to prevent SSRF
  let imageBuffer
  try {
    const parsedUrl = new URL(job.imageUrl)
    if (parsedUrl.hostname !== 'cloudinary.com' && !parsedUrl.hostname.endsWith('.cloudinary.com')) {
      return res.status(400).json({ error: 'Invalid image source' })
    }
    const response = await fetch(job.imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
    const arrayBuffer = await response.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
  } catch (fetchError) {
    console.error(`[OCR] Failed to fetch image for reprocessing job ${imageId}:`, fetchError)
    return res.status(500).json({ error: 'Failed to retrieve original image for reprocessing' })
  }

  const newImageId = crypto.randomUUID()

  ocrJobs.set(newImageId, {
    status: 'pending',
    progress: 0,
    imageUrl: job.imageUrl,
    publicId: job.publicId,
    filename: job.filename,
    size: job.size,
    mimeType: job.mimeType,
    userId: req.user.id,
    startedAt: new Date().toISOString(),
    completedAt: null,
    results: null,
    error: null,
  })

  // Start OCR processing asynchronously
  processImageWithOCR(newImageId, imageBuffer, job.mimeType).catch((err) =>
    console.error(`[OCR] Unhandled error for reprocess job ${newImageId}:`, err),
  )

  console.log(`[OCR] Reprocess job ${newImageId} queued (original: ${imageId})`)

  res.status(202).json({
    imageId: newImageId,
    originalImageId: imageId,
    status: 'pending',
    message: 'Reprocessing has started.',
  })
})

module.exports = router
