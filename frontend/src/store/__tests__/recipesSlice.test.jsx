import recipesReducer, { updateFilters, clearFilters } from '../slices/recipesSlice'
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe, toggleFavorite } from '../recipesThunks'

describe('recipesSlice', () => {
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

  it('should return the initial state', () => {
    expect(recipesReducer(undefined, { type: undefined })).toEqual(initialState)
  })

  it('should handle fetchRecipes.fulfilled', () => {
    const recipes = [
      { id: 1, title: 'Pasta Carbonara', category: 'Italian' },
      { id: 2, title: 'Chicken Curry', category: 'Indian' },
    ]
    const pagination = {
      page: 1,
      limit: 12,
      total: 25,
      totalPages: 3,
    }
    const action = {
      type: fetchRecipes.fulfilled.type,
      payload: { recipes, pagination },
    }
    const actual = recipesReducer({ ...initialState, loading: true }, action)
    expect(actual.loading).toEqual(false)
    expect(actual.recipes).toEqual(recipes)
    expect(actual.pagination).toEqual(pagination)
    expect(actual.error).toEqual(null)
  })

  it('should handle createRecipe.fulfilled', () => {
    const newRecipe = { id: 3, title: 'New Recipe', category: 'Dessert' }
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Existing Recipe' },
        { id: 2, title: 'Another Recipe' },
      ],
    }
    const action = {
      type: createRecipe.fulfilled.type,
      payload: { recipe: newRecipe },
    }
    const actual = recipesReducer(stateWithRecipes, action)
    expect(actual.recipes[0]).toEqual(newRecipe)
    expect(actual.recipes).toHaveLength(3)
  })

  it('should handle updateRecipe.fulfilled', () => {
    const updatedRecipe = { id: 1, title: 'Updated Pasta', category: 'Italian' }
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Old Pasta', category: 'Italian' },
        { id: 2, title: 'Chicken Curry', category: 'Indian' },
      ],
      currentRecipe: { id: 1, title: 'Old Pasta', category: 'Italian' },
    }
    const action = {
      type: updateRecipe.fulfilled.type,
      payload: { recipe: updatedRecipe },
    }
    const actual = recipesReducer(stateWithRecipes, action)
    expect(actual.recipes[0]).toEqual(updatedRecipe)
    expect(actual.currentRecipe).toEqual(updatedRecipe)
  })

  it('should handle deleteRecipe.fulfilled', () => {
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Recipe 1' },
        { id: 2, title: 'Recipe 2' },
      ],
      currentRecipe: { id: 1, title: 'Recipe 1' },
    }
    const action = {
      type: deleteRecipe.fulfilled.type,
      payload: 1,
    }
    const actual = recipesReducer(stateWithRecipes, action)
    expect(actual.recipes).toHaveLength(1)
    expect(actual.recipes[0].id).toEqual(2)
  })

  it('should handle toggleFavorite.fulfilled (add)', () => {
    const recipeId = 1
    const action = {
      type: toggleFavorite.fulfilled.type,
      payload: { recipeId, isFavorite: true },
    }
    const actual = recipesReducer(initialState, action)
    expect(actual.favorites).toEqual([{ id: recipeId }])
  })

  it('should handle toggleFavorite.fulfilled (remove)', () => {
    const recipeId = 1
    const stateWithFavorites = {
      ...initialState,
      favorites: [{ id: recipeId }],
    }
    const action = {
      type: toggleFavorite.fulfilled.type,
      payload: { recipeId, isFavorite: false },
    }
    const actual = recipesReducer(stateWithFavorites, action)
    expect(actual.favorites).toHaveLength(0)
  })

  it('should handle updateFilters', () => {
    const newFilters = {
      search: 'pasta',
      category: 'Italian',
      tags: ['vegetarian'],
    }
    const actual = recipesReducer(initialState, updateFilters(newFilters))
    expect(actual.filters).toEqual({
      ...initialState.filters,
      ...newFilters,
    })
  })

  it('should handle clearFilters', () => {
    const stateWithFilters = {
      ...initialState,
      filters: {
        search: 'pasta',
        category: 'Italian',
        tags: ['vegetarian'],
        language: 'es',
      },
    }
    const actual = recipesReducer(stateWithFilters, clearFilters())
    expect(actual.filters).toEqual(initialState.filters)
  })
})
