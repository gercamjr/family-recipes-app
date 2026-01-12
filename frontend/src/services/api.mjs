import axios from 'axios'
import config from './config.mjs'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Response interceptor to handle token expiration and errors
api.interceptors.response.use(
 (response) => {
   return response
 },
 (error) => {
   if (error.response?.status === 401) {
     // Token expired or invalid - clear local storage and redirect to login
     localStorage.removeItem('user')
     window.location.href = '/login'
   }
   return Promise.reject(error)
 }
)

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.message)
    return Promise.reject(error)
  }
)

export default api
