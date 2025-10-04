export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  extensionsToTreatAsEsm: ['.jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],
  globals: {
    'import.meta': {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3001/api',
      },
    },
  },
}
