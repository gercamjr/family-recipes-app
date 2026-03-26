/**
 * Retry utility with exponential backoff.
 *
 * Retries an async function up to `maxAttempts` times, doubling the delay
 * between each attempt (with optional jitter) up to `maxDelayMs`.
 */

/**
 * @typedef {Object} RetryOptions
 * @property {number} [maxAttempts=3]       - Maximum number of total attempts (including the first).
 * @property {number} [initialDelayMs=1000] - Delay before the second attempt in ms.
 * @property {number} [maxDelayMs=30000]    - Upper bound on any single delay.
 * @property {number} [factor=2]            - Backoff multiplication factor.
 * @property {boolean} [jitter=true]        - Add random jitter to the delay.
 * @property {function(Error, number): boolean} [shouldRetry] - Predicate; return false to stop early.
 * @property {function(Error, number, number): void} [onRetry] - Called before each retry attempt.
 * @property {function(number): Promise<void>} [_sleep]        - Override sleep for testing.
 */

/**
 * Executes `fn` with exponential-backoff retry logic.
 *
 * @template T
 * @param {() => Promise<T>} fn           - The async function to execute.
 * @param {RetryOptions}     [options={}]
 * @returns {Promise<T>}
 * @throws The last error thrown by `fn` if all attempts are exhausted.
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    factor = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry = null,
    _sleep = sleep,
  } = options

  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      const isLastAttempt = attempt === maxAttempts
      if (isLastAttempt || !shouldRetry(err, attempt)) {
        throw err
      }

      // Calculate exponential delay: initialDelayMs * factor^(attempt - 1)
      let delayMs = Math.min(initialDelayMs * Math.pow(factor, attempt - 1), maxDelayMs)

      // Add ±20% jitter to avoid thundering-herd
      if (jitter) {
        const jitterAmount = delayMs * 0.2
        delayMs = delayMs + (Math.random() * 2 - 1) * jitterAmount
      }

      delayMs = Math.round(delayMs)

      if (onRetry) {
        onRetry(err, attempt, delayMs)
      } else {
        console.warn(
          `[retry] Attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying in ${delayMs}ms…`,
        )
      }

      await _sleep(delayMs)
    }
  }

  // Should never reach here, but just in case
  throw lastError
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = { retryWithBackoff, sleep }

