const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Media = sequelize.define(
  'Media',
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    type: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: true, // Cloudinary public ID for deletion
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'media',
    indexes: [
      {
        fields: ['recipe_id'],
      },
      {
        fields: ['recipe_id', 'order'],
      },
    ],
  }
)

module.exports = Media
