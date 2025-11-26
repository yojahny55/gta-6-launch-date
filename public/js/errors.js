/**
 * Error Handling Module (Story 3.5: Error Handling with Retry Mechanisms)
 *
 * Provides centralized error handling, retry logic with exponential backoff,
 * user-friendly error messages, and fallback behaviors for resilience.
 *
 * Integrates with submission (Story 3.3) and stats display (Story 3.1).
 */

/**
 * Error Code Types
 * Maps various error scenarios to user-friendly codes
 */
export const ErrorCode = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONFLICT: 'CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  TURNSTILE_FAILED: 'TURNSTILE_FAILED'
};

/**
 * Retry Configuration
 * Per AC2: Auto-retry after 3 seconds, max 3 attempts, 10s total timeout
 * Exponential backoff: 1s, 2s, 4s
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2     // 1s → 2s → 4s
};

/**
 * Error Messages
 * User-friendly messages mapped to error codes (AC1-AC8)
 */
const ERROR_MESSAGES = {
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect. Please check your internet and try again.',
  [ErrorCode.VALIDATION_ERROR]: 'Please enter a valid date.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Slow down! Please wait {seconds} seconds.',
  [ErrorCode.CONFLICT]: "You've already submitted. Update your prediction instead.",
  [ErrorCode.NOT_FOUND]: 'Prediction not found. Please try submitting again.',
  [ErrorCode.SERVER_ERROR]: 'Something went wrong on our end. Please try again in a moment.',
  [ErrorCode.TURNSTILE_FAILED]: 'Verification failed. Please try again.'
};

/**
 * Classify an error and determine if it's retryable
 * Handles network errors, API errors, and Turnstile failures
 *
 * @param {Error|Response} error - Error object or fetch Response
 * @returns {Promise<{code: string, message: string, retryable: boolean, details?: any}>}
 */
export async function classifyError(error) {
  // Network error (TypeError from fetch)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      retryable: true
    };
  }

  // Generic network error
  if (error instanceof TypeError || error.name === 'NetworkError') {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      retryable: true
    };
  }

  // API Response error
  if (error instanceof Response) {
    const status = error.status;
    let errorBody = null;

    try {
      errorBody = await error.json();
    } catch (jsonError) {
      // Could not parse JSON, use default message
    }

    // AC3: 400 Bad Request - Validation error
    if (status === 400) {
      const message = errorBody?.error?.message || ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR];
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        retryable: false,
        details: errorBody?.error?.details
      };
    }

    // AC4: 409 Conflict - Already submitted
    if (status === 409) {
      return {
        code: ErrorCode.CONFLICT,
        message: ERROR_MESSAGES[ErrorCode.CONFLICT],
        retryable: false
      };
    }

    // AC5: 429 Rate Limit - Extract wait time from Retry-After header
    if (status === 429) {
      const retryAfter = error.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
      const message = ERROR_MESSAGES[ErrorCode.RATE_LIMIT_EXCEEDED].replace('{seconds}', waitSeconds);
      return {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message,
        retryable: true,
        details: { waitSeconds }
      };
    }

    // AC6: 500 Server Error
    if (status >= 500) {
      return {
        code: ErrorCode.SERVER_ERROR,
        message: ERROR_MESSAGES[ErrorCode.SERVER_ERROR],
        retryable: true
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        code: ErrorCode.NOT_FOUND,
        message: ERROR_MESSAGES[ErrorCode.NOT_FOUND],
        retryable: false
      };
    }
  }

  // Turnstile-specific error
  if (error.message && error.message.includes('Turnstile')) {
    return {
      code: ErrorCode.TURNSTILE_FAILED,
      message: ERROR_MESSAGES[ErrorCode.TURNSTILE_FAILED],
      retryable: true
    };
  }

  // Generic/unknown error (AC7: Database errors - generic message)
  return {
    code: ErrorCode.SERVER_ERROR,
    message: 'Unable to save your prediction. Please try again.',
    retryable: false
  };
}

/**
 * Fetch with retry logic and exponential backoff
 * AC1-AC2: Network errors with auto-retry (max 3 attempts, 10s timeout)
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {object} config - Retry configuration (optional)
 * @returns {Promise<Response>} Fetch response
 * @throws {Response|Error} Last error if all attempts fail
 */
export async function fetchWithRetry(url, options = {}, config = RETRY_CONFIG) {
  let lastError = null;
  let totalDelay = 0;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Attempt fetch
      const response = await fetch(url, options);

      // If response is OK (2xx), return it
      if (response.ok) {
        return response;
      }

      // If response is not OK, classify and decide if retryable
      const errorInfo = await classifyError(response.clone());

      if (!errorInfo.retryable || attempt === config.maxAttempts - 1) {
        // Not retryable or last attempt - throw the response
        throw response;
      }

      // Retryable error - calculate backoff delay
      lastError = response;
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      totalDelay += delay;

      // AC2: Timeout after 10 seconds total
      if (totalDelay >= config.maxDelay) {
        console.warn('Total retry timeout exceeded (10s)');
        throw response;
      }

      console.log(`Retry attempt ${attempt + 1}/${config.maxAttempts} after ${delay}ms`);
      await sleep(delay);

    } catch (error) {
      // Network error (TypeError)
      const errorInfo = await classifyError(error);

      if (!errorInfo.retryable || attempt === config.maxAttempts - 1) {
        // Not retryable or last attempt - throw the error
        throw error;
      }

      // Retryable error - calculate backoff delay
      lastError = error;
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      totalDelay += delay;

      // AC2: Timeout after 10 seconds total
      if (totalDelay >= config.maxDelay) {
        console.warn('Total retry timeout exceeded (10s)');
        throw error;
      }

      console.log(`Retry attempt ${attempt + 1}/${config.maxAttempts} after ${delay}ms`);
      await sleep(delay);
    }
  }

  // All attempts failed - throw last error
  throw lastError;
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show error message to user (AC8: Error UI design)
 * Creates/updates error container with appropriate styling
 *
 * @param {string} code - Error code from ErrorCode enum
 * @param {object} details - Additional error details (e.g., waitSeconds for rate limit)
 */
