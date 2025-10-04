import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { createRecipe, updateRecipe, fetchRecipeById } from '../../store/recipesThunks'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const RecipeForm = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { language } = useAppSelector((state) => state.ui)
  const { user } = useAppSelector((state) => state.auth)
  const { loading, currentRecipe } = useAppSelector((state) => state.recipes)

  const isEdit = !!id
  const recipe = currentRecipe
  const isOwner = recipe ? user?.id === recipe.user_id : true
  const canEdit = !isEdit || (isEdit && isOwner)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(recipe?.image_url || '')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title_en: recipe?.title_en || '',
      title_es: recipe?.title_es || '',
      ingredients_en: recipe?.ingredients_en || [''],
      ingredients_es: recipe?.ingredients_es || [''],
      instructions_en: recipe?.instructions_en || '',
      instructions_es: recipe?.instructions_es || '',
      prep_time: recipe?.prep_time || '',
      cook_time: recipe?.cook_time || '',
      servings: recipe?.servings || 1,
      tags: recipe?.tags || [],
      categories: recipe?.categories || [],
    },
  })

  const {
    fields: ingredientsEnFields,
    append: appendEn,
    remove: removeEn,
  } = useFieldArray({
    control,
    name: 'ingredients_en',
  })

  const {
    fields: ingredientsEsFields,
    append: appendEs,
    remove: removeEs,
  } = useFieldArray({
    control,
    name: 'ingredients_es',
  })

  const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']
  const availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    if (!canEdit) return

    try {
      let imageUrl = recipe?.image_url || ''
      if (imageFile) {
        // Upload image to backend
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadResponse = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = uploadResponse.data.url
      }

      const recipeData = {
        ...data,
        image_url: imageUrl,
        ingredients_en: data.ingredients_en.filter((i) => i.trim()),
        ingredients_es: data.ingredients_es.filter((i) => i.trim()),
      }

      if (isEdit) {
        await dispatch(updateRecipe({ id, data: recipeData })).unwrap()
      } else {
        await dispatch(createRecipe(recipeData)).unwrap()
      }

      navigate('/')
    } catch (error) {
      console.error('Error saving recipe:', error)
    }
  }

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchRecipeById(id))
    }
  }, [dispatch, id, isEdit])

  useEffect(() => {
    if (recipe) {
      setImagePreview(recipe.image_url || '')
      reset({
        title_en: recipe.title_en,
        title_es: recipe.title_es,
        ingredients_en: recipe.ingredients_en,
        ingredients_es: recipe.ingredients_es,
        instructions_en: recipe.instructions_en,
        instructions_es: recipe.instructions_es,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        tags: recipe.tags,
        categories: recipe.categories,
      })
    }
  }, [recipe, reset])

  if (!canEdit) {
    return (
      <div className='p-4 text-center'>
        <p className='text-red-500'>{t('recipe.form.noPermission')}</p>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6'>{isEdit ? t('recipe.form.editTitle') : t('recipe.form.createTitle')}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {/* Image Upload */}
        <div>
          <label className='block text-sm font-medium mb-2'>{t('recipe.form.image')}</label>
          <input
            type='file'
            accept='image/*'
            onChange={handleImageChange}
            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          />
          {imagePreview && <img src={imagePreview} alt='Preview' className='mt-2 max-w-xs h-auto rounded' />}
        </div>

        {/* Titles */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.titleEn')}</label>
            <input
              {...register('title_en', { required: t('recipe.form.required') })}
              className='w-full p-2 border rounded'
            />
            {errors.title_en && <p className='text-red-500 text-sm'>{errors.title_en.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.titleEs')}</label>
            <input
              {...register('title_es', { required: t('recipe.form.required') })}
              className='w-full p-2 border rounded'
            />
            {errors.title_es && <p className='text-red-500 text-sm'>{errors.title_es.message}</p>}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className='block text-sm font-medium mb-2'>{t('recipe.form.ingredientsEn')}</label>
          {ingredientsEnFields.map((field, index) => (
            <div key={field.id} className='flex mb-2'>
              <input
                {...register(`ingredients_en.${index}`)}
                className='flex-1 p-2 border rounded mr-2'
                placeholder={`Ingredient ${index + 1}`}
              />
              <button type='button' onClick={() => removeEn(index)} className='px-2 py-1 bg-red-500 text-white rounded'>
                -
              </button>
            </div>
          ))}
          <button type='button' onClick={() => appendEn('')} className='px-4 py-2 bg-green-500 text-white rounded'>
            {t('recipe.form.addIngredient')}
          </button>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2'>{t('recipe.form.ingredientsEs')}</label>
          {ingredientsEsFields.map((field, index) => (
            <div key={field.id} className='flex mb-2'>
              <input
                {...register(`ingredients_es.${index}`)}
                className='flex-1 p-2 border rounded mr-2'
                placeholder={`Ingrediente ${index + 1}`}
              />
              <button type='button' onClick={() => removeEs(index)} className='px-2 py-1 bg-red-500 text-white rounded'>
                -
              </button>
            </div>
          ))}
          <button type='button' onClick={() => appendEs('')} className='px-4 py-2 bg-green-500 text-white rounded'>
            {t('recipe.form.addIngredient')}
          </button>
        </div>

        {/* Instructions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.instructionsEn')}</label>
            <textarea
              {...register('instructions_en', { required: t('recipe.form.required') })}
              rows={4}
              className='w-full p-2 border rounded'
            />
            {errors.instructions_en && <p className='text-red-500 text-sm'>{errors.instructions_en.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.instructionsEs')}</label>
            <textarea
              {...register('instructions_es', { required: t('recipe.form.required') })}
              rows={4}
              className='w-full p-2 border rounded'
            />
            {errors.instructions_es && <p className='text-red-500 text-sm'>{errors.instructions_es.message}</p>}
          </div>
        </div>

        {/* Times and Servings */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.prepTime')}</label>
            <input type='number' {...register('prep_time', { min: 0 })} className='w-full p-2 border rounded' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.cookTime')}</label>
            <input type='number' {...register('cook_time', { min: 0 })} className='w-full p-2 border rounded' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.servings')}</label>
            <input type='number' {...register('servings', { min: 1 })} className='w-full p-2 border rounded' />
          </div>
        </div>

        {/* Categories and Tags */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.categories')}</label>
            <div className='space-y-2'>
              {availableCategories.map((category) => (
                <label key={category} className='flex items-center'>
                  <input type='checkbox' value={category} {...register('categories')} className='mr-2' />
                  {category}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>{t('recipe.form.tags')}</label>
            <div className='space-y-2'>
              {availableTags.map((tag) => (
                <label key={tag} className='flex items-center'>
                  <input type='checkbox' value={tag} {...register('tags')} className='mr-2' />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className='flex justify-end space-x-4'>
          <button type='button' onClick={() => navigate('/')} className='px-4 py-2 bg-gray-500 text-white rounded'>
            {t('common.cancel')}
          </button>
          <button
            type='submit'
            disabled={loading}
            className='px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50'
          >
            {loading ? t('common.loading') : isEdit ? t('common.update') : t('common.create')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RecipeForm
