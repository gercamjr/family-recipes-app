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

- **Frontend**: React.js, Tailwind CSS, i18next, Redux Toolkit
- **Backend**: Node.js, Express.js, Sequelize ORM, PostgreSQL
- **Storage**: Cloudinary for images/videos
- **Deployment**: Vercel for full-stack hosting

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
   - Create a PostgreSQL database
   - Run migrations (to be implemented in Phase 2)

5. **Run the development servers**:

   ```bash
   # Backend
   npm run dev --workspace=backend

   # Frontend
   npm run dev --workspace=frontend
   ```

### Alternative: Docker Development Environment

For a complete containerized development environment with PostgreSQL, see the [Docker documentation](docker/README.md).

Quick Docker setup:

```bash
npm run docker:up
```

## Development Phases

- **Phase 1**: Setup and Repo Creation ✅ (Completed)
- **Phase 2**: Backend Development
- **Phase 3**: Frontend Development
- **Phase 4**: Integration, Testing, and Security
- **Phase 5**: Deployment and CI/CD
- **Phase 6**: Post-Launch

See `docs/software-development-plan.md` for detailed roadmap.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

This project is open-source. See `LICENSE` for details.