export function showError(code, details = {}) {
  const errorContainer = document.getElementById('error-container');

  if (!errorContainer) {
    console.error('Error container not found in DOM');
    return;
  }

  // Get error message template
  let message = ERROR_MESSAGES[code] || 'An error occurred. Please try again.';

  // Replace placeholders in message (e.g., {seconds} for rate limit)
  if (details.waitSeconds && code === ErrorCode.RATE_LIMIT_EXCEEDED) {
    message = message.replace('{seconds}', details.waitSeconds);
  }

  // Build error UI (AC8: Red/orange colors, retry/dismiss buttons)
  errorContainer.innerHTML = `
    <div class="alert alert-error shadow-lg" role="alert" aria-live="assertive">
      <div class="flex items-start gap-4 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <span>${escapeHtml(message)}</span>
        </div>
        <div class="flex gap-2">
          ${isRetryable(code) ? '<button id="error-retry-btn" class="btn btn-sm">Retry</button>' : ''}
          <button id="error-dismiss-btn" class="btn btn-sm btn-ghost" aria-label="Dismiss error">✕</button>
        </div>
      </div>
    </div>
  `;

  // Show error container
  errorContainer.classList.remove('hidden');

  // Add event listeners
  const dismissBtn = document.getElementById('error-dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', hideError);
  }

  const retryBtn = document.getElementById('error-retry-btn');
  if (retryBtn && details.retryCallback) {
    retryBtn.addEventListener('click', () => {
      hideError();
      details.retryCallback();
    });
  }

  // For rate limit errors with countdown (AC5)
  if (code === ErrorCode.RATE_LIMIT_EXCEEDED && details.waitSeconds) {
    startRateLimitCountdown(details.waitSeconds);
  }
}

/**
 * Active countdown timer ID for rate limit errors
 * Tracked globally to prevent memory leaks
 */
let rateLimitCountdownTimer = null;

/**
 * Hide error message (AC8: Dismiss button)
 */
export function hideError() {
  // Clear any active rate limit countdown timer to prevent memory leak
  if (rateLimitCountdownTimer) {
    clearTimeout(rateLimitCountdownTimer);
    rateLimitCountdownTimer = null;
  }

  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.classList.add('hidden');
    errorContainer.innerHTML = '';
  }
}

/**
 * Determine if error code is retryable
 * @param {string} code - Error code
 * @returns {boolean}
 */
function isRetryable(code) {
  return [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.SERVER_ERROR,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    ErrorCode.TURNSTILE_FAILED
  ].includes(code);
}

/**
 * Start countdown for rate limit errors (AC5)
 * @param {number} seconds - Seconds to wait
 */
function startRateLimitCountdown(seconds) {
  // Clear any existing countdown timer before starting new one
  if (rateLimitCountdownTimer) {
    clearTimeout(rateLimitCountdownTimer);
    rateLimitCountdownTimer = null;
  }

  let remaining = seconds;
  const updateCountdown = () => {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer || errorContainer.classList.contains('hidden')) {
      // Clear timer and stop if error was dismissed
      rateLimitCountdownTimer = null;
      return;
    }

    const message = ERROR_MESSAGES[ErrorCode.RATE_LIMIT_EXCEEDED].replace('{seconds}', remaining);
    const messageSpan = errorContainer.querySelector('span');
    if (messageSpan) {
      messageSpan.textContent = message;
    }

    remaining--;

    if (remaining > 0) {
      // Store timer ID to allow cleanup
      rateLimitCountdownTimer = setTimeout(updateCountdown, 1000);
    } else {
      // Countdown complete - hide error and clear timer
      rateLimitCountdownTimer = null;
      hideError();
    }
  };

  updateCountdown();
}

/**
 * Escape HTML to prevent XSS (AC8: Security)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Save submission to localStorage for retry (AC11: Fallback behavior)
 * Used when submission fails and user wants to retry later
 *
 * @param {object} data - Submission data {predicted_date, turnstile_token}
 */
export function saveSubmissionToLocalStorage(data) {
  try {
    const submissionData = {
      predicted_date: data.predicted_date,
      turnstile_token: data.turnstile_token,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('gta6_pending_submission', JSON.stringify(submissionData));
    console.log('Submission saved to localStorage for retry');
  } catch (error) {
    console.error('Failed to save submission to localStorage:', error);
  }
}

/**
 * Retrieve pending submission from localStorage
 * @returns {object|null} Submission data or null
 */
export function getPendingSubmission() {
  try {
    const data = localStorage.getItem('gta6_pending_submission');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve pending submission:', error);
    return null;
  }
}

/**
 * Clear pending submission from localStorage
 */
export function clearPendingSubmission() {
  try {
    localStorage.removeItem('gta6_pending_submission');
  } catch (error) {
    console.error('Failed to clear pending submission:', error);
  }
}

/**
 * Log error for monitoring (AC7: Detailed server-side logging)
 * In production, this would send to an error tracking service
 *
 * @param {string} context - Context where error occurred
 * @param {Error|Response} error - The error object
 * @param {object} additionalInfo - Additional context
 */
export function logError(context, error, additionalInfo = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message || error.statusText || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack
    },
    ...additionalInfo
  };

  console.error('Error logged:', errorLog);

  // TODO: In production, send to error tracking service (e.g., Sentry, LogRocket)
  // Example: Sentry.captureException(error, { extra: errorLog });
}
