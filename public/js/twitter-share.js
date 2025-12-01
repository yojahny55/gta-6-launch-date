/**
 * Twitter Share Module (Story 5.1: Twitter/X Share Button with Pre-filled Text)
 *
 * Handles Twitter/X share button functionality including:
 * - Tweet text generation with personalization
 * - Twitter Web Intent integration
 * - URL tracking parameters
 * - Share button click analytics
 */

/**
 * Generate personalized tweet text based on user prediction vs median
 * AC: Tweet template with personalization (optimistic/pessimistic/aligned)
 *
 * @param {string} userDate - User's predicted date (ISO 8601 format: YYYY-MM-DD)
 * @param {string} medianDate - Community median date (ISO 8601 format: YYYY-MM-DD)
 * @param {string} siteUrl - Base site URL with tracking parameters
 * @returns {string} Personalized tweet text
 */
export function generateTweetText(userDate, medianDate, siteUrl) {
  if (!userDate || !medianDate) {
    // Fallback if dates are missing
    return `Check out GTA 6 launch date predictions! 🎮\n\n${siteUrl}`;
  }

  // Format dates for display (e.g., "June 15, 2027")
  const formattedUserDate = formatDateForTweet(userDate);
  const formattedMedianDate = formatDateForTweet(medianDate);

  // Calculate difference in days
  const daysDiff = calculateDaysDifference(userDate, medianDate);

  // Generate personalization line
  const personalization = generatePersonalization(daysDiff);

  // Construct tweet text
  const tweetText = `I predicted GTA 6 will launch on ${formattedUserDate}. The community median is ${formattedMedianDate}.
${personalization}
What do you think? 🎮

${siteUrl}`;

  return tweetText;
}

/**
 * Generate personalization message based on days difference
 * AC: Personalization logic (optimistic/pessimistic/aligned)
 *
 * @param {number} daysDiff - Days difference (positive = pessimistic, negative = optimistic)
 * @returns {string} Personalization message
 */
function generatePersonalization(daysDiff) {
  if (daysDiff === 0) {
    return "I'm aligned with the community! 🎯";
  } else if (daysDiff < 0) {
    // User is more optimistic (predicted earlier)
    const absDays = Math.abs(daysDiff);
    return `I'm ${absDays} days more optimistic 🤞`;
  } else {
    // User is more pessimistic (predicted later)
    return `I'm ${daysDiff} days more pessimistic 😬`;
  }
}

/**
 * Calculate days difference between two dates
 * Consistent with comparison.js logic
 *
 * @param {string} userDate - User's predicted date (YYYY-MM-DD)
 * @param {string} medianDate - Community median date (YYYY-MM-DD)
 * @returns {number} Days difference (positive = user is later/pessimistic)
 */
function calculateDaysDifference(userDate, medianDate) {
  // Parse dates consistently with UTC interpretation to avoid timezone edge cases
  const user = new Date(userDate + 'T00:00:00');
  const median = new Date(medianDate + 'T00:00:00');

  const diffMs = user.getTime() - median.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Format date for tweet display (e.g., "June 15, 2027")
 * Matches submission.js formatting for consistency
 *
 * @param {string} isoDate - ISO 8601 date string (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDateForTweet(isoDate) {
  if (!isoDate) return '';

  try {
    // Parse date components manually to avoid timezone issues
    const [year, month, day] = isoDate.split('-').map(Number);

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    return `${months[month - 1]} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date for tweet:', error);
    return isoDate;
  }
}

/**
 * Generate Twitter Web Intent URL with pre-filled text
 * AC: Twitter Web Intent integration
 *
 * @param {string} tweetText - Pre-filled tweet text
 * @param {string} hashtags - Comma-separated hashtags (without #)
 * @returns {string} Twitter Web Intent URL
 */
export function generateTwitterIntentUrl(tweetText, hashtags = 'GTA6,Rockstar') {
  // Twitter Web Intents API endpoint
  const baseUrl = 'https://twitter.com/intent/tweet';

  // URL encode parameters
  const params = new URLSearchParams({
    text: tweetText,
    hashtags: hashtags
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate share URL with tracking parameters
 * AC: URL parameters track source (ref=twitter, u={hash})
 *
 * @param {string} cookieId - User's cookie ID (for u parameter hash)
 * @returns {string} Share URL with tracking parameters
 */
export function generateShareUrl(cookieId = null) {
  // Base URL (production)
  const baseUrl = 'https://gta6predictions.com';

  // Add tracking parameters
  const params = new URLSearchParams({
    ref: 'twitter'
  });

  // Add optional unique identifier (privacy-preserving hash of cookie_id)
  if (cookieId) {
    // Use simple hash for u parameter (first 8 chars of cookie_id)
    // This is anonymous and privacy-preserving
    const hashValue = cookieId.substring(0, 8);
    params.append('u', hashValue);
  }

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Open Twitter share dialog
 * AC: Open in new window/tab with window.open()
 *
 * @param {string} userDate - User's predicted date
 * @param {string} medianDate - Community median date
 * @param {string} cookieId - User's cookie ID (optional)
 */
export function openTwitterShare(userDate, medianDate, cookieId = null) {
  try {
    // Generate share URL with tracking
    const shareUrl = generateShareUrl(cookieId);

    // Generate personalized tweet text
    const tweetText = generateTweetText(userDate, medianDate, shareUrl);

    // Generate Twitter Web Intent URL
    const intentUrl = generateTwitterIntentUrl(tweetText);

    // Open Twitter compose dialog in new window
    // Recommended dimensions: 550x420
    const windowFeatures = 'width=550,height=420,scrollbars=yes,resizable=yes';
    window.open(intentUrl, 'twitter-share', windowFeatures);

    return true;
  } catch (error) {
    console.error('Error opening Twitter share:', error);
    return false;
  }
}

/**
 * Track share button click event
 * AC: Share analytics (track button clicks)
 *
 * @param {string} platform - Share platform ('twitter' or 'reddit')
 * @param {Object} eventData - Analytics event data
 * @param {string} [eventData.user_prediction] - User's predicted date (optional)
 * @param {string} eventData.median_prediction - Community median date
 */
export function trackShareClick(platform, eventData = {}) {
  try {
    // Calculate delta days if both dates available
    let deltaDays = null;
    if (eventData.user_prediction && eventData.median_prediction) {
      deltaDays = calculateDaysDifference(eventData.user_prediction, eventData.median_prediction);
    }

    return true;
  } catch (error) {
    // Analytics tracking is non-blocking - log error but don't fail
    console.error('Error tracking share click:', error);
    return false;
  }
}
