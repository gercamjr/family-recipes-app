# Frontend Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Family Recipes App frontend, based on industry best practices from Vitest, Redux, and Kent C. Dodds' principles. Our approach prioritizes **integration tests over unit tests** and focuses on **testing behavior rather than implementation details**.

## Guiding Principles

### 1. Test Like a User

> "The more your tests resemble the way your software is used, the more confidence they can give you." - Kent C. Dodds

- **DO**: Test user interactions (clicking buttons, filling forms, navigation)
- **DO**: Assert on what users see (rendered text, visible elements)
- **DON'T**: Test component state directly
- **DON'T**: Test Redux actions/reducers in isolation (except complex logic)

### 2. Prefer Integration Over Isolation

- **Integration tests** (80%): Test components with real Redux store, real routing, real interactions
- **Unit tests** (20%): Reserved for complex pure functions (selectors, validators, utilities)
- Avoid mocking Redux hooks or selectors - use real Redux store in tests

### 3. Avoid Testing Implementation Details

**Implementation details** are things that users don't know/care about:

- Component state variable names
- Redux action names
- CSS class names
- Internal function names

**User-facing behavior** is what matters:

- What text appears on screen
- What happens when buttons are clicked
- Error messages displayed
- Navigation flow

## Testing Hierarchy

```
┌─────────────────────────────────────────┐
│  1. Critical User Paths (MUST TEST)    │ ← Login, Create Recipe, Search
├─────────────────────────────────────────┤
│  2. Error Handling (SHOULD TEST)       │ ← Network errors, Validation
├─────────────────────────────────────────┤
│  3. Edge Cases (SHOULD TEST)           │ ← Empty states, Long text
├─────────────────────────────────────────┤
│  4. Accessibility (RECOMMENDED)         │ ← Keyboard nav, ARIA labels
├─────────────────────────────────────────┤
│  5. Performance (NICE TO HAVE)          │ ← Large datasets, animations
└─────────────────────────────────────────┘
```

## Test Stack

### Current Setup

- **Test Runner**: Vitest
- **Environment**: jsdom (simulated DOM)
- **Component Testing**: React Testing Library
- **User Interactions**: `@testing-library/user-event`
- **Assertions**: `@testing-library/jest-dom`
- **Mocking**: Vitest mocks + MSW (recommended for API calls)

### Recommended Upgrades

1. **Mock Service Worker (MSW)** for API mocking
   ```bash
   npm install --save-dev msw
   ```
2. **Vitest Browser Mode** (future consideration)
   - Real browser testing vs jsdom
   - Catches CSS, layout, and real browser API issues
   - Better for visual regression and accessibility testing

## Testing Patterns

### 1. Integration Test Pattern (PREFERRED)

Test components with **real Redux store** and **real dependencies**:

```jsx
// utils/test-utils.jsx - Reusable render helper
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../store/slices/authSlice'
import recipesSlice from '../store/slices/recipesSlice'
import uiSlice from '../store/slices/uiSlice'

export function setupStore(preloadedState) {
  return configureStore({
    reducer: {
      auth: authSlice,
      recipes: recipesSlice,
      ui: uiSlice,
    },
    preloadedState,
  })
}

export function renderWithProviders(
  ui,
  { preloadedState = {}, store = setupStore(preloadedState), ...renderOptions } = {},
) {
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
```

**Example Integration Test:**

```jsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/test-utils'
import RecipeList from '../components/recipes/RecipeList'

describe('RecipeList Integration', () => {
  it('allows user to search and filter recipes', async () => {
    const user = userEvent.setup()

    // Render with initial state
    renderWithProviders(<RecipeList />, {
      preloadedState: {
        recipes: {
          items: [
            { id: 1, titleEn: 'Tacos', category: 'Mexican' },
            { id: 2, titleEn: 'Pizza', category: 'Italian' },
          ],
          loading: false,
        },
        ui: { language: 'en' },
      },
    })

    // Initially shows all recipes (what user sees)
    expect(screen.getByText('Tacos')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()

    // User types in search box (how user interacts)
    const searchBox = screen.getByRole('searchbox', { name: /search/i })
    await user.type(searchBox, 'Tacos')

    // Only matching recipe shown (what user expects)
    expect(screen.getByText('Tacos')).toBeInTheDocument()
    expect(screen.queryByText('Pizza')).not.toBeInTheDocument()
  })
})
```

### 2. API Mocking with MSW (RECOMMENDED)

Mock network requests at the HTTP level, not the function level:

```jsx
// mocks/handlers.js
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/recipes', () => {
    return HttpResponse.json({
      recipes: [{ id: 1, titleEn: 'Tacos', titleEs: 'Tacos' }],
    })
  }),

  http.post('/api/recipes', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({ recipe: { id: 2, ...data } }, { status: 201 })
  }),

  http.get('/api/recipes/:id', ({ params }) => {
    if (params.id === '404') {
      return HttpResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }
    return HttpResponse.json({
      recipe: { id: params.id, titleEn: 'Test Recipe' },
    })
  }),
]

// mocks/server.js
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// setupTests.js
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Test with MSW:**

```jsx
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

