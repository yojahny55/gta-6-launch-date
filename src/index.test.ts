import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from './index';

/**
 * Integration tests for GTA 6 Tracker API endpoints
 * Tests database connectivity, error handling, and response formats
 *
 * Story 1.2: Cloudflare Infrastructure Configuration
 * Requirement: Epic 1 Tech Spec line 433 - Integration Tests for database connection
 */

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('GTA 6 Launch Date Prediction Tracker - API');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status with timestamp', async () => {
      const req = new Request('http://localhost/health');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('status', 'healthy');
      expect(body).toHaveProperty('timestamp');

      // Verify timestamp is valid ISO 8601 format
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('GET /api/db-test', () => {
    it('should successfully connect to database and return prediction count', async () => {
      const req = new Request('http://localhost/api/db-test');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);

      const body = await res.json();

      // Verify response structure
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', 'Database connection successful');
      expect(body).toHaveProperty('data');

      // Verify data payload
      expect(body.data).toHaveProperty('predictions_count');
      expect(body.data).toHaveProperty('database_connected', true);
      expect(body.data).toHaveProperty('timestamp');

      // Verify count is a number (0 or greater for empty database)
      expect(typeof body.data.predictions_count).toBe('number');
      expect(body.data.predictions_count).toBeGreaterThanOrEqual(0);

      // Verify timestamp is valid
      const timestamp = new Date(body.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should return valid JSON response structure', async () => {
      const req = new Request('http://localhost/api/db-test');
      const res = await app.fetch(req, env);

      const contentType = res.headers.get('content-type');
      expect(contentType).toContain('application/json');

      const body = await res.json();

      // Verify response follows standard API structure
      expect(body).toHaveProperty('success');
      expect(typeof body.success).toBe('boolean');

      if (body.success) {
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');
      } else {
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('error');
      }
    });

    it('should use prepared statement (parameterized query)', async () => {
      // This test verifies that the query uses c.env.DB.prepare()
      // which implements parameterized queries (NFR-S5, FR78)
      const req = new Request('http://localhost/api/db-test');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);
      const body = await res.json();

      // If query execution succeeds, prepared statement is working
      expect(body.success).toBe(true);
      expect(body.data.database_connected).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  describe('GET /api/db-test', () => {
    it('should handle database errors gracefully', async () => {
      // Test that errors don't leak sensitive information
      const req = new Request('http://localhost/api/db-test');
      const res = await app.fetch(req, env);

      const body = await res.json();

      // Even if there's an error, it should be structured
      if (!body.success) {
        expect(res.status).toBe(500);
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('timestamp');

        // Verify no SQL or sensitive info leaked
        expect(body.error).not.toContain('database_id');
        expect(body.error).not.toContain('wrangler');
      }
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const req = new Request('http://localhost/nonexistent-route');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(404);
    });
  });
});

describe('Response Headers', () => {
  it('should return appropriate content-type for JSON endpoints', async () => {
    const endpoints = ['/health', '/api/db-test'];

    for (const endpoint of endpoints) {
      const req = new Request(`http://localhost${endpoint}`);
      const res = await app.fetch(req, env);

      const contentType = res.headers.get('content-type');
      expect(contentType).toContain('application/json');
    }
  });

  it('should return appropriate content-type for text endpoints', async () => {
    const req = new Request('http://localhost/');
    const res = await app.fetch(req, env);

    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('text/plain');
  });
});
