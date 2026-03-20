import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * RecipeImageUpload – standalone, reusable component for uploading recipe
 * images (JPG / PNG / PDF) to the OCR endpoint.
 *
 * Props:
 *  - onUploadComplete(result)  called with the API response after a successful upload
 *  - onError(message)          called with an error message string on failure
 *  - disabled                  disables all interaction when true
 *  - className                 extra CSS classes for the outer container
 */
const RecipeImageUpload = ({ onUploadComplete, onError, disabled = false, className = '' }) => {
  const { t } = useTranslation()

  const [uploadStatus, setUploadStatus] = useState('idle') // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [preview, setPreview] = useState(null) // data-URL for image preview
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const fileInputRef = useRef(null)

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateFile = useCallback(
    (file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return t('imageUpload.errors.invalidType')
      }
      if (file.size > MAX_FILE_SIZE) {
        return t('imageUpload.errors.tooLarge')
      }
      return null
    },
    [t],
  )

  // ─── File Processing ────────────────────────────────────────────────────────

  const processFile = useCallback(
    (file) => {
      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setUploadStatus('error')
        onError?.(validationError)
        return
      }

      setSelectedFile(file)
      setErrorMessage('')
      setUploadStatus('idle')
      setUploadProgress(0)
      setUploadResult(null)

      if (file.type !== 'application/pdf') {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    },
    [validateFile, onError],
  )

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset the input value so the same file can be re-selected after removal
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      const msg = t('imageUpload.errors.noFile')
      setErrorMessage(msg)
      onError?.(msg)
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await api.post('/recipes/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        },
      })

      setUploadStatus('success')
      setUploadProgress(100)
      setUploadResult(response.data)
      onUploadComplete?.(response.data)
    } catch (err) {
      const msg = err.response?.data?.error || t('imageUpload.errors.uploadFailed')
      setErrorMessage(msg)
      setUploadStatus('error')
      onError?.(msg)
    }
  }

  // ─── Derived State ──────────────────────────────────────────────────────────

  const isPdf = selectedFile?.type === 'application/pdf'
  const isUploading = uploadStatus === 'uploading'
  const isSuccess = uploadStatus === 'success'
  const isError = uploadStatus === 'error'

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`} role='region' aria-label={t('imageUpload.title')}>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-space-cadet'>{t('imageUpload.title')}</h2>
        <p className='text-sm text-gray-500 mt-1'>{t('imageUpload.subtitle')}</p>
      </div>

      {/* Drop Zone (hidden once a file is selected and upload is successful) */}
      {!isSuccess && (
        <div
          role='button'
          tabIndex={disabled ? -1 : 0}
          aria-label={t('imageUpload.dragDropText')}
          aria-disabled={disabled}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              fileInputRef.current?.click()
            }
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            isDragOver && !disabled ? 'border-papaya bg-sunglow/10' : 'border-gray-300 hover:border-papaya',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            isError ? 'border-red-400 bg-red-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Upload cloud icon */}
          <svg
            className='mx-auto w-12 h-12 text-gray-400 mb-3'
            aria-hidden='true'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
            />
          </svg>

          <p className='text-sm font-medium text-gray-700'>{t('imageUpload.dragDropText')}</p>
          <p className='text-xs text-gray-500 my-2'>{t('imageUpload.orText')}</p>

          <span
            className='inline-block bg-sunglow hover:bg-papaya text-space-cadet font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 text-sm pointer-events-none'
            aria-hidden='true'
          >
            {t('imageUpload.browseFiles')}
          </span>

          <p className='mt-3 text-xs text-gray-400'>{t('imageUpload.supportedFormats')}</p>
          <p className='text-xs text-gray-400'>{t('imageUpload.maxSize')}</p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id='ocr-file-upload'
            type='file'
            accept={ALLOWED_EXTENSIONS.join(',')}
            className='sr-only'
            onChange={handleFileChange}
            disabled={disabled}
            aria-label={t('imageUpload.browseFiles')}
          />
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !isSuccess && (
        <div className='mt-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm'>
          <div className='flex items-start gap-4'>
            {/* Thumbnail */}
            <div className='flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200'>
              {preview ? (
                <img
                  src={preview}
                  alt={t('imageUpload.preview')}
                  className='w-full h-full object-cover'
                />
              ) : (
                <svg
                  className='w-8 h-8 text-gray-400'
                  aria-label={t('imageUpload.pdfFile')}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                  />
                </svg>
              )}
            </div>

            {/* File info */}
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-gray-800 truncate' title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                {isPdf ? t('imageUpload.pdfFile') : selectedFile.type} &bull;{' '}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>

              {/* Progress Bar */}
              {isUploading && (
                <div className='mt-2'>
                  <div
                    role='progressbar'
                    aria-label={t('imageUpload.progress')}
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'
                  >
                    <div
                      className='bg-cerulean h-2 rounded-full transition-all duration-300'
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className='text-xs text-cerulean mt-1 font-medium'>{uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Remove button */}
            {!isUploading && (
              <button
                type='button'
                onClick={handleRemove}
                disabled={disabled}
                aria-label={t('imageUpload.removeFile')}
                className='flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {isError && errorMessage && (
        <div
          role='alert'
          className='mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'
        >
          <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success State */}
      {isSuccess && uploadResult && (
        <div className='mt-4'>
          {/* Success banner */}
          <div
            role='status'
            aria-live='polite'
            className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4'
          >
            <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
            <span>{t('imageUpload.uploadSuccess')}</span>
          </div>

          {/* Uploaded image preview */}
          {uploadResult.type === 'image' && (
            <div className='rounded-xl overflow-hidden border border-gray-200 shadow-sm'>
              <img
                src={uploadResult.url}
                alt={t('imageUpload.preview')}
                className='w-full max-h-64 object-contain bg-gray-50'
              />
            </div>
          )}

          {/* Upload-another button */}
          <button
            type='button'
            onClick={handleRemove}
            disabled={disabled}
            className='mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sunglow hover:bg-papaya text-space-cadet font-bold py-2 px-5 rounded-lg shadow-md transition-colors duration-200'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            {t('imageUpload.uploadAnother')}
          </button>
        </div>
      )}

      {/* Upload Button (only shown when a file is selected but not yet uploading/done) */}
      {selectedFile && uploadStatus === 'idle' && (
        <button
          type='button'
          onClick={handleUpload}
          disabled={disabled}
          className='mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cerulean hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
            />
          </svg>
          {t('imageUpload.uploadButton')}
        </button>
      )}

      {/* Uploading spinner button */}
      {isUploading && (
        <button
          type='button'
          disabled
          className='mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cerulean text-white font-bold py-2 px-6 rounded-lg shadow-md opacity-75 cursor-not-allowed'
          aria-busy='true'
        >
          <svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24' aria-hidden='true'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
            />
          </svg>
          {t('imageUpload.uploading')}
        </button>
      )}
    </div>
  )
}

export default RecipeImageUpload
