import { createAsyncThunk } from '@reduxjs/toolkit'
import { recipesService } from '../services/recipes'

// Fetch recipes with pagination and filters
export const fetchRecipes = createAsyncThunk('recipes/fetchRecipes', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await recipesService.getRecipes(params)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Fetch current user's recipes with pagination and filters
export const fetchMyRecipes = createAsyncThunk('recipes/fetchMyRecipes', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await recipesService.getMyRecipes(params)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Fetch single recipe by ID
export const fetchRecipeById = createAsyncThunk('recipes/fetchRecipeById', async (id, { rejectWithValue }) => {
  try {
    const response = await recipesService.getRecipe(id)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Create new recipe
export const createRecipe = createAsyncThunk('recipes/createRecipe', async (recipeData, { rejectWithValue }) => {
  try {
    const response = await recipesService.createRecipe(recipeData)
    return response
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Update existing recipe
export const updateRecipe = createAsyncThunk(
  'recipes/updateRecipe',
  async ({ id, recipeData }, { rejectWithValue }) => {
    try {
      const response = await recipesService.updateRecipe(id, recipeData)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

// Delete recipe
export const deleteRecipe = createAsyncThunk('recipes/deleteRecipe', async (id, { rejectWithValue }) => {
  try {
    await recipesService.deleteRecipe(id)
    return id
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Toggle favorite status
export const toggleFavorite = createAsyncThunk(
  'recipes/toggleFavorite',
  async ({ recipeId, isFavorite }, { rejectWithValue }) => {
    try {
      // This would call a favorites API endpoint
      // For now, we'll just return the recipeId
      return { recipeId, isFavorite }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

// Fetch comments for a recipe
export const fetchComments = createAsyncThunk('recipes/fetchComments', async (recipeId, { rejectWithValue }) => {
  try {
    const response = await recipesService.getComments(recipeId)
    return { recipeId, comments: response.comments }
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

// Add a comment to a recipe
export const addComment = createAsyncThunk(
  'recipes/addComment',
  async ({ recipeId, commentText }, { rejectWithValue }) => {
    try {
      const response = await recipesService.addComment(recipeId, commentText)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)
