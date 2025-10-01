# Frontend Dockerfile for development
FROM node:20-alpine

# Set working directory
WORKDIR /app/frontend

# Copy package files
COPY package-lock.json ./package-lock.json
COPY frontend/package.json ./package.json

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app/frontend
USER nextjs

# Expose port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]