test('handles API errors gracefully', async () => {
  // Override handler for this test
  server.use(
    http.get('/api/recipes', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 })
    }),
  )

  renderWithProviders(<RecipeList />)

  // User sees error message
  await screen.findByText(/error loading recipes/i)
})
```

### 3. Unit Test Pattern (SELECTIVE USE)

Only for complex pure functions:

```jsx
// utils/validation.test.js
import { validateRecipeForm } from '../validation'

describe('validateRecipeForm', () => {
  it('returns errors for empty required fields', () => {
    const errors = validateRecipeForm({
      titleEn: '',
      ingredientsEn: [],
    })

    expect(errors.titleEn).toBe('Title is required')
    expect(errors.ingredientsEn).toBe('At least one ingredient required')
  })

  it('validates email format', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('valid@email.com')).toBe(true)
  })
})
```

### 4. Async Testing Pattern

Use `waitFor` and `findBy*` queries for async behavior:

```jsx
test('loads recipe data on mount', async () => {
  renderWithProviders(<RecipeDetail />, {
    preloadedState: {
      recipes: { loading: true, currentRecipe: null },
    },
  })

  // Loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Wait for data to load (findBy* auto-waits)
  const recipeTitle = await screen.findByText('Tacos')
  expect(recipeTitle).toBeInTheDocument()

  // Loading indicator gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
})
```

### 5. Form Testing Pattern

Test forms as users would interact with them:

```jsx
test('submits recipe form with valid data', async () => {
  const user = userEvent.setup()

  renderWithProviders(<RecipeForm />, {
    preloadedState: {
      auth: { user: { id: 1 }, isAuthenticated: true },
    },
  })

  // Fill form (like a user)
  await user.type(screen.getByLabelText(/title/i), 'My New Recipe')
  await user.type(screen.getByLabelText(/ingredients/i), 'Flour, Sugar')

  // Submit form
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Assert success behavior (what user sees)
  await screen.findByText(/recipe created successfully/i)
})
```

### 6. Accessibility Testing Pattern

```jsx
test('form is keyboard accessible', async () => {
  const user = userEvent.setup()

  renderWithProviders(<RecipeForm />)

  // Tab through form fields
  await user.tab()
  expect(screen.getByLabelText(/title/i)).toHaveFocus()

  await user.tab()
  expect(screen.getByLabelText(/ingredients/i)).toHaveFocus()

  // Escape closes modal
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('has proper ARIA labels', () => {
  renderWithProviders(<RecipeCard recipe={mockRecipe} />)

  const favoriteButton = screen.getByLabelText(/add to favorites/i)
  expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')
})
```

## What to Test vs. What to Skip

### ✅ DO TEST

- **User workflows**: Login → Browse → Create recipe → Logout
- **Form validation**: Required fields, format validation
- **Error states**: Network errors, 404s, validation errors
- **Loading states**: Spinners, skeleton screens
- **Empty states**: No recipes, no favorites
- **Bilingual content**: Language switching works
- **Authentication flow**: Protected routes redirect properly
- **Search and filters**: User can find recipes
- **CRUD operations**: Create, Read, Update, Delete recipes
- **Accessibility**: Keyboard navigation, ARIA labels

### ❌ DON'T TEST

- **Redux action creators**: Auto-generated by Redux Toolkit
- **Redux reducers**: Unless they have complex logic
- **Component internal state**: `useState` variable names
- **CSS classes**: Unless testing conditional styling behavior
- **Library internals**: React Router, Redux, i18next work correctly
- **Mock implementation**: Don't test that mocks work
- **Snapshots**: Brittle and don't test behavior

## Test Organization

### File Structure

```
src/
├── components/
│   ├── recipes/
│   │   ├── RecipeCard.jsx
│   │   ├── RecipeList.jsx
│   │   └── __tests__/
│   │       ├── RecipeCard.test.jsx         ← Component tests
│   │       └── RecipeList.integration.test.jsx ← Integration tests
│   └── auth/
│       ├── Login.jsx
│       └── __tests__/
│           └── Login.test.jsx
├── store/
│   └── slices/
│       ├── authSlice.js
│       └── __tests__/
│           └── authSlice.test.js            ← Only for complex logic
├── utils/
│   ├── validation.js
│   ├── test-utils.jsx                       ← Shared test helpers
│   └── __tests__/
│       └── validation.test.js               ← Pure function tests
└── mocks/
    ├── handlers.js                          ← MSW API mocks
    └── server.js
```

### Naming Conventions

- **Integration tests**: `*.integration.test.jsx`
- **Component tests**: `ComponentName.test.jsx`
- **Unit tests**: `functionName.test.js`
- **Test suites**: Use `describe('ComponentName', ...)`
- **Test cases**: Use descriptive names: `it('allows user to filter by category', ...)`

## Best Practices

### 1. Query Priority (Testing Library)

Use queries in this order:

```jsx
// 1. Accessible to everyone (BEST)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/search/i)
screen.getByText(/loading/i)

// 2. Semantic queries (GOOD)
screen.getByAltText(/recipe photo/i)
screen.getByTitle(/close dialog/i)

// 3. Test IDs (LAST RESORT)
screen.getByTestId('recipe-card-123')
```

### 2. Async Queries

```jsx
// ✅ GOOD: Automatic waiting
await screen.findByText('Recipe loaded')

// ✅ GOOD: Manual waiting when needed
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// ❌ BAD: No waiting
expect(screen.getByText('Success')).toBeInTheDocument() // May fail if async
```

### 3. User Interactions

```jsx
import userEvent from '@testing-library/user-event'

test('user can interact with form', async () => {
  const user = userEvent.setup()

  // ✅ GOOD: Simulates real user
  await user.type(input, 'Hello')
  await user.click(button)
  await user.selectOptions(select, 'option1')

  // ❌ BAD: Synthetic events
  fireEvent.change(input, { target: { value: 'Hello' } })
})
```

### 4. Assertions

```jsx
// ✅ GOOD: Clear, specific
expect(screen.getByText('Tacos')).toBeInTheDocument()
expect(screen.getByRole('button')).toBeDisabled()
expect(screen.queryByText('Pizza')).not.toBeInTheDocument()

// ❌ BAD: Implementation details
expect(store.getState().recipes.items).toHaveLength(5)
expect(component.state.loading).toBe(false)
```

### 5. Test Independence

```jsx
// ✅ GOOD: Each test is independent
test('test 1', () => {
  const store = setupStore({ recipes: { items: [] } })
  // ...
})

test('test 2', () => {
  const store = setupStore({ recipes: { items: [mockRecipe] } })
  // ...
})

// ❌ BAD: Tests share state
let sharedStore
beforeAll(() => {
  sharedStore = setupStore() // Pollutes all tests
})
```

## Coverage Goals

### Target Coverage

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### What NOT to Cover

- Auto-generated files
- Type definitions
- Configuration files
- Mock files
- Test utilities

### Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

## Migration Plan

### Phase 1: Foundation (Week 1-2)

- [x] Set up Vitest configuration
- [ ] Create shared `test-utils.jsx` helper
- [ ] Install and configure MSW
- [ ] Document patterns in this guide

### Phase 2: Critical Paths (Week 3-4)

- [ ] Integration tests for Login/Register
- [ ] Integration tests for Recipe CRUD
- [ ] Integration tests for Search/Filter
- [ ] API mocking with MSW

### Phase 3: Comprehensive Coverage (Week 5-6)

- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Accessibility tests
- [ ] Bilingual content tests

### Phase 4: Optimization (Week 7-8)

- [ ] Refactor existing unit tests to integration
- [ ] Remove redundant tests
- [ ] Optimize test performance
- [ ] Consider Vitest Browser Mode for critical paths

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- RecipeForm.test.jsx

# Run tests with coverage
npm test -- --coverage

# Run tests with UI
npm run test:ui
```

### CI/CD

```yaml
# .github/workflows/ci.yml
- name: Run Frontend Tests
  run: |
    cd frontend
    npm test -- --coverage --run
```

## Common Pitfalls

### ❌ Testing Implementation Details

```jsx
// BAD: Testing internal state
expect(component.state.count).toBe(5)

// GOOD: Testing user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### ❌ Over-Mocking

```jsx
// BAD: Mocking Redux hooks
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(),
}))

