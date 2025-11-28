/**
 * Centralized Validation Module
 *
 * Provides Zod schemas and validation functions for all user inputs.
 * Implements server-side validation with TypeScript-first approach.
 *
 * Requirements: Implements FR78 (input validation), NFR-S4, NFR-S5 (XSS/SQL injection prevention).
 * Story 2.4: Input Validation and XSS Prevention
 *
 * Security: All inputs validated server-side. Never trust client.
 */

import { z } from 'zod';

/**
 * Minimum allowed date for predictions (November 19, 2026 - Official GTA 6 launch date)
 */
export const MIN_DATE = '2026-11-19';

/**
 * Maximum allowed date for predictions (December 31, 2125)
 */
export const MAX_DATE = '2125-12-31';

/**
 * ISO 8601 date format regex (YYYY-MM-DD)
 * Validates year range 2025-2125, months 01-12, days 01-31
 */
export const DATE_REGEX = /^(202[5-9]|20[3-9]\d|21[0-2]\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * UUID v4 format regex
 * Format: 8-4-4-4-12 hex digits with '4' in version position and '[89ab]' in variant position
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maximum user agent string length
 */
export const MAX_USER_AGENT_LENGTH = 256;

/**
 * Zod schema for ISO 8601 date validation with range constraints
 *
 * Validation rules:
 * - Format: YYYY-MM-DD (ISO 8601)
 * - Range: 2026-11-19 to 2125-12-31
 * - Valid calendar date (no Feb 30, no month 13, etc.)
 *
 * @example
 * DateSchema.parse('2026-11-19') // OK
 * DateSchema.parse('2024-12-31') // Error: Date before minimum
 * DateSchema.parse('11/19/2026') // Error: Invalid format
 */
export const DateSchema = z
  .string()
  .regex(DATE_REGEX, 'Invalid date format. Expected YYYY-MM-DD between 2026-11-19 and 2125-12-31')
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: 'Invalid calendar date' }
  )
  .refine(
    (date) => {
      const parsed = new Date(date);
      const min = new Date(MIN_DATE);
      return parsed >= min;
    },
    { message: `Date must be on or after ${MIN_DATE} (official GTA 6 launch date). Predictions before the official launch date are not allowed.` }
  )
  .refine(
    (date) => {
      const parsed = new Date(date);
      const max = new Date(MAX_DATE);
      return parsed <= max;
    },
    { message: `Date must be on or before ${MAX_DATE}` }
  )
  .refine(
    (date) => {
      // Verify calendar validity (prevents Feb 30, etc.)
      const parsed = new Date(date);
      const reconstructed = parsed.toISOString().split('T')[0];
      return reconstructed === date;
    },
    { message: 'Invalid calendar date (e.g., Feb 30, Apr 31)' }
  );

/**
 * Zod schema for UUID v4 validation
 *
 * Validation rules:
 * - Format: 8-4-4-4-12 hexadecimal
 * - Version field (13th char) must be '4'
 * - Variant field (17th char) must be [89ab]
 * - Max length: 36 characters
 *
 * @example
 * UUIDSchema.parse('550e8400-e29b-41d4-a716-446655440000') // OK
 * UUIDSchema.parse('invalid-uuid') // Error
 */
export const UUIDSchema = z
  .string()
  .max(36, 'UUID must be at most 36 characters')
  .regex(UUID_REGEX, 'Invalid UUID v4 format');

/**
 * Zod schema for user agent validation
 *
 * Validation rules:
 * - Max length: 256 characters
 * - Sanitized to remove dangerous patterns
 *
 * Note: User agent is optional in database, but if provided, must be valid
 *
 * @example
 * UserAgentSchema.parse('Mozilla/5.0 ...') // OK
 * UserAgentSchema.parse('x'.repeat(300)) // Error: Too long
 */
export const UserAgentSchema = z
  .string()
  .max(MAX_USER_AGENT_LENGTH, `User agent must be at most ${MAX_USER_AGENT_LENGTH} characters`);

