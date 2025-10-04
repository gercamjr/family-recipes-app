import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { fetchRecipeById } from '../../store/recipesThunks'
import { addToFavorites, removeFromFavorites } from '../../store/slices/recipesSlice'
import { fetchComments, addComment } from '../../store/recipesThunks'
import { useParams, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'

const RecipeDetail = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { language } = useAppSelector((state) => state.ui)
  const { currentRecipe: recipe, loading, favorites } = useAppSelector((state) => state.recipes)
  const { user } = useAppSelector((state) => state.auth)

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchRecipeById(id))
      loadComments()
    }
  }, [dispatch, id])

  const loadComments = async () => {
    setCommentsLoading(true)
    try {
      const result = await dispatch(fetchComments(id)).unwrap()
      setComments(result.comments)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const isFavorite = favorites.some((fav) => fav.id === recipe?.id)
  const isOwner = user?.id === recipe?.user_id

  const title = language === 'es' ? recipe?.title_es : recipe?.title_en
  const ingredients = language === 'es' ? recipe?.ingredients_es : recipe?.ingredients_en
  const instructions = language === 'es' ? recipe?.instructions_es : recipe?.instructions_en

  const handleFavoriteToggle = () => {
    if (!recipe) return
    if (isFavorite) {
      dispatch(removeFromFavorites(recipe.id))
    } else {
      dispatch(addToFavorites(recipe))
    }
  }

  const handleEdit = () => {
    navigate(`/recipes/${id}/edit`)
  }

  const handleShare = (type) => {
    const url = window.location.href
    const text = `Check out this recipe: ${title}`

    switch (type) {
      case 'print':
        window.print()
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`)
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
      default:
        break
    }
  }

  const handlePdfDownload = () => {
    const element = document.getElementById('recipe-content')
    const opt = {
      margin: 1,
      filename: `${title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    }
    html2pdf().set(opt).from(element).save()
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>{t('recipe.detail.notFound')}</p>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div id='recipe-content'>
        {/* Header */}
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>{title}</h1>
            <div className='flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400'>
              <span>Prep: {recipe.prep_time} min</span>
              <span>Cook: {recipe.cook_time} min</span>
              <span>Servings: {recipe.servings}</span>
            </div>
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
            >
              <svg
                className='w-6 h-6'
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
            {isOwner && (
              <button onClick={handleEdit} className='p-2 rounded-full text-gray-400 hover:text-blue-500'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Image */}
        {recipe.image_url && (
          <img src={recipe.image_url} alt={title} className='w-full h-64 object-cover rounded-lg mb-6' />
        )}

        {/* Tags and Categories */}
        <div className='flex flex-wrap gap-2 mb-6'>
          {recipe.categories?.map((category) => (
            <span
              key={category}
              className='px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm'
            >
              {category}
            </span>
          ))}
          {recipe.tags?.map((tag) => (
            <span
              key={tag}
              className='px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm'
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Ingredients */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>{t('recipe.detail.ingredients')}</h2>
            <ul className='space-y-2'>
              {ingredients?.map((ingredient, index) => (
                <li key={index} className='flex items-center'>
                  <span className='w-2 h-2 bg-blue-500 rounded-full mr-3'></span>
                  <span className='text-gray-700 dark:text-gray-300'>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>{t('recipe.detail.instructions')}</h2>
            <div className='text-gray-700 dark:text-gray-300 whitespace-pre-line'>{instructions}</div>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className='mt-8 pt-8 border-t border-gray-200 dark:border-gray-700'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>{t('recipe.detail.share')}</h3>
        <div className='flex space-x-4'>
          <button
            onClick={() => handleShare('print')}
            className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
          >
            {t('recipe.detail.print')}
          </button>
          <button onClick={handlePdfDownload} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
            {t('recipe.detail.downloadPdf')}
          </button>
          <button
            onClick={() => handleShare('email')}
            className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
          >
            {t('recipe.detail.email')}
          </button>
          <button
            onClick={() => handleShare('copy')}
            className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
          >
            {t('recipe.detail.copyLink')}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className='mt-8 pt-8 border-t border-gray-200 dark:border-gray-700'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>{t('recipe.detail.comments')}</h3>
        {/* Comments List */}
        <div className='space-y-4 mb-6'>
          {commentsLoading ? (
            <p>{t('common.loading')}</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-white'>{comment.user_name}</p>
                    <p className='text-gray-700 dark:text-gray-300'>{comment.comment_text}</p>
                  </div>
                  <span className='text-sm text-gray-500'>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>{t('recipe.detail.noComments')}</p>
          )}
        </div>

        {/* Add Comment */}
        <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg'>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('recipe.detail.addComment')}
            rows={3}
            className='w-full p-2 border rounded dark:bg-gray-700 dark:text-white'
          />
          <button
            onClick={async () => {
              if (!newComment.trim()) return
              try {
                await dispatch(addComment({ recipeId: id, commentText: newComment })).unwrap()
                setNewComment('')
                loadComments() // Reload comments
              } catch (error) {
                console.error('Failed to add comment:', error)
              }
            }}
            className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            {t('recipe.detail.postComment')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail
