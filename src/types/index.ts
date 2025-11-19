// TypeScript interfaces for GTA 6 Tracker

/**
 * Cookie ID type alias (UUID v4 format)
 * Used for user tracking without accounts (FR3)
 * Format: "550e8400-e29b-41d4-a716-446655440000"
 */
export type CookieID = string; // UUID v4 format

export interface Prediction {
  id: number;
  predicted_date: string; // ISO 8601: "2027-03-15"
  submitted_at: string; // ISO 8601: "2025-11-13T10:30:00Z"
  updated_at: string;
  ip_hash: string;
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
  IP_HASH_SALT: string; // Secret for IP hashing (Story 1.2)
}
