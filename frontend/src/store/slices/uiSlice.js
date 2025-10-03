import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  language: 'en', // 'en' or 'es'
  theme: 'light', // 'light' or 'dark'
  sidebarOpen: false,
  modal: {
    isOpen: false,
    type: null, // 'login', 'register', 'recipe-form', 'confirm-delete', etc.
    data: null,
  },
  notifications: [],
  loading: {
    global: false,
    specific: {}, // { 'fetchRecipes': true, 'createRecipe': false, etc. }
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

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    openModal: (state, action) => {
      state.modal.isOpen = true
      state.modal.type = action.payload.type
      state.modal.data = action.payload.data || null
    },
    closeModal: (state) => {
      state.modal.isOpen = false
      state.modal.type = null
      state.modal.data = null
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: action.payload.type || 'info', // 'success', 'error', 'warning', 'info'
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        timestamp: new Date().toISOString(),
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    setSpecificLoading: (state, action) => {
      state.loading.specific[action.payload.key] = action.payload.value
    },
    clearSpecificLoading: (state, action) => {
      delete state.loading.specific[action.payload]
    },
    toggleSearch: (state) => {
      state.search.isOpen = !state.search.isOpen
    },
    setSearchOpen: (state, action) => {
      state.search.isOpen = action.payload
    },
    setSearchQuery: (state, action) => {
      state.search.query = action.payload
    },
    updateSearchFilters: (state, action) => {
      state.search.filters = { ...state.search.filters, ...action.payload }
    },
    clearSearchFilters: (state) => {
      state.search.filters = initialState.search.filters
    },
    resetSearch: (state) => {
      state.search = initialState.search
    },
  },
})

export const {
  setLanguage,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setSpecificLoading,
  clearSpecificLoading,
  toggleSearch,
  setSearchOpen,
  setSearchQuery,
  updateSearchFilters,
  clearSearchFilters,
  resetSearch,
} = uiSlice.actions

export default uiSlice.reducer
