import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { fetchRecipes, updateFilters, clearFilters, deleteRecipe, toggleFavorite } from '../../store/recipesThunks'
import { useNavigate } from 'react-router-dom'
import RecipeCard from './RecipeCard'

const RecipeList = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { recipes, loading, error, pagination, filters } = useAppSelector((state) => state.recipes)
  const { language } = useAppSelector((state) => state.ui)

  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [selectedCategory, setSelectedCategory] = useState(filters.category)
  const [selectedTags, setSelectedTags] = useState(filters.tags)

  // Available categories and tags (could be fetched from API)
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']
  const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']

  useEffect(() => {
    dispatch(fetchRecipes({ ...filters, language }))
  }, [dispatch, filters, language])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(updateFilters({ search: searchTerm }))
  }

  const handleCategoryChange = (category) => {
    const newCategory = selectedCategory === category ? '' : category
    setSelectedCategory(newCategory)
    dispatch(updateFilters({ category: newCategory }))
  }

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    setSelectedTags(newTags)
    dispatch(updateFilters({ tags: newTags }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedTags([])
    dispatch(clearFilters())
  }

  const handlePageChange = (page) => {
    dispatch(updateFilters({ page }))
  }

  const handleEditRecipe = (recipe) => {
    navigate(`/recipes/${recipe.id}/edit`)
  }

  const handleDeleteRecipe = async (recipe) => {
    if (window.confirm(t('common.confirm'))) {
      try {
        await dispatch(deleteRecipe(recipe.id)).unwrap()
      } catch (error) {
        console.error('Failed to delete recipe:', error)
      }
    }
  }

  const handleViewRecipe = (recipe) => {
    navigate(`/recipes/${recipe.id}`)
  }

  const handleAddRecipe = () => {
    navigate('/recipes/new')
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>{t('app.dashboard')}</h1>
        <button
          onClick={handleAddRecipe}
          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span>{t('recipes.addRecipe')}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <form onSubmit={handleSearch} className='space-y-4'>
          {/* Search Bar */}
          <div className='flex space-x-4'>
            <div className='flex-1'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('recipes.search')}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
              />
            </div>
            <button
              type='submit'
              className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              {t('recipes.search')}
            </button>
            <button
              type='button'
              onClick={handleClearFilters}
              className='px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
            >
              {t('recipes.filter')}
            </button>
          </div>

          {/* Categories */}
          <div>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>{t('recipes.categories')}</h3>
            <div className='flex flex-wrap gap-2'>
              {categories.map((category) => (
                <button
                  key={category}
                  type='button'
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>{t('recipes.tags')}</h3>
            <div className='flex flex-wrap gap-2'>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type='button'
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className='bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4'>
          <div className='flex'>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>{t('common.error')}</h3>
              <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
        </div>
      )}

      {/* Recipes Grid */}
      {!loading && recipes.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
              onView={handleViewRecipe}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recipes.length === 0 && !error && (
        <div className='text-center py-12'>
          <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            />
          </svg>
          <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>{t('recipes.noRecipes')}</h3>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{t('recipes.noRecipesDesc')}</p>
          <div className='mt-6'>
            <button
              onClick={handleAddRecipe}
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600'
            >
              <svg className='-ml-1 mr-2 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              {t('recipes.addRecipe')}
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className='flex justify-center items-center space-x-2'>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className='px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
          >
            {t('common.previous')}
          </button>

          <span className='text-sm text-gray-700 dark:text-gray-300'>
            {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className='px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  )
}

export default RecipeList
