const { Sequelize } = require('sequelize')

// Create test database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'family_recipes_db',
  username: process.env.POSTGRES_USER || 'family_recipes_user',
  password: process.env.POSTGRES_PASSWORD || 'Family!$042288',
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
    timestamps: true,
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

const Recipe = sequelize.define(
  'Recipe',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    titleEn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    titleEs: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ingredientsEn: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Ingredients must be an array')
          }
        },
      },
    },
    ingredientsEs: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Ingredients must be an array')
          }
        },
      },
    },
    instructionsEn: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    instructionsEs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prepTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cookTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    servings: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags')
        return rawValue ? JSON.parse(rawValue) : []
      },
      set(val) {
        this.setDataValue('tags', JSON.stringify(val || []))
      },
    },
    categories: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('categories')
        return rawValue ? JSON.parse(rawValue) : []
      },
      set(val) {
        this.setDataValue('categories', JSON.stringify(val || []))
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'recipes',
    timestamps: true,
  }
)

// Add scopes
Recipe.addScope('search', (query, language = 'en') => {
  const whereClause = {}

  if (query) {
    const searchFields =
      language === 'es'
        ? ['titleEs', 'ingredientsEs', 'instructionsEs', 'tags', 'categories']
        : ['titleEn', 'ingredientsEn', 'instructionsEn', 'tags', 'categories']

    whereClause[sequelize.Sequelize.Op.or] = searchFields.map((field) => ({
      [field]: {
        [sequelize.Sequelize.Op.iLike]: `%${query}%`,
      },
    }))
  }

  return {
    where: {
      ...whereClause,
      isPublic: true,
    },
  }
})

Recipe.addScope('userRecipes', (userId) => ({
  where: { userId },
}))

// Global test setup
beforeAll(async () => {
  // Drop all tables to ensure clean state
  await sequelize.drop()
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.close()
})

// Make sequelize and models available globally for tests
global.sequelize = sequelize
global.User = User
global.Recipe = Recipe
