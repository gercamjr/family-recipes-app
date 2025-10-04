const express = require('express')
const { authenticateToken, optionalAuth } = require('../middleware/auth')
const { formatRecipeResponse } = require('../utils/auth')
const { validate, emailShareSchema } = require('../utils/validation')
const prisma = require('../lib/prisma')
const router = express.Router()

// @route   GET /api/share/pdf/:recipeId
// @desc    Generate PDF for recipe sharing
// @access  Public (for public recipes)
router.get('/pdf/:recipeId', optionalAuth, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        author: {
          select: { email: true },
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

    // For now, return recipe data - PDF generation would require additional library like puppeteer
    // TODO: Implement PDF generation
    res.json({
      message: 'PDF generation not yet implemented',
      recipe: formattedRecipe,
    })
  } catch (error) {
    console.error('Share PDF error:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

// @route   POST /api/share/email/:recipeId
// @desc    Share recipe via email
// @access  Private
router.post('/email/:recipeId', authenticateToken, validate(emailShareSchema), async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)
    const { email } = req.body

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        author: {
          select: { email: true },
        },
      },
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check permissions
    if (!recipe.isPublic && req.user.id !== recipe.authorId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const language = req.user.languagePref
    const formattedRecipe = formatRecipeResponse(recipe, language)

    // TODO: Implement email sending with nodemailer
    // For now, just return success
    res.json({
      message: 'Email sharing not yet implemented',
      shared: {
        recipeId,
        email,
        recipeTitle: formattedRecipe.title,
      },
    })
  } catch (error) {
    console.error('Share email error:', error)
    res.status(500).json({ error: 'Failed to share recipe' })
  }
})

module.exports = router
