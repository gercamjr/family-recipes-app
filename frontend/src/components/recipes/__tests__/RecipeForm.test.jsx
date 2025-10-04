import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import RecipeForm from '../RecipeForm'
import authSlice from '../../../store/slices/authSlice'
import recipesSlice from '../../../store/slices/recipesSlice'
import uiSlice from '../../../store/slices/uiSlice'
import i18nMiddleware from '../../../store/middleware/i18nMiddleware'

// Mock the api service
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return key as-is for testing
  }),
}))

// Mock i18n middleware
jest.mock('../../../store/middleware/i18nMiddleware', () => jest.fn(() => (next) => (action) => next(action)))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: jest.fn(),
}))

import { useParams } from 'react-router-dom'

// Create a store setup function for testing (similar to Redux docs recommendation)
const setupStore = (preloadedState) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      recipes: recipesSlice,
      ui: uiSlice,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(i18nMiddleware),
  })
}

// Custom render function that sets up Redux store and router
const renderWithProviders = (
  ui,
  { preloadedState = {}, store = setupStore(preloadedState), routeParams = {}, ...renderOptions } = {}
) => {
  // Mock useParams to return the route params
  useParams.mockReturnValue(routeParams)

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  )

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

describe('RecipeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form correctly', () => {
    const { store } = renderWithProviders(<RecipeForm />, {
      preloadedState: {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        recipes: {
          loading: false,
          error: null,
          currentRecipe: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    expect(screen.getByText('recipe.form.createTitle')).toBeInTheDocument()
    expect(screen.getByText('recipe.form.titleEn')).toBeInTheDocument()
    expect(screen.getByText('recipe.form.titleEs')).toBeInTheDocument()
  })

  it('renders edit form when recipe is provided', () => {
    const mockRecipe = {
      id: 1,
      title_en: 'Test Recipe',
      title_es: 'Receta de Prueba',
      ingredients_en: ['Ingredient 1'],
      instructions_en: 'Test instructions',
      user_id: 1,
    }

    const { store } = renderWithProviders(<RecipeForm />, {
      preloadedState: {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        recipes: {
          loading: false,
          error: null,
          currentRecipe: mockRecipe,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
      routeParams: { id: '1' },
    })

    expect(screen.getByText('recipe.form.editTitle')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument()
  })

  it('shows permission error for non-owner', () => {
    const mockRecipe = {
      id: 1,
      title_en: 'Test Recipe',
      user_id: 2, // Different user
    }

    const { store } = renderWithProviders(<RecipeForm />, {
      preloadedState: {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        recipes: {
          loading: false,
          error: null,
          currentRecipe: mockRecipe,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
      routeParams: { id: '1' },
    })

    expect(screen.getByText('recipe.form.noPermission')).toBeInTheDocument()
  })
})
