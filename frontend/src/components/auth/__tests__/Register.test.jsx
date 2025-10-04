import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Register from '../Register'
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
    i18n: { language: 'en' },
  }),
}))

// Mock i18n middleware
jest.mock('../../../store/middleware/i18nMiddleware', () => jest.fn(() => (next) => (action) => next(action)))

// Mock auth service
jest.mock('../../../services/auth', () => ({
  authService: {
    register: jest.fn(),
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

describe('Register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders registration form correctly', () => {
    const { store } = renderWithProviders(<Register />, {
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

    expect(screen.getByText('auth.register.title')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.register.name')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.register.email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.register.inviteToken')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.register.password')).toBeInTheDocument()
    expect(screen.getByLabelText('auth.register.confirmPassword')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth.register.submit' })).toBeInTheDocument()
  })

  it('shows validation errors for empty form submission', async () => {
    const { store } = renderWithProviders(<Register />, {
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

    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    // Submit empty form
    fireEvent.click(submitButton)

    // Wait for validation errors to appear - all required fields should show errors
    await waitFor(() => {
      const errorMessages = screen.getAllByText('auth.register.nameRequired')
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    await waitFor(() => {
      expect(screen.getByText('auth.register.emailRequired')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('auth.register.inviteTokenRequired')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('auth.register.passwordTooShort')).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const { store } = renderWithProviders(<Register />, {
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

    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.register.passwordTooShort')).toBeInTheDocument()
    })
  })

  it('shows validation error for password mismatch', async () => {
    const { store } = renderWithProviders(<Register />, {
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

    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('auth.register.passwordMismatch')).toBeInTheDocument()
    })
  })

  it('handles successful registration', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    const mockToken = 'mock-jwt-token'

    authService.register.mockResolvedValueOnce({ token: mockToken, user: mockUser })

    const { store } = renderWithProviders(<Register />, {
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

    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        inviteToken: 'invite-token',
        languagePref: 'en',
      })
    })

    // Check that the store was updated
    const state = store.getState()
    expect(state.auth.user).toEqual(mockUser)
    expect(state.auth.isAuthenticated).toBe(true)
  })

  it('handles registration error', async () => {
    const errorMessage = 'Registration failed'
    authService.register.mockRejectedValueOnce(new Error(errorMessage))

    const { store } = renderWithProviders(<Register />, {
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

    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Check that error is in store
    const state = store.getState()
    expect(state.auth.error).toBe(errorMessage)
  })

  it('shows loading state during registration', async () => {
    // Mock register to take some time
    authService.register.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ token: 'token', user: {} }), 100))
    )

    const { store } = renderWithProviders(<Register />, {
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

    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Check loading state immediately after submit
    await waitFor(() => {
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
    })
    expect(submitButton).toBeDisabled()

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Creating Account...')).not.toBeInTheDocument()
    })
  })

  it('clears error when dismiss button is clicked', async () => {
    const errorMessage = 'Registration failed'
    authService.register.mockRejectedValueOnce(new Error(errorMessage))

    const { store } = renderWithProviders(<Register />, {
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
    const nameInput = screen.getByLabelText('auth.register.name')
    const emailInput = screen.getByLabelText('auth.register.email')
    const inviteTokenInput = screen.getByLabelText('auth.register.inviteToken')
    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')
    const submitButton = screen.getByRole('button', { name: 'auth.register.submit' })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(inviteTokenInput, { target: { value: 'invite-token' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })

    // Check that error is cleared from store
    const state = store.getState()
    expect(state.auth.error).toBeNull()
  })

  it('toggles password visibility', () => {
    const { store } = renderWithProviders(<Register />, {
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

    const passwordInput = screen.getByLabelText('auth.register.password')
    const confirmPasswordInput = screen.getByLabelText('auth.register.confirmPassword')

    // Password visibility toggles use emoji buttons
    const passwordToggle = passwordInput.parentElement.querySelector('button')
    const confirmPasswordToggle = confirmPasswordInput.parentElement.querySelector('button')

    // Initially passwords should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    // Click to show password
    fireEvent.click(passwordToggle)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click to show confirm password
    fireEvent.click(confirmPasswordToggle)
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')

    // Click to hide passwords again
    fireEvent.click(passwordToggle)
    fireEvent.click(confirmPasswordToggle)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })
})
