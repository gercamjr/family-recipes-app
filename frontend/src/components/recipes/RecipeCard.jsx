import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { addToFavorites, removeFromFavorites } from '../../store/slices/recipesSlice'

const RecipeCard = ({ recipe, onEdit, onDelete, onView }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { language } = useAppSelector((state) => state.ui)
  const { favorites } = useAppSelector((state) => state.recipes)
  const { user } = useAppSelector((state) => state.auth)

  const [imageError, setImageError] = useState(false)

  const isFavorite = favorites.some((fav) => fav.id === recipe.id)
  const isOwner = user?.id === recipe.user_id

  const title = language === 'es' ? recipe.title_es : recipe.title_en
  const ingredients = language === 'es' ? recipe.ingredients_es : recipe.ingredients_en
  const instructions = language === 'es' ? recipe.instructions_es : recipe.instructions_en

  const handleFavoriteToggle = (e) => {
    e.stopPropagation()
    if (isFavorite) {
      dispatch(removeFromFavorites(recipe.id))
    } else {
      dispatch(addToFavorites(recipe))
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(recipe)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(recipe)
  }

  const handleView = () => {
    onView?.(recipe)
  }

  return (
    <div
      className='bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer'
      onClick={handleView}
    >
      {/* Recipe Image */}
      <div className='h-48 bg-gray-200 dark:bg-gray-700 relative'>
        {recipe.image_url && !imageError ? (
          <img
            src={recipe.image_url}
            alt={title}
            className='w-full h-full object-cover'
            onError={() => setImageError(true)}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500'>
            <svg className='w-12 h-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          className='absolute top-2 right-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow'
        >
          <svg
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
            />
          </svg>
        </button>
      </div>

      {/* Recipe Content */}
      <div className='p-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2'>
          {title || t('recipes.sampleRecipe')}
        </h3>

        {/* Recipe Meta */}
        <div className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3'>
          <div className='flex items-center space-x-4'>
            {recipe.prep_time && (
              <span className='flex items-center'>
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {recipe.prep_time}min
              </span>
            )}
            {recipe.servings && (
              <span className='flex items-center'>
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                {recipe.servings}
              </span>
            )}
          </div>
        </div>

        {/* Tags/Categories */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-3'>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className='px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full'
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className='px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full'>
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between items-center'>
          <div className='flex space-x-2'>
            {isOwner && (
              <>
                <button
                  onClick={handleEdit}
                  className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                >
                  {t('recipes.editRecipe')}
                </button>
                <button
                  onClick={handleDelete}
                  className='px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                >
                  {t('recipes.deleteRecipe')}
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleView}
            className='px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors'
          >
            {t('common.view')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
