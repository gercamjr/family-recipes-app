const { Sequelize } = require('sequelize')

// Create test database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
})

// Define models directly for testing (simplified versions)
const { DataTypes } = require('sequelize')

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    languagePref: {
      type: DataTypes.ENUM('en', 'es'),
      allowNull: false,
      defaultValue: 'en',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    inviteToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    inviteTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
  }
)

// Instance methods
User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.passwordHash
  delete values.inviteToken
  delete values.inviteTokenExpires
  return values
}

// Global test setup
beforeAll(async () => {
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.close()
})

// Make sequelize and models available globally for tests
global.sequelize = sequelize
global.User = User
