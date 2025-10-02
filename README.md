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

This project uses branch protection rules to ensure code quality. All changes to the `main` branch must be made through pull requests that pass automated tests.

### Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit them
3. Run tests locally: `npm test`
4. Push your branch: `git push origin feature/your-feature-name`
5. Create a pull request on GitHub
6. Wait for CI/CD checks to pass (tests and build)
7. Request review from team members
8. Once approved and all checks pass, merge the PR

### Branch Protection

The `main` branch is protected and requires:
- ✅ All CI/CD checks to pass
- ✅ Code review approval
- ✅ Pull request workflow (no direct pushes)

For detailed information about branch protection setup and workflow, see [Branch Protection Guide](.github/BRANCH_PROTECTION.md).

## License

This project is open-source. See `LICENSE` for details.
