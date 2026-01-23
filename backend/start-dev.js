#!/usr/bin/env node

/**
 * Development startup script for Family Recipes Backend
 *
 * This script automatically seeds the database with sample data
 * if no users exist, then starts the development server.
 */

const { spawn } = require('child_process')
const prisma = require('./lib/prisma')

async function checkNeedsSeeding() {
  try {
    const userCount = await prisma.user.count()
    return userCount === 0
  } catch (error) {
    // If there's an error (like table doesn't exist), we need to seed
    console.log('Database tables not found or error checking user count, will seed:', error.message)
    return true
  } finally {
    await prisma.$disconnect()
  }
}

async function runMigrate() {
  console.log('🔄 Running database migrations...')

  return new Promise((resolve, reject) => {
    const migrateProcess = spawn('npx', ['prisma', 'migrate', 'dev'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    migrateProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database migrations completed')
        resolve()
      } else {
        console.error('❌ Database migrations failed')
        reject(new Error(`Migrate script exited with code ${code}`))
      }
    })

    migrateProcess.on('error', (error) => {
      console.error('❌ Error running migrate script:', error)
      reject(error)
    })
  })
}

async function runSeed() {
  console.log('🌱 Database appears empty, running seed script...')

  return new Promise((resolve, reject) => {
    const seedProcess = spawn('node', ['prisma/seed.js'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    seedProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database seeding completed')
        resolve()
      } else {
        console.error('❌ Database seeding failed')
        reject(new Error(`Seed script exited with code ${code}`))
      }
    })

    seedProcess.on('error', (error) => {
      console.error('❌ Error running seed script:', error)
      reject(error)
    })
  })
}

async function startDevServer() {
  console.log('🚀 Starting development server...')

  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  devProcess.on('close', (code) => {
    console.log(`Development server exited with code ${code}`)
    process.exit(code)
  })

  devProcess.on('error', (error) => {
    console.error('Error starting development server:', error)
    process.exit(1)
  })
}

async function main() {
  try {
    // Wait a bit for database to be ready
    console.log('⏳ Checking database status...')
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Run migrations first
    await runMigrate()

    const needsSeeding = await checkNeedsSeeding()

    if (needsSeeding) {
      await runSeed()
    } else {
      console.log('✅ Database already has data, skipping seed')
    }

    // Start the development server
    await startDevServer()
  } catch (error) {
    console.error('❌ Startup script failed:', error)
    process.exit(1)
  }
}

main()
