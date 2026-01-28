import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders, createAuthenticatedState, createUnauthenticatedState } from '../../../utils/test-utils'
import Header from '../Header'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}))

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header with title', () => {
    renderWithProviders(<Header />, {
      preloadedState: createUnauthenticatedState(),
    })

    expect(screen.getByText('common.familyRecipes')).toBeInTheDocument()
  })

  it('renders logout button when user is logged in', () => {
    renderWithProviders(<Header />, {
      preloadedState: createAuthenticatedState(),
    })

    expect(screen.getByText('auth.logout')).toBeInTheDocument()
  })

  it('dispatches logout action when logout button is clicked', async () => {
    const user = userEvent.setup()

    const { store } = renderWithProviders(<Header />, {
      preloadedState: createAuthenticatedState(),
    })

    await user.click(screen.getByText('auth.logout'))

    const actions = store.getState()
    // After logout, user should be null and isAuthenticated should be false
    expect(actions.auth.user).toBeNull()
    expect(actions.auth.isAuthenticated).toBe(false)
  })
})
