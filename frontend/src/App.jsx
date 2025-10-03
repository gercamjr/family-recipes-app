import { useAppSelector, useAppDispatch } from './store/hooks'
import { setLanguage } from './store/slices/uiSlice'

function App() {
  const dispatch = useAppDispatch()
  const { language, theme } = useAppSelector((state) => state.ui)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  const handleLanguageChange = () => {
    const newLanguage = language === 'en' ? 'es' : 'en'
    dispatch(setLanguage(newLanguage))
  }

  return (
    <div className={`App min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8 text-center'>
          {language === 'en' ? 'Family Recipes' : 'Recetas Familiares'}
        </h1>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-semibold mb-4'>
            {language === 'en' ? 'Redux Store Status' : 'Estado del Store Redux'}
          </h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{language === 'en' ? 'Language:' : 'Idioma:'}</span>
              <div className='flex items-center space-x-2'>
                <span className='text-blue-600 font-mono'>{language}</span>
                <button
                  onClick={handleLanguageChange}
                  className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                >
                  {language === 'en' ? 'Switch to ES' : 'Cambiar a EN'}
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='font-medium'>{language === 'en' ? 'Theme:' : 'Tema:'}</span>
              <span className='text-green-600 font-mono'>{theme}</span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='font-medium'>{language === 'en' ? 'Authenticated:' : 'Autenticado:'}</span>
              <span className={`font-mono ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>

            {user && (
              <div className='flex items-center justify-between'>
                <span className='font-medium'>{language === 'en' ? 'User:' : 'Usuario:'}</span>
                <span className='text-purple-600 font-mono'>{user.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className='text-center text-gray-500'>
          {language === 'en'
            ? 'Redux store is working! Phase 3 frontend development has begun.'
            : '¡El store de Redux está funcionando! Ha comenzado el desarrollo del frontend de la Fase 3.'}
        </div>
      </div>
    </div>
  )
}

export default App
