const request = require('supertest')
const app = require('../server')

jest.mock('../lib/prisma', () => ({
  comment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}))
const prisma = require('../lib/prisma')

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', role: 'viewer' }
    next()
  },
  optionalAuth: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', role: 'viewer', languagePref: 'en' }
    next()
  },
  requireRole: jest.fn(() => (req, res, next) => next()),
}))

describe('Comments Routes', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/comments/:recipeId', () => {
    it('should get comments for a public recipe', async () => {
      const mockRecipe = { id: 1, isPublic: true }
      const mockComments = [
        {
          id: 1,
          content: 'Great recipe!',
          createdAt: '2025-10-03T14:32:38.533Z',
          author: { id: 2, email: 'author@example.com' },
        },
      ]

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)
      prisma.comment.findMany.mockResolvedValue(mockComments)

      const response = await request(app).get('/api/comments/1').expect(200)

      expect(response.body.comments).toEqual(mockComments)
      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({ where: { id: 1 }, select: { isPublic: true } })
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { recipeId: 1 },
        include: {
          author: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('should return 404 for non-existent recipe', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null)

      await request(app).get('/api/comments/999').expect(404)
    })

    it('should return 403 for private recipe without authentication', async () => {
      const mockRecipe = { id: 1, isPublic: false }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)

      await request(app).get('/api/comments/1').expect(403)
    })
  })

  describe('POST /api/comments/:recipeId', () => {
    it('should add a comment to a recipe', async () => {
      const mockRecipe = { id: 1 }
      const mockComment = {
        id: 1,
        content: 'Delicious!',
        recipeId: 1,
        authorId: 1,
        author: { id: 1, email: 'test@example.com' },
      }

      prisma.recipe.findUnique.mockResolvedValue(mockRecipe)
      prisma.comment.create.mockResolvedValue(mockComment)

      const response = await request(app).post('/api/comments/1').send({ content: 'Delicious!' }).expect(201)

      expect(response.body.message).toBe('Comment added successfully')
      expect(response.body.comment).toEqual(mockComment)
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Delicious!',
          recipeId: 1,
          authorId: 1,
        },
        include: {
          author: {
            select: { id: true, email: true },
          },
        },
      })
    })

    it('should return 400 for invalid comment data', async () => {
      const response = await request(app).post('/api/comments/1').send({ content: '' }).expect(400)

      expect(response.body.errors).toBeDefined()
    })
  })

  describe('PUT /api/comments/:id', () => {
    it('should update a comment by the author', async () => {
      const mockComment = {
        id: 1,
        content: 'Old comment',
        authorId: 1,
      }
      const updatedComment = {
        id: 1,
        content: 'Updated comment',
        author: { id: 1, email: 'test@example.com' },
      }

      prisma.comment.findUnique.mockResolvedValue(mockComment)
      prisma.comment.update.mockResolvedValue(updatedComment)

      const response = await request(app).put('/api/comments/1').send({ content: 'Updated comment' }).expect(200)

      expect(response.body.message).toBe('Comment updated successfully')
      expect(response.body.comment).toEqual(updatedComment)
    })

    it('should return 403 for updating others comment', async () => {
      const mockComment = {
        id: 1,
        content: 'Comment',
        authorId: 2, // Different author
      }

      prisma.comment.findUnique.mockResolvedValue(mockComment)

      await request(app).put('/api/comments/1').send({ content: 'Updated comment' }).expect(403)
    })
  })

  describe('DELETE /api/comments/:id', () => {
    it('should delete a comment by the author', async () => {
      const mockComment = {
        id: 1,
        authorId: 1,
      }

      prisma.comment.findUnique.mockResolvedValue(mockComment)
      prisma.comment.delete.mockResolvedValue(mockComment)

      const response = await request(app).delete('/api/comments/1').expect(200)

      expect(response.body.message).toBe('Comment deleted successfully')
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('should return 404 for non-existent comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(null)

      await request(app).delete('/api/comments/999').expect(404)
    })
  })
})
