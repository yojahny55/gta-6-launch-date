// TypeScript interfaces for GTA 6 Tracker

/**
 * Cookie ID type alias (UUID v4 format)
 * Used for user tracking without accounts (FR3)
 * Format: "550e8400-e29b-41d4-a716-446655440000"
 */
export type CookieID = string; // UUID v4 format

/**
 * IP Hash type alias (64-character hex string)
 * Result of BLAKE2b-256 or SHA-256 hashing with salt
 * Used for privacy-preserving anti-spam (FR53, NFR-S2)
 * Format: "a3bb189e8bf9388899912ace4e6543002f1a2b3c4d5e6f7890abcdef12345678"
 */
export type IPHash = string; // 64-char hex string

export interface Prediction {
  id: number;
  predicted_date: string; // ISO 8601: "2027-03-15"
  submitted_at: string; // ISO 8601: "2025-11-13T10:30:00Z"
  updated_at: string;
  ip_hash: IPHash; // 64-char hex string (BLAKE2b/SHA-256)
  cookie_id: CookieID; // UUID v4 format
  user_agent: string | null;
  weight: number;
}

export interface Stats {
  median: string; // Weighted median date
  min: string; // Earliest prediction
  max: string; // Latest prediction
  total: number; // Total predictions count
}

export interface PredictionResponse {
  success: true;
  data: {
    prediction: Prediction;
    stats: Stats;
    delta_days: number;
    comparison: 'optimistic' | 'pessimistic' | 'aligned';
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'RATE_LIMIT_EXCEEDED'
      | 'NOT_FOUND'
      | 'SERVER_ERROR'
      | 'BOT_DETECTED';
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Date validation result interface
 * Used by date-validation utility functions (Story 2.3)
 */
export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generic validation result interface
 * Used by validation utility functions (Story 2.4)
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

/**
 * User agent validation result interface
 * Used by validateUserAgent function (Story 2.4)
 */
export interface UserAgentValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * reCAPTCHA verification result interface
 * Used by reCAPTCHA utility functions (Story 2.5)
 * DEPRECATED: Replaced by TurnstileVerificationResult (Story 2.5B)
 */
export interface RecaptchaVerificationResult {
  success: boolean;
  score: number; // 0.0 (bot) to 1.0 (human)
  action?: string; // Action name from frontend (e.g., 'submit_prediction')
  challenge_ts?: string; // ISO 8601 timestamp of challenge
  hostname?: string; // Hostname where reCAPTCHA was executed
  'error-codes'?: string[]; // Google API error codes
}

/**
 * Cloudflare Turnstile verification result interface
 * Used by Turnstile utility functions (Story 2.5B)
 *
 * Simpler than reCAPTCHA: Boolean success (no score threshold)
 * Replaces RecaptchaVerificationResult per ADR-013
 */
export interface TurnstileVerificationResult {
  success: boolean; // Challenge-based: true = passed, false = failed
  challenge_ts?: string; // ISO 8601 timestamp of challenge completion
  hostname?: string; // Hostname where Turnstile was executed
  'error-codes'?: string[]; // Cloudflare API error codes
}

// Cloudflare Workers Environment
export interface Env {
  DB: D1Database; // D1 database binding (Story 1.2)
  IP_HASH_SALT: string; // Legacy salt (deprecated - use SALT_V1)
  SALT_V1: string; // Versioned salt for IP hashing (Story 2.2, FR79)
  RECAPTCHA_SECRET_KEY?: string; // DEPRECATED: reCAPTCHA v3 secret key (Story 2.5) - kept for backward compatibility
  RECAPTCHA_SITE_KEY?: string; // DEPRECATED: reCAPTCHA v3 site key (Story 2.5)
  TURNSTILE_SECRET_KEY: string; // Cloudflare Turnstile secret key (Story 2.5B)
  TURNSTILE_SITE_KEY?: string; // Cloudflare Turnstile site key (public, optional in backend)
}
