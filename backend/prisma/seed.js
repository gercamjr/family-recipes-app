/**
 * Database Seed Script for Family Recipes App
 *
 * This script populates the development database with sample data including:
 * - Admin user: admin@familyrecipes.com / admin123
 * - Regular user: user@familyrecipes.com / user123
 * - 4 sample recipes with bilingual content (English/Spanish)
 *
 * Usage:
 * - From backend directory: npm run db:seed
 * - From project root: npm run db:seed
 *
 * Note: This script uses upsert operations, so it can be run multiple times safely.
 */

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const { hashPassword } = require('../utils/auth')
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })

const connectionString =
  process.env.DB_POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['info', 'warn', 'error'],
})

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@familyrecipes.com' },
    update: {},
    create: {
      email: 'admin@familyrecipes.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
      languagePref: 'en',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create regular user
  const userPassword = await hashPassword('user123')
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@familyrecipes.com' },
    update: {},
    create: {
      email: 'user@familyrecipes.com',
      name: 'Recipe Editor',
      passwordHash: userPassword,
      role: 'editor',
      languagePref: 'en',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ Regular user created:', regularUser.email)

  // Create sample recipes
  const recipes = [
    {
      titleEn: 'Classic Chocolate Chip Cookies',
      titleEs: 'Galletas Clásicas de Chispas de Chocolate',
      ingredientsEn: [
        '2 ¼ cups all-purpose flour',
        '1 teaspoon baking soda',
        '1 teaspoon salt',
        '1 cup unsalted butter, softened',
        '¾ cup granulated sugar',
        '¾ cup packed brown sugar',
        '1 teaspoon vanilla extract',
        '2 large eggs',
        '2 cups chocolate chips',
      ],
      ingredientsEs: [
        '2 ¼ tazas de harina para todo uso',
        '1 cucharadita de bicarbonato de sodio',
        '1 cucharadita de sal',
        '1 taza de mantequilla sin sal, ablandada',
        '¾ taza de azúcar granulada',
        '¾ taza de azúcar morena compacta',
        '1 cucharadita de extracto de vainilla',
        '2 huevos grandes',
        '2 tazas de chispas de chocolate',
      ],
      instructionsEn: `Preheat oven to 375°F (190°C). In a bowl, combine flour, baking soda, and salt. In another bowl, cream butter and sugars until light and fluffy. Beat in vanilla and eggs. Gradually blend in flour mixture. Stir in chocolate chips. Drop rounded tablespoons onto ungreased cookie sheets. Bake 9-11 minutes or until golden brown.`,
      instructionsEs: `Precaliente el horno a 375°F (190°C). En un bowl, combine harina, bicarbonato de sodio y sal. En otro bowl, bata la mantequilla y azúcares hasta que estén ligeros y esponjosos. Agregue vainilla y huevos. Incorpore gradualmente la mezcla de harina. Agregue las chispas de chocolate. Coloque cucharadas redondeadas en bandejas para galletas sin engrasar. Hornee 9-11 minutos o hasta que estén doradas.`,
      prepTime: 15,
      cookTime: 11,
      servings: 24,
      tags: ['dessert', 'cookies', 'chocolate', 'baking'],
      categories: ['dessert', 'american'],
      isPublic: true,
      authorId: admin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      titleEn: 'Spanish Tortilla (Tortilla Española)',
      titleEs: 'Tortilla Española',
      ingredientsEn: [
        '4 large potatoes, peeled and thinly sliced',
        '1 large onion, thinly sliced',
        '6 large eggs',
        '½ cup olive oil',
        'Salt to taste',
      ],
      ingredientsEs: [
        '4 papas grandes, peladas y cortadas en rodajas finas',
        '1 cebolla grande, cortada en rodajas finas',
        '6 huevos grandes',
        '½ taza de aceite de oliva',
        'Sal al gusto',
      ],
      instructionsEn: `Heat olive oil in a large non-stick skillet over medium heat. Add potatoes and onions, season with salt. Cook slowly for 20-25 minutes, stirring occasionally, until potatoes are tender but not browned. Beat eggs in a large bowl with salt. Drain potatoes and onions, add to eggs, and let sit for 5 minutes. Remove excess oil from skillet, leaving about 2 tablespoons. Add egg mixture and cook over medium-low heat for 8-10 minutes until edges are set. Place a large plate over the skillet and carefully flip the tortilla. Slide back into skillet and cook for another 3-5 minutes until fully set.`,
      instructionsEs: `Caliente el aceite de oliva en una sartén grande antiadherente a fuego medio. Agregue papas y cebollas, sazone con sal. Cocine lentamente por 20-25 minutos, revolviendo ocasionalmente, hasta que las papas estén tiernas pero no doradas. Bata los huevos en un bowl grande con sal. Escurra las papas y cebollas, agregue a los huevos, y deje reposar 5 minutos. Remueva el exceso de aceite de la sartén, dejando unas 2 cucharadas. Agregue la mezcla de huevos y cocine a fuego medio-bajo por 8-10 minutos hasta que los bordes estén cuajados. Coloque un plato grande sobre la sartén y voltee cuidadosamente la tortilla. Deslice de vuelta a la sartén y cocine por otros 3-5 minutos hasta que esté completamente cuajada.`,
      prepTime: 20,
      cookTime: 30,
      servings: 6,
      tags: ['spanish', 'potatoes', 'eggs', 'traditional'],
      categories: ['main course', 'spanish'],
      isPublic: true,
      authorId: regularUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      titleEn: 'Homemade Margherita Pizza',
      titleEs: 'Pizza Margherita Casera',
      ingredientsEn: [
        '1 pound pizza dough',
        '½ cup pizza sauce',
        '8 oz fresh mozzarella, sliced',
        'Fresh basil leaves',
        '2 tablespoons olive oil',
        'Salt and pepper to taste',
      ],
      ingredientsEs: [
        '450g de masa para pizza',
        '½ taza de salsa para pizza',
        '225g de mozzarella fresca, en rodajas',
        'Hojas de albahaca fresca',
        '2 cucharadas de aceite de oliva',
        'Sal y pimienta al gusto',
      ],
      instructionsEn: `Preheat oven to 475°F (245°C) with a pizza stone if available. Roll out pizza dough on a floured surface to desired thickness. Transfer to a pizza peel or baking sheet. Spread pizza sauce evenly, leaving a border for the crust. Add mozzarella slices and fresh basil. Drizzle with olive oil and season with salt and pepper. Bake for 12-15 minutes until crust is golden and cheese is bubbly.`,
      instructionsEs: `Precaliente el horno a 475°F (245°C) con una piedra para pizza si está disponible. Extienda la masa para pizza en una superficie enharinada al grosor deseado. Transfiera a una pala para pizza o bandeja para hornear. Extienda la salsa para pizza uniformemente, dejando un borde para la corteza. Agregue las rodajas de mozzarella y la albahaca fresca. Rocíe con aceite de oliva y sazone con sal y pimienta. Hornee por 12-15 minutos hasta que la corteza esté dorada y el queso burbujeante.`,
      prepTime: 15,
      cookTime: 15,
      servings: 4,
      tags: ['pizza', 'italian', 'cheese', 'homemade'],
      categories: ['main course', 'italian'],
      isPublic: true,
      authorId: admin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      titleEn: 'Chicken Tikka Masala',
      titleEs: 'Pollo Tikka Masala',
      ingredientsEn: [
        '1.5 lbs chicken breast, cubed',
        '1 cup plain yogurt',
        '2 tablespoons lemon juice',
        '2 teaspoons cumin',
        '2 teaspoons paprika',
        '1 teaspoon turmeric',
        '1 teaspoon garam masala',
        '4 cloves garlic, minced',
        '1 inch ginger, grated',
        '2 tablespoons vegetable oil',
        '1 large onion, diced',
        '1 can (14 oz) crushed tomatoes',
        '1 cup heavy cream',
        'Salt to taste',
        'Fresh cilantro for garnish',
      ],
      ingredientsEs: [
        '680g de pechuga de pollo, en cubos',
        '1 taza de yogur natural',
        '2 cucharadas de jugo de limón',
        '2 cucharaditas de comino',
        '2 cucharaditas de paprika',
        '1 cucharadita de cúrcuma',
        '1 cucharadita de garam masala',
        '4 dientes de ajo, picados',
        '2.5cm de jengibre, rallado',
        '2 cucharadas de aceite vegetal',
        '1 cebolla grande, picada',
        '1 lata (400g) de tomates triturados',
        '1 taza de crema espesa',
        'Sal al gusto',
        'Cilantro fresco para decorar',
      ],
      instructionsEn: `Marinate chicken in yogurt, lemon juice, and spices for at least 1 hour. Heat oil in a large pan and cook marinated chicken until browned. Remove chicken and set aside. In the same pan, sauté onion until soft. Add garlic and ginger, cook for 1 minute. Add crushed tomatoes and simmer for 10 minutes. Stir in cream and return chicken to the pan. Simmer for another 10-15 minutes. Season with salt and garnish with cilantro.`,
      instructionsEs: `Marine el pollo en yogur, jugo de limón y especias por al menos 1 hora. Caliente aceite en una sartén grande y cocine el pollo marinado hasta que esté dorado. Retire el pollo y reserve. En la misma sartén, saltee la cebolla hasta que esté suave. Agregue ajo y jengibre, cocine por 1 minuto. Agregue los tomates triturados y deje hervir a fuego lento por 10 minutos. Incorpore la crema y regrese el pollo a la sartén. Deje hervir a fuego lento por otros 10-15 minutos. Sazone con sal y decore con cilantro.`,
      prepTime: 20,
      cookTime: 35,
      servings: 4,
      tags: ['chicken', 'indian', 'curry', 'spicy'],
      categories: ['main course', 'indian'],
      isPublic: true,
      authorId: regularUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const createdRecipes = []
  for (const recipeData of recipes) {
    const recipe = await prisma.recipe.create({
      data: recipeData,
    })
    console.log('✅ Recipe created:', recipe.titleEn)
    createdRecipes.push(recipe)
  }

  // Seed RecipeImages with OCR results and processing logs
  const sampleImages = [
    {
      filename: 'chocolate-cake-recipe.jpg',
      originalUrl: 'https://res.cloudinary.com/sample/image/upload/family-recipes/ocr/chocolate-cake-recipe.jpg',
      cloudinaryPublicId: 'family-recipes/ocr/chocolate-cake-recipe',
      mimeType: 'image/jpeg',
      size: 204800,
      status: 'completed',
      recipeId: createdRecipes[0].id,
      userId: admin.id,
    },
    {
      filename: 'tortilla-recipe.jpg',
      originalUrl: 'https://res.cloudinary.com/sample/image/upload/family-recipes/ocr/tortilla-recipe.jpg',
      cloudinaryPublicId: 'family-recipes/ocr/tortilla-recipe',
      mimeType: 'image/jpeg',
      size: 153600,
      status: 'completed',
      recipeId: createdRecipes[1].id,
      userId: regularUser.id,
    },
    {
      filename: 'pending-upload.png',
      originalUrl: 'https://res.cloudinary.com/sample/image/upload/family-recipes/ocr/pending-upload.png',
      cloudinaryPublicId: 'family-recipes/ocr/pending-upload',
      mimeType: 'image/png',
      size: 307200,
      status: 'pending',
      recipeId: null,
      userId: admin.id,
    },
  ]

  const createdImages = []
  for (const imageData of sampleImages) {
    const image = await prisma.recipeImage.create({ data: imageData })
    console.log('✅ RecipeImage created:', image.filename, '| status:', image.status)
    createdImages.push(image)
  }

  // Seed OcrResults for completed images
  const ocrResultsData = [
    {
      recipeImageId: createdImages[0].id,
      rawText:
        'Chocolate Cake\n2 cups flour\n1 cup sugar\n1/2 cup cocoa\nMix all ingredients. Bake at 350F for 30 minutes.',
      confidence: 0.97,
      detectedLanguage: 'en',
      parsedTitle: 'Chocolate Cake',
      parsedIngredients: ['2 cups flour', '1 cup sugar', '1/2 cup cocoa'],
      parsedInstructions: 'Mix all ingredients. Bake at 350F for 30 minutes.',
      isManuallyEdited: false,
    },
    {
      recipeImageId: createdImages[1].id,
      rawText:
        'Tortilla Española\n4 papas\n6 huevos\nAceite de oliva\nCocinar a fuego medio 20 minutos.',
      confidence: 0.94,
      detectedLanguage: 'es',
      parsedTitle: 'Tortilla Española',
      parsedIngredients: ['4 papas', '6 huevos', 'Aceite de oliva'],
      parsedInstructions: 'Cocinar a fuego medio 20 minutos.',
      isManuallyEdited: true,
      editedAt: new Date(),
      editedById: regularUser.id,
    },
  ]

  for (const ocrData of ocrResultsData) {
    const ocrResult = await prisma.ocrResult.create({ data: ocrData })
    console.log('✅ OcrResult created for image:', ocrResult.recipeImageId, '| language:', ocrResult.detectedLanguage)
  }

  // Seed OcrProcessingLogs
  const processingLogsData = [
    {
      recipeImageId: createdImages[0].id,
      userId: admin.id,
      status: 'completed',
      processingTimeMs: 1230,
      errorMessage: null,
      apiCost: 0.0015,
    },
    {
      recipeImageId: createdImages[1].id,
      userId: regularUser.id,
      status: 'completed',
      processingTimeMs: 980,
      errorMessage: null,
      apiCost: 0.0015,
    },
    {
      recipeImageId: createdImages[0].id,
      userId: admin.id,
      status: 'failed',
      processingTimeMs: 5001,
      errorMessage: 'Google Vision API timeout',
      apiCost: null,
    },
  ]

  for (const logData of processingLogsData) {
    const log = await prisma.ocrProcessingLog.create({ data: logData })
    console.log('✅ OcrProcessingLog created:', log.id, '| status:', log.status)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
