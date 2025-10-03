import { useAppSelector, useAppDispatch } from './store/hooks'
import { setLanguageWithI18n } from './store/slices/uiSlice'
import { logout } from './store/slices/authSlice'
import { useTranslation } from 'react-i18next'

function App() {
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const { language, theme } = useAppSelector((state) => state.ui)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'es' : 'en'
    dispatch(setLanguageWithI18n(newLanguage))
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div className={`App min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className='max-w-4xl mx-auto'>
        {/* Header with navigation */}
        <header className='flex justify-between items-center mb-8'>
          <h1 className='text-4xl font-bold'>{t('app.title')}</h1>
          <div className='flex items-center space-x-4'>
            <button
              onClick={handleLanguageChange}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
            >
              {language === 'en' ? 'ES' : 'EN'}
            </button>
            <button
              onClick={handleLogout}
              className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
            >
              {t('app.logout')}
            </button>
          </div>
        </header>

        {/* Welcome message */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-semibold mb-4'>{t('app.welcome')}</h2>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{t('user.user')}:</span>
              <span className='text-blue-600 font-mono'>{user?.email}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{t('user.language')}:</span>
              <span className='text-green-600 font-mono'>{language.toUpperCase()}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{t('user.theme')}:</span>
              <span className='text-purple-600 font-mono'>{theme}</span>
            </div>
          </div>
        </div>

        {/* Main content placeholder */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-xl font-semibold mb-4'>{t('app.dashboard')}</h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{t('app.comingSoon')}</p>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Placeholder cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                <div className='w-full h-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 flex items-center justify-center'>
                  <span className='text-gray-500 dark:text-gray-400'>{t('recipes.recipeImage')}</span>
                </div>
                <h4 className='font-semibold mb-2'>
                  {t(`recipes.sampleRecipe`)} ${i}
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400'>{t('app.comingSoon')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
