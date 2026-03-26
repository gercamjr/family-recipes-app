const { retryWithBackoff, sleep } = require('../utils/retry')

describe('retryWithBackoff', () => {
  let mockSleep

  beforeEach(() => {
    mockSleep = jest.fn().mockResolvedValue(undefined)
    // Silence expected retry warnings in test output
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    console.warn.mockRestore()
  })

  // Helper: common options that disable jitter and inject mock sleep
  const opts = (extra = {}) => ({ jitter: false, _sleep: mockSleep, ...extra })

  it('returns the result immediately when fn succeeds on the first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await retryWithBackoff(fn, opts({ maxAttempts: 3 }))
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(mockSleep).not.toHaveBeenCalled()
  })

  it('retries on failure and returns result on a later attempt', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success on attempt 3')

    const result = await retryWithBackoff(fn, opts({ maxAttempts: 3, initialDelayMs: 100 }))
    expect(result).toBe('success on attempt 3')
    expect(fn).toHaveBeenCalledTimes(3)
    expect(mockSleep).toHaveBeenCalledTimes(2)
  })

  it('throws the last error after exhausting all attempts', async () => {
    const error = new Error('persistent failure')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(retryWithBackoff(fn, opts({ maxAttempts: 3 }))).rejects.toThrow('persistent failure')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry when maxAttempts is 1', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'))
    await expect(retryWithBackoff(fn, opts({ maxAttempts: 1 }))).rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(mockSleep).not.toHaveBeenCalled()
  })

  it('stops early when shouldRetry returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('non-retriable'))
    const shouldRetry = jest.fn().mockReturnValue(false)

    await expect(retryWithBackoff(fn, opts({ maxAttempts: 3, shouldRetry }))).rejects.toThrow('non-retriable')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledTimes(1)
    expect(mockSleep).not.toHaveBeenCalled()
  })

  it('calls shouldRetry with the error and attempt number', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('err1'))
      .mockRejectedValueOnce(new Error('err2'))
      .mockResolvedValue('ok')

    const shouldRetry = jest.fn().mockReturnValue(true)

    await retryWithBackoff(fn, opts({ maxAttempts: 3, shouldRetry }))

    expect(shouldRetry).toHaveBeenCalledTimes(2)
    expect(shouldRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1)
    expect(shouldRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2)
  })

  it('calls the onRetry callback with error, attempt number, and delay', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValue('ok')

    const onRetry = jest.fn()

    await retryWithBackoff(fn, opts({ maxAttempts: 3, initialDelayMs: 500, onRetry }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 500)
  })

  it('logs a warning to console when no onRetry is provided', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('retry warning'))
      .mockResolvedValue('ok')

    await retryWithBackoff(fn, opts({ maxAttempts: 2 }))

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('retry'))
  })

  it('applies exponential backoff: second delay is double the first', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValue('ok')

    await retryWithBackoff(fn, opts({ maxAttempts: 3, initialDelayMs: 1000, factor: 2, onRetry: () => {} }))

    expect(mockSleep).toHaveBeenCalledTimes(2)
    const [firstDelay] = mockSleep.mock.calls[0]
    const [secondDelay] = mockSleep.mock.calls[1]
    expect(secondDelay).toBe(firstDelay * 2)
  })

  it('caps delay at maxDelayMs', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValue('ok')

    await retryWithBackoff(fn, opts({ maxAttempts: 3, initialDelayMs: 50000, maxDelayMs: 5000, factor: 2, onRetry: () => {} }))

    for (const [delay] of mockSleep.mock.calls) {
      expect(delay).toBeLessThanOrEqual(5000)
    }
  })

  it('applies jitter so delays are not exactly equal across runs', async () => {
    // Run multiple times and collect delays; they should vary due to jitter
    const delays = []
    for (let i = 0; i < 10; i++) {
      const localMockSleep = jest.fn().mockResolvedValue(undefined)
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('e'))
        .mockResolvedValue('ok')

      await retryWithBackoff(fn, {
        maxAttempts: 2,
        initialDelayMs: 1000,
        jitter: true,
        onRetry: () => {},
        _sleep: localMockSleep,
      })
      delays.push(localMockSleep.mock.calls[0][0])
    }

    // With jitter, delays should not all be identical
    const unique = new Set(delays)
    expect(unique.size).toBeGreaterThan(1)
  })

  it('passes through non-Error rejections', async () => {
    const fn = jest.fn().mockRejectedValue('string error')
    await expect(retryWithBackoff(fn, opts({ maxAttempts: 1 }))).rejects.toBe('string error')
  })
})

describe('sleep', () => {
  it('is a function exported from the module', () => {
    expect(typeof sleep).toBe('function')
  })

  it('resolves after approximately the specified time', async () => {
    jest.useFakeTimers()
    const p = sleep(100)
    jest.advanceTimersByTime(100)
    await expect(p).resolves.toBeUndefined()
    jest.useRealTimers()
  })
})

