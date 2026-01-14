#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the database to be ready
until pg_isready -h postgres -p 5432 -U "${POSTGRES_USER}"; do
  echo "Waiting for database..."
  sleep 2
done

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database
echo "Seeding the database..."
npm run db:seed

# Start the server
echo "Starting the server..."
exec npm run dev
