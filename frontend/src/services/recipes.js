import api from './api.js'

export const recipesService = {
  // Get all recipes with optional search/filtering
  async getRecipes(params = {}) {
    try {
      const response = await api.get('/recipes', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recipes')
    }
  },

  // Get single recipe by ID
  async getRecipe(id) {
    try {
      const response = await api.get(`/recipes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recipe')
    }
  },

  // Create new recipe
  async createRecipe(recipeData) {
    try {
      const response = await api.post('/recipes', recipeData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create recipe')
    }
  },

  // Update existing recipe
  async updateRecipe(id, recipeData) {
    try {
      const response = await api.put(`/recipes/${id}`, recipeData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update recipe')
    }
  },

  // Delete recipe
  async deleteRecipe(id) {
    try {
      const response = await api.delete(`/recipes/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete recipe')
    }
  },

  // Search recipes by keywords, ingredients, categories
  async searchRecipes(searchParams) {
    try {
      const response = await api.get('/recipes/search', { params: searchParams })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Search failed')
    }
  },

  // Get user's favorite recipes
  async getFavorites() {
    try {
      const response = await api.get('/favorites')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites')
    }
  },

  // Add recipe to favorites
  async addToFavorites(recipeId) {
    try {
      const response = await api.post('/favorites', { recipeId })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add to favorites')
    }
  },

  // Remove recipe from favorites
  async removeFromFavorites(recipeId) {
    try {
      const response = await api.delete(`/favorites/${recipeId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove from favorites')
    }
  },

  // Get comments for a recipe
  async getComments(recipeId) {
    try {
      const response = await api.get(`/comments?recipeId=${recipeId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch comments')
    }
  },

  // Add a comment to a recipe
  async addComment(recipeId, commentText) {
    try {
      const response = await api.post('/comments', { recipeId, commentText })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add comment')
    }
  },

  // Upload media file (image/video) to Cloudinary via backend
  async uploadMedia(file, recipeId = null) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (recipeId) {
        formData.append('recipeId', recipeId)
      }

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload media')
    }
  },
}
