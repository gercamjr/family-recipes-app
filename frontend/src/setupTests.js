import '@testing-library/jest-dom/vitest'

// Set environment variable for tests (used by config.mjs)
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api'

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

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})
