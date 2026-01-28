# Testing Migration Example

This document shows how to refactor an existing test from the old pattern to the new integration testing approach.

## Before: Old Pattern (Testing Implementation Details)

```jsx
// ❌ OLD APPROACH - Overly mocked, testing implementation
import { render, screen } from '@testing-library/react'
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

// ❌ PROBLEM: Mocking the api module directly
vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// ❌ PROBLEM: Mocking i18n returns implementation details
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}))

// ❌ PROBLEM: Mocking middleware
vi.mock('../../../store/middleware/i18nMiddleware', () => ({
  default: vi.fn(() => (next) => (action) => next(action)),
}))

// ❌ PROBLEM: Duplicating store setup in every test file
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

// ❌ PROBLEM: Duplicating render wrapper in every test file
const renderWithProviders = (
  ui,
  { preloadedState = {}, store = setupStore(preloadedState), ...renderOptions } = {},
) => {
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
    // ❌ PROBLEM: Manually specifying full state tree
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

    // ❌ PROBLEM: Asserting on translation keys instead of user-visible text
    expect(screen.getByText('recipes.createRecipe')).toBeInTheDocument()
    expect(screen.getByText('recipes.title')).toBeInTheDocument()
  })

  it('shows permission error for non-owner', async () => {
    const mockRecipe = {
      id: 1,
      titleEn: 'Test Recipe',
      // ... many fields
      author: { id: 2 }, // ❌ PROBLEM: Different user, but no real auth check
    }

    // ❌ PROBLEM: Manually mocking API response
    api.get.mockResolvedValue({ data: { recipe: mockRecipe } })

    renderWithProviders(<RecipeForm />, {
      preloadedState: {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        // ... duplicated state
      },
      routeParams: { id: '1' },
    })

    // ❌ PROBLEM: Checking for translation key
    await waitFor(() => {
      expect(screen.getByText('common.unauthorized')).toBeInTheDocument()
    })
  })
})
```

## After: New Pattern (Integration Testing)

```jsx
// ✅ NEW APPROACH - Integration testing with MSW
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { server } from '../../../mocks/server'
import {
  renderWithProviders,
  createAuthenticatedState,
  createMockRecipe,
  createMockUser,
} from '../../../utils/test-utils'
import RecipeForm from '../RecipeForm'

// ✅ GOOD: Only mock what's necessary (i18n for simpler assertions)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}))

describe('RecipeForm Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Recipe', () => {
    it('allows user to create a new recipe', async () => {
      const user = userEvent.setup()

      // ✅ GOOD: Use helper for common state
      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // ✅ GOOD: Test user behavior, not implementation
      // Fill out form as a user would
      await user.type(screen.getByLabelText(/title/i), 'Delicious Tacos')

      await user.type(screen.getByLabelText(/ingredients/i), 'Tortillas, Beef, Cheese')

      await user.type(screen.getByLabelText(/instructions/i), 'Cook beef, assemble tacos')

      await user.type(screen.getByLabelText(/prep time/i), '15')

      // ✅ GOOD: Click submit button
      await user.click(screen.getByRole('button', { name: /submit|create/i }))

      // ✅ GOOD: Assert on user-visible outcome
      await waitFor(() => {
        expect(screen.getByText(/recipe created successfully/i)).toBeInTheDocument()
      })

      // ✅ GOOD: Can also verify navigation if needed
      expect(window.location.pathname).toContain('/recipes')
    })

    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup()

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // ✅ GOOD: Submit empty form
      await user.click(screen.getByRole('button', { name: /submit|create/i }))

      // ✅ GOOD: Check for error messages user would see
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/ingredients.*required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edit Recipe', () => {
    it('loads and displays existing recipe for editing', async () => {
      const mockRecipe = createMockRecipe({
        id: 1,
        titleEn: 'Existing Recipe',
        author: { id: 1, name: 'Test User' },
      })

      // ✅ GOOD: Mock API with MSW
      server.use(
        http.get('/api/recipes/:id', () => {
          return HttpResponse.json({ recipe: mockRecipe })
        }),
      )

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(
          createMockUser({ id: 1 }), // Owner
        ),
        route: '/recipes/1/edit',
      })

      // ✅ GOOD: Wait for recipe to load
      const titleInput = await screen.findByDisplayValue('Existing Recipe')
      expect(titleInput).toBeInTheDocument()
    })

    it('prevents non-owner from editing recipe', async () => {
      const mockRecipe = createMockRecipe({
        id: 1,
        author: { id: 999, name: 'Other User' }, // Different owner
      })

      server.use(
        http.get('/api/recipes/:id', () => {
          return HttpResponse.json({ recipe: mockRecipe })
        }),
      )

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(
          createMockUser({ id: 1 }), // Current user (not owner)
        ),
        route: '/recipes/1/edit',
      })

      // ✅ GOOD: Check for user-visible error message
      await waitFor(() => {
        expect(screen.getByText(/you don't have permission|unauthorized/i)).toBeInTheDocument()
      })

      // ✅ GOOD: Form should not be editable
      expect(screen.queryByRole('button', { name: /save|update/i })).not.toBeInTheDocument()
    })

    it('allows admin to edit any recipe', async () => {
      const mockRecipe = createMockRecipe({
        id: 1,
        author: { id: 999, name: 'Other User' },
      })

      server.use(
        http.get('/api/recipes/:id', () => {
          return HttpResponse.json({ recipe: mockRecipe })
        }),
      )

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(
          createMockUser({ id: 1, role: 'admin' }), // Admin can edit
        ),
        route: '/recipes/1/edit',
      })

      // ✅ GOOD: Admin should see editable form
      await screen.findByRole('button', { name: /save|update/i })
    })
  })

  describe('Error Handling', () => {
    it('shows error when recipe creation fails', async () => {
      const user = userEvent.setup()

      // ✅ GOOD: Mock API error with MSW
      server.use(
        http.post('/api/recipes', () => {
          return HttpResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
        }),
      )

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Recipe')
      await user.type(screen.getByLabelText(/ingredients/i), 'Ingredient 1')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      // ✅ GOOD: Check for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create|error/i)).toBeInTheDocument()
      })
    })

    it('allows user to retry after error', async () => {
      const user = userEvent.setup()

      // First attempt fails
      server.use(
        http.post('/api/recipes', () => {
          return HttpResponse.json({ error: 'Error' }, { status: 500 })
        }),
      )

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Recipe')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await screen.findByText(/error/i)

      // ✅ GOOD: Reset handlers for retry
      server.resetHandlers()

      // Retry
      await user.click(screen.getByRole('button', { name: /retry|submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument()
      })
    })
  })

  describe('Bilingual Support', () => {
    it('saves recipe with both English and Spanish content', async () => {
      const user = userEvent.setup()

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // ✅ GOOD: Test language switching behavior
      await user.type(screen.getByLabelText(/title.*english/i), 'Tacos')
      await user.type(screen.getByLabelText(/title.*spanish/i), 'Tacos')

      await user.click(screen.getByRole('button', { name: /submit/i }))

      // ✅ GOOD: Verify both languages were saved (can check store or API call)
      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('is keyboard navigable', async () => {
      const user = userEvent.setup()

      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // ✅ GOOD: Test tab navigation
      await user.tab()
      expect(screen.getByLabelText(/title/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/ingredients/i)).toHaveFocus()
    })

    it('has proper ARIA labels', () => {
      renderWithProviders(<RecipeForm />, {
        preloadedState: createAuthenticatedState(),
      })

      // ✅ GOOD: Check for accessibility attributes
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label')

      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).toBeEnabled()
    })
  })
})
```

