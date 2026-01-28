import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup MSW worker for browser environment
// This can be used for development/debugging
// Not needed for tests (uses server.js instead)
export const worker = setupWorker(...handlers)
