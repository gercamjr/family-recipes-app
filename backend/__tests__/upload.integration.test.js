const request = require('supertest')
const app = require('../server')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')

// Use real Prisma client for integration tests
const prisma = require('../lib/prisma')

// Mock Cloudinary to avoid actual uploads during tests
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const { Writable } = require('stream')

        // Create a proper writable stream
        const mockStream = new Writable({
          write(chunk, encoding, done) {
            done()
          },
        })

        // Simulate successful upload when stream ends
        mockStream.on('finish', () => {
          callback(null, {
            secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/family-recipes/test-image.jpg',
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

describe('Upload Integration Tests', () => {
  let testUser
  let testRecipe
  let authToken

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.findFirst({
      where: { email: 'test-upload@example.com' },
    })

    if (!testUser) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('testpassword123', 10)
      testUser = await prisma.user.create({
        data: {
          email: 'test-upload@example.com',
          passwordHash: hashedPassword,
          role: 'editor',
          languagePref: 'en',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' })

    // Create a test recipe
    testRecipe = await prisma.recipe.create({
      data: {
        titleEn: 'Integration Test Recipe',
        ingredientsEn: ['Test Ingredient'],
        instructionsEn: 'Test Instructions',
        authorId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testRecipe) {
      await prisma.media.deleteMany({ where: { recipeId: testRecipe.id } })
      await prisma.recipe.delete({ where: { id: testRecipe.id } })
    }
    if (testUser && testUser.email === 'test-upload@example.com') {
      await prisma.user.delete({ where: { id: testUser.id } })
    }
    await prisma.$disconnect()
  })

  describe('POST /api/upload', () => {
    it('should upload an image and return metadata', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'test-image.jpg')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('url')
      expect(response.body).toHaveProperty('publicId')
      expect(response.body).toHaveProperty('type', 'image')
      expect(response.body).toHaveProperty('filename', 'test-image.jpg')
      expect(response.body.url).toContain('cloudinary.com')
    })

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app).post('/api/upload').set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('No file uploaded')
    })

    it('should return 401 when user is not authenticated', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app).post('/api/upload').attach('file', testImageBuffer, 'test-image.jpg')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/upload/:recipeId', () => {
    it('should upload media for a recipe and create database record', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app)
        .post(`/api/upload/${testRecipe.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'recipe-photo.jpg')

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('message', 'File uploaded successfully')
      expect(response.body).toHaveProperty('media')
      expect(response.body.media).toHaveProperty('url')
      expect(response.body.media).toHaveProperty('type', 'image')
      expect(response.body.media).toHaveProperty('recipeId', testRecipe.id)

      // Verify media was created in database
      const media = await prisma.media.findUnique({
        where: { id: response.body.media.id },
      })
      expect(media).toBeTruthy()
      expect(media.recipeId).toBe(testRecipe.id)

      // Cleanup
      await prisma.media.delete({ where: { id: media.id } })
    })

    it('should return 404 for non-existent recipe', async () => {
      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app)
        .post('/api/upload/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'test.jpg')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Recipe not found')
    })

    it('should return 403 when user is not the recipe owner', async () => {
      // Create another user and recipe
      const bcrypt = require('bcryptjs')
      // Ensure no user with this email exists before creating
      const existingOtherUser = await prisma.user.findUnique({
        where: { email: 'other-upload-user@example.com' },
      })
      if (existingOtherUser) {
        // Delete all media for recipes owned by this user to avoid FK constraint errors
        const recipes = await prisma.recipe.findMany({ where: { authorId: existingOtherUser.id } })
        const recipeIds = recipes.map((r) => r.id)
        if (recipeIds.length > 0) {
          await prisma.media.deleteMany({ where: { recipeId: { in: recipeIds } } })
        }
        await prisma.recipe.deleteMany({ where: { authorId: existingOtherUser.id } })
        await prisma.user.delete({ where: { id: existingOtherUser.id } })
      }
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-upload-user@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'viewer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const otherRecipe = await prisma.recipe.create({
        data: {
          titleEn: 'Other User Recipe',
          ingredientsEn: ['Ingredient'],
          instructionsEn: 'Instructions',
          authorId: otherUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const testImageBuffer = Buffer.from('fake-image-data')

      const response = await request(app)
        .post(`/api/upload/${otherRecipe.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImageBuffer, 'test.jpg')

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Access denied')

      // Cleanup
      await prisma.recipe.delete({ where: { id: otherRecipe.id } })
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('DELETE /api/upload/:mediaId', () => {
    it('should delete media by recipe owner', async () => {
      // Create a media item
      const media = await prisma.media.create({
        data: {
          url: 'https://cloudinary.com/test-delete.jpg',
          type: 'image',
          filename: 'test-delete.jpg',
          recipeId: testRecipe.id,
        },
      })

      const response = await request(app).delete(`/api/upload/${media.id}`).set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Media deleted successfully')

      // Verify media was deleted
      const deletedMedia = await prisma.media.findUnique({
        where: { id: media.id },
      })
      expect(deletedMedia).toBeNull()
    })

    it('should return 404 for non-existent media', async () => {
      const response = await request(app).delete('/api/upload/99999').set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Media not found')
    })

    it('should return 403 when user is not the recipe owner', async () => {
      // Create another user and their media
      const bcrypt = require('bcryptjs')
      // Ensure no user with this email exists before creating
      const existingOtherUser = await prisma.user.findUnique({
        where: { email: 'other-delete-user@example.com' },
      })
      if (existingOtherUser) {
        // Delete all media for recipes owned by this user to avoid FK constraint errors
        const recipes = await prisma.recipe.findMany({ where: { authorId: existingOtherUser.id } })
        const recipeIds = recipes.map((r) => r.id)
        if (recipeIds.length > 0) {
          await prisma.media.deleteMany({ where: { recipeId: { in: recipeIds } } })
        }
        await prisma.recipe.deleteMany({ where: { authorId: existingOtherUser.id } })
        await prisma.user.delete({ where: { id: existingOtherUser.id } })
      }
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-delete-user@example.com',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'viewer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const otherRecipe = await prisma.recipe.create({
        data: {
          titleEn: 'Other Recipe',
          ingredientsEn: ['Ingredient'],
          instructionsEn: 'Instructions',
          authorId: otherUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const otherMedia = await prisma.media.create({
        data: {
          url: 'https://cloudinary.com/other.jpg',
          type: 'image',
          filename: 'other.jpg',
          recipeId: otherRecipe.id,
        },
      })

      const response = await request(app)
        .delete(`/api/upload/${otherMedia.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Access denied')

      // Cleanup
      await prisma.media.delete({ where: { id: otherMedia.id } })
      await prisma.recipe.delete({ where: { id: otherRecipe.id } })
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('Recipe Creation with Media', () => {
    it('should create a recipe with multiple media items', async () => {
      const mediaData = [
        {
          url: 'https://cloudinary.com/image1.jpg',
          type: 'image',
          filename: 'image1.jpg',
          size: 12345,
          mimeType: 'image/jpeg',
        },
        {
          url: 'https://cloudinary.com/video1.mp4',
          type: 'video',
          filename: 'video1.mp4',
          size: 54321,
          mimeType: 'video/mp4',
        },
      ]

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleEn: 'Recipe with Media',
          titleEs: 'Receta con Medios',
          ingredientsEn: ['Ingredient 1'],
          ingredientsEs: ['Ingrediente 1'],
          instructionsEn: 'Instructions',
          instructionsEs: 'Instrucciones',
          authorId: testUser.id,
          categories: ['Test'],
          tags: ['Test'],
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          descriptionEn: 'Test description',
          descriptionEs: 'Descripción de prueba',
          published: true,
          difficulty: 'easy', // Add this if your schema requires it
          status: 'active', // Add this if your schema requires it
          media: mediaData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      expect(response.status).toBe(201)
      expect(response.body.recipe).toHaveProperty('id')

      // Verify media was created
      const createdMedia = await prisma.media.findMany({
        where: { recipeId: response.body.recipe.id },
      })

      expect(createdMedia).toHaveLength(2)
      expect(createdMedia[0].type).toBe('image')
      expect(createdMedia[1].type).toBe('video')

      // Cleanup
      await prisma.media.deleteMany({ where: { recipeId: response.body.recipe.id } })
      await prisma.recipe.delete({ where: { id: response.body.recipe.id } })
    })

    it('should update a recipe and replace media', async () => {
      // Create a recipe with media
      const recipe = await prisma.recipe.create({
        data: {
          titleEn: 'Recipe to Update',
          ingredientsEn: ['Ingredient'],
          instructionsEn: 'Instructions',
          authorId: testUser.id,
          media: {
            create: [
              {
                url: 'https://cloudinary.com/old-image.jpg',
                type: 'image',
                filename: 'old-image.jpg',
              },
            ],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: { media: true },
      })

      const newMediaData = [
        {
          url: 'https://cloudinary.com/new-image.jpg',
          type: 'image',
          filename: 'new-image.jpg',
          size: 99999,
          mimeType: 'image/jpeg',
        },
      ]

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleEn: 'Updated Recipe',
          media: newMediaData,
        })

      expect(response.status).toBe(200)

      // Verify old media was deleted and new media created
      const updatedMedia = await prisma.media.findMany({
        where: { recipeId: recipe.id },
      })

      expect(updatedMedia).toHaveLength(1)
      expect(updatedMedia[0].url).toBe('https://cloudinary.com/new-image.jpg')
      expect(updatedMedia[0].filename).toBe('new-image.jpg')

      // Cleanup
      await prisma.media.deleteMany({ where: { recipeId: recipe.id } })
      await prisma.recipe.delete({ where: { id: recipe.id } })
    })
  })
})
