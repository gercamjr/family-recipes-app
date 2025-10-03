const request = require('supertest')
const app = require('../server')

jest.mock('../lib/prisma', () => ({
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
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

describe('Favorites Routes', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/favorites', () => {
    it('should get user favorites', async () => {
      const mockFavorites = [
        {
          id: 1,
          createdAt: '2025-10-03T14:32:38.533Z',
          recipe: {
            id: 1,
            titleEn: 'Test Recipe',
            _count: { comments: 2, favorites: 5 },
            author: { id: 2, email: 'author@example.com' },
          },
        },
      ]

      prisma.favorite.findMany.mockResolvedValue(mockFavorites)

      const response = await request(app).get('/api/favorites').expect(200)

      expect(response.body.recipes).toEqual([mockFavorites[0].recipe])
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          recipe: {
            include: {
              author: {
                select: { id: true, email: true },
              },
              _count: {
                select: { comments: true, favorites: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('POST /api/favorites/:recipeId', () => {
    it('should add recipe to favorites', async () => {
      const mockRecipe = { id: 1 }
      const mockFavorite = { id: 1, userId: 1, recipeId: 1 }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)
      prisma.favorite.findUnique.mockResolvedValue(null)
      prisma.favorite.create.mockResolvedValue(mockFavorite)

      const response = await request(app).post('/api/favorites/1').expect(201)

      expect(response.body.message).toBe('Recipe added to favorites')
      expect(response.body.favorite).toEqual(mockFavorite)
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          recipeId: 1,
        },
      })
    })

    it('should return 400 if recipe already favorited', async () => {
      const mockRecipe = { id: 1 }
      const mockFavorite = { id: 1, userId: 1, recipeId: 1 }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite)

      await request(app).post('/api/favorites/1').expect(400)
    })

    it('should return 404 for non-existent recipe', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null)

      await request(app).post('/api/favorites/999').expect(404)
    })
  })

  describe('DELETE /api/favorites/:recipeId', () => {
    it('should remove recipe from favorites', async () => {
      const mockFavorite = { id: 1, userId: 1, recipeId: 1 }

      prisma.favorite.findUnique.mockResolvedValue(mockFavorite)
      prisma.favorite.delete.mockResolvedValue(mockFavorite)

      const response = await request(app).delete('/api/favorites/1').expect(200)

      expect(response.body.message).toBe('Recipe removed from favorites')
      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: {
          userId_recipeId: {
            userId: 1,
            recipeId: 1,
          },
        },
      })
    })

    it('should return 404 if favorite not found', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null)

      await request(app).delete('/api/favorites/1').expect(404)
    })
  })
})
