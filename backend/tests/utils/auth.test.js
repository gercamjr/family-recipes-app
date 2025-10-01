const {
  hashPassword,
  verifyPassword,
  generateToken,
  generateInviteToken,
  getLanguageFields,
  formatRecipeResponse,
} = require('../../utils/auth')

describe('Auth Utilities', () => {
  beforeAll(() => {
    // Set up test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
  })

  describe('hashPassword', () => {
    test('should hash a password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).not.toBe(password) // Hash should be different from plain password
    })

    test('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Different salts should produce different hashes
    })
  })

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    test('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    test('should handle empty passwords', async () => {
      const password = ''
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(true)

      const isInvalid = await verifyPassword('notempty', hash)
      expect(isInvalid).toBe(false)
    })
  })

  describe('generateToken', () => {
    test('should generate a JWT token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        role: 'viewer',
      }

      const token = generateToken(user)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts separated by dots
    })

    test('should include correct payload in token', () => {
      const user = {
        id: 123,
        email: 'user@example.com',
        role: 'editor',
      }

      const token = generateToken(user)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      expect(decoded.id).toBe(123)
      expect(decoded.email).toBe('user@example.com')
      expect(decoded.role).toBe('editor')
      expect(decoded.iat).toBeDefined() // issued at timestamp
      expect(decoded.exp).toBeDefined() // expiration timestamp
    })

    test('should set correct expiration time', () => {
      const user = { id: 1, email: 'test@example.com', role: 'viewer' }
      const token = generateToken(user)

      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const issuedAt = decoded.iat
      const expiresAt = decoded.exp
      const sevenDaysInSeconds = 7 * 24 * 60 * 60

      expect(expiresAt - issuedAt).toBe(sevenDaysInSeconds)
    })
  })

  describe('generateInviteToken', () => {
    test('should generate a random token', () => {
      const token1 = generateInviteToken()
      const token2 = generateInviteToken()

      expect(token1).toBeDefined()
      expect(typeof token1).toBe('string')
      expect(token1.length).toBe(64) // 32 bytes * 2 hex chars per byte
      expect(token1).not.toBe(token2) // Should be random
    })

    test('should generate valid hex string', () => {
      const token = generateInviteToken()

      expect(/^[a-f0-9]+$/.test(token)).toBe(true)
    })
  })

  describe('getLanguageFields', () => {
    test('should return English fields by default', () => {
      const fields = getLanguageFields()

      expect(fields).toEqual({
        title: 'titleEn',
        ingredients: 'ingredientsEn',
        instructions: 'instructionsEn',
      })
    })

    test('should return English fields for en', () => {
      const fields = getLanguageFields('en')

      expect(fields).toEqual({
        title: 'titleEn',
        ingredients: 'ingredientsEn',
        instructions: 'instructionsEn',
      })
    })

    test('should return Spanish fields for es', () => {
      const fields = getLanguageFields('es')

      expect(fields).toEqual({
        title: 'titleEs',
        ingredients: 'ingredientsEs',
        instructions: 'instructionsEs',
      })
    })

    test('should return English fields for unknown language', () => {
      const fields = getLanguageFields('fr')

      expect(fields).toEqual({
        title: 'titleEn',
        ingredients: 'ingredientsEn',
        instructions: 'instructionsEn',
      })
    })
  })

  describe('formatRecipeResponse', () => {
    const mockRecipe = {
      id: 1,
      titleEn: 'Chocolate Cake',
      titleEs: 'Pastel de Chocolate',
      ingredientsEn: ['flour', 'sugar', 'chocolate'],
      ingredientsEs: ['harina', 'azúcar', 'chocolate'],
      instructionsEn: 'Mix and bake',
      instructionsEs: 'Mezclar y hornear',
      prepTime: 30,
      cookTime: 45,
      servings: 8,
      tags: ['dessert', 'cake'],
      categories: ['baking'],
      isPublic: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      author: {
        id: 1,
        email: 'author@example.com',
      },
      media: [{ id: 1, url: 'image.jpg' }],
      comments: [{ id: 1 }, { id: 2 }],
      favorites: [{ id: 1 }, { id: 2 }, { id: 3 }],
    }

    test('should format recipe in English by default', () => {
      const formatted = formatRecipeResponse(mockRecipe)

      expect(formatted.id).toBe(1)
      expect(formatted.title).toBe('Chocolate Cake')
      expect(formatted.ingredients).toEqual(['flour', 'sugar', 'chocolate'])
      expect(formatted.instructions).toBe('Mix and bake')
      expect(formatted.prepTime).toBe(30)
      expect(formatted.cookTime).toBe(45)
      expect(formatted.servings).toBe(8)
      expect(formatted.tags).toEqual(['dessert', 'cake'])
      expect(formatted.categories).toEqual(['baking'])
      expect(formatted.isPublic).toBe(true)
      expect(formatted.author).toEqual({ id: 1, email: 'author@example.com' })
      expect(formatted.media).toEqual([{ id: 1, url: 'image.jpg' }])
      expect(formatted.commentsCount).toBe(2)
      expect(formatted.favoritesCount).toBe(3)
    })

    test('should format recipe in Spanish', () => {
      const formatted = formatRecipeResponse(mockRecipe, 'es')

      expect(formatted.title).toBe('Pastel de Chocolate')
      expect(formatted.ingredients).toEqual(['harina', 'azúcar', 'chocolate'])
      expect(formatted.instructions).toBe('Mezclar y hornear')
    })

    test('should fallback to English when Spanish fields are missing', () => {
      const recipeWithoutSpanish = {
        ...mockRecipe,
        titleEs: null,
        ingredientsEs: null,
        instructionsEs: null,
      }

      const formatted = formatRecipeResponse(recipeWithoutSpanish, 'es')

      expect(formatted.title).toBe('Chocolate Cake')
      expect(formatted.ingredients).toEqual(['flour', 'sugar', 'chocolate'])
      expect(formatted.instructions).toBe('Mix and bake')
    })

    test('should handle missing author', () => {
      const recipeWithoutAuthor = { ...mockRecipe, author: null }

      const formatted = formatRecipeResponse(recipeWithoutAuthor)

      expect(formatted.author).toBeNull()
    })

    test('should handle missing media, comments, and favorites', () => {
      const minimalRecipe = {
        id: 1,
        titleEn: 'Simple Recipe',
        ingredientsEn: ['ingredient'],
        instructionsEn: 'Instructions',
        prepTime: null,
        cookTime: null,
        servings: null,
        tags: [],
        categories: [],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const formatted = formatRecipeResponse(minimalRecipe)

      expect(formatted.media).toEqual([])
      expect(formatted.commentsCount).toBe(0)
      expect(formatted.favoritesCount).toBe(0)
    })
  })
})
