const request = require('supertest')
const app = require('../server')
const jwt = require('jsonwebtoken')

jest.mock('../lib/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  recipe: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}))
const prisma = require('../lib/prisma')

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
}))

const user = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'EDITOR',
  isActive: true,
  languagePref: 'en',
}

const recipe = {
  id: 1,
  authorId: user.id,
  titleEn: 'Test Recipe',
  ingredientsEn: ['Ingredient 1', 'Ingredient 2'],
  instructionsEn: 'Test instructions',
  titleEs: 'Receta de prueba',
  ingredientsEs: ['Ingrediente 1', 'Ingrediente 2'],
  instructionsEs: 'Instrucciones de prueba',
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: user.id,
    email: user.email,
  },
  _count: {
    comments: 0,
    favorites: 0,
  },
}

describe('Recipes API', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/recipes', () => {
    it('should return a list of public recipes', async () => {
      prisma.recipe.findMany.mockResolvedValue([recipe])
      prisma.recipe.count.mockResolvedValue(1)

      const res = await request(app).get('/api/recipes')

      expect(res.statusCode).toEqual(200)
      expect(res.body.recipes).toHaveLength(1)
      expect(res.body.recipes[0].title).toEqual(recipe.titleEn)
      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublic: true },
        })
      )
    })
  })

  describe('GET /api/recipes/my', () => {
    it('should return recipes created by the authenticated user', async () => {
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.recipe.findMany.mockResolvedValue([recipe])
      prisma.recipe.count.mockResolvedValue(1)

      const res = await request(app).get('/api/recipes/my').set('Authorization', 'Bearer valid-token')

      expect(res.statusCode).toEqual(200)
      expect(res.body.recipes).toHaveLength(1)
      expect(res.body.recipes[0].title).toEqual(recipe.titleEn)
      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: user.id },
        })
      )
    })

    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/recipes/my')
      expect(res.statusCode).toEqual(401)
    })
  })

  describe('GET /api/recipes/:id', () => {
    it('should return a single public recipe', async () => {
      prisma.recipe.findUnique.mockResolvedValue(recipe)

      const res = await request(app).get(`/api/recipes/${recipe.id}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.recipe.title).toEqual(recipe.titleEn)
    })

    it('should return 404 for a non-existent recipe', async () => {
      prisma.recipe.findUnique.mockResolvedValue(null)
      const res = await request(app).get('/api/recipes/999')
      expect(res.statusCode).toEqual(404)
    })

    it('should return a private recipe if the user is the author', async () => {
      const privateRecipe = { ...recipe, isPublic: false }
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.recipe.findUnique.mockResolvedValue(privateRecipe)

      const res = await request(app).get(`/api/recipes/${privateRecipe.id}`).set('Authorization', 'Bearer valid-token')

      expect(res.statusCode).toEqual(200)
      expect(res.body.recipe.title).toEqual(privateRecipe.titleEn)
    })

    it('should return 403 for a private recipe if user is not the author', async () => {
      const privateRecipe = { ...recipe, isPublic: false, authorId: 2 }
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.recipe.findUnique.mockResolvedValue(privateRecipe)

      const res = await request(app).get(`/api/recipes/${privateRecipe.id}`).set('Authorization', 'Bearer valid-token')

      expect(res.statusCode).toEqual(403)
    })
  })

  describe('POST /api/recipes', () => {
    const newRecipeData = {
      titleEn: 'New Recipe',
      ingredientsEn: ['New Ingredient'],
      instructionsEn: 'New instructions',
    }

    it('should create a new recipe for an authenticated user', async () => {
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      const createdRecipe = {
        ...recipe,
        ...newRecipeData,
        id: 2,
        authorId: user.id,
      }
      prisma.recipe.create.mockResolvedValue(createdRecipe)

      const res = await request(app).post('/api/recipes').set('Authorization', 'Bearer valid-token').send(newRecipeData)

      expect(res.statusCode).toEqual(201)
      expect(res.body.recipe.title).toEqual(newRecipeData.titleEn)
      expect(prisma.recipe.create).toHaveBeenCalledWith({
        data: {
          titleEn: newRecipeData.titleEn,
          ingredientsEn: newRecipeData.ingredientsEn,
          instructionsEn: newRecipeData.instructionsEn,
          authorId: user.id,
        },
        include: {
          author: {
            select: { id: true, email: true },
          },
        },
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).post('/api/recipes').send(newRecipeData)
      expect(res.statusCode).toEqual(401)
    })
  })

  describe('PUT /api/recipes/:id', () => {
    const updatedData = {
      titleEn: 'Updated Recipe',
      ingredientsEn: ['Updated Ingredient'],
      instructionsEn: 'Updated instructions',
    }

    it('should update a recipe if user is the author', async () => {
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.recipe.findUnique.mockResolvedValue(recipe)
      prisma.recipe.update.mockResolvedValue({ ...recipe, ...updatedData })

      const res = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatedData)

      expect(res.statusCode).toEqual(200)
      expect(res.body.recipe.title).toEqual(updatedData.titleEn)
    })

    it('should return 403 if user is not the author or an admin/editor', async () => {
      const otherUser = { ...user, id: 2, role: 'VIEWER' }
      jwt.verify.mockReturnValue({ id: otherUser.id })
      prisma.user.findUnique.mockResolvedValue(otherUser)
      prisma.recipe.findUnique.mockResolvedValue(recipe)

      const res = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updatedData)

      expect(res.statusCode).toEqual(403)
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    it('should delete a recipe if user is the author', async () => {
      jwt.verify.mockReturnValue({ id: user.id })
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.recipe.findUnique.mockResolvedValue(recipe)
      prisma.recipe.delete.mockResolvedValue(recipe)

      const res = await request(app).delete(`/api/recipes/${recipe.id}`).set('Authorization', 'Bearer valid-token')

      expect(res.statusCode).toEqual(200)
      expect(res.body).toEqual({ message: 'Recipe deleted successfully' })
    })

    it('should return 403 if user is not the author or an admin', async () => {
      const otherUser = { ...user, id: 2, role: 'EDITOR' }
      jwt.verify.mockReturnValue({ id: otherUser.id })
      prisma.user.findUnique.mockResolvedValue(otherUser)
      prisma.recipe.findUnique.mockResolvedValue(recipe)

      const res = await request(app).delete(`/api/recipes/${recipe.id}`).set('Authorization', 'Bearer valid-token')

      expect(res.statusCode).toEqual(403)
    })
  })
})
