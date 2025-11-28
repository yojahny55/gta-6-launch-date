/**
 * Submission Module (Story 3.3: Submission Confirmation with Visual Feedback)
 *
 * Handles optimistic UI updates, confirmation display, and rollback on failure.
 * Integrates with Story 3.2 (Social Comparison Messaging).
 */

// State management for optimistic UI
let previousState = {
  count: null,
  confirmationVisible: false,
};

/**
 * Show optimistic confirmation UI immediately (AC6: Optimistic UI)
 * Increments count display immediately before API confirms
 *
 * @param {string} predictedDate - User's predicted date (ISO 8601)
 */
export function showOptimisticConfirmation(predictedDate) {
  // Store previous state for potential rollback
  const statsCountElement = document.getElementById('stats-count-value');
  const confirmationDisplay = document.getElementById('confirmation-display');

  if (statsCountElement) {
    previousState.count = statsCountElement.textContent;

    // AC6: Increment count immediately (+1)
    const currentCount = parseInt(previousState.count.replace(/,/g, ''), 10);
    if (!isNaN(currentCount)) {
      const newCount = currentCount + 1;
      statsCountElement.textContent = newCount.toLocaleString();
    }
  }

  // Show confirmation UI (will be updated with actual data from API)
  if (confirmationDisplay) {
    previousState.confirmationVisible = confirmationDisplay.classList.contains('hidden');

    // Set predicted date in echo
    const confirmationDateElement = document.getElementById('confirmation-date');
    if (confirmationDateElement && predictedDate) {
      confirmationDateElement.textContent = formatDateForDisplay(predictedDate);
    }

    // New dashboard doesn't show confirmation-rank element
    // Comparison message will be updated when API returns (in updateConfirmationWithActual)

    // Apply animation class for success (AC8: Micro-animation)
    applySuccessAnimation();

    // Show confirmation
    confirmationDisplay.classList.remove('hidden');
  }
}

/**
 * Update confirmation with actual data from API response
 * Called after API successfully returns
 *
 * @param {Object} apiResponse - Response from POST /api/predict
 * @param {number} apiResponse.prediction_id - Actual ranking number
 * @param {Object} apiResponse.stats - Stats object with count, median, etc.
 */
export function updateConfirmationWithActual(apiResponse) {
  // Update stats count with actual count from API
  const statsCountElement = document.getElementById('stats-count-value');
  if (statsCountElement && apiResponse.stats?.count) {
    statsCountElement.textContent = apiResponse.stats.count.toLocaleString();
  }

  // Check if we've crossed the 50 prediction threshold to show chart
  const totalPredictions = apiResponse.stats?.total || apiResponse.stats?.count || 0;
  if (totalPredictions >= 50) {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer && chartContainer.classList.contains('hidden')) {
      console.log('Threshold reached! Showing chart...');
      chartContainer.classList.remove('hidden');
      // Trigger chart initialization if not already loaded
      if (window.initChart && typeof window.initChart === 'function') {
        window.initChart();
      }
    }
  }

  // Update comparison message with social comparison (Story 3.2b)
  const predictedDate = apiResponse.predicted_date;
  const medianDate = apiResponse.stats?.median;

  if (predictedDate && medianDate) {
    // Generate comparison message using comparison.js module
    const comparison = getComparisonMessage(predictedDate, medianDate);

    // Update comparison message in confirmation display
    const comparisonMessageElement = document.getElementById('comparison-message');
    if (comparisonMessageElement && comparison) {
      comparisonMessageElement.textContent = `${comparison.emoji} ${comparison.message} (${comparison.formattedDelta})`;
    }

    // Prepare screen reader announcement (AC9: FR70)
    announceToScreenReader(predictedDate, medianDate);
  }
}

/**
 * Roll back optimistic UI on API failure (AC7)
 * Restores previous count, hides confirmation, shows error
 */
export function rollbackOptimisticUI() {
  // Restore previous count
  const statsCountElement = document.getElementById('stats-count-value');
  if (statsCountElement && previousState.count !== null) {
    statsCountElement.textContent = previousState.count;
  }

  // Hide confirmation UI
  const confirmationDisplay = document.getElementById('confirmation-display');
  if (confirmationDisplay && previousState.confirmationVisible) {
    confirmationDisplay.classList.add('hidden');
  }

  // Remove animation classes
  removeSuccessAnimation();

  // Clear stored state
  previousState = {
    count: null,
    confirmationVisible: false,
  };
}

/**
 * Apply success animation (AC8: Micro-animation on success)
 * Respects prefers-reduced-motion (AC10)
 */
function applySuccessAnimation() {
  const confirmationIcon = document.getElementById('confirmation-icon');

  if (!confirmationIcon) return;

  // Check for prefers-reduced-motion (AC10: WCAG compliance)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animation if user prefers reduced motion
    return;
  }

  // Apply pulse/scale animation class
  confirmationIcon.classList.add('confirmation-icon-animate');

  // Remove animation class after animation completes
  setTimeout(() => {
    confirmationIcon.classList.remove('confirmation-icon-animate');
  }, 600); // Match CSS animation duration
}

/**
 * Remove success animation classes
 */
function removeSuccessAnimation() {
  const confirmationIcon = document.getElementById('confirmation-icon');
  if (confirmationIcon) {
    confirmationIcon.classList.remove('confirmation-icon-animate');
  }
}

/**
 * Announce confirmation to screen readers (AC9: FR70)
 * Injects message into ARIA live region
 *
 * @param {string} predictedDate - User's predicted date
 * @param {string} medianDate - Community median date
 */
export function announceToScreenReader(predictedDate, medianDate) {
  const announcementElement = document.getElementById('confirmation-announcement');

  if (!announcementElement) return;

  // Calculate comparison for announcement
  const userDate = new Date(predictedDate);
  const median = new Date(medianDate);
  const daysDiff = Math.round((userDate.getTime() - median.getTime()) / (24 * 60 * 60 * 1000));

  let directionText = '';
  if (daysDiff === 0) {
    directionText = "You're exactly aligned with the community median";
  } else if (daysDiff > 0) {
    directionText = `You're ${Math.abs(daysDiff)} days more pessimistic than the community median`;
  } else {
    directionText = `You're ${Math.abs(daysDiff)} days more optimistic than the community median`;
  }

  // Construct full announcement message
  const formattedDate = formatDateForDisplay(predictedDate);
  const message = `Success. Your prediction for ${formattedDate} has been recorded. ${directionText}.`;

  // Inject into ARIA live region (aria-live="assertive" for immediate announcement)
  announcementElement.textContent = message;

  // Clear announcement after 5 seconds (screen readers will have announced it)
  setTimeout(() => {
    announcementElement.textContent = '';
  }, 5000);
}

/**
 * Format date for display (e.g., "February 14, 2027")
 *
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} Formatted date string
 */
function formatDateForDisplay(isoDate) {
  if (!isoDate) return '--';

  try {
    // Parse date components manually to avoid timezone issues
    // ISO format: "YYYY-MM-DD"
    const [year, month, day] = isoDate.split('-').map(Number);

    // Use direct string construction to avoid Happy-DOM timezone handling issues
    // with toLocaleDateString()
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    return `${months[month - 1]} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoDate;
  }
}
