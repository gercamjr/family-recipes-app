const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

const getLanguageFields = (language = 'en') => {
  return {
    title: language === 'es' ? 'titleEs' : 'titleEn',
    ingredients: language === 'es' ? 'ingredientsEs' : 'ingredientsEn',
    instructions: language === 'es' ? 'instructionsEs' : 'instructionsEn',
  }
}

const formatRecipeResponse = (recipe, language = 'en') => {
  const langFields = getLanguageFields(language)

  return {
    id: recipe.id,
    title: recipe[langFields.title] || recipe.titleEn,
    ingredients: recipe[langFields.ingredients] || recipe.ingredientsEn,
    instructions: recipe[langFields.instructions] || recipe.instructionsEn,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags,
    categories: recipe.categories,
    isPublic: recipe.isPublic,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    author: recipe.author
      ? {
          id: recipe.author.id,
          email: recipe.author.email,
        }
      : null,
    media: recipe.media || [],
    commentsCount: recipe.comments ? recipe.comments.length : 0,
    favoritesCount: recipe.favorites ? recipe.favorites.length : 0,
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateInviteToken,
  getLanguageFields,
  formatRecipeResponse,
}
