import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { store } from './store'
import App from './App'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'recipes.searchRecipes': 'Search Recipes',
        'recipes.filterByCategory': 'Filter by Category',
        'recipes.filterByTags': 'Filter by Tags',
        'recipes.noRecipesFound': 'No recipes found',
      }
      return translations[key] || key
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}))

test('renders the recipe list component', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  )
  // App now renders RecipeList, so we check for search functionality
  const searchButton = screen.getByRole('button', { name: /search/i })
  expect(searchButton).toBeInTheDocument()
})
