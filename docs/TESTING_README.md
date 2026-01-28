# Frontend Testing Setup

This directory contains the testing infrastructure for the Family Recipes App frontend.

## 📚 Documentation

- **[Testing Strategy](./TESTING_STRATEGY.md)** - Comprehensive guide to our testing philosophy and patterns
- **[Quick Reference](./TESTING_QUICK_REFERENCE.md)** - Cheatsheet for common testing patterns
- **[Migration Example](./TESTING_MIGRATION_EXAMPLE.md)** - How to refactor old tests to new patterns

## 🚀 Quick Start

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Tests

```bash
# Watch mode (default)
npm test

# Run once (CI mode)
npm run test:run

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/              # Component tests
│   ├── store/
│   │   └── __tests__/              # Redux slice tests
│   ├── utils/
│   │   ├── test-utils.jsx          # Shared test utilities
│   │   └── __tests__/              # Utility function tests
│   ├── mocks/
│   │   ├── handlers.js             # MSW request handlers
│   │   ├── server.js               # MSW server (Node)
│   │   └── browser.js              # MSW worker (Browser)
│   └── setupTests.js               # Global test setup
├── vitest.config.js                # Vitest configuration
└── package.json                    # Test scripts
```

## 🧪 Test Types

### Integration Tests (Recommended - 80%)

Test components with real Redux store and user interactions:

```jsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createAuthenticatedState } from '../utils/test-utils'

test('user can create a recipe', async () => {
  const user = userEvent.setup()

  renderWithProviders(<RecipeForm />, {
    preloadedState: createAuthenticatedState(),
  })

  await user.type(screen.getByLabelText(/title/i), 'Tacos')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  await screen.findByText(/recipe created/i)
})
```

### Unit Tests (Selective - 20%)

Test pure functions in isolation:

```jsx
import { validateRecipeForm } from '../validation'

test('validates required fields', () => {
  const errors = validateRecipeForm({ titleEn: '' })
  expect(errors.titleEn).toBe('Title is required')
})
```

## 🛠️ Tools

- **[Vitest](https://vitest.dev/)** - Fast test runner compatible with Vite
- **[React Testing Library](https://testing-library.com/)** - User-centric component testing
- **[MSW](https://mswjs.io/)** - Mock Service Worker for API mocking
- **[User Event](https://testing-library.com/docs/user-event/intro)** - Realistic user interactions
- **[jest-dom](https://github.com/testing-library/jest-dom)** - Custom DOM matchers

## 🎯 Testing Philosophy

We follow these principles:

1. **Test behavior, not implementation**
   - Focus on what users see and do
   - Avoid testing internal state or private methods

2. **Integration over isolation**
   - Use real Redux store in tests
   - Mock at the network layer (MSW), not the module layer

3. **Accessible queries**
   - Prefer `getByRole`, `getByLabelText`
   - Use `getByTestId` only as last resort

4. **User-centric**
   - Write tests that mirror user interactions
   - Assert on user-visible outcomes

## 📝 Common Patterns

### Rendering with Redux Store

```jsx
import { renderWithProviders } from '../utils/test-utils'

renderWithProviders(<MyComponent />, {
  preloadedState: {
    auth: { user: mockUser, isAuthenticated: true },
  },
})
```

### API Mocking with MSW

```jsx
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

server.use(
  http.get('/api/recipes', () => {
    return HttpResponse.json({ recipes: [] })
  }),
)
```

### Async Testing

```jsx
// Wait for element to appear
await screen.findByText('Loaded')

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

### User Interactions

```jsx
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

await user.type(input, 'Hello')
await user.click(button)
await user.selectOptions(select, 'option1')
```

## ✅ Coverage Goals

| Metric     | Target |
| ---------- | ------ |
| Statements | 80%+   |
| Branches   | 75%+   |
| Functions  | 80%+   |
| Lines      | 80%+   |

Focus on critical paths:

- Authentication flow
- Recipe CRUD operations
- Search and filter
- Error handling
- Bilingual support

## 🐛 Debugging Tests

### 1. Visual Debugging

```jsx
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### 2. Check Available Queries

```jsx
// List all interactive elements
screen.getAllByRole('button').forEach((btn) => {
  console.log(btn.textContent)
})
```

### 3. Increase Timeout

```jsx
await screen.findByText('Slow element', {}, { timeout: 5000 })
```

## 🔧 Configuration

### Vitest Config

See [vite.config.js](../frontend/vite.config.js):

```js
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.js',
}
```

### MSW Setup

See [src/setupTests.js](../frontend/src/setupTests.js):

- MSW server starts before all tests
- Handlers reset after each test
- Server closes after all tests

## 📖 Learning Resources

### Official Docs

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Redux Testing](https://redux.js.org/usage/writing-tests)
- [MSW](https://mswjs.io/)

### Articles

- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) - Kent C. Dodds
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) - Kent C. Dodds
- [Evolution of Redux Testing](https://blog.isquaredsoftware.com/2021/06/the-evolution-of-redux-testing-approaches/) - Mark Erikson

## 🚦 CI/CD Integration

Tests run automatically on GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Run Frontend Tests
  run: |
    cd frontend
    npm run test:run -- --coverage
```

## 🤝 Contributing

When adding new features:

1. Write integration tests for user workflows
2. Add unit tests for complex utilities
3. Mock APIs with MSW
4. Ensure accessibility (keyboard nav, ARIA labels)
5. Test bilingual support
6. Run `npm run test:coverage` to check coverage

## 📞 Need Help?

- Check the [Quick Reference](./TESTING_QUICK_REFERENCE.md) for common patterns
- Review the [Migration Example](./TESTING_MIGRATION_EXAMPLE.md) for refactoring guidance
- Read the [Testing Strategy](./TESTING_STRATEGY.md) for comprehensive philosophy

## 🔄 Next Steps

1. **Install MSW**: `npm install --save-dev msw`
2. **Review existing tests**: Identify candidates for refactoring
3. **Start with critical paths**: Login, Create Recipe, Search
4. **Gradually migrate**: Refactor tests one component at a time
5. **Monitor coverage**: Aim for 80%+ on critical features

---

**Last Updated**: January 28, 2026  
**Maintained By**: Development Team
