import { http, HttpResponse } from 'msw'

// Mock API handlers for testing
// These intercept network requests and return mock responses

export const handlers = [
  // ============================================
  // Authentication Endpoints
  // ============================================

  // Login
  http.post('*/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json()

    // Simulate validation
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        token: 'mock-jwt-token-123',
      })
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }),

  // Register
  http.post('*/api/auth/register', async ({ request }) => {
    const { email, name } = await request.json()

    return HttpResponse.json({
      user: {
        id: 2,
        email,
        name,
        role: 'user',
      },
      token: 'mock-jwt-token-456',
    })
  }),

  // Send invite
  http.post('*/api/auth/invite', async ({ request }) => {
    const { email } = await request.json()

    if (!email) {
      return HttpResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    return HttpResponse.json({
      message: 'Invitation sent successfully',
    })
  }),

  // Logout
  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // Get current user
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    })
  }),

  // ============================================
  // Recipe Endpoints
  // ============================================

  // Get all recipes
  http.get('*/api/recipes', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const language = url.searchParams.get('language') || 'en'

    let recipes = [
      {
        id: 1,
        titleEn: 'Tacos',
        titleEs: 'Tacos',
        ingredientsEn: ['Tortillas', 'Beef', 'Cheese'],
        ingredientsEs: ['Tortillas', 'Carne', 'Queso'],
        instructionsEn: 'Cook and assemble',
        instructionsEs: 'Cocinar y ensamblar',
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        category: 'Mexican',
        tags: ['dinner', 'mexican'],
        author: { id: 1, email: 'test@example.com', name: 'Test User' },
        media: [
          {
            id: 10,
            url: 'https://example.com/tacos.jpg',
            type: 'image',
            filename: 'tacos.jpg',
            size: 12345,
            mimeType: 'image/jpeg',
            recipeId: 1,
          },
        ],
        commentsCount: 0,
        favoritesCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        titleEn: 'Pizza',
        titleEs: 'Pizza',
        ingredientsEn: ['Dough', 'Sauce', 'Cheese'],
        ingredientsEs: ['Masa', 'Salsa', 'Queso'],
        instructionsEn: 'Bake at 450°F',
        instructionsEs: 'Hornear a 230°C',
        prepTime: 30,
        cookTime: 15,
        servings: 6,
        category: 'Italian',
        tags: ['dinner', 'italian'],
        author: { id: 1, email: 'test@example.com', name: 'Test User' },
        media: [
          {
            id: 11,
            url: 'https://example.com/pizza.jpg',
            type: 'image',
            filename: 'pizza.jpg',
            size: 23456,
            mimeType: 'image/jpeg',
            recipeId: 2,
          },
        ],
        commentsCount: 0,
        favoritesCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]

    // Apply search filter
    if (search) {
      const searchField = language === 'es' ? 'titleEs' : 'titleEn'
      recipes = recipes.filter((recipe) => recipe[searchField].toLowerCase().includes(search.toLowerCase()))
    }

    // Apply category filter
    if (category) {
      recipes = recipes.filter((recipe) => recipe.category === category)
    }

    // Format recipes to match backend response (add title field based on language)
    const formattedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      title: language === 'es' ? recipe.titleEs : recipe.titleEn,
      ingredients: language === 'es' ? recipe.ingredientsEs : recipe.ingredientsEn,
      instructions: language === 'es' ? recipe.instructionsEs : recipe.instructionsEn,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      category: recipe.category,
      tags: recipe.tags,
      author: recipe.author,
      media: recipe.media,
      commentsCount: recipe.commentsCount,
      favoritesCount: recipe.favoritesCount,
      createdAt: recipe.createdAt,
    }))

    return HttpResponse.json({
      recipes: formattedRecipes,
      pagination: {
        page: 1,
        limit: 12,
        total: formattedRecipes.length,
        totalPages: Math.ceil(formattedRecipes.length / 12),
      },
    })
  }),

  // Get single recipe
  http.get('*/api/recipes/:id', ({ params }) => {
    const id = parseInt(params.id)

    if (id === 404) {
      return HttpResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    return HttpResponse.json({
      recipe: {
        id,
        titleEn: 'Test Recipe',
        titleEs: 'Receta de Prueba',
        ingredientsEn: ['Ingredient 1', 'Ingredient 2'],
        ingredientsEs: ['Ingrediente 1', 'Ingrediente 2'],
        instructionsEn: 'Test instructions',
        instructionsEs: 'Instrucciones de prueba',
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        category: 'Test',
        tags: ['test'],
        author: { id: 1, name: 'Test User' },
        createdAt: new Date().toISOString(),
      },
    })
  }),

  // Create recipe
  http.post('*/api/recipes', async ({ request }) => {
    const data = await request.json()

    return HttpResponse.json(
      {
        recipe: {
          id: Date.now(),
          ...data,
          author: { id: 1, name: 'Test User' },
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  }),

  // Update recipe
  http.put('*/api/recipes/:id', async ({ params, request }) => {
    const data = await request.json()

    return HttpResponse.json({
      recipe: {
        id: parseInt(params.id),
        ...data,
        updatedAt: new Date().toISOString(),
      },
    })
  }),

  // Delete recipe
  http.delete('*/api/recipes/:id', ({ params }) => {
    return HttpResponse.json({
      message: `Recipe ${params.id} deleted successfully`,
    })
  }),

  // ============================================
  // Comments Endpoints
  // ============================================

  // Get recipe comments
  http.get('*/api/recipes/:recipeId/comments', () => {
    return HttpResponse.json({
      comments: [
        {
          id: 1,
          content: 'Great recipe!',
          author: { id: 2, email: 'another@example.com', name: 'Another User' },
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }),

  // Add comment
  http.post('*/api/recipes/:recipeId/comments', async ({ request }) => {
    const { content } = await request.json()

    return HttpResponse.json(
      {
        comment: {
          id: Date.now(),
          content,
          author: { id: 1, email: 'test@example.com', name: 'Test User' },
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  }),

  // ============================================
  // Favorites Endpoints
  // ============================================

  // Get user favorites
  http.get('*/api/favorites', () => {
    return HttpResponse.json({
      favorites: [
        {
          id: 1,
          recipeId: 1,
          userId: 1,
        },
      ],
    })
  }),

  // Add to favorites
  http.post('*/api/favorites/:recipeId', ({ params }) => {
    return HttpResponse.json(
      {
        favorite: {
          id: Date.now(),
          recipeId: parseInt(params.recipeId),
          userId: 1,
        },
      },
      { status: 201 },
    )
  }),

  // Remove from favorites
  http.delete('*/api/favorites/:recipeId', () => {
    return HttpResponse.json({
      message: 'Removed from favorites',
    })
  }),

  // ============================================
  // Upload Endpoints
  // ============================================

  // Upload image/video
  http.post('*/api/upload', async () => {
    return HttpResponse.json({
      url: 'https://cloudinary.example.com/mock-image.jpg',
      publicId: 'mock-public-id',
      format: 'jpg',
    })
  }),

  // OCR image upload
  http.post('*/api/recipes/ocr', async () => {
    return HttpResponse.json({
      url: 'https://cloudinary.example.com/mock-ocr-image.jpg',
      publicId: 'family-recipes/ocr/mock-ocr-id',
      filename: 'recipe.jpg',
      size: 102400,
      mimeType: 'image/jpeg',
      type: 'image',
      ocrData: null,
    })
  }),

  // ============================================
  // Share Endpoints
  // ============================================

  // Share via email
  http.post('*/api/share/email', async ({ request }) => {
    const { recipeId, email } = await request.json()

    return HttpResponse.json({
      message: `Recipe ${recipeId} shared with ${email}`,
    })
  }),

  // Generate PDF
  http.get('*/api/share/pdf/:recipeId', () => {
    return HttpResponse.json({
      pdfUrl: 'https://example.com/recipe.pdf',
    })
  }),
]

// ============================================
// Error Handlers
// ============================================

// These can be used in specific tests to simulate errors
export const errorHandlers = {
  networkError: http.get('*/api/*', () => {
    return HttpResponse.error()
  }),

  serverError: http.get('*/api/*', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),

  unauthorizedError: http.get('*/api/*', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }),
}
