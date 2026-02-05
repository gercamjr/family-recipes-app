import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMyRecipes, deleteRecipe } from '../../store/recipesThunks'
import { updateMyRecipesFilters, clearMyRecipesFilters } from '../../store/slices/recipesSlice'

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']
const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']

const parseTagsParam = (searchParams) => {
  const tags = searchParams.getAll('tags')
  if (tags.length > 0) {
    return tags
  }

  const tagsValue = searchParams.get('tags')
  if (!tagsValue) {
    return []
  }

  return tagsValue
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const MyRecipesTable = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const didInitRef = useRef(false)

  const { myRecipes, myRecipesLoading, myRecipesError, myRecipesPagination, myRecipesFilters } = useAppSelector(
    (state) => state.recipes,
  )
  const { language } = useAppSelector((state) => state.ui)

  const [searchTerm, setSearchTerm] = useState(myRecipesFilters.search)
  const [tagsInput, setTagsInput] = useState(myRecipesFilters.tags.join(', '))

  useEffect(() => {
    if (didInitRef.current) {
      return
    }

    const nextFilters = {
      page: Number(searchParams.get('page')) || myRecipesFilters.page,
      limit: Number(searchParams.get('limit')) || myRecipesFilters.limit,
      search: searchParams.get('search') || myRecipesFilters.search,
      category: searchParams.get('category') || myRecipesFilters.category,
      status: searchParams.get('status') || myRecipesFilters.status,
      sortBy: searchParams.get('sortBy') || myRecipesFilters.sortBy,
      sortDir: searchParams.get('sortDir') || myRecipesFilters.sortDir,
      tags: parseTagsParam(searchParams),
    }

    dispatch(updateMyRecipesFilters(nextFilters))
    setSearchTerm(nextFilters.search)
    setTagsInput(nextFilters.tags.join(', '))
    didInitRef.current = true
  }, [dispatch, searchParams, myRecipesFilters])

  useEffect(() => {
    if (!didInitRef.current) {
      return
    }

    dispatch(fetchMyRecipes({ ...myRecipesFilters, language }))
  }, [dispatch, myRecipesFilters, language])

  useEffect(() => {
    if (!didInitRef.current) {
      return
    }

    const nextParams = new URLSearchParams()

    if (myRecipesFilters.search) nextParams.set('search', myRecipesFilters.search)
    if (myRecipesFilters.category) nextParams.set('category', myRecipesFilters.category)
    if (myRecipesFilters.status && myRecipesFilters.status !== 'all') nextParams.set('status', myRecipesFilters.status)
    if (myRecipesFilters.sortBy) nextParams.set('sortBy', myRecipesFilters.sortBy)
    if (myRecipesFilters.sortDir) nextParams.set('sortDir', myRecipesFilters.sortDir)
    if (myRecipesFilters.page) nextParams.set('page', String(myRecipesFilters.page))
    if (myRecipesFilters.limit) nextParams.set('limit', String(myRecipesFilters.limit))

    myRecipesFilters.tags.forEach((tag) => nextParams.append('tags', tag))

    setSearchParams(nextParams, { replace: true })
  }, [myRecipesFilters, setSearchParams])

  useEffect(() => {
    setSearchTerm(myRecipesFilters.search)
    setTagsInput(myRecipesFilters.tags.join(', '))
  }, [myRecipesFilters.search, myRecipesFilters.tags])

  const handleAddRecipe = () => {
    navigate('/recipes/new')
  }

  const handleViewRecipe = (recipeId) => {
    navigate(`/recipes/${recipeId}`)
  }

  const handleEditRecipe = (recipeId) => {
    navigate(`/recipes/${recipeId}/edit`)
  }

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm(t('common.confirm'))) {
      try {
        await dispatch(deleteRecipe(recipeId)).unwrap()
      } catch (error) {
        console.error('Failed to delete recipe:', error)
      }
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    dispatch(updateMyRecipesFilters({ search: searchTerm, tags, page: 1 }))
  }

  const handleClearFilters = () => {
    dispatch(clearMyRecipesFilters())
  }

  const handleCategoryChange = (event) => {
    dispatch(updateMyRecipesFilters({ category: event.target.value, page: 1 }))
  }

  const handleStatusChange = (event) => {
    dispatch(updateMyRecipesFilters({ status: event.target.value, page: 1 }))
  }

  const handleSort = (field) => {
    const nextSortDir = myRecipesFilters.sortBy === field && myRecipesFilters.sortDir === 'asc' ? 'desc' : 'asc'
    dispatch(updateMyRecipesFilters({ sortBy: field, sortDir: nextSortDir, page: 1 }))
  }

  const handlePageChange = (page) => {
    dispatch(updateMyRecipesFilters({ page }))
  }

  const totalPages = myRecipesPagination.totalPages || 1

  const rows = useMemo(() => {
    return myRecipes.map((recipe) => {
      const recipeCategories = recipe.categories?.length ? recipe.categories : recipe.category ? [recipe.category] : []
      const recipeTags = recipe.tags || []

      return {
        ...recipe,
        categories: recipeCategories,
        tags: recipeTags,
      }
    })
  }, [myRecipes])

  return (
    <div className='container mx-auto p-4'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-space-cadet dark:text-white'>{t('recipes.myRecipesTitle')}</h1>
          <p className='text-gray-500 dark:text-gray-300 mt-1'>{t('recipes.myRecipesSubtitle')}</p>
        </div>
        <button
          onClick={handleAddRecipe}
          className='bg-papaya hover:bg-sunglow text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center justify-center'
        >
          {t('recipes.addRecipe')}
        </button>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 flex flex-col gap-4'
      >
        <div className='flex flex-col md:flex-row gap-4'>
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('recipes.myRecipesSearchPlaceholder')}
            className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent dark:bg-gray-700 dark:text-white'
          />
          <select
            value={myRecipesFilters.category}
            onChange={handleCategoryChange}
            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white'
          >
            <option value=''>{t('recipes.categories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(`categories.${category.toLowerCase()}`)}
              </option>
            ))}
          </select>
          <select
            value={myRecipesFilters.status}
            onChange={handleStatusChange}
            className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white'
          >
            <option value='all'>{t('recipes.myRecipesStatusAll')}</option>
            <option value='public'>{t('recipes.myRecipesStatusPublic')}</option>
            <option value='private'>{t('recipes.myRecipesStatusPrivate')}</option>
          </select>
        </div>
        <div className='flex flex-col md:flex-row gap-4'>
          <input
            type='text'
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('recipes.addTagPlaceholder')}
            className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent dark:bg-gray-700 dark:text-white'
          />
          <button
            type='submit'
            className='bg-cerulean hover:bg-sea-green text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300'
          >
            {t('common.search')}
          </button>
          <button
            type='button'
            onClick={handleClearFilters}
            className='border border-gray-300 dark:border-gray-600 text-space-cadet dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:border-cerulean transition-colors duration-300'
          >
            {t('common.clear')}
          </button>
        </div>
        {availableTags.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type='button'
                onClick={() => {
                  const currentTags = tagsInput
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
                  if (currentTags.includes(tag)) return
                  const nextTags = [...currentTags, tag]
                  setTagsInput(nextTags.join(', '))
                }}
                className='px-3 py-1 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-sea-green hover:text-sea-green hover:bg-mint-cream dark:hover:bg-gray-600 transition-all duration-300'
              >
                + {t(`tags.${tag.toLowerCase()}`)}
              </button>
            ))}
          </div>
        )}
      </form>

      {myRecipesLoading && <p>{t('common.loading')}</p>}
      {myRecipesError && <p className='text-red-500'>{myRecipesError}</p>}

      {!myRecipesLoading && !myRecipesError && rows.length === 0 && (
        <p className='text-center text-gray-500'>{t('recipes.noRecipes')}</p>
      )}

      {rows.length > 0 && (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-x-auto'>
          <table className='min-w-full text-left'>
            <thead className='bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'>
              <tr>
                <th className='px-4 py-3'>
                  <button
                    type='button'
                    onClick={() => handleSort('title')}
                    className='flex items-center gap-2 font-semibold'
                  >
                    {t('recipes.myRecipesColumns.title')}
                  </button>
                </th>
                <th className='px-4 py-3'>{t('recipes.myRecipesColumns.categories')}</th>
                <th className='px-4 py-3'>{t('recipes.myRecipesColumns.tags')}</th>
                <th className='px-4 py-3'>{t('recipes.myRecipesColumns.visibility')}</th>
                <th className='px-4 py-3'>
                  <button
                    type='button'
                    onClick={() => handleSort('updatedAt')}
                    className='flex items-center gap-2 font-semibold'
                  >
                    {t('recipes.myRecipesColumns.updatedAt')}
                  </button>
                </th>
                <th className='px-4 py-3'>
                  <button
                    type='button'
                    onClick={() => handleSort('favorites')}
                    className='flex items-center gap-2 font-semibold'
                  >
                    {t('recipes.myRecipesColumns.favorites')}
                  </button>
                </th>
                <th className='px-4 py-3'>
                  <button
                    type='button'
                    onClick={() => handleSort('comments')}
                    className='flex items-center gap-2 font-semibold'
                  >
                    {t('recipes.myRecipesColumns.comments')}
                  </button>
                </th>
                <th className='px-4 py-3'>{t('recipes.myRecipesColumns.actions')}</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
              {rows.map((recipe) => (
                <tr key={recipe.id} className='text-gray-700 dark:text-gray-200'>
                  <td className='px-4 py-3 font-semibold text-space-cadet dark:text-white'>{recipe.title}</td>
                  <td className='px-4 py-3'>
                    {recipe.categories.length > 0
                      ? recipe.categories.map((category) => (
                          <span
                            key={`${recipe.id}-category-${category}`}
                            className='inline-block mr-2 mb-1 rounded-full bg-mint-cream dark:bg-gray-600 px-2 py-1 text-xs text-gray-700 dark:text-gray-100'
                          >
                            {t(`categories.${category.toLowerCase()}`, { defaultValue: category })}
                          </span>
                        ))
                      : '-'}
                  </td>
                  <td className='px-4 py-3'>
                    {recipe.tags.length > 0
                      ? recipe.tags.map((tag) => (
                          <span
                            key={`${recipe.id}-tag-${tag}`}
                            className='inline-block mr-2 mb-1 rounded-full bg-sea-green text-white px-2 py-1 text-xs'
                          >
                            {t(`tags.${tag.toLowerCase()}`, { defaultValue: tag })}
                          </span>
                        ))
                      : '-'}
                  </td>
                  <td className='px-4 py-3'>
                    {recipe.isPublic ? t('recipes.myRecipesStatusPublic') : t('recipes.myRecipesStatusPrivate')}
                  </td>
                  <td className='px-4 py-3'>
                    {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className='px-4 py-3'>{recipe.favoritesCount ?? 0}</td>
                  <td className='px-4 py-3'>{recipe.commentsCount ?? 0}</td>
                  <td className='px-4 py-3'>
                    <div className='flex gap-3'>
                      <button
                        type='button'
                        onClick={() => handleViewRecipe(recipe.id)}
                        className='text-cerulean hover:text-sea-green font-semibold transition-colors'
                      >
                        {t('common.view')}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleEditRecipe(recipe.id)}
                        className='text-cerulean hover:text-sea-green font-semibold transition-colors'
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className='text-papaya hover:text-red-700 font-semibold transition-colors'
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6'>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            {t('common.page')} {myRecipesPagination.page} {t('common.of')} {totalPages}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => handlePageChange(Math.max(1, myRecipesPagination.page - 1))}
              disabled={myRecipesPagination.page <= 1}
              className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-space-cadet dark:text-gray-200 disabled:opacity-50'
            >
              {t('common.previous')}
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type='button'
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg ${
                  page === myRecipesPagination.page
                    ? 'bg-cerulean text-white'
                    : 'border border-gray-300 dark:border-gray-600 text-space-cadet dark:text-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type='button'
              onClick={() => handlePageChange(Math.min(totalPages, myRecipesPagination.page + 1))}
              disabled={myRecipesPagination.page >= totalPages}
              className='px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-space-cadet dark:text-gray-200 disabled:opacity-50'
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyRecipesTable
