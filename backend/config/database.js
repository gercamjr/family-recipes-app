const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : 'sqlite::memory:', // Use SQLite for development
  {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: false,
    },
  }
)

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}

module.exports = { sequelize, testConnection }
