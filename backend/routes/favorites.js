const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { formatRecipeResponse } = require('../utils/auth')
const prisma = require('../lib/prisma')
const router = express.Router()

// @route   GET /api/favorites
// @desc    Get user's favorite recipes
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
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

    const recipes = favorites.map((fav) => fav.recipe)
    const formattedRecipes = recipes.map((recipe) => formatRecipeResponse(recipe, req.user.languagePref))

    res.json({ recipes: formattedRecipes })
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({ error: 'Failed to fetch favorites' })
  }
})

// @route   POST /api/favorites/:recipeId
// @desc    Add recipe to favorites
// @access  Private
router.post('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId: req.user.id,
          recipeId,
        },
      },
    })

    if (existingFavorite) {
      return res.status(400).json({ error: 'Recipe already in favorites' })
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        recipeId,
      },
    })

    res.status(201).json({
      message: 'Recipe added to favorites',
      favorite,
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    res.status(500).json({ error: 'Failed to add to favorites' })
  }
})

// @route   DELETE /api/favorites/:recipeId
// @desc    Remove recipe from favorites
// @access  Private
router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId: req.user.id,
          recipeId,
        },
      },
    })

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' })
    }

    await prisma.favorite.delete({
      where: {
        userId_recipeId: {
          userId: req.user.id,
          recipeId,
        },
      },
    })

    res.json({ message: 'Recipe removed from favorites' })
  } catch (error) {
    console.error('Remove favorite error:', error)
    res.status(500).json({ error: 'Failed to remove from favorites' })
  }
})

module.exports = router
