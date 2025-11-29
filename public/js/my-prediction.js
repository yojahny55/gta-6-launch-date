// GTA 6 Tracker - My Prediction Card Module
// Story 10.3: My Prediction Card Enhancement
// Displays user's prediction prominently for returning users

/**
 * DOM elements for My Prediction card
 */
let myPredictionElements = null;

/**
 * Initialize and cache My Prediction card DOM elements
 */
function initMyPredictionElements() {
  myPredictionElements = {
    card: document.getElementById('my-prediction-card'),
    date: document.getElementById('my-prediction-date'),
    delta: document.getElementById('my-prediction-delta'),
  };
}

/**
 * Get user's prediction from localStorage
 * AC: Data Source - Read from cookie (primary), fallback to localStorage
 *
 * @returns {object|null} Prediction data or null if not found
 */
function getUserPrediction() {
  // Check for cookie ID first (primary data source)
  const cookieId = typeof getCookieID === 'function' ? getCookieID() : null;

  if (!cookieId) {
    console.log('My Prediction: No cookie ID found');
    return null;
  }

  // Try to get prediction from localStorage
  try {
    const storageKey = `gta6_prediction_${cookieId}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      console.log('My Prediction: No cached prediction found');
      return null;
    }

    const prediction = JSON.parse(stored);

    // Validate prediction structure
    if (!prediction || !prediction.predicted_date) {
      console.warn('My Prediction: Invalid prediction structure');
      return null;
    }

    return prediction;
  } catch (error) {
    console.error('My Prediction: Error reading localStorage:', error);
    return null;
  }
}

/**
 * Calculate and format delta from median
 * AC: Calculate difference in months/days, format as "+3 months from median"
 *
 * @param {string} userDate - User's predicted date (ISO 8601)
 * @param {string} medianDate - Community median date (ISO 8601)
 * @returns {string} Formatted delta string
 */
function calculateMyPredictionDelta(userDate, medianDate) {
  // Use existing comparison.js functions if available
  if (typeof calculateDaysDiff === 'function' && typeof formatDelta === 'function') {
    const daysDiff = calculateDaysDiff(userDate, medianDate);
    const formatted = formatDelta(daysDiff);

    // Convert "29 days later" → "+29 days from median"
    // Convert "3 months earlier" → "-3 months from median"
    const sign = daysDiff > 0 ? '+' : (daysDiff < 0 ? '-' : '');
    const deltaText = formatted.replace(' later', '').replace(' earlier', '').replace(/^-/, '');
    return `${sign}${deltaText} from median`;
  }

  // Fallback if comparison.js not loaded
  const user = new Date(userDate + 'T00:00:00');
  const median = new Date(medianDate + 'T00:00:00');
  const diffMs = user.getTime() - median.getTime();
  const daysDiff = Math.round(diffMs / (24 * 60 * 60 * 1000));

  const absDays = Math.abs(daysDiff);
  const sign = daysDiff >= 0 ? '+' : '-';

  if (absDays >= 60) {
    const months = Math.round(absDays / 30);
    return `${sign}${months} month${months !== 1 ? 's' : ''} from median`;
  }

  return `${sign}${absDays} day${absDays !== 1 ? 's' : ''} from median`;
}

/**
 * Format date for display
 * AC: Display user's predicted date (e.g., "Jun 10, 2027")
 *
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} Formatted date (e.g., "Jun 10, 2027")
 */
function formatMyPredictionDate(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('My Prediction: Error formatting date:', error);
    return dateString;
  }
}

/**
 * Show My Prediction card with user's prediction and delta
 * AC: Show card only if prediction exists
 *
 * @param {object} prediction - User's prediction data
 * @param {string} medianDate - Community median date
 */
function showMyPredictionCard(prediction, medianDate) {
  if (!myPredictionElements || !myPredictionElements.card) {
    console.error('My Prediction: DOM elements not initialized');
    return;
  }

  // Format and display prediction date
  const formattedDate = formatMyPredictionDate(prediction.predicted_date);
  myPredictionElements.date.textContent = formattedDate;

  // Calculate and display delta from median
  if (medianDate) {
    const delta = calculateMyPredictionDelta(prediction.predicted_date, medianDate);
    myPredictionElements.delta.textContent = delta;
  } else {
    myPredictionElements.delta.textContent = 'Loading community median...';
  }

  // Show the card (remove 'hidden' class)
  myPredictionElements.card.classList.remove('hidden');

  console.log('My Prediction: Card shown with date:', formattedDate);
}

/**
 * Hide My Prediction card
 * AC: Hide card if no prediction found
 */
function hideMyPredictionCard() {
  if (!myPredictionElements || !myPredictionElements.card) {
    return;
  }

  // Hide the card (add 'hidden' class)
  myPredictionElements.card.classList.add('hidden');

  console.log('My Prediction: Card hidden (no prediction)');
}


/**
 * Initialize My Prediction card
 * Main entry point for the module
 *
 * @param {object} stats - Current stats (includes median)
 */
function initMyPrediction(stats) {
  // Initialize DOM elements
  initMyPredictionElements();

  // Check for user's prediction
  const prediction = getUserPrediction();

  // AC: Hide card if no prediction exists
  if (!prediction) {
    hideMyPredictionCard();
    return;
  }

  // AC: Show card with prediction and delta
  const medianDate = stats?.median || null;
  showMyPredictionCard(prediction, medianDate);
}

/**
 * Update My Prediction card with new stats (e.g., after stats refresh)
 * Recalculates delta with updated median
 *
 * @param {object} stats - Updated stats data
 */
function updateMyPredictionDelta(stats) {
  if (!myPredictionElements || myPredictionElements.card.classList.contains('hidden')) {
    // Card not visible, no need to update
    return;
  }

  const prediction = getUserPrediction();
  if (!prediction || !stats || !stats.median) {
    return;
  }

  // Recalculate and update delta
  const delta = calculateMyPredictionDelta(prediction.predicted_date, stats.median);
  if (myPredictionElements.delta) {
    myPredictionElements.delta.textContent = delta;
  }
}

// Export functions for use in app.js and tests
if (typeof module !== 'undefined' && module.exports) {
  // Node.js / CommonJS environment (for tests)
  module.exports = {
    initMyPrediction,
    updateMyPredictionDelta,
    getUserPrediction,
    calculateMyPredictionDelta,
    formatMyPredictionDate,
    showMyPredictionCard,
    hideMyPredictionCard,
  };
}
