-- GTA 6 Predictions Database Schema
-- Cloudflare D1 (SQLite)

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date TEXT NOT NULL,  -- ISO 8601 format (YYYY-MM-DD)
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- ISO 8601 timestamp
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,    -- ISO 8601 timestamp
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
  subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- ISO 8601 timestamp
  verified INTEGER DEFAULT 0,  -- SQLite STRICT mode: 0=false, 1=true
  verification_token TEXT,
  unsubscribe_token TEXT UNIQUE
) STRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date);
CREATE INDEX IF NOT EXISTS idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX IF NOT EXISTS idx_predictions_submitted ON predictions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_email_verified ON email_subscriptions(verified);
