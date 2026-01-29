import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { authService } from '../../services/auth'

const AdminInviteDashboard = () => {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await authService.sendInvite(data.email.trim())
      setStatus({
        type: 'success',
        message: response?.message || t('admin.invites.success'),
      })
      reset()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || t('admin.invites.error'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl my-8'>
      <h1 className='text-3xl font-bold text-space-cadet mb-2'>{t('admin.invites.title')}</h1>
      <p className='text-sm text-gray-600 mb-6'>{t('admin.invites.description')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <label className='block text-sm font-semibold text-space-cadet mb-2' htmlFor='invite-email'>
            {t('admin.invites.emailLabel')}
          </label>
          <input
            id='invite-email'
            name='email'
            type='email'
            placeholder={t('admin.invites.emailPlaceholder')}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-papaya'
            {...register('email', {
              required: t('validation.required'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('validation.email'),
              },
            })}
          />
          {errors.email && <p className='mt-2 text-sm text-red-600'>{errors.email.message}</p>}
        </div>

        {status && (
          <div
            className={`rounded-md p-4 text-sm font-medium ${
              status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {status.message}
          </div>
        )}

        <button
          type='submit'
          disabled={isSubmitting}
          className='bg-papaya hover:bg-sunglow text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed'
        >
          {isSubmitting ? t('admin.invites.sending') : t('admin.invites.submit')}
        </button>
      </form>
    </div>
  )
}

export default AdminInviteDashboard
