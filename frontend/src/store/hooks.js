import { useDispatch, useSelector } from 'react-redux'
import { store } from '../store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch()
export const useAppSelector = (selector) => useSelector(selector)

// Auth selectors
export const useAuth = () => useAppSelector((state) => state.auth)
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated)
export const useCurrentUser = () => useAppSelector((state) => state.auth.user)
export const useAuthToken = () => useAppSelector((state) => state.auth.token)

// Recipes selectors
export const useRecipes = () => useAppSelector((state) => state.recipes)
export const useCurrentRecipe = () => useAppSelector((state) => state.recipes.currentRecipe)
export const useFavorites = () => useAppSelector((state) => state.recipes.favorites)
export const useRecipesLoading = () => useAppSelector((state) => state.recipes.loading)
export const useRecipesError = () => useAppSelector((state) => state.recipes.error)
export const useRecipesPagination = () => useAppSelector((state) => state.recipes.pagination)
export const useRecipesFilters = () => useAppSelector((state) => state.recipes.filters)

// UI selectors
export const useUI = () => useAppSelector((state) => state.ui)
export const useLanguage = () => useAppSelector((state) => state.ui.language)
export const useTheme = () => useAppSelector((state) => state.ui.theme)
export const useSidebarOpen = () => useAppSelector((state) => state.ui.sidebarOpen)
export const useModal = () => useAppSelector((state) => state.ui.modal)
export const useNotifications = () => useAppSelector((state) => state.ui.notifications)
export const useGlobalLoading = () => useAppSelector((state) => state.ui.loading.global)
export const useSpecificLoading = (key) => useAppSelector((state) => state.ui.loading.specific[key])
export const useSearch = () => useAppSelector((state) => state.ui.search)
