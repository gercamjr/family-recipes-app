import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Login from '../Login'
import authSlice from '../../../store/slices/authSlice'
import uiSlice from '../../../store/slices/uiSlice'
import i18nMiddleware from '../../../store/middleware/i18nMiddleware'

// Mock the api service
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return key as-is for testing
  }),
}))

// Mock i18n middleware
jest.mock('../../../store/middleware/i18nMiddleware', () => jest.fn(() => (next) => (action) => next(action)))

// Mock auth service
jest.mock('../../../services/auth', () => ({
  authService: {
    login: jest.fn(),
  },
}))

import { authService } from '../../../services/auth'

// Create a store setup function for testing (similar to Redux docs recommendation)
const setupStore = (preloadedState) => {
  return configureStore({
    reducer: {
      auth: authSlice,
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

// Custom render function that sets up Redux store and router
const renderWithProviders = (
  ui,
  { preloadedState = {}, store = setupStore(preloadedState), ...renderOptions } = {}
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

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    expect(screen.getByText('auth.login.title')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.login.email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.login.password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth.login.submit' })).toBeInTheDocument()
  })

  it('shows validation errors for empty form submission', async () => {
    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    // Submit empty form
    fireEvent.click(submitButton)

    // Wait for validation errors to appear - both email and password should show required error
    await waitFor(() => {
      const errorMessages = screen.getAllByText('validation.required')
      expect(errorMessages).toHaveLength(2) // Both email and password fields
    })
  })

  it.skip('shows validation error for invalid email', async () => {
    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput) // Blur to trigger validation
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Wait for email validation error to appear
    await waitFor(() => {
      expect(screen.getByText('validation.email')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.register.passwordTooShort')).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    const mockToken = 'mock-jwt-token'

    authService.login.mockResolvedValueOnce({ token: mockToken, user: mockUser })

    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // Check that the store was updated
    const state = store.getState()
    expect(state.auth.user).toEqual(mockUser)
    expect(state.auth.isAuthenticated).toBe(true)
  })

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials'
    authService.login.mockRejectedValueOnce(new Error(errorMessage))

    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Check that error is in store
    const state = store.getState()
    expect(state.auth.error).toBe(errorMessage)
  })

  it('shows loading state during login', async () => {
    // Mock login to take some time
    authService.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ token: 'token', user: {} }), 100))
    )

    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Check loading state immediately after submit
    await waitFor(() => {
      expect(screen.getByText('common.loading')).toBeInTheDocument()
    })
    expect(submitButton).toBeDisabled()

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('common.loading')).not.toBeInTheDocument()
    })
  })

  it('clears error when close button is clicked', async () => {
    const errorMessage = 'Invalid credentials'
    authService.login.mockRejectedValueOnce(new Error(errorMessage))

    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    // Trigger error first
    const emailInput = screen.getByLabelText('auth.login.email')
    const passwordInput = screen.getByLabelText('auth.login.password')
    const submitButton = screen.getByRole('button', { name: 'auth.login.submit' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Click close button
    const closeButton = screen.getByRole('button', { name: 'common.close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })

    // Check that error is cleared from store
    const state = store.getState()
    expect(state.auth.error).toBeNull()
  })

  it('toggles password visibility', () => {
    const { store } = renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
        ui: {
          language: 'en',
          theme: 'light',
        },
      },
    })

    const passwordInput = screen.getByLabelText('auth.login.password')
    const toggleButton = passwordInput.parentElement.querySelector('button')

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to hide password again
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
