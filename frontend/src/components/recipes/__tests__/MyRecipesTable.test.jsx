import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, createAuthenticatedState } from '../../../utils/test-utils'
import MyRecipesTable from '../MyRecipesTable'

describe('MyRecipesTable', () => {
  it('renders user recipes in a table', async () => {
    renderWithProviders(<MyRecipesTable />, {
      preloadedState: createAuthenticatedState(),
    })

    await waitFor(() => {
      expect(screen.getByText('Tacos')).toBeInTheDocument()
    })

    expect(screen.getByText('recipes.myRecipesTitle')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })
})
