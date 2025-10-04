const { z } = require('zod')

// User validation schemas
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  languagePref: z.enum(['en', 'es']).optional().default('en'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const inviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'editor', 'viewer']).optional().default('viewer'),
})

// Recipe validation schemas
const recipeSchema = z.object({
  titleEn: z.string().min(1, 'English title is required'),
  titleEs: z.string().min(1, 'Spanish title is required').optional(),
  ingredientsEn: z.array(z.string()).min(1, 'At least one English ingredient is required'),
  ingredientsEs: z.array(z.string()).min(1, 'At least one Spanish ingredient is required').optional(),
  instructionsEn: z.string().min(1, 'English instructions are required'),
  instructionsEs: z.string().min(1, 'Spanish instructions are required').optional(),
  prepTime: z.number().int().min(0).optional(),
  cookTime: z.number().int().min(0).optional(),
  servings: z.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
})

const recipeUpdateSchema = recipeSchema.partial()

// Comment validation
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
})

// Search/query validation
const searchQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  language: z.enum(['en', 'es']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

// Email sharing validation
const emailShareSchema = z.object({
  email: z.string().email('Invalid email format'),
  message: z.string().max(500, 'Message too long').optional(),
})

// Validation middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        errors: error.issues.map((err) => ({
          msg: err.message,
          param: err.path.join('.'),
          location: 'body',
        })),
      })
    }
    // Handle other errors
    return res.status(400).json({ error: 'Validation failed' })
  }
}

const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        errors: error.issues.map((err) => ({
          msg: err.message,
          param: err.path.join('.'),
          location: 'query',
        })),
      })
    }
    // Handle other errors
    return res.status(400).json({ error: 'Query validation failed' })
  }
}

module.exports = {
  userSchema,
  loginSchema,
  inviteSchema,
  recipeSchema,
  recipeUpdateSchema,
  commentSchema,
  searchQuerySchema,
  emailShareSchema,
  validate,
  validateQuery,
}
