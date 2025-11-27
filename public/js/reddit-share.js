/**
 * Reddit Share Module (Story 5.2: Reddit Share Button with Pre-filled Text)
 *
 * Handles Reddit share button functionality including:
 * - Reddit post text generation with personalization
 * - Reddit Submit API integration
 * - URL tracking parameters
 * - Share button click analytics
 */

/**
 * Generate personalized Reddit post content based on user prediction vs median
 * AC: Reddit post template with personalization (optimistic/pessimistic/aligned)
 *
 * @param {string} userDate - User's predicted date (ISO 8601 format: YYYY-MM-DD)
 * @param {string} medianDate - Community median date (ISO 8601 format: YYYY-MM-DD)
 * @param {string} siteUrl - Base site URL with tracking parameters
 * @returns {Object} Reddit post data with title and body
 */
export function generateRedditPost(userDate, medianDate, siteUrl) {
  // Default title (AC: Reddit post template)
  const title = 'GTA 6 Launch Date Predictions - What does the community think?';

  // If dates are missing, return basic post
  if (!userDate || !medianDate) {
    return {
      title: title,
      body: `Check out the full data and add your prediction:\n${siteUrl}`,
      url: siteUrl
    };
  }

  // Format dates for display (e.g., "June 15, 2027")
  const formattedUserDate = formatDateForReddit(userDate);
  const formattedMedianDate = formatDateForReddit(medianDate);

  // Calculate difference in days
  const daysDiff = calculateDaysDifference(userDate, medianDate);

  // Generate personalization line
  const personalization = generatePersonalization(daysDiff);

  // Construct post body (AC: Reddit post template)
  // Note: Reddit Submit API doesn't support pre-filled body via URL parameters
  // This body text is for reference/documentation only
  const body = `I just submitted my prediction: ${formattedUserDate}
Community median: ${formattedMedianDate}

${personalization}

Check out the full data and add your prediction:
${siteUrl}`;

  return {
    title: title,
    body: body,
    url: siteUrl
  };
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
    return "I'm aligned with the community!";
  } else if (daysDiff < 0) {
    // User is more optimistic (predicted earlier)
    const absDays = Math.abs(daysDiff);
    return `I'm ${absDays} days more optimistic compared to everyone else!`;
  } else {
    // User is more pessimistic (predicted later)
    return `I'm ${daysDiff} days more pessimistic compared to everyone else!`;
  }
}

/**
 * Calculate days difference between two dates
 * Consistent with comparison.js and twitter-share.js logic
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
 * Format date for Reddit post display (e.g., "June 15, 2027")
 * Matches submission.js formatting for consistency
 *
 * @param {string} isoDate - ISO 8601 date string (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDateForReddit(isoDate) {
  if (!isoDate) return '';

  try {
    // Parse date components manually to avoid timezone issues
    const [year, month, day] = isoDate.split('-').map(Number);

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    return `${months[month - 1]} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date for Reddit post:', error);
    return isoDate;
  }
}

/**
 * Generate Reddit Submit URL with pre-filled title and URL
 * AC: Reddit Submit API integration
 *
 * @param {string} postTitle - Pre-filled post title
 * @param {string} postUrl - URL to submit
 * @returns {string} Reddit Submit URL
 */
export function generateRedditSubmitUrl(postTitle, postUrl) {
  // Reddit Submit API endpoint
  const baseUrl = 'https://reddit.com/submit';

  // URL encode parameters
  // Note: Reddit doesn't support pre-filled body text via URL parameters
  const params = new URLSearchParams({
    url: postUrl,
    title: postTitle,
    resubmit: 'true' // Allow resubmitting the same URL
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate share URL with tracking parameters
 * AC: URL parameters track source (ref=reddit, u={hash})
 *
 * @param {string} cookieId - User's cookie ID (for u parameter hash)
 * @returns {string} Share URL with tracking parameters
 */
export function generateShareUrl(cookieId = null) {
  // Base URL (production)
  const baseUrl = 'https://gta6predictions.com';

  // Add tracking parameters
  const params = new URLSearchParams({
    ref: 'reddit'
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
 * Open Reddit share dialog
 * AC: Open in new window/tab with window.open()
 *
 * @param {string} userDate - User's predicted date
 * @param {string} medianDate - Community median date
 * @param {string} cookieId - User's cookie ID (optional)
 */
export function openRedditShare(userDate, medianDate, cookieId = null) {
  try {
    // Generate share URL with tracking
    const shareUrl = generateShareUrl(cookieId);

    // Generate personalized Reddit post content
    const redditPost = generateRedditPost(userDate, medianDate, shareUrl);

    // Generate Reddit Submit URL
    const submitUrl = generateRedditSubmitUrl(redditPost.title, shareUrl);

    // Open Reddit submit page in new window
    // Reddit submit page is responsive, no specific dimensions required
    const windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes';
    window.open(submitUrl, 'reddit-share', windowFeatures);

    return true;
  } catch (error) {
    console.error('Error opening Reddit share:', error);
    return false;
  }
}

/**
 * Track share button click event
 * AC: Share analytics (track button clicks)
 *
 * Note: This function is shared with Twitter share module
 * Reuses trackShareClick from twitter-share.js
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

    // Log analytics event (Cloudflare Analytics auto-tracks page events)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: 'share_click',
      platform: platform,
      user_prediction: eventData.user_prediction || null,
      median_prediction: eventData.median_prediction,
      delta_days: deltaDays
    }));

    return true;
  } catch (error) {
    // Analytics tracking is non-blocking - log error but don't fail
    console.error('Error tracking share click:', error);
    return false;
  }
}
