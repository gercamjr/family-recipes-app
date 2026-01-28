# Family Recipes App

A secure, invite-only web app for family recipes with role-based access control, bilingual support (English and Spanish), and mobile-responsive Progressive Web App (PWA) features.

## Features

- **Role-based Access**: Admin, Editor, and Viewer roles with appropriate permissions
- **Bilingual Support**: Full English and Spanish language support
- **Mobile-Responsive PWA**: Works offline and on all devices
- **Recipe Management**: Create, edit, search, and share recipes with ingredients, instructions, and media
- **Social Features**: Comments, favorites, and sharing via PDF or email
- **Secure Authentication**: JWT-based auth with invite-only registration

## Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, i18next, Redux Toolkit, React Router v6, React Hook Form
- **Backend**: Node.js 20+, Express.js, Prisma ORM, PostgreSQL, Passport.js + JWT
- **Validation**: Zod schemas
- **Storage**: Cloudinary for images/videos
- **Testing**: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- **PWA**: vite-plugin-pwa with Workbox
- **Deployment**: Vercel for full-stack hosting, GitHub Actions CI/CD

## Project Structure

```
family-recipes-app/
├── frontend/          # React PWA frontend
├── backend/           # Node.js/Express API
├── docker/            # Docker development environment ([docs](docker/README.md))
├── docs/              # Documentation and plans
└── package.json       # Monorepo configuration
```

## Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone https://github.com/gercamjr/family-recipes-app.git
   cd family-recipes-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your database URL, JWT secret, Cloudinary credentials, and email settings

4. **Set up the database**:

   ```bash
   # Generate Prisma client
   npx prisma generate --schema=backend/prisma/schema.prisma

   # Run migrations
   npx prisma migrate dev --schema=backend/prisma/schema.prisma

   # Seed the database (optional)
   npm run db:seed
   ```

5. **Run the development servers**:

   ```bash
   # Backend
   npm run dev --workspace=backend

   # Frontend
   npm run dev --workspace=frontend
   ```

### Alternative: Docker Development Environment

For a complete containerized development environment with PostgreSQL, see the [Docker documentation](docker/README.md).

```bash
# Start all services (PostgreSQL, backend, frontend)
npm run docker:up

# View logs
npm run docker:logs

# Run tests in Docker
npm run docker:test

# Stop services
npm run docker:down

# Reset database (caution: deletes all data)
npm run docker:db-reset
```

## Development Phases

- **Phase 1**: Setup and Repo Creation ✅
- **Phase 2**: Backend Development ✅
- **Phase 3**: Frontend Development ✅
- **Phase 4**: Integration, Testing, and Security ✅
- **Phase 5**: Deployment and CI/CD ✅
- **Phase 6**: Post-Launch (ongoing)

See `docs/software-development-plan.md` for detailed roadmap.

## Available Scripts

- `npm install` - Install all dependencies (monorepo)
- `npm test` - Run all tests
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run docker:up` - Start Docker development environment
- `npm run docker:down` - Stop Docker containers
- `npm run db:seed` - Seed the database with sample data

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Submit a pull request

## License

This project is open-source. See `LICENSE` for details.
