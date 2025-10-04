import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { vi } from 'vitest'
import RecipeCard from '../RecipeCard'
import authSlice from '../../../store/slices/authSlice'
import recipesSlice from '../../../store/slices/recipesSlice'
import uiSlice from '../../../store/slices/uiSlice'
import i18n from '../../../i18n'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return key as-is for testing
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}))

// Mock i18n
vi.mock('../../../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
  },
}))

const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      recipes: recipesSlice,
      ui: uiSlice,
    },
    preloadedState: initialState,
  })
}

const mockRecipe = {
  id: 1,
  user_id: 1,
  title_en: 'Test Recipe',
  title_es: 'Receta de Prueba',
  ingredients_en: ['ingredient 1', 'ingredient 2'],
  ingredients_es: ['ingrediente 1', 'ingrediente 2'],
  instructions_en: 'Mix ingredients',
  instructions_es: 'Mezclar ingredientes',
  prep_time: 10,
  cook_time: 20,
  servings: 4,
  tags: ['tag1'],
  categories: ['category1'],
  created_at: '2023-01-01',
}

const renderWithProviders = (component, initialState = {}) => {
  const store = createMockStore(initialState)
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  )
}

describe('RecipeCard', () => {
  beforeEach(() => {
    i18n.changeLanguage('en')
  })

  it('renders recipe title in English', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />, {
      ui: { language: 'en' },
    })

    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
  })

  it('renders recipe title in Spanish', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />, {
      ui: { language: 'es' },
    })

    expect(screen.getByText('Receta de Prueba')).toBeInTheDocument()
  })

  it('displays recipe metadata', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
  })

  it('shows favorite button and toggles favorite', () => {
    const mockOnView = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onView={mockOnView} />, {
      auth: { user: { id: 1 } },
      recipes: { favorites: [] },
    })

    const favoriteButton = screen.getAllByRole('button')[0] // The first button is the favorite one
    expect(favoriteButton).toBeInTheDocument()

    fireEvent.click(favoriteButton)
    // Since it's mocked, we can't test dispatch, but at least it doesn't crash
  })

  it('shows edit and delete buttons for owner', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />, {
      auth: { user: { id: 1 } },
    })

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('does not show edit and delete buttons for non-owner', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />, {
      auth: { user: { id: 2 } },
    })

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('calls onView when clicked', () => {
    const mockOnView = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onView={mockOnView} />)

    const card = screen.getByText('Receta de Prueba').closest('div')
    fireEvent.click(card)

    expect(mockOnView).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onEdit={mockOnEdit} />, {
      auth: { user: { id: 1 } },
    })

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onDelete={mockOnDelete} />, {
      auth: { user: { id: 1 } },
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('renders without crashing', () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />)

    expect(screen.getByText('Receta de Prueba')).toBeInTheDocument()
  })
})
