const { sequelize } = require('../config/database')
const User = require('./User')
const Recipe = require('./Recipe')
const Comment = require('./Comment')
const Favorite = require('./Favorite')
const Media = require('./Media')

// Define associations
User.hasMany(Recipe, { foreignKey: 'userId', as: 'recipes' })
Recipe.belongsTo(User, { foreignKey: 'userId', as: 'author' })

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' })
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' })

Recipe.hasMany(Comment, { foreignKey: 'recipeId', as: 'comments' })
Comment.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' })

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' })
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Recipe.hasMany(Favorite, { foreignKey: 'recipeId', as: 'favorites' })
Favorite.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' })

Recipe.hasMany(Media, { foreignKey: 'recipeId', as: 'media' })
Media.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' })

// Self-referencing for invites
User.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' })
User.hasMany(User, { foreignKey: 'invitedBy', as: 'invitees' })

module.exports = {
  sequelize,
  User,
  Recipe,
  Comment,
  Favorite,
  Media,
}
