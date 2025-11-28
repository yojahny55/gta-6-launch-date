// GTA 6 Tracker - Status Badge Module
// Story 10.4: Dynamic Status Badge
// Updates header status badge based on community sentiment (median vs official date)

/**
 * Color classes map for different status values
 * Maps status_color (from API) to Tailwind CSS classes
 */
const STATUS_COLOR_CLASSES = {
  green: 'border-green-500/30 text-green-500 bg-green-500/10',
  blue: 'border-gta-blue/30 text-gta-blue bg-gta-blue/10',
  amber: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  red: 'border-red-500/30 text-red-500 bg-red-500/10',
};

/**
 * Default fallback status when API fails or no data available
 */
const FALLBACK_STATUS = {
  status: 'Unknown',
  status_color: 'blue',
};

/**
 * Get API base URL from environment
 * Supports both local development and production deployments
 *
 * @returns {string} API base URL (e.g., "http://localhost:8787" or "")
 */
function getAPIBaseURL() {
  // Check if API_URL is defined globally (from env variables)
  if (typeof window.API_URL !== 'undefined') {
    return window.API_URL;
  }

  // For production, API is same origin (empty string)
  return '';
}

/**
 * Fetch current status from /api/status endpoint
 *
 * @returns {Promise<object>} Status data from API
 * @throws {Error} If API request fails
 */
async function fetchStatus() {
  const apiURL = getAPIBaseURL();
  const endpoint = `${apiURL}/api/status`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Status API returned ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Invalid status API response');
  }

  return result.data;
}

/**
 * Apply color classes to status badge element
 *
 * @param {HTMLElement} badge - The status badge DOM element
 * @param {string} statusColor - Color key (green, blue, amber, red)
 */
function applyStatusColor(badge, statusColor) {
  // Remove all existing color classes
  Object.values(STATUS_COLOR_CLASSES).forEach((classes) => {
    classes.split(' ').forEach((cls) => {
      badge.classList.remove(cls);
    });
  });

  // Add new color classes (default to blue if invalid color)
  const newClasses = STATUS_COLOR_CLASSES[statusColor] || STATUS_COLOR_CLASSES.blue;
  newClasses.split(' ').forEach((cls) => {
    badge.classList.add(cls);
  });
}

/**
 * Update status badge with data from API
 *
 * @param {HTMLElement} badge - The status badge DOM element
 * @param {object} statusData - Status data from /api/status
 */
function updateStatusBadge(badge, statusData) {
  const { status, status_color } = statusData;

  // Apply color classes
  applyStatusColor(badge, status_color);

  // Update text content - only update the text span, preserving icon
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.textContent = `Status: ${status}`;
  } else {
    // Fallback: update badge text directly (for backwards compatibility)
    badge.textContent = `Status: ${status}`;
  }

  // Update data attribute for debugging
  badge.dataset.statusColor = status_color;

  console.log('Status badge updated', {
    status,
    color: status_color,
    median_date: statusData.median_date,
    days_difference: statusData.days_difference,
  });
}

/**
 * Set fallback status when API fails
 *
 * @param {HTMLElement} badge - The status badge DOM element
 */
function setFallbackStatus(badge) {
  applyStatusColor(badge, FALLBACK_STATUS.status_color);

  // Update text content - only update the text span, preserving icon
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.textContent = `Status: ${FALLBACK_STATUS.status}`;
  } else {
    // Fallback: update badge text directly (for backwards compatibility)
    badge.textContent = `Status: ${FALLBACK_STATUS.status}`;
  }

  badge.dataset.statusColor = FALLBACK_STATUS.status_color;

  console.warn('Using fallback status due to API error');
}

/**
 * Initialize status badge on page load
 * Fetches status from /api/status and updates badge in header
 */
async function initStatusBadge() {
  // Get status badge element
  const badge = document.getElementById('status-badge');

  if (!badge) {
    console.warn('Status badge element not found (#status-badge)');
    return;
  }

  try {
    // Fetch status from API
    const statusData = await fetchStatus();

    // Update badge with fetched data
    updateStatusBadge(badge, statusData);
  } catch (error) {
    console.error('Failed to load status badge:', error);

    // Apply fallback status
    setFallbackStatus(badge);
  }
}

// Initialize status badge when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStatusBadge);
} else {
  // DOM already loaded, execute immediately
  initStatusBadge();
}
