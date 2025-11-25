// GTA 6 Tracker - Frontend JavaScript
// Cookie Management and User Tracking (Story 2.1)
// Stats Display (Story 3.1)

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
 * Track if user has already submitted a prediction
 * Used to switch between POST (create) and PUT (update) modes (Story 2.8)
 */
let hasExistingPrediction = false;

/**
 * Update the submit button text based on mode
 */
function updateSubmitButtonText() {
  const submitButton = document.querySelector('#prediction-form button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = hasExistingPrediction ? 'Update My Prediction' : 'Add My Prediction';
  }
}

/**
 * Handle form submission with validation and Turnstile (Story 2.3, 2.5B, 2.7, 2.8)
 * Updated workflow:
 * 1. Validate date (Story 2.3)
 * 2. Execute Cloudflare Turnstile (Story 2.5B)
 * 3. POST /api/predict (new) or PUT /api/predict (update) (Story 2.7, 2.8)
 * 4. Display comparison messaging (Story 3.2)
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

    // Submit prediction to API (Story 2.7 POST or Story 2.8 PUT)
    submitButton.textContent = hasExistingPrediction ? 'Updating...' : 'Submitting...';

    const response = await fetch('/api/predict', {
      method: hasExistingPrediction ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        predicted_date: dateValue,
        turnstile_token: turnstileToken || '',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle 409 Conflict - user already has a prediction
      if (response.status === 409) {
        hasExistingPrediction = true;
        updateSubmitButtonText();
        showValidationMessage(
          'You already have a prediction. Click "Update My Prediction" to change it.',
          'error'
        );
        return;
      }

      // Handle other API errors
      const errorMessage = result.error?.message || 'Failed to submit prediction';
      showValidationMessage(errorMessage, 'error');
      return;
    }

    // Mark that user now has a prediction
    hasExistingPrediction = true;
    updateSubmitButtonText();

    // Success! Display comparison (Story 3.2)
    console.log('Prediction submitted/updated successfully:', result);

    // Extract median from response (handle both POST and PUT response formats)
    const userDate = result.data?.predicted_date || result.predicted_date;
    const medianDate = result.data?.stats?.median;

    // Display social comparison (AC1: Immediately after submission)
    // Only show if we have median data (POST response has it, PUT might not)
    if (medianDate) {
      displayComparison(userDate, medianDate);
    }

    // Show success message
    const successMessage = hasExistingPrediction
      ? (result.message || 'Your prediction has been updated!')
      : (result.message || 'Your prediction has been recorded!');
    showValidationMessage(successMessage, 'success');

    // Refresh stats display to show updated count (bypass cache for fresh data)
    loadStats(true);

    // Clear the form
    dateInput.value = '';
  } catch (error) {
    console.error('Form submission error:', error);
    showValidationMessage(
      'An unexpected error occurred. Please try again.',
      'error'
    );
  } finally {
    // Re-enable submit button
    submitButton.disabled = false;
    updateSubmitButtonText();
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

// ============================================================================
// STATS DISPLAY MODULE (Story 3.1)
// ============================================================================

/**
 * Stats Display Configuration
 * AC: Stats from GET /api/stats (Story 2.10)
 */
const STATS_API_URL = '/api/stats';
const STATS_THRESHOLD = 50; // FR99: Minimum predictions to show median
const STATS_RETRY_DELAY = 3000; // 3 seconds
const STATS_MAX_RETRIES = 3;

/**
 * Stats Display DOM Elements (cached on init)
 */
let statsElements = null;

/**
 * Initialize stats DOM element references
 * Caches DOM lookups for performance
 */
function initStatsElements() {
  statsElements = {
    loading: document.getElementById('stats-loading'),
    content: document.getElementById('stats-content'),
    threshold: document.getElementById('stats-threshold'),
    error: document.getElementById('stats-error'),
    median: document.getElementById('stats-median'),
    count: document.getElementById('stats-count-value'),
    min: document.getElementById('stats-min'),
    max: document.getElementById('stats-max'),
    errorMessage: document.getElementById('stats-error-message'),
    retryBtn: document.getElementById('stats-retry-btn'),
    thresholdCount: document.getElementById('stats-threshold-count'),
  };
}

/**
 * Format a date string for locale-aware display
 * Converts ISO 8601 date to user-friendly format (e.g., "Feb 14, 2027")
 *
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns {string} Formatted date string for locale
 */
function formatDateForDisplay(dateString) {
  if (!dateString) return '--';

  try {
    const date = new Date(dateString + 'T00:00:00'); // Force UTC interpretation
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString;
  }
}

