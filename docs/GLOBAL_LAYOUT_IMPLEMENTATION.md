# Global Header and Footer Implementation

## Summary

Implemented a global layout system that automatically applies Header and Footer components to all protected pages in the application. This eliminates the need to manually add Header/Footer to each component and ensures consistency across the app.

## Architecture

### New Component: `ProtectedLayout`

**Location:** `/frontend/src/components/ui/ProtectedLayout.jsx`

This is a wrapper component that provides the common layout structure for all authenticated pages:

- Header at the top
- Main content area (flex-grow to fill available space)
- Footer at the bottom
- Full viewport height layout (`min-h-screen`)

```jsx
const ProtectedLayout = ({ children }) => {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-grow container mx-auto p-4'>{children}</main>
      <Footer />
    </div>
  )
}
```

### Updated: `ProtectedRoute` Component

**Location:** `/frontend/src/main.jsx`

The `ProtectedRoute` component now automatically wraps all protected content with `ProtectedLayout`:

```jsx
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = store.getState().auth.isAuthenticated

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return <ProtectedLayout>{children}</ProtectedLayout>
}
```

## Changes Made

### 1. Created `ProtectedLayout.jsx`

- New reusable layout component
- Handles responsive layout structure
- Uses Tailwind's flexbox utilities for proper spacing

### 2. Updated `main.jsx`

- Added import for `ProtectedLayout`
- Modified `ProtectedRoute` to wrap children with `ProtectedLayout`
- All protected routes now automatically get Header and Footer

### 3. Updated `App.jsx`

- Removed Header and Footer imports
- Removed layout wrapper div
- Now just returns `RecipeList` component
- Layout is handled by `ProtectedLayout`

### 4. Updated `RecipeForm.jsx`

- Removed Header and Footer imports
- Removed Header/Footer from loading state
- Removed Header/Footer from unauthorized state
- Removed Header/Footer from main return
- Simplified component structure

## Benefits

### 1. **DRY Principle (Don't Repeat Yourself)**

- Header and Footer defined once, used everywhere
- No need to import and add to each component
- Reduces code duplication

### 2. **Consistency**

- All protected pages have identical layout structure
- Prevents layout inconsistencies
- Easier to maintain uniform spacing and styling

### 3. **Easier Maintenance**

- Changes to layout structure only need to be made in one place
- Adding new protected pages doesn't require layout setup
- Reduces potential for bugs

### 4. **Better Separation of Concerns**

- Page components focus on their specific functionality
- Layout concerns handled at routing level
- Cleaner component code

### 5. **Scalability**

- Easy to add new protected routes
- Can create different layouts for different route groups (e.g., AdminLayout, UserLayout)
- Future-proof architecture

## How It Works

### For Protected Pages:

1. User navigates to a protected route (e.g., `/recipes/new`)
2. `ProtectedRoute` checks authentication
3. If authenticated, wraps the page component with `ProtectedLayout`
4. `ProtectedLayout` renders: Header → Page Content → Footer
5. User sees consistent layout across all pages

### For Public Pages (Login/Register):

1. User navigates to public route (e.g., `/login`)
2. `PublicRoute` component handles the route
3. No layout wrapper applied
4. Login/Register pages render with their own styling

## Protected Pages Using Global Layout

All these pages automatically get Header and Footer:

- ✅ Home page (`/`) - Recipe List
- ✅ Recipe Detail (`/recipes/:id`)
- ✅ Create Recipe (`/recipes/new`)
- ✅ Edit Recipe (`/recipes/:id/edit`)

## Public Pages (No Layout)

These pages remain without Header/Footer:

- Login (`/login`)
- Register (`/register`)

## Future Enhancements

### Potential additions to ProtectedLayout:

1. **Breadcrumbs** - Show navigation path
2. **Loading Indicator** - Global loading state
3. **Notifications** - Toast messages
4. **Scroll to Top** - Auto-scroll on route change
5. **Analytics** - Page view tracking

### Alternative Layouts:

```jsx
// Example: Admin layout with sidebar
const AdminLayout = ({ children }) => (
  <div className='flex min-h-screen'>
    <Sidebar />
    <div className='flex-1 flex flex-col'>
      <Header />
      <main className='flex-grow'>{children}</main>
      <Footer />
    </div>
  </div>
)
```

## Testing Checklist

- [ ] Verify all protected pages show Header and Footer
- [ ] Test responsive layout on mobile devices
- [ ] Verify language switching works from all pages
- [ ] Test logout functionality from all pages
- [ ] Verify Login/Register pages don't have Header/Footer
- [ ] Test navigation between pages maintains layout
- [ ] Verify footer stays at bottom on short content pages
- [ ] Test loading and error states maintain layout

## Migration Notes

If you previously added Header/Footer manually to any component:

1. Remove Header/Footer imports
2. Remove Header/Footer from JSX
3. The layout will be automatically applied via `ProtectedRoute`

## Related Files

- `/frontend/src/components/ui/ProtectedLayout.jsx` - Main layout component
- `/frontend/src/components/ui/Header.jsx` - Header component
- `/frontend/src/components/ui/Footer.jsx` - Footer component
- `/frontend/src/main.jsx` - Routing configuration
- `/frontend/src/App.jsx` - Main app component (simplified)
- `/frontend/src/components/recipes/RecipeForm.jsx` - Cleaned up recipe form
