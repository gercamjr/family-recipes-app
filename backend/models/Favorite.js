const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Favorite = sequelize.define(
  'Favorite',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Recipes',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    tableName: 'favorites',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'recipe_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['recipe_id'],
      },
    ],
  }
)

module.exports = Favorite
