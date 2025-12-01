// Cookie Consent Management (Story 4.1: GDPR Cookie Consent Banner)
// Handles granular consent, banner display, analytics enabling/disabling

/**
 * Cookie Consent Configuration
 * Per AC: 12-month storage, granular functional vs analytics
 */
const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE_DAYS = 365; // 12 months
const CONSENT_COOKIE_OPTIONS = {
  expires: CONSENT_COOKIE_MAX_AGE_DAYS,
  secure: true,               // HTTPS only
  sameSite: 'strict',        // CSRF protection
  path: '/'                   // Site-wide
};

/**
 * Consent Levels
 * AC: Two levels - "all" (functional + analytics) or "functional" (functional only)
 */
const ConsentLevel = {
  ALL: 'all',
  FUNCTIONAL: 'functional'
};

/**
 * Simple Cookie Utility (reused from app.js pattern)
 * Handles encoding/decoding safely
 */
const CookieConsent = {
  /**
   * Set consent cookie with secure options
   * @param {string} level - Consent level ("all" or "functional")
   */
  setConsent(level) {
    const options = CONSENT_COOKIE_OPTIONS;
    let cookieString = `${encodeURIComponent(CONSENT_COOKIE_NAME)}=${encodeURIComponent(level)}`;

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
   * Get current consent level
   * @returns {string|undefined} "all", "functional", or undefined if not set
   */
  getConsent() {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const consentCookie = cookies.find(cookie => cookie.startsWith(`${CONSENT_COOKIE_NAME}=`));

    if (!consentCookie) {
      return undefined;
    }

    const value = consentCookie.substring(CONSENT_COOKIE_NAME.length + 1);
    return decodeURIComponent(value);
  },

  /**
   * Check if analytics cookies are enabled
   * @returns {boolean} True if consent=all, false otherwise
   */
  isAnalyticsEnabled() {
    const consent = this.getConsent();
    return consent === ConsentLevel.ALL;
  }
};

/**
 * Check current consent status
 * AC: Used to determine banner visibility
 * @returns {string|null} Current consent level or null if no consent given
 */
function checkConsentStatus() {
  return CookieConsent.getConsent() || null;
}

/**
 * Show the cookie consent banner
 * AC: Banner appears at bottom, non-intrusive
 */
function showConsentBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) {
    banner.classList.remove('hidden');
    // Announce to screen readers
    banner.setAttribute('aria-live', 'polite');
  }
}

/**
 * Hide the cookie consent banner
 * AC: Banner dismisses on button click
 */
function hideConsentBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

/**
 * Enable or disable analytics based on consent
 * AC: Analytics loaded only if consent=all
 * AC: Functional cookies always work (gta6_user_id)
 *
 * @param {boolean} enabled - True to enable analytics, false to disable
 */
function setAnalyticsEnabled(enabled) {
  if (enabled) {
    // Enable Cloudflare Analytics
    enableCloudflareAnalytics();
  } else {
    // Disable analytics (functional cookies still work)
    // Note: Functional cookies (gta6_user_id) always work regardless
  }
}

/**
 * Enable Cloudflare Analytics by loading the script
 * AC: Load analytics only if consent=all
 */
function enableCloudflareAnalytics() {
  // Check if analytics script already loaded
  if (document.querySelector('script[data-cf-beacon]')) {
    return;
  }

  // Load Cloudflare Web Analytics script
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', '{"token": "placeholder-replace-with-actual-token"}');
  document.body.appendChild(script);
}

/**
 * Handle "Accept All" button click
 * AC: Set both functional and analytics cookies
 */
function handleAcceptAll() {
  // Set consent to "all" (functional + analytics)
  CookieConsent.setConsent(ConsentLevel.ALL);

  // Enable analytics
  setAnalyticsEnabled(true);

  // Hide banner
  hideConsentBanner();
}

/**
 * Handle "Functional Only" button click
 * AC: Only set gta6_user_id, disable analytics
 */
function handleFunctionalOnly() {
  // Set consent to "functional" only
  CookieConsent.setConsent(ConsentLevel.FUNCTIONAL);

  // Disable analytics (functional cookies like gta6_user_id still work)
  setAnalyticsEnabled(false);

  // Hide banner
  hideConsentBanner();
}

/**
 * Initialize cookie consent banner on page load
 * AC: Show banner on first visit (no cookie_consent cookie)
 * AC: Hide banner if cookie_consent exists and valid
 * AC: Re-show banner after 12 months (cookie expiration)
 */
function initializeCookieConsent() {
  const consentStatus = checkConsentStatus();

  if (!consentStatus) {
    // No consent given yet - show banner
    showConsentBanner();
  } else {
    // Consent already given - hide banner
    hideConsentBanner();

    // Enable analytics if user previously consented to "all"
    if (consentStatus === ConsentLevel.ALL) {
      setAnalyticsEnabled(true);
    }
  }

  // Set up button event listeners
  const acceptAllBtn = document.getElementById('cookie-accept-all');
  const functionalOnlyBtn = document.getElementById('cookie-functional-only');

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', handleAcceptAll);
  }

  if (functionalOnlyBtn) {
    functionalOnlyBtn.addEventListener('click', handleFunctionalOnly);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCookieConsent);
} else {
  // DOM already loaded
  initializeCookieConsent();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CookieConsent,
    checkConsentStatus,
    showConsentBanner,
    hideConsentBanner,
    setAnalyticsEnabled,
    enableCloudflareAnalytics,
    handleAcceptAll,
    handleFunctionalOnly,
    initializeCookieConsent,
    ConsentLevel,
    CONSENT_COOKIE_NAME,
    CONSENT_COOKIE_MAX_AGE_DAYS
  };
}
