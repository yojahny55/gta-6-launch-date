import { beforeAll } from 'vitest';
import { env } from 'cloudflare:test';

/**
 * Test Setup - Apply Database Schema
 *
 * This file runs before all tests to apply the database schema to the test D1 database.
 * The Vitest pool creates a fresh, empty D1 database for testing.
 */

// Embedded schema from src/db/schema.sql
const SCHEMA_SQL = `
-- GTA 6 Predictions Database Schema
-- Cloudflare D1 (SQLite)

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date TEXT NOT NULL,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
) STRICT;

-- Email subscriptions table (optional, for post-MVP)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  cookie_id TEXT NOT NULL,
  subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  verified INTEGER DEFAULT 0,
  verification_token TEXT,
  unsubscribe_token TEXT UNIQUE
) STRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date);
CREATE INDEX IF NOT EXISTS idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX IF NOT EXISTS idx_predictions_submitted ON predictions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_email_verified ON email_subscriptions(verified);
`;

beforeAll(async () => {
  console.log('[Test Setup] Applying database schema to test D1 database...');

  // Execute schema as a batch (D1 supports multiple statements)
  try {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          predicted_date TEXT NOT NULL,
          submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          ip_hash TEXT NOT NULL,
          cookie_id TEXT NOT NULL UNIQUE,
          user_agent TEXT,
          weight REAL DEFAULT 1.0,
          UNIQUE(ip_hash) ON CONFLICT FAIL
        ) STRICT
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS email_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          cookie_id TEXT NOT NULL,
          subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
          verified INTEGER DEFAULT 0,
          verification_token TEXT,
          unsubscribe_token TEXT UNIQUE
        ) STRICT
      `),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date)'),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_predictions_cookie ON predictions(cookie_id)'),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_predictions_submitted ON predictions(submitted_at)'),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_email_verified ON email_subscriptions(verified)'),
    ]);

    console.log('[Test Setup] Database schema applied successfully!');
  } catch (error) {
    console.error('[Test Setup] Failed to apply schema:', error);
    throw error;
  }
});
