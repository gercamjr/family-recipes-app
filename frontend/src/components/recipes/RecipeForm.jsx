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
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title_en: '',
      title_es: '',
      ingredients_en: [{ value: '' }],
      ingredients_es: [{ value: '' }],
      instructions_en: '',
      instructions_es: '',
      prep_time: '',
      cook_time: '',
      servings: 1,
      tags: [],
      category: '',
    },
  })

  const {
    fields: ingredientsEnFields,
    append: appendEn,
    remove: removeEn,
  } = useFieldArray({ control, name: 'ingredients_en' })

  const {
    fields: ingredientsEsFields,
    append: appendEs,
    remove: removeEs,
  } = useFieldArray({ control, name: 'ingredients_es' })

  const availableTags = ['Quick', 'Easy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Healthy']
  const availableCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchRecipeById(id))
    }
  }, [dispatch, id, isEdit])

  useEffect(() => {
    if (isEdit && recipe) {
      reset({
        title_en: recipe.title_en,
        title_es: recipe.title_es,
        ingredients_en: recipe.ingredients_en?.map((i) => ({ value: i })) || [{ value: '' }],
        ingredients_es: recipe.ingredients_es?.map((i) => ({ value: i })) || [{ value: '' }],
        instructions_en: recipe.instructions_en,
        instructions_es: recipe.instructions_es,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        tags: recipe.tags,
        category: recipe.category,
      })
      setImagePreview(recipe.image_url)
    }
  }, [isEdit, recipe, reset])

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
        ingredients_en: data.ingredients_en.map((i) => i.value).filter(Boolean),
        ingredients_es: data.ingredients_es.map((i) => i.value).filter(Boolean),
      }

      if (isEdit) {
        await dispatch(updateRecipe({ id, ...recipeData })).unwrap()
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
    <div className='max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl'>
      <h1 className='text-4xl font-bold text-space-cadet mb-8'>
        {isEdit ? t('recipes.editRecipe') : t('recipes.createRecipe')}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        {/* Image Upload */}
        <div>
          <label className='block text-lg font-semibold text-space-cadet mb-2'>{t('recipes.image')}</label>
          <div className='mt-2 flex items-center'>
            {imagePreview ? (
              <img src={imagePreview} alt='Recipe preview' className='w-48 h-48 object-cover rounded-lg shadow-md' />
            ) : (
              <div className='w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center'>
                <svg className='w-16 h-16 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
            )}
            <label
              htmlFor='file-upload'
              className='ml-6 cursor-pointer bg-sunglow hover:bg-papaya text-space-cadet font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300'
            >
              <span>{t('common.uploadFile')}</span>
              <input
                id='file-upload'
                name='file-upload'
                type='file'
                className='sr-only'
                onChange={handleImageChange}
                disabled={!canEdit}
              />
            </label>
          </div>
        </div>

        {/* Titles */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <InputField
            label={t('recipes.titleEn')}
            name='title_en'
            register={register}
            errors={errors}
            required
            disabled={!canEdit}
          />
          <InputField
            label={t('recipes.titleEs')}
            name='title_es'
            register={register}
            errors={errors}
            required
            disabled={!canEdit}
          />
        </div>

        {/* Ingredients */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          <DynamicFieldArray
            label={t('recipes.ingredientsEn')}
            name='ingredients_en'
            fields={ingredientsEnFields}
            append={appendEn}
            remove={removeEn}
            register={register}
            canEdit={canEdit}
            t={t}
          />
          <DynamicFieldArray
            label={t('recipes.ingredientsEs')}
            name='ingredients_es'
            fields={ingredientsEsFields}
            append={appendEs}
            remove={removeEs}
            register={register}
            canEdit={canEdit}
            t={t}
          />
        </div>

        {/* Instructions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextareaField
            label={t('recipes.instructionsEn')}
            name='instructions_en'
            register={register}
            errors={errors}
            disabled={!canEdit}
          />
          <TextareaField
            label={t('recipes.instructionsEs')}
            name='instructions_es'
            register={register}
            errors={errors}
            disabled={!canEdit}
          />
        </div>

        {/* Meta */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <InputField
            label={t('recipes.prepTime')}
            name='prep_time'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
          />
          <InputField
            label={t('recipes.cookTime')}
            name='cook_time'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
          />
          <InputField
            label={t('recipes.servings')}
            name='servings'
            type='number'
            register={register}
            errors={errors}
            disabled={!canEdit}
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

const InputField = ({ label, name, type = 'text', register, errors, required, disabled }) => (
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
        className='mt-4 bg-sea-green hover:bg-cerulean text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300'
      >
        {t('common.add')}
      </button>
    )}
  </div>
)

export default RecipeForm
