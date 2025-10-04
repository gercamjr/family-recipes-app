import '@testing-library/jest-dom'

// Polyfill for import.meta.env in Jest
global.import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:3001/api',
      // Add other VITE_ env vars as needed
    },
  },
}

// Set environment variable for tests (used by config.js)
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api'
