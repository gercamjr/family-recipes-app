const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Use DB_POSTGRES_PRISMA_URL (Neon) or DATABASE_URL (Local/Production Standard)
// This ensures the app connects to the correct DB in Vercel even if DATABASE_URL is not manually set
const connectionString =
  process.env.DATABASE_URL || process.env.DB_POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

module.exports = prisma
