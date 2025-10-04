import recipesReducer, {
  fetchRecipesSuccess,
  createRecipeSuccess,
  updateRecipeSuccess,
  deleteRecipeSuccess,
  addToFavorites,
  removeFromFavorites,
  updateFilters,
  clearFilters,
} from '../slices/recipesSlice'

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

  it('should handle fetchRecipesSuccess', () => {
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
    const actual = recipesReducer({ ...initialState, loading: true }, fetchRecipesSuccess({ recipes, pagination }))
    expect(actual.loading).toEqual(false)
    expect(actual.recipes).toEqual(recipes)
    expect(actual.pagination).toEqual(pagination)
    expect(actual.error).toEqual(null)
  })

  it('should handle createRecipeSuccess', () => {
    const newRecipe = { id: 3, title: 'New Recipe', category: 'Dessert' }
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Existing Recipe' },
        { id: 2, title: 'Another Recipe' },
      ],
    }
    const actual = recipesReducer(stateWithRecipes, createRecipeSuccess(newRecipe))
    expect(actual.recipes[0]).toEqual(newRecipe) // Should be added to the beginning
    expect(actual.recipes).toHaveLength(3)
  })

  it('should handle updateRecipeSuccess', () => {
    const updatedRecipe = { id: 1, title: 'Updated Pasta', category: 'Italian' }
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Old Pasta', category: 'Italian' },
        { id: 2, title: 'Chicken Curry', category: 'Indian' },
      ],
      currentRecipe: { id: 1, title: 'Old Pasta', category: 'Italian' },
    }
    const actual = recipesReducer(stateWithRecipes, updateRecipeSuccess(updatedRecipe))
    expect(actual.recipes[0]).toEqual(updatedRecipe)
    expect(actual.currentRecipe).toEqual(updatedRecipe)
  })

  it('should handle deleteRecipeSuccess', () => {
    const stateWithRecipes = {
      ...initialState,
      recipes: [
        { id: 1, title: 'Recipe 1' },
        { id: 2, title: 'Recipe 2' },
      ],
      favorites: [
        { id: 1, title: 'Recipe 1' },
        { id: 3, title: 'Recipe 3' },
      ],
      currentRecipe: { id: 1, title: 'Recipe 1' },
    }
    const actual = recipesReducer(stateWithRecipes, deleteRecipeSuccess(1))
    expect(actual.recipes).toHaveLength(1)
    expect(actual.recipes[0].id).toEqual(2)
    expect(actual.favorites).toHaveLength(1) // Recipe 1 removed from favorites
    expect(actual.favorites[0].id).toEqual(3)
    expect(actual.currentRecipe).toEqual(null)
  })

  it('should handle addToFavorites', () => {
    const recipe = { id: 1, title: 'Favorite Recipe' }
    const actual = recipesReducer(initialState, addToFavorites(recipe))
    expect(actual.favorites).toEqual([recipe])
  })

  it('should not add duplicate to favorites', () => {
    const recipe = { id: 1, title: 'Favorite Recipe' }
    const stateWithFavorite = {
      ...initialState,
      favorites: [recipe],
    }
    const actual = recipesReducer(stateWithFavorite, addToFavorites(recipe))
    expect(actual.favorites).toEqual([recipe]) // Should not add duplicate
  })

  it('should handle removeFromFavorites', () => {
    const stateWithFavorites = {
      ...initialState,
      favorites: [
        { id: 1, title: 'Recipe 1' },
        { id: 2, title: 'Recipe 2' },
      ],
    }
    const actual = recipesReducer(stateWithFavorites, removeFromFavorites(1))
    expect(actual.favorites).toHaveLength(1)
    expect(actual.favorites[0].id).toEqual(2)
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
