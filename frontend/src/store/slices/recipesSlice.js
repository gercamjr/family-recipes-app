import { createSlice } from '@reduxjs/toolkit'

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
    fetchRecipesStart: (state) => {
      state.loading = true
      state.error = null
    },
    fetchRecipesSuccess: (state, action) => {
      state.loading = false
      state.recipes = action.payload.recipes
      state.pagination = action.payload.pagination
      state.error = null
    },
    fetchRecipesFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    fetchRecipeByIdStart: (state) => {
      state.loading = true
      state.error = null
    },
    fetchRecipeByIdSuccess: (state, action) => {
      state.loading = false
      state.currentRecipe = action.payload
      state.error = null
    },
    fetchRecipeByIdFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    createRecipeStart: (state) => {
      state.loading = true
      state.error = null
    },
    createRecipeSuccess: (state, action) => {
      state.loading = false
      state.recipes.unshift(action.payload)
      state.error = null
    },
    createRecipeFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    updateRecipeStart: (state) => {
      state.loading = true
      state.error = null
    },
    updateRecipeSuccess: (state, action) => {
      state.loading = false
      const index = state.recipes.findIndex((recipe) => recipe.id === action.payload.id)
      if (index !== -1) {
        state.recipes[index] = action.payload
      }
      if (state.currentRecipe && state.currentRecipe.id === action.payload.id) {
        state.currentRecipe = action.payload
      }
      state.error = null
    },
    updateRecipeFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    deleteRecipeStart: (state) => {
      state.loading = true
      state.error = null
    },
    deleteRecipeSuccess: (state, action) => {
      state.loading = false
      state.recipes = state.recipes.filter((recipe) => recipe.id !== action.payload)
      state.favorites = state.favorites.filter((recipe) => recipe.id !== action.payload)
      if (state.currentRecipe && state.currentRecipe.id === action.payload) {
        state.currentRecipe = null
      }
      state.error = null
    },
    deleteRecipeFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    addToFavorites: (state, action) => {
      if (!state.favorites.find((recipe) => recipe.id === action.payload.id)) {
        state.favorites.push(action.payload)
      }
    },
    removeFromFavorites: (state, action) => {
      state.favorites = state.favorites.filter((recipe) => recipe.id !== action.payload)
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload
    },
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
})

export const {
  fetchRecipesStart,
  fetchRecipesSuccess,
  fetchRecipesFailure,
  fetchRecipeByIdStart,
  fetchRecipeByIdSuccess,
  fetchRecipeByIdFailure,
  createRecipeStart,
  createRecipeSuccess,
  createRecipeFailure,
  updateRecipeStart,
  updateRecipeSuccess,
  updateRecipeFailure,
  deleteRecipeStart,
  deleteRecipeSuccess,
  deleteRecipeFailure,
  addToFavorites,
  removeFromFavorites,
  setFavorites,
  setSearchResults,
  updateFilters,
  clearFilters,
  clearError,
  resetCurrentRecipe,
} = recipesSlice.actions

export default recipesSlice.reducer
