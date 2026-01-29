import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../store/hooks'

const RecipeCard = ({ recipe, onEdit, onDelete, onView, onToggleFavorite }) => {
  const { t } = useTranslation()
  const { language } = useAppSelector((state) => state.ui)
  const { favorites } = useAppSelector((state) => state.recipes)
  const { user } = useAppSelector((state) => state.auth)

  const isFavorite = favorites.some((fav) => fav.id === recipe.id)
  const isOwner = user?.id === recipe.author?.id

  const title = recipe.title
  const imageUrl =
    recipe.media?.find((media) => media?.type === 'image')?.url ||
    recipe.image_url ||
    'https://placehold.co//400x300'

  const handleFavoriteToggle = (e) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(recipe.id)
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
      className='bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer'
      onClick={handleView}
    >
      <div className='relative'>
        <img
          src={imageUrl}
          alt={title}
          className='w-full h-56 object-cover'
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x300'
          }}
        />
        <button
          onClick={handleFavoriteToggle}
          className='absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors'
        >
          <svg
            className={`w-6 h-6 ${isFavorite ? 'text-papaya' : 'text-gray-400'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
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
      <div className='p-5'>
        <h3 className='text-2xl font-bold text-space-cadet mb-2 truncate'>{title}</h3>
        <div className='flex items-center text-sm text-gray-500 mb-4'>
          {/* <svg className='w-5 h-5 mr-1 text-sunglow' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.24 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.965z' />
          </svg> */}
          {/* <span>{recipe.rating_avg || 'N/A'}</span>
          <span className='mx-2'>·</span> */}
          <span>{recipe.category}</span>
          {recipe.author?.name && (
            <>
              <span className='mx-2'>·</span>
              <span>{recipe.author.name}</span>
            </>
          )}
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className='flex flex-wrap gap-2 mt-4'>
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className='px-3 py-1 text-xs bg-sea-green text-white rounded-full'>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className='flex justify-end space-x-3 mt-4'>
          {isOwner && (
            <>
              <button
                onClick={handleEdit}
                className='text-cerulean hover:text-sea-green font-semibold transition-colors'
              >
                {t('common.edit')}
              </button>
              <button onClick={handleDelete} className='text-papaya hover:text-red-700 font-semibold transition-colors'>
                {t('common.delete')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
