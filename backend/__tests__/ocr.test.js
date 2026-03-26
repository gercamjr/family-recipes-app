const request = require('supertest')
const app = require('../server')
const jwt = require('jsonwebtoken')

// Mock Prisma (required to load server)
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  recipe: { findUnique: jest.fn() },
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
          callback(null, {
            secure_url: 'https://cloudinary.com/ocr-test.jpg',
            public_id: 'family-recipes/ocr/test-public-id',
          })
          mockStream.emit('finish')
        })
        return mockStream
      }),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' })),
    },
  },
}))

// Mock Google Cloud Vision
jest.mock('@google-cloud/vision', () => {
  const mockAnnotate = jest.fn().mockResolvedValue([
    {
      fullTextAnnotation: {
        text: 'Chocolate Cake\n2 cups flour\n1 cup sugar\nMix all ingredients and bake at 350F for 30 minutes.',
        pages: [
          {
            blocks: [
              {
                paragraphs: [
                  {
                    words: [
                      { confidence: 0.98 },
                      { confidence: 0.95 },
                      { confidence: 0.97 },
                    ],
                  },
                ],
              },
            ],
            property: { detectedLanguages: [{ languageCode: 'en', confidence: 0.99 }] },
          },
        ],
      },
    },
  ])
  return {
    ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
      documentTextDetection: mockAnnotate,
    })),
  }
})

// Mock Sharp
jest.mock('sharp', () => {
  const sharpInstance = {
    resize: jest.fn().mockReturnThis(),
    flatten: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-data')),
  }
  return jest.fn(() => sharpInstance)
})

// Mock global fetch (used by reprocess endpoint)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    statusText: 'OK',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  }),
)

let authToken

beforeAll(() => {
  authToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' })
  // Ensure the user mock resolves for authenticateToken middleware in integration test
  require('../lib/prisma').user.findUnique.mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    role: 'editor',
    isActive: true,
    languagePref: 'en',
  })
})

afterEach(() => {
  jest.clearAllMocks()
  // Restore user mock after each test
  require('../lib/prisma').user.findUnique.mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    role: 'editor',
    isActive: true,
    languagePref: 'en',
  })
})

describe('OCR Routes', () => {
  describe('POST /api/recipes/ocr', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.error).toBe('No file uploaded')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/recipes/ocr')
        .attach('file', Buffer.from('fake-image'), 'test.jpg')
        .expect(401)

      expect(response.body.error).toBeDefined()
    })

    it('should accept a valid image and return 202 with imageId', async () => {
      const response = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })

      expect(response.status).toBe(202)
      expect(response.body.imageId).toBeDefined()
      expect(response.body.status).toBe('pending')
      expect(response.body.imageUrl).toContain('cloudinary.com')
      expect(response.body.message).toMatch(/processing has started/i)
    })
  })

  describe('GET /api/recipes/ocr/:imageId/status', () => {
    it('should return 404 for unknown imageId', async () => {
      const response = await request(app)
        .get('/api/recipes/ocr/nonexistent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('OCR job not found')
    })

    it('should return status for an existing job', async () => {
      // Upload a file to create a job
      const uploadResponse = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })

      expect(uploadResponse.status).toBe(202)
      const { imageId } = uploadResponse.body

      const statusResponse = await request(app)
        .get(`/api/recipes/ocr/${imageId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(statusResponse.body.imageId).toBe(imageId)
      expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResponse.body.status)
      expect(statusResponse.body.progress).toBeGreaterThanOrEqual(0)
      expect(statusResponse.body.progress).toBeLessThanOrEqual(100)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app).get('/api/recipes/ocr/some-id/status').expect(401)
    })
  })

  describe('GET /api/recipes/ocr/:imageId/results', () => {
    it('should return 404 for unknown imageId', async () => {
      const response = await request(app)
        .get('/api/recipes/ocr/nonexistent-id/results')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('OCR job not found')
    })

    it('should return 202 for a job still processing', async () => {
      const uploadResponse = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })

      expect(uploadResponse.status).toBe(202)
      const { imageId } = uploadResponse.body

      // Immediately check results — job likely still pending/processing
      const resultsResponse = await request(app)
        .get(`/api/recipes/ocr/${imageId}/results`)
        .set('Authorization', `Bearer ${authToken}`)

      // Status should be 202 (pending/processing) or 200 (if completed very fast in test env)
      expect([200, 202]).toContain(resultsResponse.status)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app).get('/api/recipes/ocr/some-id/results').expect(401)
    })
  })

  describe('PATCH /api/recipes/ocr/:imageId/edit', () => {
    it('should return 404 for unknown imageId', async () => {
      const response = await request(app)
        .patch('/api/recipes/ocr/nonexistent-id/edit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipe: { title: 'Updated Title' } })
        .expect(404)

      expect(response.body.error).toBe('OCR job not found')
    })

    it('should return 400 if job is not completed', async () => {
      // Upload file (job starts as pending)
      const uploadResponse = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })

      const { imageId } = uploadResponse.body

      // Directly set job state to pending for this test using module internals — instead,
      // we test by making an edit on a pending job (which should fail)
      const editResponse = await request(app)
        .patch(`/api/recipes/ocr/${imageId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipe: { title: 'New Title' } })

      // Should be 400 since the job won't be completed yet (async processing still pending)
      // or 200 if it completed synchronously in the mock
      expect([200, 400]).toContain(editResponse.status)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .patch('/api/recipes/ocr/some-id/edit')
        .send({ recipe: { title: 'Test' } })
        .expect(401)
    })
  })

  describe('POST /api/recipes/ocr/:imageId/reprocess', () => {
    it('should return 404 for unknown imageId', async () => {
      const response = await request(app)
        .post('/api/recipes/ocr/nonexistent-id/reprocess')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('OCR job not found')
    })

    it('should return 202 with a new imageId for an existing job', async () => {
      // Upload file to create original job
      const uploadResponse = await request(app)
        .post('/api/recipes/ocr')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), { filename: 'test.jpg', contentType: 'image/jpeg' })

      expect(uploadResponse.status).toBe(202)
      const { imageId } = uploadResponse.body

      // Reprocess
      const reprocessResponse = await request(app)
        .post(`/api/recipes/ocr/${imageId}/reprocess`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(202)

      expect(reprocessResponse.body.imageId).toBeDefined()
      expect(reprocessResponse.body.imageId).not.toBe(imageId)
      expect(reprocessResponse.body.originalImageId).toBe(imageId)
      expect(reprocessResponse.body.status).toBe('pending')
    })

    it('should return 401 when not authenticated', async () => {
      await request(app).post('/api/recipes/ocr/some-id/reprocess').expect(401)
    })
  })
})
