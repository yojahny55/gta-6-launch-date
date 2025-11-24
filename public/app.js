// GTA 6 Tracker - Frontend JavaScript
// Cookie Management and User Tracking (Story 2.1)

/**
 * Cookie Configuration Constants
 * Per ADR-010 and AC1: Security flags for user tracking
 */
const COOKIE_NAME = 'gta6_user_id';
const COOKIE_MAX_AGE_DAYS = 730; // 2 years (63072000 seconds / 86400)
const COOKIE_OPTIONS = {
  expires: COOKIE_MAX_AGE_DAYS, // js-cookie uses days, not seconds
  secure: true,                  // HTTPS only (prevents MITM attacks)
  sameSite: 'strict',           // Prevents CSRF attacks
  path: '/'                      // Site-wide access
};

/**
 * UUID v4 validation regex
 * Format: 8-4-4-4-12 hex digits with '4' in version position and '[89ab]' in variant position
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generate a cryptographically secure cookie ID using UUID v4
 * Uses Web Crypto API's crypto.randomUUID() which provides CSPRNG
 *
 * @returns {string} UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
function generateCookieID() {
  if (!crypto || !crypto.randomUUID) {
    console.error('Web Crypto API not available. Fallback to Math.random (INSECURE)');
    // Fallback for very old browsers (should never happen in practice)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  return crypto.randomUUID();
}

/**
 * Validate if a given string is a valid UUID v4 format
 *
 * @param {string} cookieId - The cookie ID to validate
 * @returns {boolean} True if valid UUID v4, false otherwise
 */
function validateCookieID(cookieId) {
  if (!cookieId || typeof cookieId !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(cookieId);
}

/**
 * Simple cookie utility functions (inline, no external dependency for now)
 * Note: js-cookie library will be loaded from CDN for production
 */
const Cookies = {
  /**
   * Set a cookie with options
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {object} options - Cookie options (expires, secure, sameSite, path)
   */
  set(name, value, options = {}) {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      const date = new Date();
      date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.secure) {
      cookieString += '; secure';
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  },

  /**
   * Get a cookie by name
   * @param {string} name - Cookie name
   * @returns {string|undefined} Cookie value or undefined
   */
  get(name) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const targetCookie = cookies.find(cookie => cookie.startsWith(`${name}=`));

    if (!targetCookie) {
      return undefined;
    }

    const value = targetCookie.substring(name.length + 1);
    return decodeURIComponent(value);
  }
};

/**
 * Initialize or retrieve user cookie ID
 *
 * Workflow per AC1:
 * 1. Check for existing cookie
 * 2. If exists: validate format → use existing
 * 3. If invalid: regenerate and replace
 * 4. If no cookie: generate UUID → set cookie with security flags
 *
 * @returns {string} User's cookie ID (UUID v4)
 */
function initializeCookieID() {
  // Check for existing cookie
  let cookieId = Cookies.get(COOKIE_NAME);

  if (cookieId) {
    // Validate existing cookie format
    if (validateCookieID(cookieId)) {
      console.log('Cookie already exists (valid):', cookieId);
      return cookieId;
    } else {
      // Invalid cookie: regenerate
      console.warn('Invalid cookie format detected. Regenerating...', cookieId);
      cookieId = generateCookieID();
      Cookies.set(COOKIE_NAME, cookieId, COOKIE_OPTIONS);
      console.log('Cookie regenerated:', cookieId);
      return cookieId;
    }
  } else {
    // No cookie: generate new UUID
    cookieId = generateCookieID();
    Cookies.set(COOKIE_NAME, cookieId, COOKIE_OPTIONS);
    console.log('Cookie generated (first visit):', cookieId);
    return cookieId;
  }
}

/**
 * Get the current user's cookie ID
 * @returns {string|undefined} Current cookie ID or undefined if not set
 */
function getCookieID() {
  return Cookies.get(COOKIE_NAME);
}

