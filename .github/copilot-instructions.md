# GitHub Copilot Instructions for Family Recipes App

## Project Overview

This is a secure, invite-only web app for family recipes. It features role-based access control, bilingual support (English and Spanish), and is built as a mobile-responsive Progressive Web App (PWA). The app is open-source, hosted on GitHub, and uses CI/CD for deployment.

## Technology Stack

- **Frontend**: React.js (v18+), Vite build tool, Tailwind CSS for responsive design, i18next for internationalization, Axios for API calls, React Hook Form for forms, Redux Toolkit for state management, React Router v6 for routing.
- **Backend**: Node.js (>=20.19.0), Express.js, Prisma ORM for PostgreSQL, Passport.js + JWT for authentication, Multer for file uploads, Zod for schema validation, bcryptjs for password hashing, Nodemailer for emails.
- **Database**: PostgreSQL with Prisma models for User, Recipe, Comment, Favorite, and Media (see `prisma/schema.prisma`).
- **Storage**: Cloudinary for images and videos.
- **Security**: Helmet for HTTP headers, express-rate-limit for rate limiting.
- **PWA**: vite-plugin-pwa with Workbox for service worker generation and offline capabilities.
- **Other**: Full-text search in PostgreSQL, sharing via PDF (html2pdf.js) and email.
- **Monorepo**: npm workspaces with `frontend/` and `backend/` as separate packages.
- **Docker**: Docker Compose setup for local development (`docker-compose.yml`).

## Coding Standards and Best Practices

- Use functional components and hooks in React.
- Follow mobile-first responsive design with Tailwind CSS breakpoints (sm, md, lg).
- Implement bilingual support: Use i18next for UI text; store dual language fields in database (e.g., title_en, title_es).
- Authentication: Use JWT with role-based middleware (roles: admin, editor, viewer).
- API Design: RESTful endpoints with proper error handling and validation.
- Testing: Backend uses Jest + Supertest; Frontend uses Vitest + React Testing Library.
- Security: Validate inputs with Zod schemas, use HTTPS, apply Helmet middleware, rate-limit APIs with express-rate-limit.
- Version Control: Commit often, use feature branches, follow Agile practices.

## Project-Specific Guidelines

- **Data Model**: Prisma schema defines dual language fields for recipes (titleEn/titleEs, ingredientsEn/ingredientsEs, instructionsEn/instructionsEs). Use JSON arrays for ingredients and String arrays for tags/categories. See `backend/prisma/schema.prisma`.
- **Auth Flow**: Invite-only registration; admins can send invites via email tokens.
- **Features**: Implement search by keywords/ingredients/categories, favorites, comments, sharing (PDF/email), file uploads to Cloudinary.
- **PWA**: Uses vite-plugin-pwa for automatic manifest and service worker generation. Configure in `vite.config.js`.
- **Extensibility**: Design APIs with hooks for future AI integration.
- **Accessibility**: Add ARIA labels and alt text for images.
- **Deployment**: Use Vercel for hosting (see `vercel.json`); CI/CD via GitHub Actions (see `.github/workflows/ci.yml`).

## Examples

- When creating a recipe component, include fields for both languages and handle state with Redux Toolkit slices.
- For API endpoints, use Prisma queries with proper filtering and relations for search functionality.
- Always handle loading states and errors in UI components.
- Use Zod schemas in `backend/utils/validation.js` for request validation.
- Run `npm run docker:up` for local development with Docker.

## Additional Tips

- Prefer open-source and free libraries.
- Monitor costs on free tiers (e.g., Vercel, Cloudinary).
- If unsure, refer to official documentation for React, Prisma, Node.js, PostgreSQL, etc.
- Use `npx prisma studio` to visually inspect and edit database data.
- Project has custom Copilot skills in `.github/skills/` for React best practices and web design guidelines.</content>
  <parameter name="filePath">/Users/gerardo-dev/Development/family-recipes-app/family-recipes-app/.github/copilot-instructions.md
