# Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app/backend

# Copy package files
COPY package-lock.json ./package-lock.json
COPY backend/package.json ./package.json

# Copy Prisma schema and config
COPY backend/prisma ./prisma/
COPY backend/prisma.config.mjs ./

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY backend/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app/backend
USER nextjs

# Expose port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]