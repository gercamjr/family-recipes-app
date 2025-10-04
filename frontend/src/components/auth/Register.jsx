import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAuth } from '../../store/hooks'
import { registerStart, registerSuccess, registerFailure, clearError } from '../../store/slices/authSlice'
import { useTranslation } from 'react-i18next'
import { authService } from '../../services/auth'

const Register = () => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAuth()
  const { t, i18n } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteToken: '',
    },
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      dispatch(registerFailure(t('auth.register.passwordMismatch')))
      return
    }

    dispatch(registerStart())

    try {
      const { token, user } = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        inviteToken: data.inviteToken,
        languagePref: i18n.language,
      })
      dispatch(registerSuccess({ user, token }))
      reset()
    } catch (error) {
      dispatch(registerFailure(error.message))
    }
  }

  const handleClearError = () => {
    dispatch(clearError())
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
            {t('auth.register.title')}
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            {t('auth.register.haveAccount')}{' '}
            <Link
              to='/login'
              className='font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300'
            >
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='name' className='sr-only'>
                {t('auth.register.name')}
              </label>
              <input
                id='name'
                name='name'
                type='text'
                autoComplete='name'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                placeholder={t('auth.register.name')}
                {...register('name', { required: t('auth.register.nameRequired') })}
              />
              {errors.name && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor='email' className='sr-only'>
                {t('auth.register.email')}
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                placeholder={t('auth.register.email')}
                {...register('email', {
                  required: t('auth.register.emailRequired'),
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: t('auth.register.emailRequired'),
                  },
                })}
              />
              {errors.email && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor='inviteToken' className='sr-only'>
                {t('auth.register.inviteToken')}
              </label>
              <input
                id='inviteToken'
                name='inviteToken'
                type='text'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                placeholder={t('auth.register.inviteToken')}
                {...register('inviteToken', { required: t('auth.register.inviteTokenRequired') })}
              />
              {errors.inviteToken && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.inviteToken.message}</p>
              )}
            </div>
            <div className='relative'>
              <label htmlFor='password' className='sr-only'>
                {t('auth.register.password')}
              </label>
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                placeholder={t('auth.register.password')}
                {...register('password', {
                  required: t('auth.register.passwordTooShort'),
                  minLength: {
                    value: 8,
                    message: t('auth.register.passwordTooShort'),
                  },
                })}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className='text-gray-500 dark:text-gray-400 text-sm'>{showPassword ? '🙈' : '👁️'}</span>
              </button>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.password.message}</p>
              )}
            </div>
            <div className='relative'>
              <label htmlFor='confirmPassword' className='sr-only'>
                {t('auth.register.confirmPassword')}
              </label>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                placeholder={t('auth.register.confirmPassword')}
                {...register('confirmPassword', {
                  required: t('auth.register.passwordMismatch'),
                  validate: (value) => value === password || t('auth.register.passwordMismatch'),
                })}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <span className='text-gray-500 dark:text-gray-400 text-sm'>{showConfirmPassword ? '🙈' : '👁️'}</span>
              </button>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className='rounded-md bg-red-50 dark:bg-red-900 p-4'>
              <div className='flex'>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                    {t('auth.login.invalidCredentials')}
                  </h3>
                  <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                    <p>{error}</p>
                  </div>
                  <div className='mt-4'>
                    <div className='-mx-2 -my-1.5 flex'>
                      <button
                        type='button'
                        className='bg-red-50 dark:bg-red-900 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-900 focus:ring-red-600'
                        onClick={handleClearError}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating Account...' : t('auth.register.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
