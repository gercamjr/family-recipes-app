import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../store/slices/authSlice'
import recipesSlice from '../store/slices/recipesSlice'
import uiSlice from '../store/slices/uiSlice'
import i18nMiddleware from '../store/middleware/i18nMiddleware'

/**
 * Create a Redux store for testing with optional preloaded state
 * Creates a fresh store instance for each test to ensure isolation
 *
 * @param {Object} preloadedState - Initial state for the store
 * @returns {Object} Configured Redux store
 */
export function setupStore(preloadedState = {}) {
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

/**
 * Custom render function that wraps components with necessary providers
 * Automatically provides Redux store and React Router for testing
 *
 * Usage:
 * ```jsx
 * const { store } = renderWithProviders(<MyComponent />, {
 *   preloadedState: { auth: { user: mockUser } }
 * })
 * ```
 *
 * @param {ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.preloadedState - Initial Redux state
 * @param {Object} options.store - Custom store instance (optional)
 * @param {Object} options.route - Initial route for Router (default: '/')
 * @returns {Object} Render result with store instance
 */
export function renderWithProviders(
  ui,
  { preloadedState = {}, store = setupStore(preloadedState), route = '/', ...renderOptions } = {},
) {
  // Set initial route if provided
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Create mock user for authenticated tests
 *
 * @param {Object} overrides - Custom user properties
 * @returns {Object} Mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    ...overrides,
  }
}

/**
 * Create mock recipe for testing
 *
 * @param {Object} overrides - Custom recipe properties
 * @returns {Object} Mock recipe object
 */
export function createMockRecipe(overrides = {}) {
  return {
    id: 1,
    titleEn: 'Test Recipe',
    titleEs: 'Receta de Prueba',
    ingredientsEn: ['Ingredient 1', 'Ingredient 2'],
    ingredientsEs: ['Ingrediente 1', 'Ingrediente 2'],
    instructionsEn: 'Test instructions',
    instructionsEs: 'Instrucciones de prueba',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: ['test'],
    category: 'Test Category',
    author: {
      id: 1,
      name: 'Test Author',
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create authenticated state for tests
 *
 * @param {Object} user - User object (optional, will create mock if not provided)
 * @returns {Object} Preloaded state with authenticated user
 */
export function createAuthenticatedState(user = null) {
  return {
    auth: {
      user: user || createMockUser(),
      isAuthenticated: true,
      loading: false,
      error: null,
    },
    ui: {
      language: 'en',
      theme: 'light',
    },
  }
}

/**
 * Create initial unauthenticated state for tests
 *
 * @returns {Object} Preloaded state for logged out user
 */
export function createUnauthenticatedState() {
  return {
    auth: {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    },
    ui: {
      language: 'en',
      theme: 'light',
    },
  }
}

/**
 * Wait for a condition to be true
 * Useful for complex async scenarios
 *
 * @param {Function} callback - Function that should eventually return true
 * @param {Object} options - Options for waiting
 * @param {number} options.timeout - Maximum time to wait (ms)
 * @param {number} options.interval - Check interval (ms)
 */
export async function waitForCondition(callback, { timeout = 3000, interval = 50 } = {}) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (callback()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error('Timeout waiting for condition')
}
