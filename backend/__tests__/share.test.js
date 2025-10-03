const request = require('supertest')
const app = require('../server')

jest.mock('../lib/prisma', () => ({
  recipe: {
    findUnique: jest.fn(),
  },
}))
const prisma = require('../lib/prisma')

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', role: 'viewer', languagePref: 'en' }
    next()
  },
  optionalAuth: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', role: 'viewer', languagePref: 'en' }
    next()
  },
  requireRole: jest.fn(() => (req, res, next) => next()),
}))

jest.mock('../utils/auth', () => ({
  formatRecipeResponse: jest.fn((recipe) => recipe),
}))

describe('Share Routes', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/share/pdf/:recipeId', () => {
    it('should return placeholder for PDF generation', async () => {
      const mockRecipe = {
        id: 1,
        isPublic: true,
        author: { email: 'author@example.com' },
      }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)

      const response = await request(app).get('/api/share/pdf/1').expect(200)

      expect(response.body.message).toBe('PDF generation not yet implemented')
      expect(response.body.recipe).toEqual(mockRecipe)
    })

    it('should return 404 for non-existent recipe', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null)

      await request(app).get('/api/share/pdf/999').expect(404)
    })
  })

  describe('POST /api/share/email/:recipeId', () => {
    it('should return placeholder for email sharing', async () => {
      const mockRecipe = {
        id: 1,
        isPublic: true,
        author: { email: 'author@example.com' },
      }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)

      const response = await request(app)
        .post('/api/share/email/1')
        .send({ email: 'friend@example.com', message: 'Check this recipe!' })
        .expect(200)

      expect(response.body.message).toBe('Email sharing not yet implemented')
      expect(response.body.shared.recipeId).toBe(1)
      expect(response.body.shared.email).toBe('friend@example.com')
    })

    it('should return 400 for invalid email', async () => {
      const mockRecipe = {
        id: 1,
        isPublic: true,
        author: { email: 'author@example.com' },
      }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)

      const response = await request(app).post('/api/share/email/1').send({ email: 'invalid-email' }).expect(400)

      expect(response.body.errors).toBeDefined()
    })

    it('should return 403 for private recipe access', async () => {
      const mockRecipe = {
        id: 1,
        isPublic: false,
        authorId: 2, // Different author
      }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)

      await request(app).post('/api/share/email/1').send({ email: 'friend@example.com' }).expect(403)
    })
  })
})
