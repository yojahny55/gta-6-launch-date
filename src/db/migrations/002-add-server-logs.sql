-- Migration: Add server_logs table for data retention policy
-- Story 4.8: Data Retention Policy Implementation
-- Retention: 90 days

CREATE TABLE IF NOT EXISTS server_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- ISO 8601 timestamp
  level TEXT NOT NULL,                        -- INFO, WARN, ERROR
  message TEXT NOT NULL,                      -- Log message
  ip_hash TEXT,                               -- Hashed IP address (privacy-preserving)
  request_path TEXT,                          -- Request path (e.g., /api/predict)
  request_method TEXT,                        -- HTTP method (GET, POST, etc.)
  status_code INTEGER,                        -- HTTP status code
  error_details TEXT,                         -- Error stack trace or details
  user_agent TEXT                             -- User agent string
) STRICT;

-- Index for efficient cleanup queries (DELETE WHERE created_at < cutoff)
CREATE INDEX IF NOT EXISTS idx_server_logs_created_at ON server_logs(created_at);

-- Index for querying by log level
CREATE INDEX IF NOT EXISTS idx_server_logs_level ON server_logs(level);
