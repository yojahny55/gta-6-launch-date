// GTA 6 Tracker - Social Comparison Module
// Story 3.2: Social Comparison Messaging
// Calculates and formats comparison between user prediction and community median

/**
 * Comparison thresholds for personality messages
 * Based on AC4: Personality messaging thresholds
 */
const COMPARISON_THRESHOLDS = {
  ALIGNED: 0,
  CLOSE: 30,
  DIFFERENT: 90,
  BOLD: 180,
  EXTREME: Infinity
};

/**
 * ComparisonResult interface
 * @typedef {Object} ComparisonResult
 * @property {number} daysDiff - Days difference (positive = pessimistic, negative = optimistic)
 * @property {'optimistic'|'pessimistic'|'aligned'} direction - Direction of difference
 * @property {string} message - Human-readable comparison message
 * @property {string} personality - Personality message based on magnitude
 * @property {string} emoji - Emoji indicator for direction
 * @property {string} formattedDelta - Formatted delta (e.g., "29 days later" or "3 months earlier")
 */

/**
 * Calculate days difference between two dates
 * AC2: Days difference calculated correctly (positive = later than median = pessimistic)
 *
 * @param {Date|string} userDate - User's predicted date
 * @param {Date|string} medianDate - Community median date
 * @returns {number} Days difference (positive = user is more pessimistic)
 */
function calculateDaysDiff(userDate, medianDate) {
  // Parse dates consistently with UTC interpretation to avoid timezone edge cases
  // Appending 'T00:00:00' forces UTC midnight interpretation
  const user = typeof userDate === 'string' ? new Date(userDate + 'T00:00:00') : userDate;
  const median = typeof medianDate === 'string' ? new Date(medianDate + 'T00:00:00') : medianDate;

  const diffMs = user.getTime() - median.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Determine comparison direction based on days difference
 * AC3: Direction indicated with emojis
 *
 * @param {number} daysDiff - Days difference
 * @returns {'optimistic'|'pessimistic'|'aligned'} Direction
 */
function getDirection(daysDiff) {
  if (daysDiff === 0) return 'aligned';
  return daysDiff > 0 ? 'pessimistic' : 'optimistic';
}

/**
 * Get emoji indicator for direction
 * AC3: Direction emoji indicators
 *
 * @param {'optimistic'|'pessimistic'|'aligned'} direction - Direction
 * @returns {string} Emoji indicator
 */
function getDirectionEmoji(direction) {
  const emojis = {
    optimistic: '🤞',
    pessimistic: '😬',
    aligned: '🎯'
  };
  return emojis[direction];
}

/**
 * Get personality message based on magnitude of difference
 * AC4: Personality messages based on thresholds
 *
 * @param {number} daysDiff - Days difference (absolute value will be used)
 * @returns {string} Personality message
 */
function getPersonalityMessage(daysDiff) {
  const absDays = Math.abs(daysDiff);

  if (absDays === COMPARISON_THRESHOLDS.ALIGNED) {
    return "Great minds think alike!";
  } else if (absDays <= COMPARISON_THRESHOLDS.CLOSE) {
    return "Pretty close to the crowd";
  } else if (absDays <= COMPARISON_THRESHOLDS.DIFFERENT) {
    return "You have a different perspective";
  } else if (absDays <= COMPARISON_THRESHOLDS.BOLD) {
    return "Bold prediction!";
  } else {
    return "Wow, you're way outside the consensus!";
  }
}

/**
 * Format delta quantification
 * AC5: Large differences (> 60 days) shown in months
 * FR18: Quantify delta
 *
 * @param {number} daysDiff - Days difference
 * @returns {string} Formatted delta (e.g., "29 days later" or "3 months earlier")
 */
function formatDelta(daysDiff) {
  const absDays = Math.abs(daysDiff);
  const direction = daysDiff >= 0 ? 'later' : 'earlier';

  // Show months if >= 60 days (approximately 2 months)
  if (absDays >= 60) {
    // Use 30-day approximation for user-friendly display
    // This is intentionally simplified (actual months vary 28-31 days)
    // Results in slight inaccuracy but clearer user communication
    const months = Math.round(absDays / 30);
    const monthLabel = months === 1 ? 'month' : 'months';
    return `${months} ${monthLabel} ${direction}`;
  }

  // Show days for < 60 days
  const dayLabel = absDays === 1 ? 'day' : 'days';
  return `${absDays} ${dayLabel} ${direction}`;
}

/**
 * Generate human-readable comparison message
 *
 * @param {number} daysDiff - Days difference
 * @param {'optimistic'|'pessimistic'|'aligned'} direction - Direction
 * @returns {string} Comparison message
 */
function generateComparisonMessage(daysDiff, direction) {
  if (direction === 'aligned') {
    return "You're exactly aligned with the community!";
  }

  const absDays = Math.abs(daysDiff);
  const directionLabel = direction === 'optimistic' ? 'more optimistic' : 'more pessimistic';

  return `You're ${absDays} ${absDays === 1 ? 'day' : 'days'} ${directionLabel} than the community`;
}

/**
 * Main comparison function
 * AC: All acceptance criteria - Comparison Logic
 *
 * Calculates comparison between user's prediction and community median,
 * returning a comprehensive result with direction, messaging, and formatting.
 *
 * @param {Date|string} userDate - User's predicted date
 * @param {Date|string} medianDate - Community median date
 * @returns {ComparisonResult} Complete comparison result
 */
function getComparisonMessage(userDate, medianDate) {
  // Calculate days difference
  const daysDiff = calculateDaysDiff(userDate, medianDate);

  // Determine direction
  const direction = getDirection(daysDiff);

  // Get emoji and personality
  const emoji = getDirectionEmoji(direction);
  const personality = getPersonalityMessage(daysDiff);

  // Generate message and formatted delta
  const message = generateComparisonMessage(daysDiff, direction);
  const formattedDelta = formatDelta(daysDiff);

  return {
    daysDiff,
    direction,
    message,
    personality,
    emoji,
    formattedDelta
  };
}

// Export functions for use in app.js and tests
if (typeof module !== 'undefined' && module.exports) {
  // Node.js / CommonJS environment (for tests)
  module.exports = {
    getComparisonMessage,
    getPersonalityMessage,
    formatDelta,
    calculateDaysDiff,
    getDirection,
    getDirectionEmoji,
    COMPARISON_THRESHOLDS
  };
}
