const {
  ErrorCodes,
  ErrorMessages,
  AppError,
  formatErrorResponse,
  isQuotaExceededError,
  isTimeoutError,
} = require('../utils/errors')

describe('ErrorCodes', () => {
  it('exports all required error codes', () => {
    expect(ErrorCodes.IMAGE_TOO_LARGE).toBe('IMAGE_TOO_LARGE')
    expect(ErrorCodes.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE')
    expect(ErrorCodes.OCR_PROCESSING_FAILED).toBe('OCR_PROCESSING_FAILED')
    expect(ErrorCodes.API_QUOTA_EXCEEDED).toBe('API_QUOTA_EXCEEDED')
    expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR')
    expect(ErrorCodes.NETWORK_TIMEOUT).toBe('NETWORK_TIMEOUT')
    expect(ErrorCodes.CORRUPTED_FILE).toBe('CORRUPTED_FILE')
    expect(ErrorCodes.POOR_IMAGE_QUALITY).toBe('POOR_IMAGE_QUALITY')
    expect(ErrorCodes.UPLOAD_FAILED).toBe('UPLOAD_FAILED')
    expect(ErrorCodes.JOB_NOT_FOUND).toBe('JOB_NOT_FOUND')
    expect(ErrorCodes.JOB_NOT_COMPLETE).toBe('JOB_NOT_COMPLETE')
    expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT')
  })
})

describe('ErrorMessages', () => {
  it('has a message for every error code', () => {
    for (const code of Object.values(ErrorCodes)) {
      expect(ErrorMessages[code]).toBeDefined()
      expect(typeof ErrorMessages[code]).toBe('string')
      expect(ErrorMessages[code].length).toBeGreaterThan(0)
    }
  })
})

describe('AppError', () => {
  it('creates an error with the correct code and default message', () => {
    const err = new AppError(ErrorCodes.IMAGE_TOO_LARGE)
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe(ErrorCodes.IMAGE_TOO_LARGE)
    expect(err.message).toBe(ErrorMessages[ErrorCodes.IMAGE_TOO_LARGE])
    expect(err.name).toBe('AppError')
  })

  it('allows overriding the message', () => {
    const custom = 'Custom error message'
    const err = new AppError(ErrorCodes.INVALID_INPUT, custom)
    expect(err.message).toBe(custom)
    expect(err.code).toBe(ErrorCodes.INVALID_INPUT)
  })

  it('allows overriding the HTTP status', () => {
    const err = new AppError(ErrorCodes.INVALID_INPUT, undefined, 422)
    expect(err.status).toBe(422)
  })

  describe('defaultStatusForCode', () => {
    const cases = [
      [ErrorCodes.IMAGE_TOO_LARGE, 413],
      [ErrorCodes.INVALID_FILE_TYPE, 415],
      [ErrorCodes.OCR_PROCESSING_FAILED, 422],
      [ErrorCodes.API_QUOTA_EXCEEDED, 503],
      [ErrorCodes.DATABASE_ERROR, 503],
      [ErrorCodes.NETWORK_TIMEOUT, 504],
      [ErrorCodes.CORRUPTED_FILE, 422],
      [ErrorCodes.POOR_IMAGE_QUALITY, 422],
      [ErrorCodes.UPLOAD_FAILED, 502],
      [ErrorCodes.JOB_NOT_FOUND, 404],
      [ErrorCodes.JOB_NOT_COMPLETE, 202],
      [ErrorCodes.INVALID_INPUT, 400],
    ]

    test.each(cases)('code %s maps to status %i', (code, expectedStatus) => {
      expect(AppError.defaultStatusForCode(code)).toBe(expectedStatus)
    })

    it('returns 500 for an unknown code', () => {
      expect(AppError.defaultStatusForCode('UNKNOWN_CODE')).toBe(500)
    })
  })

  it('sets status from defaultStatusForCode when not provided', () => {
    const err = new AppError(ErrorCodes.JOB_NOT_FOUND)
    expect(err.status).toBe(404)
  })
})

describe('formatErrorResponse', () => {
  it('formats an AppError correctly', () => {
    const err = new AppError(ErrorCodes.IMAGE_TOO_LARGE)
    const response = formatErrorResponse(err)
    expect(response.error).toBe(ErrorMessages[ErrorCodes.IMAGE_TOO_LARGE])
    expect(response.code).toBe(ErrorCodes.IMAGE_TOO_LARGE)
    expect(response.details).toBeUndefined()
  })

  it('includes details when exposeDetails is true', () => {
    const err = new AppError(ErrorCodes.OCR_PROCESSING_FAILED)
    const response = formatErrorResponse(err, true)
    expect(response.details).toBeDefined()
  })

  it('formats a generic Error as generic message', () => {
    const err = new Error('internal error')
    const response = formatErrorResponse(err)
    expect(response.error).toBe('An unexpected error occurred.')
    expect(response.code).toBeUndefined()
    expect(response.details).toBeUndefined()
  })

  it('includes details for generic Error when exposeDetails is true', () => {
    const err = new Error('internal error')
    const response = formatErrorResponse(err, true)
    expect(response.details).toBe('internal error')
  })
})

describe('isQuotaExceededError', () => {
  it('returns false for null/undefined', () => {
    expect(isQuotaExceededError(null)).toBe(false)
    expect(isQuotaExceededError(undefined)).toBe(false)
  })

  it('detects error code 429', () => {
    const err = new Error('Too Many Requests')
    err.code = 429
    expect(isQuotaExceededError(err)).toBe(true)
  })

  it('detects "quota" in message (case-insensitive)', () => {
    expect(isQuotaExceededError(new Error('Quota exceeded'))).toBe(true)
    expect(isQuotaExceededError(new Error('QUOTA_EXCEEDED'))).toBe(true)
  })

  it('detects "resource_exhausted" in message', () => {
    expect(isQuotaExceededError(new Error('resource_exhausted'))).toBe(true)
  })

  it('detects "rate limit" in message', () => {
    expect(isQuotaExceededError(new Error('rate limit reached'))).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isQuotaExceededError(new Error('something else'))).toBe(false)
  })
})

describe('isTimeoutError', () => {
  it('returns false for null/undefined', () => {
    expect(isTimeoutError(null)).toBe(false)
    expect(isTimeoutError(undefined)).toBe(false)
  })

  const timeoutCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND']
  test.each(timeoutCodes)('detects error code %s', (code) => {
    const err = new Error('connection error')
    err.code = code
    expect(isTimeoutError(err)).toBe(true)
  })

  it('detects "timeout" in message', () => {
    expect(isTimeoutError(new Error('Request timeout after 5000ms'))).toBe(true)
  })

  it('detects "timed out" in message', () => {
    expect(isTimeoutError(new Error('The request timed out'))).toBe(true)
  })

  it('detects "network" in message', () => {
    expect(isTimeoutError(new Error('network error'))).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isTimeoutError(new Error('some other error'))).toBe(false)
  })
})
