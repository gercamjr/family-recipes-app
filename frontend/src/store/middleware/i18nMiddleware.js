import i18n from '../i18n'

const i18nMiddleware = (store) => (next) => (action) => {
  // If the action is setLanguageWithI18n, sync with i18next
  if (action.type === 'ui/setLanguageWithI18n') {
    i18n.changeLanguage(action.payload)
  }

  return next(action)
}

export default i18nMiddleware
