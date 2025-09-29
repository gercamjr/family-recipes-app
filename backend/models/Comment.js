const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Comment = sequelize.define(
  'Comment',
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
    commentText: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000], // Max 1000 characters
      },
    },
  },
  {
    tableName: 'comments',
    indexes: [
      {
        fields: ['recipe_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
)

module.exports = Comment
