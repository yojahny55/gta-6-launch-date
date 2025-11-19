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
    code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}

// Cloudflare Workers Environment
export interface Env {
  DB: D1Database; // D1 database binding (Story 1.2)
  IP_HASH_SALT: string; // Legacy salt (deprecated - use SALT_V1)
  SALT_V1: string; // Versioned salt for IP hashing (Story 2.2, FR79)
}
