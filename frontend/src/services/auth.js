import api from './api.mjs'

export const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data

      // Store token and user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      return { token, user }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  },

  // Register new user (invite-only)
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  },

  // Send invitation (admin only)
  async sendInvite(email) {
    try {
      const response = await api.post('/auth/invite', { email })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send invitation')
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser()
    return user?.role || null
  },
}
