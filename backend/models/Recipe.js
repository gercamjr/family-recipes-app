const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

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
      references: {
        model: 'Users',
        key: 'id',
      },
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
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    cookTime: {
      type: DataTypes.INTEGER, // in minutes
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
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['is_public'],
      },
      {
        fields: ['tags'],
      },
      {
        fields: ['categories'],
      },
    ],
  }
)

// Scopes for search functionality
Recipe.addScope('search', (query, language = 'en') => {
  const whereClause = {}

  if (query) {
    const searchFields =
      language === 'es'
        ? ['title_es', 'ingredients_es', 'instructions_es', 'tags', 'categories']
        : ['title_en', 'ingredients_en', 'instructions_en', 'tags', 'categories']

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

module.exports = Recipe