/**
 * Zod schema for prediction submission request
 *
 * Used by POST /api/predict and PUT /api/predict endpoints
 * Updated to use Cloudflare Turnstile (Story 2.5B)
 *
 * @example
 * PredictionRequestSchema.parse({
 *   predicted_date: '2026-11-19',
 *   turnstile_token: '0x1aBcDeFg...'
 * }) // OK
 */
export const PredictionRequestSchema = z.object({
  predicted_date: DateSchema,
  turnstile_token: z.string().min(1, 'Turnstile token is required'),
});

/**
 * Type inference for PredictionRequest
 */
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

/**
 * Sanitize user agent string to prevent XSS attacks
 *
 * Applies HTML encoding to special characters:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#x27;
 *
 * @param {string} userAgent - Raw user agent string
 * @returns {string} Sanitized user agent string
 *
 * @example
 * sanitizeUserAgent('Mozilla/5.0 <script>alert(1)</script>')
 * // Returns: 'Mozilla/5.0 &lt;script&gt;alert(1)&lt;/script&gt;'
 */
export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent || typeof userAgent !== 'string') {
    return '';
  }

  return userAgent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Detect SQL injection patterns in user input
 *
 * Checks for common SQL injection patterns:
 * - UNION SELECT
 * - DROP TABLE/DATABASE
 * - DELETE FROM
 * - INSERT INTO
 * - UPDATE SET
 * - SQL comments (-- and block comments)
 * - OR 1=1 patterns
 * - EXEC/EXECUTE
 *
 * @param {string} input - User input to check
 * @returns {boolean} True if SQL injection detected, false otherwise
 *
 * @example
 * detectSQLInjection('Mozilla/5.0') // false
 * detectSQLInjection("'; DROP TABLE users; --") // true
 * detectSQLInjection('1 OR 1=1') // true
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\b(TABLE|DATABASE)\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bEXEC(UTE)?\b)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect XSS (Cross-Site Scripting) patterns in user input
 *
 * Checks for common XSS attack vectors:
 * - <script> tags
 * - <img> tags with onerror
 * - <iframe> tags
 * - <object> and <embed> tags
 * - Event handlers (onclick, onerror, onload, etc.)
 * - javascript: protocol
 * - data: protocol with base64
 *
 * @param {string} input - User input to check
 * @returns {boolean} True if XSS pattern detected, false otherwise
 *
 * @example
 * detectXSS('Mozilla/5.0') // false
 * detectXSS('<script>alert(1)</script>') // true
 * detectXSS('<img src=x onerror=alert(1)>') // true
 * detectXSS('javascript:alert(1)') // true
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<img[^>]+onerror\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /on(click|error|load|mouse\w+|key\w+)\s*=/gi,
    /javascript:/gi,
    /data:.*base64/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate user agent string for security threats
 *
 * Combines length validation, SQL injection detection, and XSS detection
 *
 * @param {string} userAgent - User agent string to validate
 * @returns {{ valid: boolean; error?: string; sanitized?: string }} Validation result
 *
 * @example
 * validateUserAgent('Mozilla/5.0')
 * // { valid: true, sanitized: 'Mozilla/5.0' }
 *
 * validateUserAgent('<script>alert(1)</script>')
 * // { valid: false, error: 'User agent contains potentially dangerous XSS patterns' }
 *
 * validateUserAgent("'; DROP TABLE users; --")
 * // { valid: false, error: 'User agent contains potentially dangerous SQL injection patterns' }
 */
export function validateUserAgent(userAgent: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  // Length validation
  if (userAgent.length > MAX_USER_AGENT_LENGTH) {
    return {
      valid: false,
      error: `User agent must be at most ${MAX_USER_AGENT_LENGTH} characters`,
    };
  }

  // SQL injection detection
  if (detectSQLInjection(userAgent)) {
    return {
      valid: false,
      error: 'User agent contains potentially dangerous SQL injection patterns',
    };
  }

  // XSS detection
  if (detectXSS(userAgent)) {
    return {
      valid: false,
      error: 'User agent contains potentially dangerous XSS patterns',
    };
  }

  // Sanitize for storage
  const sanitized = sanitizeUserAgent(userAgent);

  return { valid: true, sanitized };
}
