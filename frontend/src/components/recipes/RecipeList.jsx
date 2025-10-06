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
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-space-cadet'>{t('app.dashboard')}</h1>
        <button
          onClick={handleAddRecipe}
          className='bg-papaya hover:bg-sunglow text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center'
        >
          <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          <span>{t('recipes.addRecipe')}</span>
        </button>
      </div>

      <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
        <form onSubmit={handleSearch} className='space-y-6'>
          <div className='flex items-center space-x-4'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('recipes.searchPlaceholder')}
              className='flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent'
            />
            <button
              type='submit'
              className='bg-cerulean hover:bg-sea-green text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300'
            >
              {t('common.search')}
            </button>
            <button
              type='button'
              onClick={handleClearFilters}
              className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300'
            >
              {t('common.clear')}
            </button>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-space-cadet mb-3'>{t('recipes.categories')}</h3>
            <div className='flex flex-wrap gap-3'>
              {categories.map((category) => (
                <button
                  key={category}
                  type='button'
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-300 ${
                    selectedCategory === category
                      ? 'bg-sunglow text-space-cadet shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t(`categories.${category.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-space-cadet mb-3'>{t('recipes.tags')}</h3>
            <div className='flex flex-wrap gap-3'>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type='button'
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-300 ${
                    selectedTags.includes(tag)
                      ? 'bg-sunglow text-space-cadet shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t(`tags.${tag.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className='text-red-500'>{error}</p>}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={() => handleEditRecipe(recipe)}
            onDelete={() => handleDeleteRecipe(recipe)}
            onView={() => handleViewRecipe(recipe)}
            onToggleFavorite={() => dispatch(toggleFavorite(recipe.id))}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className='flex justify-center mt-8'>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`mx-1 px-4 py-2 rounded-lg ${
                pagination.currentPage === page ? 'bg-cerulean text-white' : 'bg-white text-space-cadet'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecipeList
