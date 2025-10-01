# Family Recipes App - Docker Development Environment

This Docker setup provides a complete local development environment for the Family Recipes App with PostgreSQL database, Node.js backend, and React frontend.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Clone the repository and navigate to the project root**

   ```bash
   git clone <repository-url>
   cd family-recipes-app
   ```

2. **Start the development environment**

   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be ready** (PostgreSQL health check will ensure database is ready before starting the backend)

4. **Access the applications**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - PostgreSQL: localhost:5432 (postgres/postgres)

## Services

### PostgreSQL Database

- **Image**: postgres:15-alpine
- **Database**: family_recipes_dev
- **Credentials**: postgres/postgres
- **Port**: 5432
- **Volume**: postgres_data (persistent data)
- **Initialization**: Creates tables, indexes, and sample data

### Backend API

- **Port**: 5001
- **Environment**: Development
- **Auto-restart**: On code changes
- **Dependencies**: Waits for PostgreSQL to be healthy

### Frontend (Development)

- **Port**: 5173
- **Hot reload**: Enabled
- **Environment**: Development with API proxy

## Database Schema

The PostgreSQL database includes the following tables:

- **users**: User accounts with roles and preferences
- **recipes**: Recipe storage with bilingual support
- **comments**: Recipe comments
- **favorites**: User recipe favorites
- **media**: Recipe media files (Cloudinary URLs)

### Default Admin User

- **Email**: admin@familyrecipes.com
- **Password**: admin123
- **Role**: admin

## Development Workflow

### Starting Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up backend
docker-compose up frontend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ destroys database data)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Running Commands

```bash
# Run backend tests
docker-compose exec backend npm test

# Run backend shell
docker-compose exec backend sh

# Run database queries
docker-compose exec postgres psql -U postgres -d family_recipes_dev
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d family_recipes_dev

# View tables
\d

# View sample data
SELECT * FROM users;
SELECT * FROM recipes LIMIT 5;
```

## Environment Variables

### Local Development

Create `.env` files in the respective directories:

#### Backend (.env)

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/family_recipes_dev
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_APP_NAME=Family Recipes App
VITE_DEFAULT_LANGUAGE=en
```

#### PostgreSQL (.env) - Optional

```env
POSTGRES_DB=family_recipes_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
```

### Production (Vercel)

Set these environment variables in your Vercel dashboard:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `NODE_ENV`: production
- `PORT`: 5001 (or Vercel-assigned port)

## Usage

### Development

```bash
# Start with local .env files
docker-compose up -d

# Or use the dev override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production

```bash
# Use production compose (for local testing with prod-like setup)
docker-compose -f docker-compose.prod.yml up -d
```

### Using Makefile

```bash
make up          # Start development environment
make down        # Stop all services
make logs        # View logs
make test        # Run tests
make db-connect  # Connect to database
```

### Troubleshooting

### Services Won't Start

1. Check if ports 5432, 5001, 5173 are available
2. Ensure Docker daemon is running
3. Check logs: `docker-compose logs`

### Database Connection Issues

1. Wait for PostgreSQL health check to pass
2. Verify DATABASE_URL in backend environment
3. Check PostgreSQL logs: `docker-compose logs postgres`

### Frontend Can't Connect to Backend

1. Ensure backend is running on port 5001
2. Check VITE_API_BASE_URL in frontend environment
3. Verify CORS settings in backend

### Performance Issues

- Ensure sufficient RAM allocation for Docker
- Use Docker Desktop settings to increase resources
- Consider using lighter base images for development

## Production Deployment

This Docker setup is for development only. For production:

1. Use separate Docker Compose files for different environments
2. Implement proper secrets management
3. Use production-optimized images
4. Configure reverse proxy (nginx)
5. Set up proper logging and monitoring
6. Use managed database services (Vercel Postgres, etc.)

## File Structure

```
family-recipes-app/
├── docker-compose.yml          # Main Docker Compose configuration
├── docker/
│   └── postgres/
│       └── init.sql           # Database initialization script
├── backend/
│   ├── Dockerfile             # Backend container configuration
│   ├── .dockerignore          # Files to exclude from build
│   └── ...                    # Backend source code
├── frontend/
│   ├── Dockerfile             # Frontend container configuration
│   ├── .dockerignore          # Files to exclude from build
│   └── ...                    # Frontend source code
└── docs/
    └── software-development-plan.md
```
