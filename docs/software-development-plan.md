# Software Development Plan for Family Recipes Web App

## 1. Project Overview

- **Goal**: Secure, invite-only web app for family recipes with role-based access, bilingual support, and specified features. Mobile-responsive PWA, open-source, GitHub-hosted with CI/CD.
- **Estimated Effort**: 4 weeks for MVP (solo dev):
  - Week 1: Setup & Backend basics.
  - Week 2: Frontend basics & integration.
  - Week 3: Features & testing.
  - Week 4: Polish, deploy, & launch.
- **Risks/Mitigations**: Tight timeline—use boilerplates (e.g., React starter). Data growth—PostgreSQL scales well on free tiers for small users.

## 2. High-Level Architecture

- **Frontend**: React app for UI, handling language switch, forms, and displays.
- **Backend**: Node.js/Express for APIs, auth, and business logic.
- **Database**: PostgreSQL for structured data (recipes, users, comments, favorites).
- **Storage**: Cloudinary (free) for images/videos.
- **Auth**: JWT with role-based middleware.
- **Diagram** (Text-based):

  ```text
  User (Mobile/Desktop) --> PWA Frontend (React + Tailwind + i18next)
                                |
                                v
  Backend API (Node.js/Express + JWT) <--> Database (PostgreSQL)
                                |
                                v
  File Storage (Cloudinary for images/videos)
  ```

- **Extensibility**: APIs designed with hooks for future AI (e.g., endpoint for suggestions).

## 3. Technology Stack

- **Frontend**: React.js (v18+), Create React App or Vite for setup. Tailwind CSS for responsive design (mobile-first, breakpoints for phones/tablets). i18next for bilingual UI. Axios for API calls. React Hook Form for forms. Redux Toolkit for state (users, recipes).
- **Backend**: Node.js (v20+), Express.js. Sequelize ORM for PostgreSQL. Passport.js + JWT for auth. Multer for file uploads to Cloudinary.
- **Database**: PostgreSQL (schema: users, recipes, comments, favorites tables). Dual language fields (e.g., title_en, title_es).
- **Other Libraries**:
  - Search: PostgreSQL full-text search for keywords/ingredients/categories.
  - Sharing: html2pdf.js (client-side PDF), email via Nodemailer (free SMTP like Gmail).
  - PWA: Workbox or CRA's service worker.
  - Testing: Jest (unit), Supertest (API), React Testing Library (UI).
  - CI/CD: GitHub Actions.
- **All open-source/free**.

## 4. Data Model (PostgreSQL Schema Outline)

- **Users Table**: id, email, password_hash, role (enum: 'admin', 'editor', 'viewer'), invited_by, language_pref.
- **Recipes Table**: id, user_id (owner), title_en, title_es, ingredients_en (JSON array), ingredients_es (JSON), instructions_en (text), instructions_es, prep_time, cook_time, servings, tags (array), categories (array), created_at.
- **Comments Table**: id, recipe_id, user_id, comment_text, created_at.
- **Favorites Table**: id, recipe_id, user_id.
- **Media Table** (optional): id, recipe_id, url (Cloudinary), type (image/video).

## 5. Development Phases

Use Agile: Daily commits, weekly reviews. Track progress in GitHub Issues.

- **Phase 1: Setup and Repo Creation (Days 1-3)**

  - Create new GitHub repo: `family-recipes-app` (private for security).
  - Structure: `/frontend` (React), `/backend` (Node.js), `/docs` (for this plan).
  - Setup monorepo with npm workspaces or separate repos if preferred.
  - Install deps: `npm init`, add packages (express, sequelize, etc.).
  - Configure env vars: `.env` for DB URL, JWT secret, Cloudinary keys.
  - Init CI/CD: GitHub Actions workflow for lint/test/build on push/PR.
  - Setup Vercel: Link repo, configure for full-stack (frontend + API).

