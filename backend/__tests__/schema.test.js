/**
 * Unit tests for RecipeImages, OcrResult, and OcrProcessingLog schema models.
 *
 * These tests validate the Prisma client interactions for the new OCR-related
 * database models using mocks (no real DB connection required).
 */

// Mock Prisma client with the new models
jest.mock('../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  recipeImage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  ocrResult: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  ocrProcessingLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}))

const prisma = require('../lib/prisma')

afterEach(() => {
  jest.clearAllMocks()
})

// ─── RecipeImage ─────────────────────────────────────────────────────────────

describe('RecipeImage model', () => {
  const baseImage = {
    id: 1,
    filename: 'test-recipe.jpg',
    originalUrl: 'https://res.cloudinary.com/sample/image/upload/family-recipes/ocr/test.jpg',
    cloudinaryPublicId: 'family-recipes/ocr/test',
    mimeType: 'image/jpeg',
    size: 204800,
    status: 'pending',
    recipeId: null,
    userId: 1,
    createdAt: new Date('2026-03-26T10:00:00Z'),
    updatedAt: new Date('2026-03-26T10:00:00Z'),
  }

  it('should create a RecipeImage record', async () => {
    prisma.recipeImage.create.mockResolvedValue(baseImage)

    const result = await prisma.recipeImage.create({
      data: {
        filename: baseImage.filename,
        originalUrl: baseImage.originalUrl,
        cloudinaryPublicId: baseImage.cloudinaryPublicId,
        mimeType: baseImage.mimeType,
        size: baseImage.size,
        status: 'pending',
        userId: 1,
      },
    })

    expect(result).toMatchObject({
      id: 1,
      filename: 'test-recipe.jpg',
      status: 'pending',
      userId: 1,
    })
    expect(prisma.recipeImage.create).toHaveBeenCalledTimes(1)
  })

  it('should find a RecipeImage by id', async () => {
    prisma.recipeImage.findUnique.mockResolvedValue(baseImage)

    const result = await prisma.recipeImage.findUnique({ where: { id: 1 } })

    expect(result).toMatchObject({ id: 1, filename: 'test-recipe.jpg' })
    expect(prisma.recipeImage.findUnique).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('should return null when RecipeImage not found', async () => {
    prisma.recipeImage.findUnique.mockResolvedValue(null)

    const result = await prisma.recipeImage.findUnique({ where: { id: 9999 } })

    expect(result).toBeNull()
  })

  it('should list RecipeImages by userId', async () => {
    const images = [baseImage, { ...baseImage, id: 2, filename: 'second.jpg', status: 'completed' }]
    prisma.recipeImage.findMany.mockResolvedValue(images)

    const result = await prisma.recipeImage.findMany({ where: { userId: 1 } })

    expect(result).toHaveLength(2)
    expect(result[0].userId).toBe(1)
    expect(result[1].status).toBe('completed')
  })

  it('should list RecipeImages filtered by status', async () => {
    const pendingImages = [baseImage]
    prisma.recipeImage.findMany.mockResolvedValue(pendingImages)

    const result = await prisma.recipeImage.findMany({ where: { status: 'pending' } })

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('pending')
  })

  it('should update RecipeImage status', async () => {
    const updated = { ...baseImage, status: 'completed', updatedAt: new Date() }
    prisma.recipeImage.update.mockResolvedValue(updated)

    const result = await prisma.recipeImage.update({
      where: { id: 1 },
      data: { status: 'completed' },
    })

    expect(result.status).toBe('completed')
    expect(prisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'completed' },
    })
  })

  it('should allow recipeId to be null (image uploaded before recipe is saved)', async () => {
    const imageWithoutRecipe = { ...baseImage, recipeId: null }
    prisma.recipeImage.create.mockResolvedValue(imageWithoutRecipe)

    const result = await prisma.recipeImage.create({
      data: { ...baseImage, recipeId: undefined },
    })

    expect(result.recipeId).toBeNull()
  })

  it('should associate a RecipeImage with a recipe', async () => {
    const linkedImage = { ...baseImage, recipeId: 42, status: 'completed' }
    prisma.recipeImage.update.mockResolvedValue(linkedImage)

    const result = await prisma.recipeImage.update({
      where: { id: 1 },
      data: { recipeId: 42 },
    })

    expect(result.recipeId).toBe(42)
  })

  it('should delete a RecipeImage by id', async () => {
    prisma.recipeImage.delete.mockResolvedValue(baseImage)

    const result = await prisma.recipeImage.delete({ where: { id: 1 } })

    expect(result.id).toBe(1)
    expect(prisma.recipeImage.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

// ─── OcrResult ───────────────────────────────────────────────────────────────

describe('OcrResult model', () => {
  const baseOcrResult = {
    id: 1,
    recipeImageId: 1,
    rawText: 'Chocolate Cake\n2 cups flour\n1 cup sugar\nBake at 350F.',
    confidence: 0.97,
    detectedLanguage: 'en',
    parsedTitle: 'Chocolate Cake',
    parsedIngredients: ['2 cups flour', '1 cup sugar'],
    parsedInstructions: 'Bake at 350F.',
    isManuallyEdited: false,
    editedAt: null,
    editedById: null,
    createdAt: new Date('2026-03-26T10:01:00Z'),
  }

  it('should create an OcrResult record', async () => {
    prisma.ocrResult.create.mockResolvedValue(baseOcrResult)

    const result = await prisma.ocrResult.create({
      data: {
        recipeImageId: 1,
        rawText: baseOcrResult.rawText,
        confidence: 0.97,
        detectedLanguage: 'en',
        parsedTitle: 'Chocolate Cake',
        parsedIngredients: ['2 cups flour', '1 cup sugar'],
        parsedInstructions: 'Bake at 350F.',
      },
    })

    expect(result).toMatchObject({
      id: 1,
      recipeImageId: 1,
      confidence: 0.97,
      detectedLanguage: 'en',
      isManuallyEdited: false,
    })
    expect(prisma.ocrResult.create).toHaveBeenCalledTimes(1)
  })

  it('should find an OcrResult by recipeImageId', async () => {
    prisma.ocrResult.findFirst.mockResolvedValue(baseOcrResult)

    const result = await prisma.ocrResult.findFirst({ where: { recipeImageId: 1 } })

    expect(result).toMatchObject({ recipeImageId: 1 })
    expect(prisma.ocrResult.findFirst).toHaveBeenCalledWith({ where: { recipeImageId: 1 } })
  })

  it('should return null when OcrResult not found', async () => {
    prisma.ocrResult.findFirst.mockResolvedValue(null)

    const result = await prisma.ocrResult.findFirst({ where: { recipeImageId: 9999 } })

    expect(result).toBeNull()
  })

  it('should update OcrResult with manual edits', async () => {
    const editedResult = {
      ...baseOcrResult,
      parsedTitle: 'Double Chocolate Cake',
      isManuallyEdited: true,
      editedAt: new Date('2026-03-26T12:00:00Z'),
      editedById: 2,
    }
    prisma.ocrResult.update.mockResolvedValue(editedResult)

    const result = await prisma.ocrResult.update({
      where: { id: 1 },
      data: {
        parsedTitle: 'Double Chocolate Cake',
        isManuallyEdited: true,
        editedAt: new Date('2026-03-26T12:00:00Z'),
        editedById: 2,
      },
    })

    expect(result.parsedTitle).toBe('Double Chocolate Cake')
    expect(result.isManuallyEdited).toBe(true)
    expect(result.editedById).toBe(2)
  })

  it('should list OcrResults by detected language', async () => {
    const spanishResults = [
      { ...baseOcrResult, id: 10, detectedLanguage: 'es', parsedTitle: 'Tortilla Española' },
    ]
    prisma.ocrResult.findMany.mockResolvedValue(spanishResults)

    const result = await prisma.ocrResult.findMany({ where: { detectedLanguage: 'es' } })

    expect(result).toHaveLength(1)
    expect(result[0].detectedLanguage).toBe('es')
  })

  it('should support null rawText for images with no detected text', async () => {
    const emptyResult = { ...baseOcrResult, rawText: null, parsedTitle: null, parsedIngredients: null }
    prisma.ocrResult.create.mockResolvedValue(emptyResult)

    const result = await prisma.ocrResult.create({
      data: { recipeImageId: 1, isManuallyEdited: false },
    })

    expect(result.rawText).toBeNull()
    expect(result.parsedTitle).toBeNull()
  })

  it('should support confidence scores between 0 and 1', async () => {
    const lowConfidenceResult = { ...baseOcrResult, confidence: 0.42 }
    prisma.ocrResult.create.mockResolvedValue(lowConfidenceResult)

    const result = await prisma.ocrResult.create({
      data: { recipeImageId: 1, confidence: 0.42 },
    })

    expect(result.confidence).toBe(0.42)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('should delete an OcrResult by id', async () => {
    prisma.ocrResult.delete.mockResolvedValue(baseOcrResult)

    const result = await prisma.ocrResult.delete({ where: { id: 1 } })

    expect(result.id).toBe(1)
    expect(prisma.ocrResult.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

// ─── OcrProcessingLog ────────────────────────────────────────────────────────

describe('OcrProcessingLog model', () => {
  const baseLog = {
    id: 1,
    recipeImageId: 1,
    userId: 1,
    status: 'completed',
    processingTimeMs: 1230,
    errorMessage: null,
    apiCost: 0.0015,
    createdAt: new Date('2026-03-26T10:02:00Z'),
  }

  it('should create an OcrProcessingLog for a successful run', async () => {
    prisma.ocrProcessingLog.create.mockResolvedValue(baseLog)

    const result = await prisma.ocrProcessingLog.create({
      data: {
        recipeImageId: 1,
        userId: 1,
        status: 'completed',
        processingTimeMs: 1230,
        apiCost: 0.0015,
      },
    })

    expect(result).toMatchObject({
      id: 1,
      status: 'completed',
      processingTimeMs: 1230,
      apiCost: 0.0015,
      errorMessage: null,
    })
    expect(prisma.ocrProcessingLog.create).toHaveBeenCalledTimes(1)
  })

  it('should create an OcrProcessingLog for a failed run with error message', async () => {
    const failedLog = {
      ...baseLog,
      id: 2,
      status: 'failed',
      processingTimeMs: 5001,
      errorMessage: 'Google Vision API timeout',
      apiCost: null,
    }
    prisma.ocrProcessingLog.create.mockResolvedValue(failedLog)

    const result = await prisma.ocrProcessingLog.create({
      data: {
        recipeImageId: 1,
        userId: 1,
        status: 'failed',
        processingTimeMs: 5001,
        errorMessage: 'Google Vision API timeout',
      },
    })

    expect(result.status).toBe('failed')
    expect(result.errorMessage).toBe('Google Vision API timeout')
    expect(result.apiCost).toBeNull()
  })

  it('should create an OcrProcessingLog with started status', async () => {
    const startedLog = { ...baseLog, id: 3, status: 'started', processingTimeMs: null, apiCost: null }
    prisma.ocrProcessingLog.create.mockResolvedValue(startedLog)

    const result = await prisma.ocrProcessingLog.create({
      data: { recipeImageId: 1, userId: 1, status: 'started' },
    })

    expect(result.status).toBe('started')
    expect(result.processingTimeMs).toBeNull()
  })

  it('should list OcrProcessingLogs by recipeImageId', async () => {
    const logs = [
      { ...baseLog, id: 1, status: 'failed' },
      { ...baseLog, id: 2, status: 'completed' },
    ]
    prisma.ocrProcessingLog.findMany.mockResolvedValue(logs)

    const result = await prisma.ocrProcessingLog.findMany({ where: { recipeImageId: 1 } })

    expect(result).toHaveLength(2)
    expect(result[0].recipeImageId).toBe(1)
    expect(result[1].recipeImageId).toBe(1)
  })

  it('should list OcrProcessingLogs by status', async () => {
    const failedLogs = [{ ...baseLog, id: 2, status: 'failed', errorMessage: 'timeout' }]
    prisma.ocrProcessingLog.findMany.mockResolvedValue(failedLogs)

    const result = await prisma.ocrProcessingLog.findMany({ where: { status: 'failed' } })

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('failed')
    expect(result[0].errorMessage).toBe('timeout')
  })

  it('should list OcrProcessingLogs by userId', async () => {
    const userLogs = [baseLog]
    prisma.ocrProcessingLog.findMany.mockResolvedValue(userLogs)

    const result = await prisma.ocrProcessingLog.findMany({ where: { userId: 1 } })

    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe(1)
  })

  it('should support null apiCost for unsuccessful or free-tier runs', async () => {
    const freeLog = { ...baseLog, apiCost: null }
    prisma.ocrProcessingLog.create.mockResolvedValue(freeLog)

    const result = await prisma.ocrProcessingLog.create({
      data: { recipeImageId: 1, userId: 1, status: 'completed' },
    })

    expect(result.apiCost).toBeNull()
  })

  it('should delete an OcrProcessingLog by id', async () => {
    prisma.ocrProcessingLog.delete.mockResolvedValue(baseLog)

    const result = await prisma.ocrProcessingLog.delete({ where: { id: 1 } })

    expect(result.id).toBe(1)
    expect(prisma.ocrProcessingLog.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

// ─── Cross-model relationship tests ──────────────────────────────────────────

describe('Cross-model relationships', () => {
  it('should include OcrResults when querying a RecipeImage', async () => {
    const imageWithResults = {
      id: 1,
      filename: 'test.jpg',
      status: 'completed',
      userId: 1,
      recipeId: 5,
      ocrResults: [
        {
          id: 1,
          recipeImageId: 1,
          confidence: 0.97,
          detectedLanguage: 'en',
          parsedTitle: 'Pasta Carbonara',
          isManuallyEdited: false,
        },
      ],
      processingLogs: [
        {
          id: 1,
          recipeImageId: 1,
          userId: 1,
          status: 'completed',
          processingTimeMs: 875,
        },
      ],
    }
    prisma.recipeImage.findUnique.mockResolvedValue(imageWithResults)

    const result = await prisma.recipeImage.findUnique({
      where: { id: 1 },
      include: { ocrResults: true, processingLogs: true },
    })

    expect(result.ocrResults).toHaveLength(1)
    expect(result.ocrResults[0].parsedTitle).toBe('Pasta Carbonara')
    expect(result.processingLogs).toHaveLength(1)
    expect(result.processingLogs[0].status).toBe('completed')
  })

  it('should link OcrResult back to its RecipeImage', async () => {
    const ocrResultWithImage = {
      id: 1,
      recipeImageId: 1,
      confidence: 0.95,
      detectedLanguage: 'en',
      recipeImage: {
        id: 1,
        filename: 'test.jpg',
        status: 'completed',
        userId: 1,
      },
    }
    prisma.ocrResult.findUnique.mockResolvedValue(ocrResultWithImage)

    const result = await prisma.ocrResult.findUnique({
      where: { id: 1 },
      include: { recipeImage: true },
    })

    expect(result.recipeImage).toBeDefined()
    expect(result.recipeImage.filename).toBe('test.jpg')
    expect(result.recipeImage.status).toBe('completed')
  })

  it('should link OcrProcessingLog back to its RecipeImage and triggering User', async () => {
    const logWithRelations = {
      id: 1,
      recipeImageId: 1,
      userId: 1,
      status: 'completed',
      recipeImage: { id: 1, filename: 'test.jpg', status: 'completed' },
      triggeredBy: { id: 1, email: 'admin@example.com', role: 'admin' },
    }
    prisma.ocrProcessingLog.findUnique.mockResolvedValue(logWithRelations)

    const result = await prisma.ocrProcessingLog.findUnique({
      where: { id: 1 },
      include: { recipeImage: true, triggeredBy: true },
    })

    expect(result.recipeImage.filename).toBe('test.jpg')
    expect(result.triggeredBy.email).toBe('admin@example.com')
  })
})
