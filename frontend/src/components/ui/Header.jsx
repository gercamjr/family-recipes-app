import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'

const Header = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header className='bg-papaya p-4 flex justify-between items-center shadow-md'>
      <h1 className='text-2xl font-bold text-white'>{t('common.familyRecipes')}</h1>
      <div className='flex items-center'>
        {user && (
          <button
            onClick={handleLogout}
            className='bg-sunglow hover:bg-sea-green text-space-cadet font-bold py-2 px-4 rounded-lg shadow-sm transition-colors duration-300 mr-4'
          >
            {t('auth.logout')}
          </button>
        )}
        <div className='flex'>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`font-bold py-2 px-4 rounded-l-lg ${
              i18n.language === 'en' ? 'bg-cerulean text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange('es')}
            className={`font-bold py-2 px-4 rounded-r-lg ${
              i18n.language === 'es' ? 'bg-cerulean text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            ES
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
