# Frontend Dockerfile for development
FROM node:20-alpine

# Set working directory for the entire monorepo
WORKDIR /app

# Copy root package files and workspace package.json files
COPY package.json ./
COPY package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all monorepo dependencies
# This installs dependencies for all workspaces (frontend, backend)
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ ./frontend/

# Set the working directory to the frontend app
WORKDIR /app/frontend

# Create and switch to a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port for the frontend development server
EXPOSE 5173

# Start the frontend development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
