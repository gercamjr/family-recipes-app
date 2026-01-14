# Project Overview

This is a full-stack web application for managing and sharing family recipes. It features a secure, invite-only system with role-based access control, bilingual support (English and Spanish), and a mobile-responsive Progressive Web App (PWA) design.

## Technologies

*   **Frontend:** React.js, Vite, Redux Toolkit, Tailwind CSS, i18next
*   **Backend:** Node.js, Express.js, Prisma ORM
*   **Database:** PostgreSQL
*   **Deployment:** Docker for development, Vercel for production

## Architecture

The project is structured as a monorepo with two main packages:

*   `frontend`: A React-based single-page application that provides the user interface.
*   `backend`: A Node.js/Express.js server that provides a RESTful API for the frontend.

The backend uses a PostgreSQL database with Prisma as the ORM to manage the application's data. The frontend is a modern React application built with Vite, using Redux Toolkit for state management and Tailwind CSS for styling.

# Building and Running

## Prerequisites

*   Node.js (>=20.0.0)
*   npm
*   Docker (optional, for development)

## Development

To run the application in a development environment, you can use the following commands:

```bash
# Install dependencies
npm install

# Run the backend server
npm run dev --workspace=backend

# Run the frontend development server
npm run dev --workspace=frontend
```

Alternatively, you can use Docker to run the entire application in a containerized environment:

```bash
# Start all services (backend, frontend, database)
docker compose up

# Stop all services
docker compose down
```

## Building for Production

To build the application for production, you can use the following command:

```bash
npm run build --workspaces
```

This will create a production-ready build of the frontend application in the `frontend/dist` directory.

## Testing

To run the tests for both the frontend and backend, you can use the following command:

```bash
npm test --workspaces
```

# Development Conventions

## Code Style

The project uses ESLint to enforce a consistent code style. You can run the linter with the following command:

```bash
npm run lint --workspaces
```

## Testing

The backend uses Jest for unit and integration testing, while the frontend uses Vitest. Test files are located in the `__tests__` directories of their respective packages.

## Continuous Integration

The project has a CI/CD pipeline configured in `.github/workflows/ci.yml`. This pipeline runs on every pull request to the `main` branch and executes the following checks:

*   Installs dependencies
*   Runs tests
*   Lints the code
