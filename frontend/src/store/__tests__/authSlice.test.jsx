import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  clearError,
} from '../slices/authSlice'

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: undefined })).toEqual(initialState)
  })

  it('should handle loginStart', () => {
    const actual = authReducer(initialState, loginStart())
    expect(actual.loading).toEqual(true)
    expect(actual.error).toEqual(null)
  })

  it('should handle loginSuccess', () => {
    const user = { id: 1, email: 'test@example.com', name: 'Test User' }
    const token = 'jwt-token-123'
    const actual = authReducer({ ...initialState, loading: true }, loginSuccess({ user, token }))
    expect(actual.loading).toEqual(false)
    expect(actual.isAuthenticated).toEqual(true)
    expect(actual.user).toEqual(user)
    expect(actual.token).toEqual(token)
    expect(actual.error).toEqual(null)
  })

  it('should handle loginFailure', () => {
    const error = 'Invalid credentials'
    const actual = authReducer({ ...initialState, loading: true }, loginFailure(error))
    expect(actual.loading).toEqual(false)
    expect(actual.error).toEqual(error)
    expect(actual.isAuthenticated).toEqual(false)
    expect(actual.user).toEqual(null)
    expect(actual.token).toEqual(null)
  })

  it('should handle logout', () => {
    const stateWithUser = {
      user: { id: 1, email: 'test@example.com' },
      token: 'jwt-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    }
    const actual = authReducer(stateWithUser, logout())
    expect(actual).toEqual(initialState)
  })

  it('should handle updateProfile', () => {
    const existingUser = { id: 1, email: 'test@example.com', name: 'Old Name' }
    const updates = { name: 'New Name', avatar: 'avatar.jpg' }
    const actual = authReducer({ ...initialState, user: existingUser }, updateProfile(updates))
    expect(actual.user).toEqual({
      id: 1,
      email: 'test@example.com',
      name: 'New Name',
      avatar: 'avatar.jpg',
    })
  })

  it('should handle clearError', () => {
    const stateWithError = {
      ...initialState,
      error: 'Some error occurred',
    }
    const actual = authReducer(stateWithError, clearError())
    expect(actual.error).toEqual(null)
  })
})