// GOOD: Using real Redux with test store
renderWithProviders(<Component />, {
  preloadedState: { recipes: { items: [] } },
})
```

### ❌ Not Waiting for Async

```jsx
// BAD: No await
const element = screen.getByText('Loaded') // Fails if async

// GOOD: Proper waiting
const element = await screen.findByText('Loaded')
```

### ❌ Testing Too Many Things

```jsx
// BAD: Testing everything in one test
test('recipe component works', () => {
  // Tests rendering, clicking, editing, deleting, errors...
})

// GOOD: One behavior per test
test('displays recipe title and ingredients', () => { ... })
test('allows user to edit recipe', () => { ... })
test('shows error when save fails', () => { ... })
```

## Resources

### Official Documentation

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Redux Testing Guide](https://redux.js.org/usage/writing-tests)
- [Mock Service Worker](https://mswjs.io/)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)

### Articles

- [Kent C. Dodds: Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Kent C. Dodds: Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mark Erikson: Evolution of Redux Testing](https://blog.isquaredsoftware.com/2021/06/the-evolution-of-redux-testing-approaches/)

### Internal Docs

- [Software Development Plan](./software-development-plan.md)
- [Project README](../README.md)

---

**Last Updated**: January 28, 2026  
**Maintained By**: Development Team  
**Review Cycle**: Monthly
