const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Prefer Neon/Vercel-specific URLs first to avoid connecting to the wrong DB when multiple vars are set:
// 1) DB_POSTGRES_PRISMA_URL (Neon)  2) POSTGRES_PRISMA_URL (fallback)  3) DATABASE_URL (local/standard)
const connectionString =
  process.env.DB_POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'No database connection string found. Please set one of the following environment variables: ' +
    'DB_POSTGRES_PRISMA_URL, POSTGRES_PRISMA_URL, or DATABASE_URL'
  )
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

module.exports = prisma
