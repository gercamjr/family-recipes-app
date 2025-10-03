import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAuth, useLanguage } from '../../store/hooks'
import { registerStart, registerSuccess, registerFailure, clearError } from '../../store/slices/authSlice'

const Register = () => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAuth()
  const language = useLanguage()
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
    },
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    dispatch(registerStart())

    try {
      // TODO: Replace with actual API call
      // const response = await api.register(data)

      // Mock successful registration for now
      dispatch(
        registerSuccess({
          user: { id: Date.now(), email: data.email, name: data.name },
          token: 'mock-jwt-token',
        })
      )
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
            {language === 'en' ? 'Create your account' : 'Crea tu cuenta'}
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            {language === 'en'
              ? 'Join our family recipes community'
              : 'Únete a nuestra comunidad de recetas familiares'}
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='name' className='sr-only'>
                {language === 'en' ? 'Full Name' : 'Nombre Completo'}
              </label>
              <input
                {...register('name', {
                  required: language === 'en' ? 'Name is required' : 'El nombre es obligatorio',
                  minLength: {
                    value: 2,
                    message:
                      language === 'en'
                        ? 'Name must be at least 2 characters'
                        : 'El nombre debe tener al menos 2 caracteres',
                  },
                })}
                id='name'
                name='name'
                type='text'
                autoComplete='name'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800'
                placeholder={language === 'en' ? 'Full Name' : 'Nombre Completo'}
              />
              {errors.name && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor='email' className='sr-only'>
                {language === 'en' ? 'Email address' : 'Dirección de correo electrónico'}
              </label>
              <input
                {...register('email', {
                  required: language === 'en' ? 'Email is required' : 'El correo electrónico es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: language === 'en' ? 'Invalid email address' : 'Dirección de correo electrónico inválida',
                  },
                })}
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800'
                placeholder={language === 'en' ? 'Email address' : 'Dirección de correo electrónico'}
              />
              {errors.email && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.email.message}</p>}
            </div>

            <div className='relative'>
              <label htmlFor='password' className='sr-only'>
                {language === 'en' ? 'Password' : 'Contraseña'}
              </label>
              <input
                {...register('password', {
                  required: language === 'en' ? 'Password is required' : 'La contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message:
                      language === 'en'
                        ? 'Password must be at least 8 characters'
                        : 'La contraseña debe tener al menos 8 caracteres',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message:
                      language === 'en'
                        ? 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                        : 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
                  },
                })}
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 pr-10'
                placeholder={language === 'en' ? 'Password' : 'Contraseña'}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                    />
                  </svg>
                ) : (
                  <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.password.message}</p>
              )}
            </div>

            <div className='relative'>
              <label htmlFor='confirmPassword' className='sr-only'>
                {language === 'en' ? 'Confirm Password' : 'Confirmar Contraseña'}
              </label>
              <input
                {...register('confirmPassword', {
                  required: language === 'en' ? 'Please confirm your password' : 'Por favor confirma tu contraseña',
                  validate: (value) =>
                    value === password ||
                    (language === 'en' ? 'Passwords do not match' : 'Las contraseñas no coinciden'),
                })}
                id='confirmPassword'
                name='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800 pr-10'
                placeholder={language === 'en' ? 'Confirm Password' : 'Confirmar Contraseña'}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                    />
                  </svg>
                ) : (
                  <svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                )}
              </button>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className='rounded-md bg-red-50 dark:bg-red-900/50 p-4'>
              <div className='flex'>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                    {language === 'en' ? 'Registration Error' : 'Error de Registro'}
                  </h3>
                  <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                    <p>{error}</p>
                  </div>
                  <div className='mt-4'>
                    <div className='-mx-2 -my-1.5 flex'>
                      <button
                        type='button'
                        onClick={handleClearError}
                        className='bg-red-50 dark:bg-red-900/50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-900/50 focus:ring-red-600'
                      >
                        {language === 'en' ? 'Dismiss' : 'Descartar'}
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
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className='flex items-center'>
                  <svg
                    className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  {language === 'en' ? 'Creating account...' : 'Creando cuenta...'}
                </div>
              ) : language === 'en' ? (
                'Create Account'
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>
        </form>

        <div className='text-center'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {language === 'en' ? 'Already have an account?' : '¿Ya tienes una cuenta?'}{' '}
            <Link
              to='/login'
              className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
            >
              {language === 'en' ? 'Sign in here' : 'Inicia sesión aquí'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
