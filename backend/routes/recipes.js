const express = require('express')
const { body, validationResult, query } = require('express-validator')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth')
const { formatRecipeResponse } = require('../utils/auth')

const prisma = new PrismaClient()
const router = express.Router()

// Validation middleware
const validateRecipe = [
  body('titleEn').notEmpty().trim(),
  body('ingredientsEn').isArray({ min: 1 }),
  body('instructionsEn').notEmpty().trim(),
  body('titleEs').optional().trim(),
  body('ingredientsEs').optional().isArray(),
  body('instructionsEs').optional().trim(),
  body('prepTime').optional().isInt({ min: 0 }),
  body('cookTime').optional().isInt({ min: 0 }),
  body('servings').optional().isInt({ min: 1 }),
  body('tags').optional().isArray(),
  body('categories').optional().isArray(),
  body('isPublic').optional().isBoolean(),
]

// @route   GET /api/recipes
// @desc    Get all recipes with optional search
// @access  Public (for public recipes)
router.get(
  '/',
  optionalAuth,
  [
    query('search').optional().trim(),
    query('category').optional().trim(),
    query('tag').optional().trim(),
    query('language').optional().isIn(['en', 'es']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const { search, category, tag, language = req.user?.languagePref || 'en', page = 1, limit = 20 } = req.query

      const skip = (page - 1) * limit
      const whereClause = { isPublic: true }

      // Add search conditions
      if (search) {
        const searchFields = language === 'es' ? ['titleEs', 'instructionsEs'] : ['titleEn', 'instructionsEn']

        whereClause.OR = searchFields.map((field) => ({
          [field]: {
            contains: search,
            mode: 'insensitive',
          },
        }))
      }

      if (category) {
        whereClause.categories = { has: category }
      }

      if (tag) {
        whereClause.tags = { has: tag }
      }

      const recipes = await prisma.recipe.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, email: true },
          },
          _count: {
            select: { comments: true, favorites: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: skip,
      })

      const totalRecipes = await prisma.recipe.count({ where: whereClause })

      const formattedRecipes = recipes.map((recipe) => formatRecipeResponse(recipe, language))

      res.json({
        recipes: formattedRecipes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRecipes,
          pages: Math.ceil(totalRecipes / limit),
        },
      })
    } catch (error) {
      console.error('Get recipes error:', error)
      res.status(500).json({ error: 'Failed to fetch recipes' })
    }
  }
)

// @route   GET /api/recipes/my
// @desc    Get user's own recipes
// @access  Private
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { authorId: req.user.id },
      include: {
        _count: {
          select: { comments: true, favorites: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedRecipes = recipes.map((recipe) => formatRecipeResponse(recipe, req.user.languagePref))

    res.json({ recipes: formattedRecipes })
  } catch (error) {
    console.error('Get my recipes error:', error)
    res.status(500).json({ error: 'Failed to fetch your recipes' })
  }
})

// @route   GET /api/recipes/:id
// @desc    Get single recipe
// @access  Public (for public recipes) or Private (for own recipes)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        author: {
          select: { id: true, email: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { favorites: true },
        },
      },
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    if (!recipe.isPublic && (!req.user || req.user.id !== recipe.authorId)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const language = req.user?.languagePref || 'en'
    const formattedRecipe = formatRecipeResponse(recipe, language)

    res.json({ recipe: formattedRecipe })
  } catch (error) {
    console.error('Get recipe error:', error)
    res.status(500).json({ error: 'Failed to fetch recipe' })
  }
})

// @route   POST /api/recipes
// @desc    Create new recipe
// @access  Private
router.post('/', authenticateToken, validateRecipe, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { titleEn, ingredientsEn, instructionsEn, ...rest } = req.body

    const recipeData = {
      titleEn,
      ingredientsEn,
      instructionsEn,
      ...rest,
      authorId: req.user.id,
    }

    const recipe = await prisma.recipe.create({
      data: recipeData,
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
    })

    const formattedRecipe = formatRecipeResponse(recipe, req.user.languagePref)

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: formattedRecipe,
    })
  } catch (error) {
    console.error('Create recipe error:', error)
    res.status(500).json({ error: 'Failed to create recipe' })
  }
})

// @route   PUT /api/recipes/:id
// @desc    Update recipe
// @access  Private (owner or editor/admin)
router.put('/:id', authenticateToken, validateRecipe, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const recipeId = parseInt(req.params.id)
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' || req.user.role === 'editor' || req.user.id === recipe.authorId

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: req.body,
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
    })

    const formattedRecipe = formatRecipeResponse(updatedRecipe, req.user.languagePref)

    res.json({
      message: 'Recipe updated successfully',
      recipe: formattedRecipe,
    })
  } catch (error) {
    console.error('Update recipe error:', error)
    res.status(500).json({ error: 'Failed to update recipe' })
  }
})

// @route   DELETE /api/recipes/:id
// @desc    Delete recipe
// @access  Private (owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id)
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || req.user.id === recipe.authorId
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.recipe.delete({ where: { id: recipeId } })

    res.json({ message: 'Recipe deleted successfully' })
  } catch (error) {
    console.error('Delete recipe error:', error)
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

module.exports = router
