import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  return (
    <div className='flex items-center space-x-2'>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-cerulean text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 rounded ${i18n.language === 'es' ? 'bg-cerulean text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        ES
      </button>
    </div>
  )
}

export default LanguageSwitcher
