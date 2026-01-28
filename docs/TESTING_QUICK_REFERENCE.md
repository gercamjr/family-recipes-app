# Testing Quick Reference

## Running Tests

```bash
# Watch mode (default)
npm test

# Run once (CI mode)
npm run test:run

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui

# Specific file
npm test RecipeList.test.jsx

# Pattern matching
npm test -- --grep "Recipe"
```

## Import Cheatsheet

```jsx
// Testing utilities
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Custom utilities
import { renderWithProviders, createMockUser, createMockRecipe, createAuthenticatedState } from '../utils/test-utils'

// MSW
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
```

## Common Patterns

### Basic Component Test

```jsx
test('renders component correctly', () => {
  renderWithProviders(<MyComponent />, {
    preloadedState: createAuthenticatedState(),
  })

  expect(screen.getByText('Hello World')).toBeInTheDocument()
})
```

### User Interaction

```jsx
test('handles button click', async () => {
  const user = userEvent.setup()

  renderWithProviders(<MyComponent />)

  const button = screen.getByRole('button', { name: /submit/i })
  await user.click(button)

  expect(screen.getByText('Submitted')).toBeInTheDocument()
})
```

### Form Input

```jsx
test('allows user to type in input', async () => {
  const user = userEvent.setup()

  renderWithProviders(<LoginForm />)

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')

  expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com')
})
```

### Async Data Loading

```jsx
test('loads data asynchronously', async () => {
  renderWithProviders(<RecipeList />)

  // Wait for data to appear
  const recipe = await screen.findByText('Tacos')
  expect(recipe).toBeInTheDocument()
})
```

### API Error Simulation

```jsx
test('handles API error', async () => {
  server.use(
    http.get('/api/recipes', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 })
    }),
  )

  renderWithProviders(<RecipeList />)

  await screen.findByText(/error/i)
})
```

### Authenticated vs Unauthenticated

```jsx
// Authenticated user
renderWithProviders(<MyComponent />, {
  preloadedState: createAuthenticatedState(),
})

// Custom user
renderWithProviders(<MyComponent />, {
  preloadedState: createAuthenticatedState(createMockUser({ role: 'admin' })),
})

// Not logged in
renderWithProviders(<MyComponent />, {
  preloadedState: createUnauthenticatedState(),
})
```

## Query Priority

```jsx
// 1. By Role (BEST - accessible to everyone)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /email/i })

// 2. By Label (GOOD - form controls)
screen.getByLabelText(/email/i)

// 3. By Placeholder (OK)
screen.getByPlaceholderText(/enter email/i)

// 4. By Text (OK for non-interactive)
screen.getByText(/welcome/i)

// 5. By Test ID (LAST RESORT)
screen.getByTestId('recipe-card-123')
```

## Query Variants

```jsx
// getBy* - Throws if not found (immediate)
screen.getByText('Hello')

// queryBy* - Returns null if not found (immediate)
screen.queryByText('Hello')

// findBy* - Returns promise, waits (async)
await screen.findByText('Hello')

// getAllBy* - Returns array (immediate)
screen.getAllByRole('button')

// queryAllBy* - Returns empty array if not found
screen.queryAllByRole('button')

// findAllBy* - Returns promise with array (async)
await screen.findAllByRole('button')
```

## Assertions

```jsx
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).toBeEnabled()
expect(element).toBeDisabled()

// Value
expect(input).toHaveValue('test')
expect(checkbox).toBeChecked()

// Attributes
expect(element).toHaveAttribute('aria-label', 'Close')
expect(element).toHaveClass('active')

// Focus
expect(element).toHaveFocus()
```

## Within Scoping

```jsx
// Find elements within a specific container
const form = screen.getByRole('form')
const submitButton = within(form).getByRole('button', { name: /submit/i })
```

## Mock Service Worker Patterns

### Override for Single Test

```jsx
test('handles specific scenario', async () => {
  server.use(
    http.get('/api/recipes', () => {
      return HttpResponse.json({ recipes: [] })
    }),
  )

  // Test continues...
})
```

### Dynamic Response

```jsx
server.use(
  http.get('/api/recipes/:id', ({ params }) => {
    return HttpResponse.json({
      recipe: { id: params.id, titleEn: 'Dynamic Recipe' },
    })
  }),
)
```

### Delay Simulation

```jsx
import { delay } from 'msw'

server.use(
  http.get('/api/recipes', async () => {
    await delay(1000) // 1 second delay
    return HttpResponse.json({ recipes: [] })
  }),
)
```

## Common Mistakes to Avoid

### ❌ Don't test implementation details

```jsx
// BAD
expect(component.state.count).toBe(5)

// GOOD
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### ❌ Don't forget to await async operations

```jsx
// BAD
const element = screen.getByText('Loaded')

// GOOD
const element = await screen.findByText('Loaded')
```

### ❌ Don't use getBy\* for elements that might not exist

```jsx
// BAD - throws error if not found
expect(screen.getByText('Optional')).not.toBeInTheDocument()

// GOOD - returns null if not found
expect(screen.queryByText('Optional')).not.toBeInTheDocument()
```

### ❌ Don't mock too much

```jsx
// BAD - mocking what you're testing
vi.mock('react-redux')

// GOOD - use real Redux with test store
renderWithProviders(<Component />, { preloadedState })
```

## Debugging Tips

### 1. Screen Debug

```jsx
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### 2. Log Queries

```jsx
// See all available roles
screen.logTestingPlaygroundURL()
```

### 3. Check What's Rendered

```jsx
// List all buttons
console.log(screen.getAllByRole('button').map((b) => b.textContent))

// Check element properties
const button = screen.getByRole('button')
console.log({
  text: button.textContent,
  disabled: button.disabled,
  className: button.className,
})
```

### 4. Increase Timeout for Slow Tests

```jsx
await screen.findByText('Loaded', {}, { timeout: 5000 }) // 5 seconds
```

## VS Code Snippets

Add to `.vscode/react.code-snippets`:

```json
{
  "Integration Test": {
    "prefix": "itest",
    "body": [
      "import { screen } from '@testing-library/react'",
      "import userEvent from '@testing-library/user-event'",
      "import { renderWithProviders, createAuthenticatedState } from '../utils/test-utils'",
      "import ${1:ComponentName} from '../${1:ComponentName}'",
      "",
      "describe('${1:ComponentName}', () => {",
      "  it('${2:test description}', async () => {",
      "    const user = userEvent.setup()",
      "    ",
      "    renderWithProviders(<${1:ComponentName} />, {",
      "      preloadedState: createAuthenticatedState(),",
      "    })",
      "    ",
      "    $0",
      "  })",
      "})"
    ]
  }
}
```

## Resources

- [Testing Strategy Doc](./TESTING_STRATEGY.md)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Docs](https://mswjs.io/)
