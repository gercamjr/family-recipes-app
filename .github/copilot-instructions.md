# GitHub Copilot Instructions for Family Recipes App

## Project Overview

This is a secure, invite-only web app for family recipes. It features role-based access control, bilingual support (English and Spanish), and is built as a mobile-responsive Progressive Web App (PWA). The app is open-source, hosted on GitHub, and uses CI/CD for deployment.

## Technology Stack

- **Frontend**: React.js (v18+), Tailwind CSS for responsive design, i18next for internationalization, Axios for API calls, React Hook Form for forms, Redux Toolkit for state management.
- **Backend**: Node.js (v20+), Express.js, Sequelize ORM for PostgreSQL, Passport.js + JWT for authentication, Multer for file uploads.
- **Database**: PostgreSQL with tables for users, recipes, comments, favorites, and media.
- **Storage**: Cloudinary for images and videos.
- **Other**: PWA with service worker, full-text search in PostgreSQL, sharing via PDF and email.

## Coding Standards and Best Practices

- Use functional components and hooks in React.
- Follow mobile-first responsive design with Tailwind CSS breakpoints (sm, md, lg).
- Implement bilingual support: Use i18next for UI text; store dual language fields in database (e.g., title_en, title_es).
- Authentication: Use JWT with role-based middleware (roles: admin, editor, viewer).
- API Design: RESTful endpoints with proper error handling and validation.
- Testing: Write unit tests with Jest, integration tests with Supertest, UI tests with React Testing Library.
- Security: Validate inputs, use HTTPS, rate-limit APIs.
- Version Control: Commit often, use feature branches, follow Agile practices.

## Project-Specific Guidelines

- **Data Model**: Ensure dual language fields for recipes (title, ingredients, instructions). Use JSON arrays for ingredients and arrays for tags/categories.
- **Auth Flow**: Invite-only registration; admins can send invites via email tokens.
- **Features**: Implement search by keywords/ingredients/categories, favorites, comments, sharing (PDF/email), file uploads to Cloudinary.
- **PWA**: Include manifest.json and service worker for offline capabilities.
- **Extensibility**: Design APIs with hooks for future AI integration.
- **Accessibility**: Add ARIA labels and alt text for images.
- **Deployment**: Use Vercel for hosting; CI/CD via GitHub Actions.

## Examples

- When creating a recipe component, include fields for both languages and handle state with Redux.
- For API endpoints, use Sequelize scopes for search functionality.
- Always handle loading states and errors in UI components.

## Additional Tips

- Prefer open-source and free libraries.
- Monitor costs on free tiers (e.g., Vercel, Cloudinary).
- If unsure, refer to official documentation for React, Node.js, PostgreSQL, etc.</content>
  <parameter name="filePath">/Users/gerardo-dev/Development/family-recipes-app/family-recipes-app/.github/copilot-instructions.md
