import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server with default handlers
// This server is used in Node.js environment (test runner)
export const server = setupServer(...handlers)
