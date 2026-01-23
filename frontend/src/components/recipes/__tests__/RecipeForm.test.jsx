import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { vi } from 'vitest'
import RecipeForm from '../RecipeForm'
import authSlice from '../../../store/slices/authSlice'
import recipesSlice from '../../../store/slices/recipesSlice'
import uiSlice from '../../../store/slices/uiSlice'
import i18nMiddleware from '../../../store/middleware/i18nMiddleware'
import api from '../../../services/api'

// Mock the api service
vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return key as-is for testing
  }),
}))

// Mock i18n middleware
vi.mock('../../../store/middleware/i18nMiddleware', () => ({
  default: vi.fn(() => (next) => (action) => next(action)),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
  useParams: vi.fn(),
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
  { preloadedState = {}, store = setupStore(preloadedState), routeParams = {}, ...renderOptions } = {},
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
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    renderWithProviders(<RecipeForm />, {
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

    expect(screen.getByText('recipes.createRecipe')).toBeInTheDocument()
    expect(screen.getByText('recipes.title')).toBeInTheDocument()
    expect(screen.getByText('recipes.recipeLanguage')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Español')).toBeInTheDocument()
  })

  it('renders edit form when recipe is provided', async () => {
    const mockRecipe = {
      id: 1,
      titleEn: 'Test Recipe',
      titleEs: 'Receta de Prueba',
      ingredientsEn: ['Ingredient 1'],
      ingredientsEs: ['Ingrediente 1'],
      instructionsEn: 'Test instructions',
      instructionsEs: 'Instrucciones de prueba',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      tags: [],
      category: '',
      author: { id: 1 },
    }

    api.get.mockResolvedValue({ data: { recipe: mockRecipe } })

    renderWithProviders(<RecipeForm />, {
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

    await waitFor(() => {
      expect(screen.getByText('recipes.editRecipe')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument()
  })

  it('shows permission error for non-owner', async () => {
    const mockRecipe = {
      id: 1,
      titleEn: 'Test Recipe',
      titleEs: 'Receta de Prueba',
      ingredientsEn: ['Ingredient 1'],
      ingredientsEs: ['Ingrediente 1'],
      instructionsEn: 'Test instructions',
      instructionsEs: 'Instrucciones de prueba',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      tags: [],
      category: '',
      author: { id: 2 }, // Different user
    }

    api.get.mockResolvedValue({ data: { recipe: mockRecipe } })

    renderWithProviders(<RecipeForm />, {
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

    await waitFor(() => {
      expect(screen.getByText('common.unauthorized')).toBeInTheDocument()
    })
  })
})
