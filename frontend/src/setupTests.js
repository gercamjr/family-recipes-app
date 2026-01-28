import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Set environment variable for tests (used by config.mjs)
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api'

// ============================================
// Mock react-i18next globally
// ============================================
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}))

// Mock i18n module to prevent initialization errors
vi.mock('./i18n/index.js', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockReturnThis(),
    t: (key) => key,
    changeLanguage: vi.fn(),
    language: 'en',
  },
}))

// Mock i18n middleware
vi.mock('./store/middleware/i18nMiddleware.js', () => ({
  default: () => (next) => (action) => next(action),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

global.localStorage = localStorageMock

// ============================================
// MSW Server Setup
// ============================================

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests
  })
})

// Reset handlers after each test (important for test isolation)
afterEach(() => {
  server.resetHandlers()
})

// Stop MSW server after all tests
afterAll(() => {
  server.close()
})

// ============================================
// Test Cleanup
// ============================================

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})