/**
 * Format a number with locale-specific thousand separators
 * AC2: Total predictions formatted with commas (e.g., "10,234")
 *
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '--';
  return num.toLocaleString();
}

/**
 * Format stats response for display
 * AC2: Locale-aware formatting for dates and numbers
 *
 * @param {object} stats - Raw stats from API { median, min, max, count, cached_at }
 * @returns {object} Formatted stats { median, min, max, count }
 */
function formatStats(stats) {
  return {
    median: formatDateForDisplay(stats.median),
    min: formatDateForDisplay(stats.min),
    max: formatDateForDisplay(stats.max),
    count: formatNumber(stats.count),
    rawCount: stats.count,
  };
}

/**
 * Show specific stats display state (loading, content, threshold, error)
 * Hides all states except the specified one
 *
 * @param {'loading' | 'content' | 'threshold' | 'error'} state - State to show
 */
function showStatsState(state) {
  if (!statsElements) return;

  const states = ['loading', 'content', 'threshold', 'error'];

  states.forEach((s) => {
    if (statsElements[s]) {
      if (s === state) {
        statsElements[s].classList.remove('hidden');
      } else {
        statsElements[s].classList.add('hidden');
      }
    }
  });
}

/**
 * Announce message to screen readers via ARIA live region
 * FR71: Screen reader announcements for dynamic updates
 *
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  // Use the stats-display section's aria-live region
  const statsSection = document.getElementById('stats-display');
  if (statsSection) {
    // Temporarily update sr-only heading to force announcement
    const heading = document.getElementById('stats-heading');
    if (heading) {
      heading.textContent = message;
      // Reset after announcement
      setTimeout(() => {
        heading.textContent = 'Community Prediction Statistics';
      }, 1000);
    }
  }
}

/**
 * Render stats data to the DOM
 * AC2: Display median, count, min/max
 * AC: FR99: Show threshold message if count < 50
 *
 * @param {object} stats - Raw stats from API
 */
function renderStats(stats) {
  if (!statsElements) return;

  const formatted = formatStats(stats);

  // FR99: Check threshold (< 50 predictions)
  if (formatted.rawCount < STATS_THRESHOLD) {
    // Show threshold message
    if (statsElements.thresholdCount) {
      statsElements.thresholdCount.textContent = formatted.rawCount.toString();
    }
    showStatsState('threshold');
    announceToScreenReader(`${formatted.rawCount} of 50 predictions submitted. Need more predictions to show community median.`);
    return;
  }

  // Update DOM elements with formatted stats
  if (statsElements.median) {
    statsElements.median.textContent = formatted.median;
  }
  if (statsElements.count) {
    statsElements.count.textContent = formatted.count;
  }
  if (statsElements.min) {
    statsElements.min.textContent = formatted.min;
  }
  if (statsElements.max) {
    statsElements.max.textContent = formatted.max;
  }

  showStatsState('content');

  // Announce stats loaded to screen readers
  announceToScreenReader(`Statistics loaded. Community median prediction: ${formatted.median}. ${formatted.count} predictions submitted.`);
}

/**
 * Show error state with message and retry button
 * AC: FR59 - User-friendly error messages
 *
 * @param {string} message - Error message to display
 */
function showStatsError(message) {
  if (!statsElements) return;

  if (statsElements.errorMessage) {
    statsElements.errorMessage.textContent = message || 'Unable to load statistics';
  }

  showStatsState('error');
}

/**
 * Fetch statistics from API with retry logic
 * AC: Async data loading with error handling
 *
 * @param {number} retryCount - Current retry attempt (0-indexed)
 * @param {boolean} bypassCache - Force fresh fetch, bypassing browser cache
 * @returns {Promise<object>} Stats data or throws error
 */
