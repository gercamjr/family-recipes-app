import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { fetchRecipes, deleteRecipe, toggleFavorite } from '../../store/recipesThunks'
import { updateFilters } from '../../store/slices/recipesSlice'
import { useNavigate } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import RecipeFilters from './RecipeFilters'

const RecipeList = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { recipes, loading, error, pagination, filters } = useAppSelector((state) => state.recipes)
  const { language } = useAppSelector((state) => state.ui)

  useEffect(() => {
    dispatch(fetchRecipes({ ...filters, language }))
  }, [dispatch, filters, language])

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

  const handlePageChange = (page) => {
    dispatch(updateFilters({ page }))
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-space-cadet dark:text-white'>{t('app.dashboard')}</h1>
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

      <RecipeFilters />

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className='text-red-500'>{error}</p>}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {console.log('Rendering recipes:', recipes)}
        {recipes && recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => handleEditRecipe(recipe)}
              onDelete={() => handleDeleteRecipe(recipe)}
              onView={() => handleViewRecipe(recipe)}
              onToggleFavorite={() => dispatch(toggleFavorite(recipe.id))}
            />
          ))
        ) : (
          <p className='col-span-full text-center text-gray-500'>No recipes found</p>
        )}
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
