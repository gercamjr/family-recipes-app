import uiReducer, {
  setLanguage,
  setTheme,
  toggleSidebar,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  setGlobalLoading,
  setSearchQuery,
  updateSearchFilters,
  resetSearch,
} from '../slices/uiSlice'

describe('uiSlice', () => {
  const initialState = {
    language: 'es', // Updated to match the actual slice default
    theme: 'light',
    sidebarOpen: false,
    modal: {
      isOpen: false,
      type: null,
      data: null,
    },
    notifications: [],
    loading: {
      global: false,
      specific: {},
    },
    search: {
      isOpen: false,
      query: '',
      filters: {
        category: '',
        tags: [],
        prepTime: '',
        cookTime: '',
      },
    },
  }

  it('should return the initial state', () => {
    expect(uiReducer(undefined, { type: undefined })).toEqual(initialState)
  })

  it('should handle setLanguage', () => {
    const actual = uiReducer(initialState, setLanguage('es'))
    expect(actual.language).toEqual('es')
  })

  it('should handle setTheme', () => {
    const actual = uiReducer(initialState, setTheme('dark'))
    expect(actual.theme).toEqual('dark')
  })

  it('should handle toggleSidebar', () => {
    const actual = uiReducer(initialState, toggleSidebar())
    expect(actual.sidebarOpen).toEqual(true)
  })

  it('should handle openModal', () => {
    const actual = uiReducer(initialState, openModal({ type: 'login', data: { userId: 1 } }))
    expect(actual.modal).toEqual({
      isOpen: true,
      type: 'login',
      data: { userId: 1 },
    })
  })

  it('should handle closeModal', () => {
    const stateWithModal = {
      ...initialState,
      modal: { isOpen: true, type: 'login', data: { userId: 1 } },
    }
    const actual = uiReducer(stateWithModal, closeModal())
    expect(actual.modal).toEqual({
      isOpen: false,
      type: null,
      data: null,
    })
  })

  it('should handle addNotification', () => {
    const actual = uiReducer(
      initialState,
      addNotification({
        type: 'success',
        message: 'Recipe saved!',
        duration: 3000,
      })
    )
    expect(actual.notifications).toHaveLength(1)
    expect(actual.notifications[0]).toMatchObject({
      type: 'success',
      message: 'Recipe saved!',
      duration: 3000,
    })
    expect(actual.notifications[0].id).toBeDefined()
  })

  it('should handle removeNotification', () => {
    const stateWithNotification = {
      ...initialState,
      notifications: [{ id: 123, type: 'success', message: 'Test' }],
    }
    const actual = uiReducer(stateWithNotification, removeNotification(123))
    expect(actual.notifications).toHaveLength(0)
  })

  it('should handle setGlobalLoading', () => {
    const actual = uiReducer(initialState, setGlobalLoading(true))
    expect(actual.loading.global).toEqual(true)
  })

  it('should handle setSearchQuery', () => {
    const actual = uiReducer(initialState, setSearchQuery('pasta'))
    expect(actual.search.query).toEqual('pasta')
  })

  it('should handle updateSearchFilters', () => {
    const actual = uiReducer(
      initialState,
      updateSearchFilters({
        category: 'Italian',
        tags: ['vegetarian'],
      })
    )
    expect(actual.search.filters).toEqual({
      category: 'Italian',
      tags: ['vegetarian'],
      prepTime: '',
      cookTime: '',
    })
  })

  it('should handle resetSearch', () => {
    const stateWithSearch = {
      ...initialState,
      search: {
        isOpen: true,
        query: 'pasta',
        filters: {
          category: 'Italian',
          tags: ['vegetarian'],
          prepTime: '30',
          cookTime: '45',
        },
      },
    }
    const actual = uiReducer(stateWithSearch, resetSearch())
    expect(actual.search).toEqual(initialState.search)
  })
})
