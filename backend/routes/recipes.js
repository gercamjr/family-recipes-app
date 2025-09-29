const express = require('express')
const { body, validationResult, query } = require('express-validator')
const { Recipe, User, Comment, Favorite, Media } = require('../models')
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth')
const { formatRecipeResponse } = require('../utils/auth')

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

      const offset = (page - 1) * limit
      const whereClause = { isPublic: true }

      // Add search conditions
      if (search) {
        const searchFields =
          language === 'es'
            ? ['titleEs', 'ingredientsEs', 'instructionsEs']
            : ['titleEn', 'ingredientsEn', 'instructionsEn']

        whereClause[require('sequelize').Op.or] = searchFields.map((field) => ({
          [field]: {
            [require('sequelize').Op.iLike]: `%${search}%`,
          },
        }))
      }

      if (category) {
        whereClause.categories = {
          [require('sequelize').Op.contains]: [category],
        }
      }

      if (tag) {
        whereClause.tags = {
          [require('sequelize').Op.contains]: [tag],
        }
      }

      const { count, rows: recipes } = await Recipe.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'email'],
          },
          {
            model: Media,
            as: 'media',
            order: [['order', 'ASC']],
          },
          {
            model: Comment,
            as: 'comments',
            attributes: ['id'],
          },
          {
            model: Favorite,
            as: 'favorites',
            attributes: ['id'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      })

      const formattedRecipes = recipes.map((recipe) => formatRecipeResponse(recipe, language))

      res.json({
        recipes: formattedRecipes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
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
    const recipes = await Recipe.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Media,
          as: 'media',
          order: [['order', 'ASC']],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
        {
          model: Favorite,
          as: 'favorites',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
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
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
        },
        {
          model: Media,
          as: 'media',
          order: [['order', 'ASC']],
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'email'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
        {
          model: Favorite,
          as: 'favorites',
          attributes: ['id'],
        },
      ],
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    if (!recipe.isPublic && (!req.user || req.user.id !== recipe.userId)) {
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

    const recipeData = {
      ...req.body,
      userId: req.user.id,
    }

    const recipe = await Recipe.create(recipeData)

    // Fetch with associations for response
    const createdRecipe = await Recipe.findByPk(recipe.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
        },
        {
          model: Media,
          as: 'media',
        },
      ],
    })

    const formattedRecipe = formatRecipeResponse(createdRecipe, req.user.languagePref)

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

    const recipe = await Recipe.findByPk(req.params.id)
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' || req.user.role === 'editor' || req.user.id === recipe.userId

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await recipe.update(req.body)

    // Fetch updated recipe with associations
    const updatedRecipe = await Recipe.findByPk(recipe.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
        },
        {
          model: Media,
          as: 'media',
        },
      ],
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
    const recipe = await Recipe.findByPk(req.params.id)
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || req.user.id === recipe.userId
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await recipe.destroy()

    res.json({ message: 'Recipe deleted successfully' })
  } catch (error) {
    console.error('Delete recipe error:', error)
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

module.exports = router
