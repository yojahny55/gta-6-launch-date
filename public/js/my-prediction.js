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
    progressBar: document.getElementById('prediction-position-bar'),
    percentile: document.getElementById('prediction-percentile'),
  };
}

/**
 * Get user's prediction from API (Cloudflare KV)
 * AC: Data Source - Fetch from /api/predict (Cloudflare KV source of truth)
 *
 * Sprint Change 2025-11-28: Changed from localStorage to API fetch for always-fresh data
 *
 * @returns {Promise<object|null>} Prediction data or null if not found
 */
async function getUserPrediction() {
  try {
    const API_URL = window.API_URL || '';
    const response = await fetch(`${API_URL}/api/predict`, {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (response.ok) {
      const result = await response.json();

      if (result.success && result.data && result.data.predicted_date) {
        console.log('My Prediction: Prediction fetched from API');
        return result.data;
      } else {
        console.log('My Prediction: No prediction found in API response');
        return null;
      }
    } else if (response.status === 404) {
      // User hasn't submitted yet - this is normal
      console.log('My Prediction: No prediction found (404)');
      return null;
    } else {
      console.warn('My Prediction: API error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('My Prediction: Error fetching prediction from API:', error);
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
 * Calculate user's percentile position in prediction distribution
 * AC: Percentile represents how pessimistic user is vs community
 *
 * Sprint Change Proposal: 2025-11-28 VS Community Percentile
 * Formula: (predictions_before_user / total_predictions) × 100
 *
 * @param {string} userDate - User's predicted date (ISO 8601)
 * @param {Array} allPredictions - Array of {predicted_date, count} from /api/predictions
 * @returns {number} Percentile (0-100), rounded to nearest integer
 */
function calculatePercentile(userDate, allPredictions) {
  if (!allPredictions || allPredictions.length === 0) {
    console.log('My Prediction: No predictions data for percentile calculation');
    return 50; // Default to middle if no data
  }

  // Count predictions earlier than user's date
  let earlierCount = 0;
  let totalCount = 0;

  allPredictions.forEach(pred => {
    const count = pred.count || 1;
    totalCount += count;

    if (pred.predicted_date < userDate) {
      earlierCount += count;
    }
  });

  if (totalCount === 0) {
    console.log('My Prediction: Total count is 0, defaulting to 50th percentile');
    return 50;
  }

  // Percentile = (predictions before user / total) × 100
  // Example: 6500 predictions before user out of 10000 total = 65th percentile
  // Interpretation: User is more pessimistic than 65% of community
  const percentile = (earlierCount / totalCount) * 100;
  const rounded = Math.round(percentile);

  console.log(`My Prediction: Percentile calculated - ${rounded}% (${earlierCount}/${totalCount} predictions earlier)`);
  return rounded;
}

/**
 * Fetch predictions data and calculate user's percentile
 * AC: Uses /api/predictions endpoint (Story 3.4b)
 *
 * Sprint Change Proposal: 2025-11-28 VS Community Percentile
 *
 * @param {string} userDate - User's predicted date
 * @returns {Promise<number>} Percentile value (0-100)
 */
async function fetchAndCalculatePercentile(userDate) {
  try {
    const API_URL = window.API_URL || '';
    const response = await fetch(`${API_URL}/api/predictions`);

    if (!response.ok) {
      console.error('My Prediction: Failed to fetch predictions for percentile (HTTP', response.status, ')');
      return 50; // Default to middle on error
    }

    const result = await response.json();
    const predictions = result.data || [];

    if (predictions.length === 0) {
      console.log('My Prediction: No predictions data returned from API');
      return 50;
    }

    return calculatePercentile(userDate, predictions);
  } catch (error) {
    console.error('My Prediction: Error fetching predictions for percentile:', error);
    return 50; // Default to middle on error
  }
}

/**
 * Update progress bar and percentile display
 * AC: Progress bar width = percentile value (0% = earliest, 100% = latest)
 *
 * Sprint Change Proposal: 2025-11-28 VS Community Percentile
 *
 * @param {number} percentile - Calculated percentile (0-100)
 */
function updateProgressBar(percentile) {
  // Support testing with global.myPredictionElements
  const elements = myPredictionElements || (typeof global !== 'undefined' && global.myPredictionElements);

  if (!elements) {
    console.error('My Prediction: DOM elements not initialized');
    return;
  }

  const { progressBar, percentile: percentileDisplay } = elements;

  // Update progress bar width
  if (progressBar) {
    progressBar.style.width = `${percentile}%`;
    console.log(`My Prediction: Progress bar updated to ${percentile}%`);
  } else {
    console.warn('My Prediction: Progress bar element not found');
  }

  // Update percentile display text
  if (percentileDisplay) {
    percentileDisplay.textContent = `${percentile}%`;
    console.log(`My Prediction: Percentile display updated to ${percentile}%`);
  } else {
    console.warn('My Prediction: Percentile display element not found');
  }
}

/**
 * Show My Prediction card with user's prediction and delta
 * AC: Show card only if prediction exists
 *
 * Sprint Change Proposal: 2025-11-28 - Enhanced with percentile calculation
 *
 * @param {object} prediction - User's prediction data
 * @param {string} medianDate - Community median date
 */
async function showMyPredictionCard(prediction, medianDate) {
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

  // Fetch predictions data and calculate percentile
  // Sprint Change Proposal: 2025-11-28 VS Community Percentile
  const percentile = await fetchAndCalculatePercentile(prediction.predicted_date);
  updateProgressBar(percentile);

  // Show the card (remove 'hidden' class)
  myPredictionElements.card.classList.remove('hidden');

  console.log('My Prediction: Card shown with date:', formattedDate, 'percentile:', percentile);
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
 * Sprint Change Proposal: 2025-11-28 - Made async to await API fetch and percentile calculation
 *
 * @param {object} stats - Current stats (includes median)
 */
async function initMyPrediction(stats) {
  // Initialize DOM elements
  initMyPredictionElements();

  // Check for user's prediction (async API fetch)
  const prediction = await getUserPrediction();

  // AC: Hide card if no prediction exists
  if (!prediction) {
    hideMyPredictionCard();
    return;
  }

  // AC: Show card with prediction and delta
  // Sprint Change Proposal: 2025-11-28 - Await async showMyPredictionCard (percentile fetch)
  const medianDate = stats?.median || null;
  await showMyPredictionCard(prediction, medianDate);
}

/**
 * Update My Prediction card with new stats (e.g., after stats refresh)
 * Recalculates delta with updated median
 *
 * Sprint Change 2025-11-28: Made async to await API fetch
 *
 * @param {object} stats - Updated stats data
 */
async function updateMyPredictionDelta(stats) {
  if (!myPredictionElements || myPredictionElements.card.classList.contains('hidden')) {
    // Card not visible, no need to update
    return;
  }

  const prediction = await getUserPrediction();
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
    // Sprint Change Proposal: 2025-11-28 VS Community Percentile
    calculatePercentile,
    fetchAndCalculatePercentile,
    updateProgressBar,
  };
}