## Key Improvements

### 1. Centralized Test Utilities

- ❌ Before: Duplicated `setupStore` and `renderWithProviders` in every test file
- ✅ After: Imported from `utils/test-utils.jsx`

### 2. MSW for API Mocking

- ❌ Before: `vi.mock('../../../services/api')` with manual mock setup
- ✅ After: MSW intercepts actual HTTP requests, closer to real app behavior

### 3. Helper Functions for Common Data

- ❌ Before: Manually creating full state objects every time
- ✅ After: `createAuthenticatedState()`, `createMockRecipe()`, `createMockUser()`

### 4. Test User Behavior, Not Implementation

- ❌ Before: `expect(screen.getByText('recipes.createRecipe'))` (translation key)
- ✅ After: `expect(screen.getByText(/create.*recipe/i))` (what user sees)

### 5. Focus on Integration

- ❌ Before: Heavily mocked, testing in isolation
- ✅ After: Real Redux store, real routing, real user interactions

### 6. Better Error Testing

- ❌ Before: Mocking API at module level
- ✅ After: MSW allows realistic error responses with status codes

### 7. Comprehensive Scenarios

- ❌ Before: Basic "renders correctly" tests
- ✅ After: Full workflows (create, edit, error handling, retry, accessibility)

## Migration Checklist

When refactoring an existing test:

- [ ] Remove duplicated `setupStore` and `renderWithProviders` functions
- [ ] Import test utilities from `utils/test-utils.jsx`
- [ ] Replace `vi.mock('api')` with MSW handlers
- [ ] Use helper functions: `createAuthenticatedState()`, `createMockUser()`, etc.
- [ ] Replace assertions on translation keys with user-visible text patterns
- [ ] Test full user workflows instead of isolated render checks
- [ ] Add error handling and retry scenarios
- [ ] Add accessibility tests (keyboard navigation, ARIA labels)
- [ ] Verify bilingual support if applicable
- [ ] Use `userEvent` instead of `fireEvent` for interactions

## Benefits

1. **Faster to write**: Less boilerplate per test
2. **More maintainable**: Changes to setup happen in one place
3. **More realistic**: Tests actual HTTP requests, not mocked functions
4. **Better coverage**: Integration tests catch more real bugs
5. **Easier to understand**: Tests read like user stories
6. **Refactor-friendly**: Implementation can change without breaking tests
