import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import recipesReducer from './slices/recipesSlice'
import uiReducer from './slices/uiSlice'
import i18nMiddleware from './middleware/i18nMiddleware'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipes: recipesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(i18nMiddleware),
})
