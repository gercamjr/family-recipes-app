const request = require('supertest')
const app = require('../server')
const jwt = require('jsonwebtoken')

// Mock Prisma
const prisma = require('../lib/prisma')
jest.mock('../lib/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recipe: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  media: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
}))

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const { Writable } = require('stream')
        const mockStream = new Writable({
          write(chunk, encoding, done) {
            done()
          },
        })
        process.nextTick(() => {
          mockStream.emit('finish')
        })
        mockStream.on('finish', () => {
          callback(null, {
            secure_url: 'https://cloudinary.com/test-image.jpg',
            public_id: 'family-recipes/test-image',
            resource_type: options.resource_type === 'auto' ? 'image' : options.resource_type || 'image',
          })
        })
        return mockStream
      }),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' })),
    },
  },
}))

describe('Upload Feature Tests (Mocked)', () => {
  let testUser
  let testRecipe
  let authToken

  beforeAll(() => {
    // Setup test data
    testUser = {
      id: 1,
      email: 'test-upload@example.com',
      passwordHash: 'hashed-password',
      role: 'editor',
      languagePref: 'en',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    testRecipe = {
      id: 101,
      titleEn: 'Integration Test Recipe',
      ingredientsEn: ['Test Ingredient'],
      instructionsEn: 'Test Instructions',
      authorId: testUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Default mock implementations
    prisma.user.findFirst.mockResolvedValue(testUser)
    prisma.user.findUnique.mockResolvedValue(testUser)
    prisma.user.create.mockResolvedValue(testUser)

    prisma.recipe.create.mockResolvedValue(testRecipe)
    prisma.recipe.findUnique.mockResolvedValue(testRecipe)

    prisma.media.create.mockImplementation((args) =>
      Promise.resolve({
        id: 999,
        ...args.data,
        url: args.data.url || 'https://cloudinary.com/test-image.jpg',
      })
    )
    prisma.media.delete.mockResolvedValue({ id: 999 })
    prisma.media.deleteMany.mockResolvedValue({ count: 1 })
    prisma.media.findUnique.mockImplementation((args) =>
      Promise.resolve({
        id: 999,
        recipeId: testRecipe.id,
        url: 'https://cloudinary.com/test-delete.jpg',
        ...args.where,
      })
    )

    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' })
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Restore default mocks if changed in tests
    prisma.user.findUnique.mockResolvedValue(testUser)
    prisma.recipe.findUnique.mockResolvedValue(testRecipe)
    prisma.media.findUnique.mockResolvedValue({
      id: 999,
      recipeId: testRecipe.id,
      url: 'https://cloudinary.com/test-delete.jpg',
    })
  })

  describe('POST /api/upload', () => {
    it('should upload an image and return metadata', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'test-image.jpg')

      if (response.status !== 200) {
        console.error('Test Failed Response:', response.body)
      }
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('url')
      expect(response.body).toHaveProperty('publicId')
      expect(response.body.url).toContain('cloudinary.com')
    })

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app).post('/api/upload').set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('No file uploaded')
    })

    it('should return 401 when user is not authenticated', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')
      // No auth token
      const response = await request(app).post('/api/upload').attach('file', testImageBuffer, 'test-image.jpg')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/upload/:recipeId', () => {
    it('should upload media for a recipe and create database record', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      prisma.recipe.findUnique.mockResolvedValue(testRecipe)

      const response = await request(app)
        .post(`/api/upload/${testRecipe.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'recipe-photo.jpg')

      if (response.status !== 201) {
        console.error(response.body)
      }
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('message', 'File uploaded successfully')
      expect(response.body.media).toHaveProperty('recipeId', testRecipe.id)

      // Verify Prisma was called
      expect(prisma.media.create).toHaveBeenCalled()
      const createCall = prisma.media.create.mock.calls[0][0]
      expect(createCall.data.recipeId).toBe(Number(testRecipe.id))
    })

    it('should return 404 for non-existent recipe', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      // Mock recipe not found
      prisma.recipe.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/upload/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'test.jpg')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Recipe not found')
    })
  })

  describe('DELETE /api/upload/:mediaId', () => {
    it('should delete media by recipe owner', async () => {
      const mediaId = 123
      const mockMedia = {
        id: mediaId,
        url: 'https://cloudinary.com/test-delete.jpg',
        recipeId: testRecipe.id,
        publicId: 'test-id', // cloud public id
        recipe: testRecipe, // Include relation because controller uses include
      }

      prisma.media.findUnique.mockResolvedValue(mockMedia)
      prisma.recipe.findUnique.mockResolvedValue(testRecipe)
      prisma.media.delete.mockResolvedValue(mockMedia)

      const response = await request(app).delete(`/api/upload/${mediaId}`).set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Media deleted successfully')

      // Check delete call
      // Note: controller typically gets media -> checks recipe -> checks owner -> calls delete
      expect(prisma.media.delete).toHaveBeenCalled()
    })
  })

  describe('Recipe Creation with Media (Mocked Integration)', () => {
    it('should create a recipe with multiple media items', async () => {
      const mediaData = [{ url: 'https://cloudinary.com/img.jpg', type: 'image' }]

      // Controller logic: creates recipe with media inside
      // Mock prisma.recipe.create to return structured data
      prisma.recipe.create.mockResolvedValue({
        ...testRecipe,
        id: 202,
        media: [{ id: 1, ...mediaData[0] }],
      })

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleEn: 'New Recipe',
          ingredientsEn: ['Ing'],
          instructionsEn: 'Inst',
          media: mediaData,
        })

      expect(response.status).toBe(201)
      expect(prisma.recipe.create).toHaveBeenCalled()
      const createArg = prisma.recipe.create.mock.calls[0][0]
      expect(createArg.data.media).toBeDefined()
    })

    it('should update a recipe and replace media', async () => {
      // This corresponds to PUT /api/recipes/:id
      // The real test recreated media via deleteMany + createMany or similar nested writes

      prisma.recipe.findUnique.mockResolvedValue({
        ...testRecipe,
        authorId: testUser.id, // Ensure owner check passes
      })

      prisma.recipe.update.mockResolvedValue({
        ...testRecipe,
        titleEn: 'Updated Recipe',
      })

      const newMediaData = [{ url: 'https://cloudinary.com/new-image.jpg', type: 'image' }]

      const response = await request(app)
        .put(`/api/recipes/${testRecipe.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleEn: 'Updated Recipe',
          media: newMediaData,
        })

      expect(response.status).toBe(200)
      expect(prisma.recipe.update).toHaveBeenCalled()
    })
  })
})
