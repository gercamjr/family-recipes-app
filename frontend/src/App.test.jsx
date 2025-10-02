import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    const titleElement = screen.getByText(/Recetas del Corazón/i)
    expect(titleElement).toBeInTheDocument()
  })

  it('renders the working message', () => {
    render(<App />)
    const messageElement = screen.getByText(/React app is working!/i)
    expect(messageElement).toBeInTheDocument()
  })
})
