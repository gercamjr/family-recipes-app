import { createSlice } from '@reduxjs/toolkit'

// Initialize state from localStorage
const token = localStorage.getItem('token')
const user = localStorage.getItem('user')

const initialState = {
  user: user ? JSON.parse(user) : null,
  isAuthenticated: !!user,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.error = null
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.isAuthenticated = false
      state.user = null
      // Clear localStorage
      localStorage.removeItem('user')
    },
    registerStart: (state) => {
      state.loading = true
      state.error = null
    },
    registerSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.error = null
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    registerFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.isAuthenticated = false
      state.user = null
      // Clear localStorage
      localStorage.removeItem('user')
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      // Clear localStorage
      localStorage.removeItem('user')
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  updateProfile,
  clearError,
} = authSlice.actions

export default authSlice.reducer
