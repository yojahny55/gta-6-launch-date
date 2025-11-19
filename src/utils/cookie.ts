/**
 * Cookie Utility Module
 *
 * Provides functions for secure cookie ID generation and validation
 * using UUID v4 format with Web Crypto API.
 *
 * Security: Implements cryptographically secure random IDs to prevent
 * enumeration attacks (FR80). Cookie flags configured per ADR-010.
 */

// UUID v4 validation regex per tech spec
// Format: 8-4-4-4-12 hex digits with '4' in version position and '[89ab]' in variant position
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Cookie ID type alias (UUID v4 format)
 * Exported for use in API endpoints and type definitions
 */
export type CookieID = string;

/**
 * Cookie options configuration for secure cookie attributes
 * Per AC1: httpOnly: false (JavaScript needs access), secure: true, sameSite: 'Strict'
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number; // in seconds
  path?: string;
}

/**
 * Generate a cryptographically secure cookie ID using UUID v4
 *
 * Uses Web Crypto API's crypto.randomUUID() which provides:
 * - Cryptographically secure randomness (CSPRNG)
 * - Standard UUID v4 format
 * - Built-in browser/Workers API (no dependencies)
 *
 * @returns {CookieID} UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * const cookieId = generateCookieID();
 * // Returns: "a3bb189e-8bf9-3888-9912-ace4e6543002"
 */
export function generateCookieID(): CookieID {
  return crypto.randomUUID();
}

/**
 * Validate if a given string is a valid UUID v4 format
 *
 * Validation criteria per tech spec:
 * - 8-4-4-4-12 hexadecimal format
 * - Version field (13th char) must be '4'
 * - Variant field (17th char) must be [89ab]
 *
 * @param {string} cookieId - The cookie ID to validate
 * @returns {boolean} True if valid UUID v4, false otherwise
 *
 * @example
 * validateCookieID("550e8400-e29b-41d4-a716-446655440000"); // true
 * validateCookieID("invalid-uuid"); // false
 * validateCookieID(""); // false
 */
export function validateCookieID(cookieId: string): boolean {
  if (!cookieId || typeof cookieId !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(cookieId);
}

/**
 * Set a cookie with secure flags
 *
 * This is a server-side utility for setting cookies in HTTP responses.
 * For frontend cookie management, use js-cookie library in public/app.js.
 *
 * Security flags per ADR-010 and AC1:
 * - httpOnly: false (JavaScript needs access for form submissions)
 * - secure: true (HTTPS only, prevents MITM attacks)
 * - sameSite: 'Strict' (prevents CSRF attacks)
 * - maxAge: 63072000 (2 years per FR65)
 * - path: '/' (site-wide access)
 *
 * @param {string} name - Cookie name (e.g., "gta6_user_id")
 * @param {string} value - Cookie value (UUID v4)
 * @param {CookieOptions} options - Cookie configuration options
 * @returns {string} Set-Cookie header value
 *
 * @example
 * const cookieHeader = setCookie("gta6_user_id", generateCookieID(), {
 *   httpOnly: false,
 *   secure: true,
 *   sameSite: 'Strict',
 *   maxAge: 63072000,
 *   path: '/'
 * });
 * // Returns: "gta6_user_id=550e8400-e29b-41d4-a716-446655440000; Max-Age=63072000; Path=/; Secure; SameSite=Strict"
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): string {
  const {
    httpOnly = false,
    secure = true,
    sameSite = 'Strict',
    maxAge = 63072000, // 2 years (per FR65)
    path = '/',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (maxAge) {
    cookieString += `; Max-Age=${maxAge}`;
  }

  if (path) {
    cookieString += `; Path=${path}`;
  }

  if (secure) {
    cookieString += '; Secure';
  }

  if (httpOnly) {
    cookieString += '; HttpOnly';
  }

  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  return cookieString;
}

/**
 * Get cookie value from cookie string
 *
 * This is a server-side utility for parsing cookies from HTTP request headers.
 * For frontend cookie management, use js-cookie library in public/app.js.
 *
 * @param {string} cookieString - Raw Cookie header value
 * @param {string} name - Cookie name to extract
 * @returns {string | undefined} Cookie value if found, undefined otherwise
 *
 * @example
 * const cookieHeader = "gta6_user_id=550e8400-e29b-41d4-a716-446655440000; session=xyz";
 * const userId = getCookie(cookieHeader, "gta6_user_id");
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 */
export function getCookie(cookieString: string, name: string): string | undefined {
  if (!cookieString) {
    return undefined;
  }

  const cookies = cookieString.split(';').map((c) => c.trim());

  for (const cookie of cookies) {
    // Handle cases like "name=value" or "name  =  value" (with extra whitespace)
    const trimmed = cookie.trim();

    // Find the equals sign
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    // Extract cookie name and trim whitespace
    const cookieName = trimmed.substring(0, equalIndex).trim();

    // Check if this is the cookie we're looking for
    if (cookieName === name) {
      const value = trimmed.substring(equalIndex + 1).trim();
      return decodeURIComponent(value);
    }
  }

  return undefined;
}

/**
 * Default cookie name for GTA 6 user tracking
 * Per AC1 and tech spec
 */
export const COOKIE_NAME = 'gta6_user_id';

/**
 * Default cookie max age (2 years in seconds)
 * Per FR65 and AC1
 * Calculation: 2 years * 365 days/year * 24 hours/day * 60 min/hour * 60 sec/min
 * Using 365 days (not 365.25) to align with spec: 2 * 365 * 24 * 60 * 60 = 63072000
 */
export const COOKIE_MAX_AGE = 63072000; // 2 years

/**
 * Get default cookie options for GTA 6 user tracking
 * Encapsulates security flags per ADR-010 and AC1
 *
 * @returns {CookieOptions} Default cookie configuration
 */
export function getDefaultCookieOptions(): CookieOptions {
  return {
    httpOnly: false, // JavaScript needs access for form submissions
    secure: true, // HTTPS only (prevents MITM attacks)
    sameSite: 'Strict', // Prevents CSRF attacks
    maxAge: COOKIE_MAX_AGE, // 2 years (FR65)
    path: '/', // Site-wide access
  };
}