- **Phase 2: Backend Development (Days 4-10)**

  - Setup Express server, connect to PostgreSQL (use Vercel's Postgres or free ElephantSQL).
  - Implement auth: Register (admin-only invites via email token?), login, JWT with roles.
  - API Endpoints:
    - Auth: /register (invite-only), /login, /invite (admin).
    - Recipes: /recipes (GET all/search, POST create, PUT update, DELETE).
      - Search: Query params for keywords/categories/ingredients (use Sequelize scopes).
    - Media: /upload (POST image/video to Cloudinary, return URL).
    - Comments: /comments (POST/GET per recipe).
    - Favorites: /favorites (POST/GET/DELETE per user/recipe).
    - Sharing: /share/email (POST recipe ID), /share/pdf (GET generates PDF).
  - Add middleware for role checks (e.g., editors can only edit own recipes).
  - Bilingual: APIs return data based on user's language_pref, or all fields for client handling.

- **Phase 3: Frontend Development (Days 11-17)**

  - Setup React app, integrate Tailwind.
  - Components: Login/Register, Dashboard (recipe list/search), RecipeForm (CRUD with dual lang fields), RecipeDetail (view, comments, favorites, share buttons), LanguageSwitcher.
  - Responsiveness: Tailwind classes (e.g., sm/md/lg breakpoints for phones/tablets).
  - PWA: Add manifest.json, service worker for offline recipe viewing.
  - Integrate APIs: Use Axios with interceptors for JWT.
  - File uploads: Drag-drop UI, send to backend.
  - Sharing: Buttons for print (window.print), PDF (html2pdf), email (link to mailto or API call).

- **Phase 4: Integration, Testing, and Security (Days 18-24)**

  - Full integration: Test auth flows, role restrictions.
  - Tests: 80% coverage—unit (components/logic), integration (APIs), e2e (manual or Cypress if time).
  - Security: Enable HTTPS on Vercel, validate inputs (Joi or Zod), rate-limit APIs.
  - Mobile testing: Chrome DevTools emulators for iOS/Android, real devices if available.
  - Bilingual testing: Switch languages, ensure recipe content displays correctly.

- **Phase 5: Deployment and CI/CD (Days 25-28)**

  - Environments: Preview (on PRs via Vercel), Production.
  - CI/CD Pipeline (GitHub Actions YAML):

    ```yaml
    name: CI/CD Pipeline
    on:
      push:
        branches: [main]
      pull_request:
      release:
        types: [published]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: actions/setup-node@v3
            with: { node-version: 20 }
          - run: npm ci --workspaces
          - run: npm test --workspaces
      deploy-preview:
        if: github.event_name == 'pull_request'
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - run: npm ci --workspaces
          - run: npm run build --workspaces
          # Deploy to Vercel preview (use Vercel CLI or action)
      deploy-prod:
        if: github.event_name == 'release'
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - run: npm ci --workspaces
          - run: npm run build --workspaces
          # Deploy to Vercel production
    ```

  - Launch: Deploy MVP, invite test users, monitor logs.

- **Phase 6: Post-Launch (Ongoing)**
  - Feedback loop: Add GitHub Issues for bugs/features.
  - Maintenance: Weekly backups (Vercel tools), updates.
  - Future: AI integration (e.g., via OpenAI API endpoint), native app (port React to React Native).

## 6. Best Practices and Tips for You

- **Version Control**: Commit often, use branches (feature/auth, etc.).
- **Tools**: VS Code for dev, Postman for API testing, DB management via pgAdmin.
- **Learning Resources**: If needed, official docs for React/Node/PostgreSQL.
- **Cost Monitoring**: Vercel free tier limits (5000 req/month)—fine for 15-30 users.
- **Accessibility**: Add ARIA labels, alt text for media.

This plan should get you to a functional MVP in 1 month. Start with the repo setup today! If you need code snippets (e.g., for auth middleware) or help with specific steps, ask.
