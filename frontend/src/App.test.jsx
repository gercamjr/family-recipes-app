import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store'
import App from './App'

test('renders the app title', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  )
  const titleElement = screen.getByText(/Recetas Familiares/i)
  expect(titleElement).toBeInTheDocument()
})
