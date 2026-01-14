import { createSlice } from '@reduxjs/toolkit'
import {
  fetchRecipes,
  fetchRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
} from '../recipesThunks'

const initialState = {
  recipes: [],
  currentRecipe: null,
  favorites: [],
  searchResults: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: '',
    category: '',
    tags: [],
    language: 'en',
  },
}

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    },
    resetCurrentRecipe: (state) => {
      state.currentRecipe = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch recipes
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false
        state.recipes = action.payload.recipes
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch recipe by ID
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.loading = false
        state.currentRecipe = action.payload.recipe
        state.error = null
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create recipe
      .addCase(createRecipe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.recipes.unshift(action.payload.recipe)
        state.error = null
      })
      .addCase(createRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update recipe
      .addCase(updateRecipe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.currentRecipe = action.payload.recipe
        // Update the recipe in the recipes array if it exists
        const index = state.recipes.findIndex((r) => r.id === action.payload.recipe.id)
        if (index !== -1) {
          state.recipes[index] = action.payload.recipe
        }
        state.error = null
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete recipe
      .addCase(deleteRecipe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.recipes = state.recipes.filter((r) => r.id !== action.payload)
        state.error = null
      })
      .addCase(deleteRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Toggle favorite
      .addCase(toggleFavorite.pending, () => {
        // No loading state for favorite toggle
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const recipeId = action.payload.recipeId
        const isFavorite = action.payload.isFavorite
        if (isFavorite) {
          state.favorites.push({ id: recipeId })
        } else {
          state.favorites = state.favorites.filter((f) => f.id !== recipeId)
        }
      })
      .addCase(toggleFavorite.rejected, () => {
        // Handle error if needed
      })
  },
})

export const { updateFilters, clearFilters, clearError, resetCurrentRecipe } = recipesSlice.actions

export default recipesSlice.reducer
