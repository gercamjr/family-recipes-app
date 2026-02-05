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
  role: z.enum(['admin', 'editor', 'viewer']).optional().default('editor'),
})

// Recipe validation schemas
const recipeSchema = z
  .object({
    titleEn: z.string().min(1, 'English title is required').optional(),
    titleEs: z.string().min(1, 'Spanish title is required').optional(),
    ingredientsEn: z.array(z.string()).min(1, 'At least one English ingredient is required').optional(),
    ingredientsEs: z.array(z.string()).min(1, 'At least one Spanish ingredient is required').optional(),
    instructionsEn: z.string().min(1, 'English instructions are required').optional(),
    instructionsEs: z.string().min(1, 'Spanish instructions are required').optional(),
    image_url: z.string().url().optional(), // Deprecated - for backwards compatibility
    media: z
      .array(
        z.object({
          url: z.string().url(),
          type: z.enum(['image', 'video']),
          filename: z.string().optional(),
          size: z.number().optional(),
          mimeType: z.string().optional(),
        }),
      )
      .optional(),
    prepTime: z.union([z.number(), z.string().transform(Number)]).optional(),
    cookTime: z.union([z.number(), z.string().transform(Number)]).optional(),
    servings: z.union([z.number().int().min(1), z.string().transform(Number)]).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    isPublic: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // Ensure at least one language is provided
      const hasEnglish = data.titleEn && data.ingredientsEn && data.instructionsEn
      const hasSpanish = data.titleEs && data.ingredientsEs && data.instructionsEs
      return hasEnglish || hasSpanish
    },
    {
      message: 'Recipe must have at least one complete language version (title, ingredients, and instructions)',
    },
  )

const recipeUpdateSchema = recipeSchema.partial()

// Comment validation
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
})

// Search/query validation
const searchQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  language: z.enum(['en', 'es']).optional(),
  page: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional(),
})

const myRecipesQuerySchema = searchQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'favorites', 'comments']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['all', 'public', 'private']).optional(),
})

// Email sharing validation
const emailShareSchema = z.object({
  email: z.string().email('Invalid email format'),
  message: z.string().max(500, 'Message too long').optional(),
})

// Validation middleware
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
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
    req.query = schema.parse(req.query)
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
  myRecipesQuerySchema,
  emailShareSchema,
  validate,
  validateQuery,
}
