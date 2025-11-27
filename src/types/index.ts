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

/**
 * Statistics API response interface
 * Returned by GET /api/stats endpoint (Story 2.10)
 */
export interface StatsApiResponse {
  median: string; // Weighted median date (ISO 8601: YYYY-MM-DD)
  min: string; // Earliest prediction date
  max: string; // Latest prediction date
  count: number; // Total prediction count
  cached_at: string; // ISO 8601 timestamp when stats were calculated
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
      | 'BOT_DETECTED'
      | 'IP_ALREADY_USED'; // Story 4.7 - Cookie conflict resolution
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

/**
 * Rate limit check result interface
 * Used by rate limiter middleware (Story 2.6)
 */
export interface RateLimitResult {
  allowed: boolean; // true = request allowed, false = rate limit exceeded
  remaining: number; // requests remaining in current window
  resetAt: number; // Unix timestamp when limit resets
  limit: number; // maximum requests per window
  error?: string; // error message if KV operation failed (fail-open)
}

/**
 * Rate limit configuration per endpoint
 * Used by rate limiter middleware (Story 2.6)
 */
export interface RateLimitConfig {
  limit: number; // max requests per window
  windowSeconds: number; // window size in seconds (typically 60)
  endpoint: string; // endpoint identifier (e.g., 'submit', 'update', 'stats')
}

/**
 * Capacity level type for graceful degradation (Story 3.7)
 * Determines system behavior under load
 */
export type CapacityLevel = 'normal' | 'elevated' | 'high' | 'critical' | 'exceeded';

/**
 * Degradation state interface (Story 3.7)
 * Describes current system capacity and enabled features
 */
export interface DegradationState {
  level: CapacityLevel;
  requestsToday: number;
  limitToday: number;
  resetAt: string; // ISO 8601 timestamp for midnight UTC
  features: {
    statsEnabled: boolean;
    submissionsEnabled: boolean;
    chartEnabled: boolean;
    cacheExtended: boolean;
  };
}

/**
 * Queued submission interface (Story 3.7)
 * Stores submissions when capacity is critical (95%+)
 */
export interface QueuedSubmission {
  predicted_date: string;
  cookie_id: CookieID;
  ip_hash: IPHash;
  user_agent: string | null;
  queued_at: string; // ISO 8601 timestamp
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
  gta6_rate_limit?: KVNamespace; // Cloudflare KV for rate limiting (Story 2.6)
  gta6_stats_cache?: KVNamespace; // Cloudflare KV for statistics caching (Story 2.10)
  gta6_capacity?: KVNamespace; // Cloudflare KV for capacity monitoring and queue (Story 3.7)
  gta6_deletion_tokens?: KVNamespace; // Cloudflare KV for deletion confirmation tokens (Story 4.6)
}
