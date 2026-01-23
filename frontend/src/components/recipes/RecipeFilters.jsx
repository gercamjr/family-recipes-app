import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateFilters, clearFilters } from '../../store/slices/recipesSlice'

const RecipeFilters = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector((state) => state.recipes)

  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [selectedCategory, setSelectedCategory] = useState(filters.category)
  const [selectedTags, setSelectedTags] = useState(filters.tags || [])
  const [showFilters, setShowFilters] = useState(false)

  const [customTagInput, setCustomTagInput] = useState('')
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']
  const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']

  // Update local state when filters change in Redux (e.g., cleared by parent)
  useEffect(() => {
    setSearchTerm(filters.search)
    setSelectedCategory(filters.category)
    setSelectedTags(filters.tags || [])
  }, [filters])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(updateFilters({ search: searchTerm }))
  }

  const handleCategoryChange = (category) => {
    const newCategory = selectedCategory === category ? '' : category
    setSelectedCategory(newCategory)
    // Dispatch immediately for category
    dispatch(updateFilters({ category: newCategory, page: 1 }))
  }

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    setSelectedTags(newTags)
    // Dispatch immediately for tags
    dispatch(updateFilters({ tags: newTags, page: 1 }))
  }

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      const newTags = [...selectedTags, trimmed]
      setSelectedTags(newTags)
      setCustomTagInput('')
      dispatch(updateFilters({ tags: newTags, page: 1 }))
    }
  }

  const handleCustomTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomTag()
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedTags([])
    setCustomTagInput('')
    dispatch(clearFilters())
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 transition-colors duration-300'>
      <form onSubmit={handleSearch} className='space-y-4'>
        {/* Row 1: Search Bar + Filter Toggle */}
        <div className='flex gap-2'>
          <div className='flex-1 relative'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('recipes.searchPlaceholder')}
              className='w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow duration-300'
            />
            <svg
              className='w-5 h-5 absolute left-3 top-3.5 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          <button
            type='submit'
            className='bg-cerulean hover:bg-sea-green text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300 flex items-center gap-2'
          >
            {t('common.search')}
          </button>
          <button
            type='button'
            onClick={() => setShowFilters(!showFilters)}
            className={`font-bold py-3 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center justify-center gap-2 border ${
              showFilters
                ? 'bg-sunglow text-space-cadet border-sunglow'
                : 'bg-white dark:bg-gray-700 text-space-cadet dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-cerulean'
            }`}
            aria-label={t('recipes.filter')}
            title={t('recipes.filter')}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
              />
            </svg>
          </button>
        </div>

        {/* Row 2: Horizontal Categories Scroll */}
        <div className='flex overflow-x-auto gap-2 pb-2 no-scrollbar'>
          {categories.map((category) => (
            <button
              key={category}
              type='button'
              onClick={() => handleCategoryChange(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shrink-0 ${
                selectedCategory === category
                  ? 'bg-sunglow text-space-cadet shadow-md transform scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t(`categories.${category.toLowerCase()}`)}
            </button>
          ))}
        </div>

        {/* Row 3: Active Filters Chips */}
        {selectedTags.length > 0 && (
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm text-gray-500 font-medium'>{t('recipes.tags')}:</span>
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type='button'
                onClick={() => handleTagToggle(tag)}
                className='inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sea-green text-white shadow-sm hover:bg-red-500 transition-colors duration-300'
                title={t('common.delete')}
              >
                {availableTags.includes(tag) ? t(`tags.${tag.toLowerCase()}`) : tag}
                <svg className='w-3 h-3 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            ))}
            <button
              type='button'
              onClick={handleClearFilters}
              className='text-xs text-cerulean hover:text-red-500 underline ml-2 font-medium'
            >
              {t('common.clear')}
            </button>
          </div>
        )}

        {/* Expandable Filter Panel (Tags) */}
        {showFilters && (
          <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn'>
            <div className='flex flex-col md:flex-row gap-6'>
              <div className='flex-1'>
                <h3 className='text-md font-semibold text-space-cadet dark:text-gray-200 mb-3'>
                  {t('recipes.filterByTags')}
                </h3>

                {/* Custom Tag Input */}
                <div className='flex gap-2 mb-4'>
                  <input
                    type='text'
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder={t('recipes.addTagPlaceholder')}
                    className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent dark:bg-gray-700 dark:text-white text-sm'
                  />
                  <button
                    type='button'
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className='px-4 py-2 bg-cerulean hover:bg-sea-green text-white text-sm font-bold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {t('common.add')}
                  </button>
                </div>

                {/* Common Tags Suggestions */}
                <div>
                  <p className='text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider'>
                    {t('recipes.suggestedTags')}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {availableTags.map((tag) => {
                      if (selectedTags.includes(tag)) return null
                      return (
                        <button
                          key={tag}
                          type='button'
                          onClick={() => handleTagToggle(tag)}
                          className='px-3 py-1 rounded-full font-medium text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-sea-green hover:text-sea-green hover:bg-mint-cream dark:hover:bg-gray-600 transition-all duration-300'
                        >
                          + {t(`tags.${tag.toLowerCase()}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default RecipeFilters
