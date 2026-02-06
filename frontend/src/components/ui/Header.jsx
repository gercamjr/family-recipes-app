import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import LanguageSwitcher from './LanguageSwitcher'

const Header = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header className='bg-papaya p-4 flex justify-between items-center shadow-md'>
      <Link to='/' className='text-2xl font-bold text-white hover:text-sunglow transition-colors duration-300'>
        {t('common.familyRecipes')}
      </Link>
      <div className='flex items-center'>
        {user && (
          <Link
            to='/'
            className='text-white font-semibold mr-4 hover:text-sunglow transition-colors duration-300'
          >
            {t('recipes.allRecipesNav')}
          </Link>
        )}
        {user && (
          <Link
            to='/my-recipes'
            className='text-white font-semibold mr-4 hover:text-sunglow transition-colors duration-300'
          >
            {t('recipes.myRecipesNav')}
          </Link>
        )}
        {isAdmin && (
          <Link
            to='/admin/invites'
            className='text-white font-semibold mr-4 hover:text-sunglow transition-colors duration-300'
          >
            {t('admin.invites.navLabel')}
          </Link>
        )}
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
