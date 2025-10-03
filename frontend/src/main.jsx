import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { store } from './store'
import App from './App'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import './index.css'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = store.getState().auth.isAuthenticated

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return children
}

// Public Route component (redirects to app if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = store.getState().auth.isAuthenticated

  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
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
            path='/'
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
)
