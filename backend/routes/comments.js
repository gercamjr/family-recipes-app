const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()

// Validation middleware
const validateComment = [body('content').notEmpty().trim().isLength({ max: 1000 })]

// @route   GET /api/comments/:recipeId
// @desc    Get comments for a recipe
// @access  Public (for public recipes)
router.get('/:recipeId', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId)

    // Check if recipe exists and is public
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { isPublic: true },
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    if (!recipe.isPublic && !req.user) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// @route   POST /api/comments/:recipeId
// @desc    Add comment to recipe
// @access  Private
router.post('/:recipeId', authenticateToken, validateComment, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const recipeId = parseInt(req.params.recipeId)
    const { content } = req.body

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        recipeId,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
    })

    res.status(201).json({
      message: 'Comment added successfully',
      comment,
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (comment author or admin)
router.put('/:id', authenticateToken, validateComment, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const commentId = parseInt(req.params.id)
    const { content } = req.body

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' || req.user.id === comment.authorId
    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, email: true },
        },
      },
    })

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({ error: 'Failed to update comment' })
  }
})

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (comment author or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id)

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || req.user.id === comment.authorId
    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

module.exports = router