/**
 * Date Validation Constants (Story 2.3)
 * Mirrors backend validation rules from src/utils/date-validation.ts
 *
 * NOTE: DATE_REGEX only validates format (YYYY-MM-DD), not range.
 * Range validation (2025-2125) happens separately in validateDateRange().
 * This ensures consistency between frontend and backend validation logic.
 */
const MIN_DATE = '2025-01-01';
const MAX_DATE = '2125-12-31';
const DATE_REGEX =
  /^(\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/**
 * Validate date format (ISO 8601: YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid format
 */
function isValidDateFormat(date) {
  if (!date || typeof date !== 'string') {
    return false;
  }
  return DATE_REGEX.test(date);
}

/**
 * Validate date is within allowed range (2025-01-01 to 2125-12-31)
 * @param {string} dateString - ISO 8601 date string
 * @returns {boolean} True if within range
 */
function validateDateRange(dateString) {
  const date = new Date(dateString);
  const min = new Date(MIN_DATE);
  const max = new Date(MAX_DATE);
  return date >= min && date <= max;
}

/**
 * Comprehensive date validation with user-friendly error messages
 * @param {string} dateString - Date to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateDate(dateString) {
  // Check format
  if (!isValidDateFormat(dateString)) {
    return { valid: false, error: 'Please enter a valid date' };
  }

  // Check range
  const date = new Date(dateString);
  const min = new Date(MIN_DATE);
  const max = new Date(MAX_DATE);

  if (date < min) {
    return { valid: false, error: "GTA 6 can't launch in the past!" };
  }

  if (date > max) {
    return {
      valid: false,
      error: 'Please select a date between Jan 1, 2025 and Dec 31, 2125',
    };
  }

  return { valid: true };
}

/**
 * Display validation message to user (AC3: user-friendly messages)
 * @param {string|null} message - Error message or null to clear
 * @param {string} type - Message type: 'error' or 'success'
 */
function showValidationMessage(message, type = 'error') {
  const messageDiv = document.getElementById('validation-message');

  if (!message) {
    // Clear message (use textContent to avoid XSS)
    messageDiv.classList.add('hidden');
    messageDiv.textContent = '';
    return;
  }

  // Show message with appropriate styling
  messageDiv.classList.remove('hidden');
  const alertClass = type === 'error' ? 'alert-error' : 'alert-success';

  // Create alert div (avoid innerHTML to prevent XSS)
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${alertClass} shadow-lg`;

  // Create SVG icon
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'stroke-current flex-shrink-0 h-6 w-6');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('viewBox', '0 0 24 24');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('d', 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z');

  svg.appendChild(path);

  // Create message span with textContent (prevents XSS)
  const span = document.createElement('span');
  span.textContent = message;

  // Assemble the alert
  alertDiv.appendChild(svg);
  alertDiv.appendChild(span);

  // Clear previous content and append new alert
  messageDiv.textContent = '';
  messageDiv.appendChild(alertDiv);
}

/**
 * Cloudflare Turnstile Configuration (Story 2.5B)
 * IMPORTANT: Replace with actual site key from Cloudflare Turnstile Dashboard
 */
const TURNSTILE_SITE_KEY = '0x4AAAAAACCQiDtgUQCqo0gC'; // TODO: Set from environment variable or build config

/**
 * Track if Turnstile widget has been rendered
 * Prevents multiple render calls on the same container
 */
let turnstileWidgetId = null;

/**
 * Execute Cloudflare Turnstile and get token
 * Implements AC1 (Frontend Turnstile execution)
 *
 * Uses managed mode (invisible) - no user interaction required for most users
 * Widget renders in background and completes challenge automatically
 *
 * @returns {Promise<string>} Turnstile token
 * @throws {Error} If turnstile not loaded or execution fails
 */
function executeTurnstile() {
  return new Promise((resolve, reject) => {
    // Check if turnstile is loaded
    if (typeof turnstile === 'undefined' || !turnstile.render) {
      console.warn('Turnstile not loaded. Allowing submission without verification (degraded mode).');
      // Return empty token - backend will handle gracefully (fail open)
      resolve('');
      return;
    }

    try {
      // Remove previous widget if exists
      if (turnstileWidgetId !== null) {
        try {
          turnstile.remove(turnstileWidgetId);
          turnstileWidgetId = null;
        } catch (removeError) {
          console.warn('Could not remove previous Turnstile widget:', removeError);
        }
      }

      // Render Turnstile widget (managed mode - invisible to most users)
      // AC1: Execute Turnstile on form submit
      turnstileWidgetId = turnstile.render('#turnstile-container', {
        sitekey: TURNSTILE_SITE_KEY,
        callback: function(token) {
          // Challenge completed successfully
          console.log('Turnstile token generated successfully');
          resolve(token);
        },
        'error-callback': function() {
          // Challenge failed or error occurred
          console.warn('Turnstile challenge failed. Allowing submission (degraded mode).');
          // Return empty token - backend will handle gracefully (fail open)
          resolve('');
        },
        'timeout-callback': function() {
          // Challenge timed out
          console.warn('Turnstile challenge timed out. Allowing submission (degraded mode).');
          // Return empty token - backend will handle gracefully (fail open)
          resolve('');
        }
      });
    } catch (error) {
      console.error('Turnstile execution failed:', error);
      // Return empty token - backend will handle gracefully (fail open)
      resolve('');
    }
  });
}

/**
 * Handle form submission with validation and Turnstile (Story 2.3, Story 2.5B)
 * Updated workflow:
 * 1. Validate date (Story 2.3)
 * 2. Execute Cloudflare Turnstile (Story 2.5B)
 * 3. Send to API endpoint with token (Story 2.7 - future)
 *
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const dateInput = document.getElementById('predicted-date');
  const dateValue = dateInput.value;
  const submitButton = event.target.querySelector('button[type="submit"]');

  // Clear previous validation messages
  showValidationMessage(null);

  // Validate date
  const validation = validateDate(dateValue);

  if (!validation.valid) {
    showValidationMessage(validation.error, 'error');
    dateInput.focus();
    return;
  }

  // Disable submit button to prevent double submission
  submitButton.disabled = true;
  submitButton.textContent = 'Verifying...';

  try {
    // Execute Cloudflare Turnstile (AC1: Frontend execution)
    const turnstileToken = await executeTurnstile();

    if (!turnstileToken) {
      console.warn('Turnstile token is empty. Proceeding anyway (degraded mode).');
    }

    // TODO (Story 2.7): Send to API endpoint
    console.log('Date validated successfully:', dateValue);
    console.log('Turnstile token:', turnstileToken ? 'Generated' : 'Empty (degraded mode)');

    showValidationMessage(
      'Prediction validated! Turnstile executed. (API integration pending)',
      'success'
    );
  } catch (error) {
    console.error('Form submission error:', error);
    showValidationMessage(
      'An unexpected error occurred. Please try again.',
      'error'
    );
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Prediction';
  }
}

/**
 * Clear date picker (Escape key handler for AC: keyboard accessibility)
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    const dateInput = document.getElementById('predicted-date');
    dateInput.value = '';
    showValidationMessage(null);
  }
}

/**
 * Application Initialization
 * Runs on page load to set up cookie tracking and form handling
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('GTA 6 Tracker initialized');

  // Initialize cookie ID (AC1: generate on first visit, persist across sessions)
  const userId = initializeCookieID();

  // Log cookie generation event for debugging (as per AC1)
  console.log('User ID:', userId);
  console.log('Cookie flags:', COOKIE_OPTIONS);

  // Store in global scope for later use by form submission logic
  window.userCookieID = userId;

  // Set up form submission handler (Story 2.3, AC3)
  const form = document.getElementById('prediction-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Set up keyboard accessibility (Story 2.3, Task 5)
  document.addEventListener('keydown', handleEscapeKey);

  console.log('Date picker initialized with validation');
});

// Export functions for testing and future use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateCookieID,
    validateCookieID,
    initializeCookieID,
    getCookieID,
    COOKIE_NAME,
    COOKIE_MAX_AGE_DAYS
  };
}
