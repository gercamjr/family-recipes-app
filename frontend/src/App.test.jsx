import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'

test('renders the app title', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  )
  const titleElement = screen.getByText(/Family Recipes/i)
  expect(titleElement).toBeInTheDocument()
})
