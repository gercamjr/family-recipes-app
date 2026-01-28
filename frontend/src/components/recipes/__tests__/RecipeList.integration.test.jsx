import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { server } from '../../../mocks/server'
import { renderWithProviders, createAuthenticatedState } from '../../../utils/test-utils'
import RecipeList from '../RecipeList'

describe('RecipeList Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Recipe Display', () => {
    it('displays recipes when loaded successfully', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      // Wait for recipes to load and render
      await waitFor(
        () => {
          expect(screen.getByText('Tacos')).toBeInTheDocument()
          expect(screen.getByText('Pizza')).toBeInTheDocument()
        },
        { timeout: 3000 },
      )

      // Verify recipe details are shown
      expect(screen.getByText('Mexican')).toBeInTheDocument()
      expect(screen.getByText('Italian')).toBeInTheDocument()
    })

    it('shows empty state when no recipes exist', async () => {
      server.use(
        http.get('*/api/recipes', () => {
          return HttpResponse.json({
            recipes: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
          })
        }),
      )

      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await waitFor(() => {
        expect(screen.getByText(/no recipes found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when recipe fetch fails', async () => {
      server.use(
        http.get('*/api/recipes', () => {
          return HttpResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
        }),
      )

      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch recipes/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('shows add recipe button', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await screen.findByText('Tacos')

      // Verify add recipe button exists
      const addButton = screen.getByRole('button', { name: /add.*recipe/i })
      expect(addButton).toBeInTheDocument()
    })

    it('displays edit and delete buttons for recipes', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await screen.findByText('Tacos')

      // Should have edit and delete buttons (shown as translation keys)
      const editButtons = screen.getAllByText('common.edit')
      const deleteButtons = screen.getAllByText('common.delete')

      expect(editButtons.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('displays category filter buttons', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await screen.findByText('Tacos')

      // Verify category buttons are present
      expect(screen.getByText('categories.breakfast')).toBeInTheDocument()
      expect(screen.getByText('categories.lunch')).toBeInTheDocument()
      expect(screen.getByText('categories.dinner')).toBeInTheDocument()
    })
  })

  describe('Recipe Content', () => {
    it('displays recipe tags', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await screen.findByText('Tacos')

      // Verify tags are displayed (both recipes have "dinner" tag, so use getAllByText)
      const dinnerTags = screen.getAllByText('dinner')
      expect(dinnerTags.length).toBeGreaterThan(0)
      expect(screen.getByText('mexican')).toBeInTheDocument()
      expect(screen.getByText('italian')).toBeInTheDocument()
    })

    it('displays recipe images with correct alt text', async () => {
      renderWithProviders(<RecipeList />, {
        preloadedState: createAuthenticatedState(),
      })

      await screen.findByText('Tacos')

      // Verify images have proper alt text
      const tacosImage = screen.getByAltText('Tacos')
      const pizzaImage = screen.getByAltText('Pizza')

      expect(tacosImage).toBeInTheDocument()
      expect(pizzaImage).toBeInTheDocument()
    })
  })
})
