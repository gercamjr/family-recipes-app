import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider, useSelector } from 'react-redux'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { store } from './store'
import App from './App'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import RecipeForm from './components/recipes/RecipeForm'
import RecipeDetail from './components/recipes/RecipeDetail'
import ProtectedLayout from './components/ui/ProtectedLayout'
import AdminInviteDashboard from './components/admin/AdminInviteDashboard'
import './i18n'
import './index.css'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return <ProtectedLayout>{children}</ProtectedLayout>
} // Public Route component (redirects to app if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return children
}

// Admin Route component
const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const userRole = useSelector((state) => state.auth.user?.role)

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (userRole !== 'admin') {
    return <Navigate to='/' replace />
  }

  return <ProtectedLayout>{children}</ProtectedLayout>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route
            path='/login'
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path='/register'
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path='/recipes/new'
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path='/recipes/:id/edit'
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path='/recipes/:id'
            element={
              <ProtectedRoute>
                <RecipeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/invites'
            element={
              <AdminRoute>
                <AdminInviteDashboard />
              </AdminRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
)

// Register Service Worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Unregister service worker in development
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister()
      console.log('Service Worker unregistered for development')
    })
  })
}
