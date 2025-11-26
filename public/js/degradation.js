/**
 * Degradation Notice Module (Story 3.7)
 * Displays degradation banners, disables features, and shows countdowns
 * Fetches degradation state from /api/degradation and updates UI
 */

/**
 * Degradation state cache
 * Prevents excessive API calls during page lifecycle
 */
let degradationCache = {
  data: null,
  timestamp: null,
  ttl: 60000, // 1 minute cache
};

/**
 * Fetch current degradation state from API
 * @returns {Promise<Object>} Degradation state with level, features, message
 */
async function fetchDegradationState() {
  // Check cache first
  if (degradationCache.data && degradationCache.timestamp) {
    const age = Date.now() - degradationCache.timestamp;
    if (age < degradationCache.ttl) {
      return degradationCache.data;
    }
  }

  try {
    const response = await fetch('/api/degradation');
    if (!response.ok) {
      throw new Error(`Degradation API failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error('Invalid degradation response');
    }

    // Update cache
    degradationCache.data = result.data;
    degradationCache.timestamp = Date.now();

    return result.data;
  } catch (error) {
    console.error('[Degradation] Error fetching state:', error);
    // Fail-open: Return normal capacity on error
    return {
      level: 'normal',
      features: {
        statsEnabled: true,
        submissionsEnabled: true,
        chartEnabled: true,
        cacheExtended: false,
      },
      message: null,
    };
  }
}

/**
 * Show degradation notice banner with message
 * @param {string} message - User-facing message
 * @param {string} level - Capacity level (for styling)
 */
function showDegradationNotice(message, level) {
  // Check if notice already exists
  let notice = document.getElementById('degradation-notice');

  if (!notice) {
    // Create notice container
    notice = document.createElement('div');
    notice.id = 'degradation-notice';
    notice.className = 'degradation-notice';
    notice.setAttribute('role', 'alert');
    notice.setAttribute('aria-live', 'polite');

    // Insert at top of page (before main content)
    const main = document.querySelector('main') || document.body;
    main.insertBefore(notice, main.firstChild);
  }

  // Set content and styling based on level
  let bgColor, textColor, icon;
  switch (level) {
    case 'high':
      bgColor = 'bg-yellow-50';
      textColor = 'text-yellow-800';
      icon = '⚠️';
      break;
    case 'critical':
      bgColor = 'bg-orange-50';
      textColor = 'text-orange-800';
      icon = '⏳';
      break;
    case 'exceeded':
      bgColor = 'bg-red-50';
      textColor = 'text-red-800';
      icon = '🚫';
      break;
    default:
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      icon = 'ℹ️';
  }

  notice.className = `degradation-notice ${bgColor} ${textColor} p-4 mb-4 rounded-lg text-center font-semibold`;
  notice.innerHTML = `
    <span class="text-2xl mr-2">${icon}</span>
    <span>${message}</span>
  `;

  // Screen reader announcement
  const ariaLive = document.createElement('div');
  ariaLive.className = 'sr-only';
  ariaLive.setAttribute('aria-live', 'assertive');
  ariaLive.textContent = message;
  document.body.appendChild(ariaLive);
  setTimeout(() => ariaLive.remove(), 1000);
}

/**
 * Hide degradation notice banner
 */
function hideDegradationNotice() {
  const notice = document.getElementById('degradation-notice');
  if (notice) {
    notice.remove();
  }
}

/**
 * Disable chart toggle button (Story 3.7 - AC: Disable chart at elevated capacity)
 * @param {boolean} disabled - True to disable, false to enable
 */
function setChartDisabled(disabled) {
  const chartToggle = document.getElementById('chart-toggle');
  if (chartToggle) {
    chartToggle.disabled = disabled;

    if (disabled) {
      chartToggle.classList.add('opacity-50', 'cursor-not-allowed');
      chartToggle.title = 'Chart temporarily unavailable due to high traffic';

      // Hide chart if currently visible
      const chartContainer = document.getElementById('chart-container');
      if (chartContainer && chartContainer.style.display !== 'none') {
        chartContainer.style.display = 'none';
        chartToggle.textContent = 'Show Prediction Distribution';
      }
    } else {
      chartToggle.classList.remove('opacity-50', 'cursor-not-allowed');
      chartToggle.title = '';
    }
  }
}

/**
 * Disable prediction form submission (Story 3.7 - AC8: Read-only mode at 100%)
 * @param {boolean} disabled - True to disable, false to enable
 * @param {string} message - Message to display instead of form
 */
function setSubmissionsDisabled(disabled, message = '') {
  const form = document.getElementById('prediction-form');
  const submitButton = document.getElementById('submit-button');

  if (!form || !submitButton) return;

  if (disabled) {
    // Disable form inputs
    form.querySelectorAll('input, button').forEach((el) => {
      el.disabled = true;
    });

    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    submitButton.textContent = 'Submissions Disabled';

    // Show read-only message
    if (message) {
      let messageEl = document.getElementById('readonly-message');
      if (!messageEl) {
        messageEl = document.createElement('p');
        messageEl.id = 'readonly-message';
        messageEl.className = 'text-red-600 font-semibold mt-2 text-center';
        form.appendChild(messageEl);
      }
      messageEl.textContent = message;
    }
  } else {
    // Re-enable form inputs
    form.querySelectorAll('input, button').forEach((el) => {
      el.disabled = false;
    });

    submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    submitButton.textContent = 'Add My Prediction';

    // Remove read-only message
    const messageEl = document.getElementById('readonly-message');
    if (messageEl) {
      messageEl.remove();
    }
  }
}

/**
 * Update countdown display for capacity reset (Story 3.7 - AC10)
 * @param {string} resetAt - ISO 8601 timestamp for midnight UTC
 */
function startCountdown(resetAt) {
  const resetDate = new Date(resetAt);

  const updateCountdown = () => {
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();

    if (diff <= 0) {
      // Countdown complete - refresh page to check new capacity
      window.location.reload();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update countdown in notice message
    const notice = document.getElementById('degradation-notice');
    if (notice) {
      const countdownText = `Resets in ${hours}h ${minutes}m ${seconds}s`;
      const existingCountdown = notice.querySelector('.countdown');

      if (existingCountdown) {
        existingCountdown.textContent = countdownText;
      } else {
        const countdown = document.createElement('div');
        countdown.className = 'countdown text-sm mt-2 font-mono';
        countdown.textContent = countdownText;
        notice.appendChild(countdown);
      }
    }
  };

  // Update immediately, then every second
  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);

  // Store interval ID to clear if needed
  window.degradationCountdownInterval = interval;
}

/**
 * Apply degradation state to UI
 * @param {Object} degradationState - Degradation state from API
 */
function applyDegradationState(degradationState) {
  const { level, features, message, resetAt } = degradationState;

  // Show/hide notice banner
  if (message) {
    showDegradationNotice(message, level);

    // Start countdown if exceeded
    if (level === 'exceeded') {
      startCountdown(resetAt);
    }
  } else {
    hideDegradationNotice();
  }

  // Disable chart if high capacity or above
  setChartDisabled(!features.chartEnabled);

  // Disable submissions if exceeded
  if (!features.submissionsEnabled) {
    setSubmissionsDisabled(true, message);
  } else {
    setSubmissionsDisabled(false);
  }
}

/**
 * Initialize degradation monitoring
 * Fetches degradation state on page load and applies UI changes
 */
async function initializeDegradation() {
  try {
    const degradationState = await fetchDegradationState();
    applyDegradationState(degradationState);

    // Poll degradation state every minute to detect changes
    setInterval(async () => {
      const updatedState = await fetchDegradationState();
      applyDegradationState(updatedState);
    }, 60000); // 1 minute
  } catch (error) {
    console.error('[Degradation] Initialization failed:', error);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDegradation);
} else {
  initializeDegradation();
}
