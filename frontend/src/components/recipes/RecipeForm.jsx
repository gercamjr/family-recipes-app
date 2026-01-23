import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { createRecipe, updateRecipe, fetchRecipeById } from '../../store/recipesThunks'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const RecipeForm = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAppSelector((state) => state.auth)
  const { loading, currentRecipe } = useAppSelector((state) => state.recipes)

  const isEdit = !!id
  const recipe = currentRecipe
  const isOwner = recipe ? user?.id === recipe.author?.id : true
  const canEdit = !isEdit || (isEdit && isOwner)

  const [mediaFiles, setMediaFiles] = useState([]) // Array of File objects
  const [mediaPreviews, setMediaPreviews] = useState([]) // Array of preview URLs
  const [uploadedMedia, setUploadedMedia] = useState([]) // Array of uploaded media metadata
  const [recipeLanguage, setRecipeLanguage] = useState(user?.languagePref || i18n?.language || 'en')

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      ingredients: [{ value: '' }],
      instructions: '',
      prepTime: '',
      cookTime: '',
      servings: 1,
      tags: [],
      category: '',
    },
  })

  const {
    fields: ingredientsFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' })

  const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']
  const availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchRecipeById(id))
    }
  }, [dispatch, id, isEdit])

  useEffect(() => {
    if (isEdit && recipe) {
      // Determine which language data to load based on user preference or available data
      const lang = user?.languagePref || i18n?.language || 'en'
      const hasEnglish = recipe.titleEn
      const hasSpanish = recipe.titleEs

      // Load the preferred language if available, otherwise fall back
      let loadLanguage = lang
      if (lang === 'en' && !hasEnglish && hasSpanish) {
        loadLanguage = 'es'
      } else if (lang === 'es' && !hasSpanish && hasEnglish) {
        loadLanguage = 'en'
      }

      setRecipeLanguage(loadLanguage)

      const title = loadLanguage === 'en' ? recipe.titleEn : recipe.titleEs
      const ingredients = loadLanguage === 'en' ? recipe.ingredientsEn : recipe.ingredientsEs
      const instructions = loadLanguage === 'en' ? recipe.instructionsEn : recipe.instructionsEs

      reset({
        title: title || '',
        ingredients: ingredients?.map((i) => ({ value: i })) || [{ value: '' }],
        instructions: instructions || '',
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        tags: recipe.tags,
        category: recipe.categories?.[0] || '',
      })

      // Load existing media
      if (recipe.media && recipe.media.length > 0) {
        setUploadedMedia(recipe.media)
        setMediaPreviews(recipe.media.map((m) => m.url))
      }
    }
  }, [isEdit, recipe, reset, user, i18n?.language])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setMediaFiles((prev) => [...prev, ...files])

      // Create previews for new files
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setMediaPreviews((prev) => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (!canEdit) return

    try {
      // Upload new media files
      const mediaToSave = [...uploadedMedia] // Start with existing uploaded media

      for (const file of mediaFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadResponse = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        mediaToSave.push(uploadResponse.data)
      }

      // Map the single language fields to the appropriate language-specific fields
      const recipeData = {
        media: mediaToSave,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        tags: data.tags,
        categories: data.category ? [data.category] : [],
      }

      // Add language-specific fields
      if (recipeLanguage === 'en') {
        recipeData.titleEn = data.title
        recipeData.ingredientsEn = data.ingredients.map((i) => i.value).filter(Boolean)
        recipeData.instructionsEn = data.instructions
      } else {
        recipeData.titleEs = data.title
        recipeData.ingredientsEs = data.ingredients.map((i) => i.value).filter(Boolean)
        recipeData.instructionsEs = data.instructions
      }

      if (isEdit) {
        await dispatch(updateRecipe({ id, recipeData })).unwrap()
        navigate(`/recipes/${id}`)
      } else {
        await dispatch(createRecipe(recipeData)).unwrap()
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to save recipe:', error)
    }
  }

  if (loading && isEdit) {
    return <p>{t('common.loading')}</p>
  }

  if (!canEdit) {
    return <p>{t('common.unauthorized')}</p>
  }

  return (
    <div className='max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl my-8'>
      <h1 className='text-4xl font-bold text-space-cadet mb-8'>
        {isEdit ? t('recipes.editRecipe') : t('recipes.createRecipe')}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        {/* Language Selector */}
        <div>
          <label className='block text-lg font-semibold text-space-cadet mb-2'>{t('recipes.recipeLanguage')}</label>
          <div className='flex gap-4'>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='radio'
                value='en'
                checked={recipeLanguage === 'en'}
                onChange={(e) => setRecipeLanguage(e.target.value)}
                className='h-5 w-5 text-cerulean focus:ring-papaya'
                disabled={!canEdit}
              />
              <span className='text-gray-700 font-medium'>English</span>
            </label>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='radio'
                value='es'
                checked={recipeLanguage === 'es'}
                onChange={(e) => setRecipeLanguage(e.target.value)}
                className='h-5 w-5 text-cerulean focus:ring-papaya'
                disabled={!canEdit}
              />
              <span className='text-gray-700 font-medium'>Español</span>
            </label>
          </div>
          <p className='text-sm text-gray-500 mt-2'>{t('recipes.languageHelp')}</p>
        </div>

        {/* Media Upload (Images/Videos) */}
        <div>
          <label className='block text-lg font-semibold text-space-cadet mb-2'>{t('recipes.media')}</label>

          {/* Drag and Drop Area */}
          <div
            onDrop={(e) => {
              e.preventDefault()
              if (!canEdit) return
              const files = Array.from(e.dataTransfer.files)
              handleImageChange({ target: { files } })
            }}
            onDragOver={(e) => e.preventDefault()}
            className='border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:border-papaya transition-colors'
          >
            <svg className='mx-auto w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
              />
            </svg>
            <p className='mt-2 text-sm text-gray-600'>{t('recipes.dragDropHelp')}</p>
            <label
              htmlFor='file-upload'
              className='mt-2 inline-flex cursor-pointer bg-sunglow hover:bg-papaya text-space-cadet font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300'
            >
              <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              <span>{t('recipes.addMedia')}</span>
              <input
                id='file-upload'
                name='file-upload'
                type='file'
                accept='image/*,video/*'
                multiple
                className='sr-only'
                onChange={handleImageChange}
                disabled={!canEdit}
              />
            </label>
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
              {mediaPreviews.map((preview, index) => (
                <div key={index} className='relative group'>
                  <img
                    src={preview}
                    alt={`Media ${index + 1}`}
                    className='w-full h-32 object-cover rounded-lg shadow-md'
                  />
                  <button
                    type='button'
                    onClick={() => removeMedia(index)}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                    disabled={!canEdit}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className='text-sm text-gray-500 mt-2'>{t('recipes.mediaHelp')}</p>
        </div>

        {/* Title */}
        <InputField
          label={t('recipes.title')}
          name='title'
          register={register}
          errors={errors}
          required
          disabled={!canEdit}
          t={t}
        />

        {/* Ingredients */}
        <DynamicFieldArray
          label={t('recipes.ingredients')}
          name='ingredients'
          fields={ingredientsFields}
          append={appendIngredient}
          remove={removeIngredient}
          register={register}
          canEdit={canEdit}
          t={t}
        />

        {/* Instructions */}
        <TextareaField
          label={t('recipes.instructions')}
          name='instructions'
          register={register}
          errors={errors}
          disabled={!canEdit}
        />

        {/* Meta */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <InputField
            label={t('recipes.prepTime')}
            name='prepTime'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
            t={t}
          />
          <InputField
            label={t('recipes.cookTime')}
            name='cookTime'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
            t={t}
          />
          <InputField
            label={t('recipes.servings')}
            name='servings'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
            t={t}
          />
        </div>

        {/* Category */}
        <SelectField
          label={t('recipes.category')}
          name='category'
          register={register}
          errors={errors}
          options={availableCategories}
          disabled={!canEdit}
          t={t}
        />

        {/* Tags */}
        <CheckboxGroup
          label={t('recipes.tags')}
          name='tags'
          options={availableTags}
          register={register}
          disabled={!canEdit}
        />

        {/* Actions */}
        {canEdit && (
          <div className='flex justify-end space-x-4'>
            <button
              type='button'
              onClick={() => navigate(isEdit ? `/recipes/${id}` : '/')}
              className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300'
            >
              {t('common.cancel')}
            </button>
            <button
              type='submit'
              className='bg-cerulean hover:bg-sea-green text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300'
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

// Helper components for form fields

const InputField = ({ label, name, type = 'text', register, errors, required, disabled, t }) => (
  <div>
    <label className='block text-lg font-semibold text-space-cadet mb-2'>{label}</label>
    <input
      type={type}
      {...register(name, { required })}
      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent disabled:bg-gray-100'
      disabled={disabled}
    />
    {errors[name] && <p className='text-papaya text-sm mt-1'>{t('common.required')}</p>}
  </div>
)

const TextareaField = ({ label, name, register, errors, disabled }) => (
  <div>
    <label className='block text-lg font-semibold text-space-cadet mb-2'>{label}</label>
    <textarea
      {...register(name)}
      rows='5'
      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent disabled:bg-gray-100'
      disabled={disabled}
    />
  </div>
)

const SelectField = ({ label, name, register, errors, options, disabled, t }) => (
  <div>
    <label className='block text-lg font-semibold text-space-cadet mb-2'>{label}</label>
    <select
      {...register(name)}
      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent disabled:bg-gray-100'
      disabled={disabled}
    >
      <option value=''>{t('common.selectOption')}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
)

const CheckboxGroup = ({ label, name, options, register, disabled }) => (
  <div>
    <label className='block text-lg font-semibold text-space-cadet mb-2'>{label}</label>
    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
      {options.map((opt) => (
        <label key={opt} className='flex items-center space-x-2'>
          <input
            type='checkbox'
            value={opt}
            {...register(name)}
            className='h-5 w-5 rounded border-gray-300 text-papaya focus:ring-sunglow disabled:opacity-50'
            disabled={disabled}
          />
          <span className='text-gray-700'>{opt}</span>
        </label>
      ))}
    </div>
  </div>
)

const DynamicFieldArray = ({ label, name, fields, append, remove, register, canEdit, t }) => (
  <div>
    <h3 className='text-xl font-semibold text-space-cadet mb-3'>{label}</h3>
    <div className='space-y-3'>
      {fields.map((field, index) => (
        <div key={field.id} className='flex items-center space-x-3'>
          <input
            {...register(`${name}.${index}.value`)}
            className='flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-papaya focus:border-transparent disabled:bg-gray-100'
            disabled={!canEdit}
          />
          {canEdit && (
            <button
              type='button'
              onClick={() => remove(index)}
              className='p-2 bg-papaya text-white rounded-full hover:bg-red-700'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 12H6' />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
    {canEdit && (
      <button
        type='button'
        onClick={() => append({ value: '' })}
        className='mt-4 bg-seaGreen hover:bg-cerulean text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300'
      >
        {t('common.add')}
      </button>
    )}
  </div>
)

export default RecipeForm
