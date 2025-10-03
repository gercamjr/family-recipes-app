import { useAppSelector, useAppDispatch } from './store/hooks'
import { setLanguageWithI18n } from './store/slices/uiSlice'
import { logout } from './store/slices/authSlice'
import { useTranslation } from 'react-i18next'
import RecipeList from './components/recipes/RecipeList'

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
      <div className='max-w-7xl mx-auto'>
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

        {/* Recipe List/Dashboard */}
        <RecipeList />
      </div>
    </div>
  )
}

export default App
