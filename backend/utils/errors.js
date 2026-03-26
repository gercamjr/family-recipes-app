/**
 * OCR and API error codes used across the application.
 */
const ErrorCodes = {
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  OCR_PROCESSING_FAILED: 'OCR_PROCESSING_FAILED',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  POOR_IMAGE_QUALITY: 'POOR_IMAGE_QUALITY',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_NOT_COMPLETE: 'JOB_NOT_COMPLETE',
  INVALID_INPUT: 'INVALID_INPUT',
}

/**
 * Human-readable messages for each error code.
 */
const ErrorMessages = {
  [ErrorCodes.IMAGE_TOO_LARGE]: 'The uploaded file exceeds the maximum allowed size of 10MB.',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type. Only JPG, PNG, and PDF files are accepted.',
  [ErrorCodes.OCR_PROCESSING_FAILED]: 'OCR processing failed. Please try uploading a clearer image.',
  [ErrorCodes.API_QUOTA_EXCEEDED]: 'OCR service quota exceeded. Please try again later.',
  [ErrorCodes.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [ErrorCodes.NETWORK_TIMEOUT]: 'The request timed out. Please check your connection and try again.',
  [ErrorCodes.CORRUPTED_FILE]: 'The uploaded file appears to be corrupted. Please try a different file.',
  [ErrorCodes.POOR_IMAGE_QUALITY]: 'Image quality is too low for text extraction. Please upload a clearer image.',
  [ErrorCodes.UPLOAD_FAILED]: 'Failed to upload file. Please try again.',
  [ErrorCodes.JOB_NOT_FOUND]: 'OCR job not found.',
  [ErrorCodes.JOB_NOT_COMPLETE]: 'OCR processing is not yet complete.',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided.',
}

/**
 * Extended Error class that carries a structured error code and HTTP status.
 */
class AppError extends Error {
  /**
   * @param {string} code     - One of the ErrorCodes constants.
   * @param {string} [message] - Override the default message for the code.
   * @param {number} [status]  - HTTP status code (defaults per code mapping).
   */
  constructor(code, message, status) {
    super(message || ErrorMessages[code] || 'An unexpected error occurred.')
    this.name = 'AppError'
    this.code = code
    this.status = status || AppError.defaultStatusForCode(code)
  }

  /**
   * Returns the default HTTP status code for a given error code.
   * @param {string} code
   * @returns {number}
   */
  static defaultStatusForCode(code) {
    const statusMap = {
      [ErrorCodes.IMAGE_TOO_LARGE]: 413,
      [ErrorCodes.INVALID_FILE_TYPE]: 415,
      [ErrorCodes.OCR_PROCESSING_FAILED]: 422,
      [ErrorCodes.API_QUOTA_EXCEEDED]: 503,
      [ErrorCodes.DATABASE_ERROR]: 503,
      [ErrorCodes.NETWORK_TIMEOUT]: 504,
      [ErrorCodes.CORRUPTED_FILE]: 422,
      [ErrorCodes.POOR_IMAGE_QUALITY]: 422,
      [ErrorCodes.UPLOAD_FAILED]: 502,
      [ErrorCodes.JOB_NOT_FOUND]: 404,
      [ErrorCodes.JOB_NOT_COMPLETE]: 202,
      [ErrorCodes.INVALID_INPUT]: 400,
    }
    return statusMap[code] || 500
  }
}

/**
 * Formats an error into the standard API error response shape.
 *
 * @param {AppError|Error} error
 * @param {boolean} [exposeDetails=false] - Include the stack / raw message in non-production envs.
 * @returns {{ error: string, code?: string, details?: string }}
 */
function formatErrorResponse(error, exposeDetails = false) {
  if (error instanceof AppError) {
    const response = { error: error.message, code: error.code }
    if (exposeDetails && error.stack) {
      response.details = error.stack
    }
    return response
  }

  // Unknown / unstructured error
  const response = { error: 'An unexpected error occurred.' }
  if (exposeDetails && error.message) {
    response.details = error.message
  }
  return response
}

/**
 * Detects whether an error from the Google Cloud Vision API is a quota-exceeded error.
 * @param {Error} err
 * @returns {boolean}
 */
function isQuotaExceededError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  const code = err.code

  return (
    code === 429 ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rateLimitExceeded') ||
    msg.includes('rate limit')
  )
}

/**
 * Detects whether an error represents a network-level timeout.
 * @param {Error} err
 * @returns {boolean}
 */
function isTimeoutError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  const code = err.code

  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('network') ||
    msg.includes('econnreset')
  )
}

module.exports = {
  ErrorCodes,
  ErrorMessages,
  AppError,
  formatErrorResponse,
  isQuotaExceededError,
  isTimeoutError,
}
