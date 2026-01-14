import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import LanguageSwitcher from './LanguageSwitcher'

const Header = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

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
        <LanguageSwitcher />
      </div>
    </header>
  )
}

export default Header