async function fetchStats(retryCount = 0, bypassCache = false) {
  try {
    const fetchOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };

    // Bypass browser cache if requested (e.g., after submission)
    if (bypassCache) {
      fetchOptions.cache = 'no-store';
    }

    const response = await fetch(STATS_API_URL, fetchOptions);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Log cache status for debugging
    const cacheStatus = response.headers.get('X-Cache');
    console.log('Stats fetched:', { cacheStatus, count: data.count });

    return data;
  } catch (error) {
    console.error('Stats fetch error:', error.message, { retryCount });

    // Retry logic
    if (retryCount < STATS_MAX_RETRIES - 1) {
      console.log(`Retrying stats fetch in ${STATS_RETRY_DELAY}ms... (attempt ${retryCount + 2}/${STATS_MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, STATS_RETRY_DELAY));
      return fetchStats(retryCount + 1);
    }

    throw error;
  }
}

/**
 * Load and display statistics
 * Main entry point for stats display functionality
 * Shows loading state, fetches data, renders or shows error
 *
 * @param {boolean} bypassCache - Force fresh fetch, bypassing browser cache
 */
async function loadStats(bypassCache = false) {
  // Show loading state
  showStatsState('loading');

  try {
    const stats = await fetchStats(0, bypassCache);
    renderStats(stats);
  } catch (error) {
    console.error('Failed to load stats after retries:', error.message);
    showStatsError('Unable to load statistics. Please try again.');
  }
}

/**
 * Handle retry button click
 * AC: FR59 - Retry mechanism for error recovery
 */
function handleStatsRetry() {
  console.log('Retrying stats load...');
  loadStats();
}

/**
 * Initialize stats display module
 * Sets up DOM references, event listeners, and triggers initial load
 */
function initStatsDisplay() {
  // Cache DOM elements
  initStatsElements();

  // Set up retry button handler
  if (statsElements && statsElements.retryBtn) {
    statsElements.retryBtn.addEventListener('click', handleStatsRetry);
  }

  // Initial stats load
  loadStats();
}

// ============================================================================
// Social Comparison Display (Story 3.2)
// ============================================================================

/**
 * DOM elements for comparison display
 */
let comparisonElements = null;

/**
 * Initialize and cache comparison display DOM elements
 */
function initComparisonElements() {
  comparisonElements = {
    container: document.getElementById('comparison-display'),
    emoji: document.getElementById('comparison-emoji'),
    message: document.getElementById('comparison-message'),
    personality: document.getElementById('comparison-personality'),
    delta: document.getElementById('comparison-delta'),
    userDate: document.getElementById('comparison-user-date'),
    medianDate: document.getElementById('comparison-median-date')
  };
}

// Note: formatDateForDisplay() is defined earlier in the file (line 532)
// and is reused here for consistency

/**
 * Display social comparison messaging
 * AC1: Comparison message shown immediately after successful submission
 *
 * @param {string} userDate - User's predicted date (ISO format)
 * @param {string} medianDate - Community median date (ISO format)
 */
function displayComparison(userDate, medianDate) {
  if (!comparisonElements) {
    initComparisonElements();
  }

  // Get comparison result using comparison.js module
  const comparison = getComparisonMessage(userDate, medianDate);

  // Update emoji (AC3: Direction emoji)
  if (comparisonElements.emoji) {
    comparisonElements.emoji.textContent = comparison.emoji;
  }

  // Update primary message (AC2: Days difference)
  if (comparisonElements.message) {
    comparisonElements.message.textContent = comparison.message;
  }

  // Update personality message (AC4: Personality thresholds)
  if (comparisonElements.personality) {
    comparisonElements.personality.textContent = comparison.personality;
  }

  // Update delta quantification (AC5: Large differences in months)
  if (comparisonElements.delta) {
    // Use DOM manipulation for XSS safety instead of innerHTML
    comparisonElements.delta.textContent = ''; // Clear existing content
    const deltaSpan = document.createElement('span');
    deltaSpan.className = 'font-semibold';
    deltaSpan.textContent = comparison.formattedDelta;
    comparisonElements.delta.appendChild(deltaSpan);
    comparisonElements.delta.appendChild(document.createTextNode(' difference'));
  }

  // Update dates for clarity (AC6: Both dates shown)
  if (comparisonElements.userDate) {
    comparisonElements.userDate.textContent = formatDateForDisplay(userDate);
  }
  if (comparisonElements.medianDate) {
    comparisonElements.medianDate.textContent = formatDateForDisplay(medianDate);
  }

  // Show the comparison section with animation
  if (comparisonElements.container) {
    comparisonElements.container.classList.remove('hidden');
    // Smooth scroll to comparison
    setTimeout(() => {
      comparisonElements.container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  console.log('Comparison displayed:', comparison);
}

/**
 * Hide comparison display
 */
function hideComparison() {
  if (!comparisonElements) {
    initComparisonElements();
  }

  if (comparisonElements.container) {
    comparisonElements.container.classList.add('hidden');
  }
}

/**
 * Application Initialization
 * Runs on page load to set up cookie tracking, form handling, and stats display
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

  // Initialize stats display (Story 3.1)
  initStatsDisplay();

  console.log('Date picker initialized with validation');
  console.log('Stats display initialized');
});

// Export functions for testing and future use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Cookie management (Story 2.1)
    generateCookieID,
    validateCookieID,
    initializeCookieID,
    getCookieID,
    COOKIE_NAME,
    COOKIE_MAX_AGE_DAYS,
    // Date validation (Story 2.3)
    isValidDateFormat,
    validateDateRange,
    validateDate,
    // Stats display (Story 3.1)
    formatDateForDisplay,
    formatNumber,
    formatStats,
    showStatsState,
    renderStats,
    showStatsError,
    fetchStats,
    loadStats,
    initStatsDisplay,
    announceToScreenReader,
    STATS_THRESHOLD,
  };
}
