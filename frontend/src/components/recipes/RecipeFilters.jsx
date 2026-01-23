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

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedTags([])
    dispatch(clearFilters())
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8'>
      <form onSubmit={handleSearch} className='space-y-6'>
        {/* Search Bar */}
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1 relative'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('recipes.searchPlaceholder')}
              className='w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent dark:bg-gray-700 dark:text-white'
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
            className='bg-cerulean hover:bg-sea-green text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300'
          >
            {t('common.search')}
          </button>
          <button
            type='button'
            onClick={handleClearFilters}
            className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300 dark:text-gray-900'
          >
            {t('common.clear')}
          </button>
        </div>

        {/* Categories */}
        <div>
          <h3 className='text-lg font-semibold text-space-cadet dark:text-gray-200 mb-3'>{t('recipes.categories')}</h3>
          <div className='flex flex-wrap gap-2'>
            {categories.map((category) => (
              <button
                key={category}
                type='button'
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-sunglow text-space-cadet shadow-md transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t(`categories.${category.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className='text-lg font-semibold text-space-cadet dark:text-gray-200 mb-3'>{t('recipes.tags')}</h3>
          <div className='flex flex-wrap gap-2'>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type='button'
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 border ${
                  selectedTags.includes(tag)
                    ? 'bg-sea-green text-white border-sea-green shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-mint-cream hover:text-sea-green hover:border-sea-green'
                }`}
              >
                {t(`tags.${tag.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}

export default RecipeFilters
