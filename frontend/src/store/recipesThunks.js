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
  }
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
  }
)

export const clearFilters = createAsyncThunk('recipes/clearFilters', async (_, { rejectWithValue }) => {
  try {
    return {}
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const updateFilters = createAsyncThunk('recipes/updateFilters', async (newFilters, { rejectWithValue }) => {
  try {
    return newFilters
  } catch (error) {
    return rejectWithValue(error.message)
  }
})
