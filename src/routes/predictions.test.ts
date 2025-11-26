/**
 * Predictions Route Integration Tests
 *
 * Tests for GET /api/predictions endpoint including:
 * - Cache hit/miss behavior
 * - Response format validation
 * - Header verification (Cache-Control, X-Cache)
 * - 50-prediction minimum threshold (FR99)
 * - Privacy preservation
 * - Error handling
 *
 * @see Story 3.4b: Prediction Data API Endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import { createPredictionsRoutes } from './predictions';

// Mock the predictions aggregation service
vi.mock('../services/predictions-aggregation.service', () => ({
  getAggregatedPredictionsWithCache: vi.fn(),
  PREDICTIONS_CACHE_KEY: 'predictions:aggregated',
  PREDICTIONS_CACHE_TTL: 300,
}));

import { getAggregatedPredictionsWithCache } from '../services/predictions-aggregation.service';

// Create test app with predictions routes
function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/', createPredictionsRoutes());
  return app;
}

// Mock environment
function createMockEnv(): Env {
  return {
    DB: {} as D1Database,
    gta6_stats_cache: {} as KVNamespace,
    IP_HASH_SALT: 'test-salt',
    SALT_V1: 'test-salt-v1',
    TURNSTILE_SECRET_KEY: 'test-turnstile-key',
  };
}

describe('GET /api/predictions', () => {
  let app: Hono<{ Bindings: Env }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache Hit', () => {
    it('should return cached predictions with X-Cache: HIT', async () => {
      const cachedPredictions = {
        data: [
          { predicted_date: '2026-11-19', count: 1247 },
          { predicted_date: '2027-02-14', count: 823 },
          { predicted_date: '2027-06-15', count: 456 },
        ],
        total_predictions: 10234,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: cachedPredictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('HIT');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');

      const body = await res.json();
      expect(body).toEqual(cachedPredictions);
      expect(body.data).toHaveLength(3);
    });
  });

  describe('Cache Miss', () => {
    it('should return calculated predictions with X-Cache: MISS', async () => {
      const calculatedPredictions = {
        data: [
          { predicted_date: '2026-11-19', count: 500 },
          { predicted_date: '2027-02-14', count: 300 },
        ],
        total_predictions: 5000,
        cached_at: '2025-11-26T14:30:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: calculatedPredictions,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('MISS');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');

      const body = await res.json();
      expect(body).toEqual(calculatedPredictions);
    });
  });

  describe('50-Prediction Minimum Threshold (FR99)', () => {
    it('should return empty data when below 50 predictions', async () => {
      const belowThreshold = {
        data: [], // Empty when threshold not met
        total_predictions: 42,
        cached_at: '2025-11-26T14:30:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: belowThreshold,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.total_predictions).toBe(42);
      expect(body.total_predictions).toBeLessThan(50);
    });

    it('should return data when exactly 50 predictions (boundary)', async () => {
      const exactThreshold = {
        data: [{ predicted_date: '2026-11-19', count: 50 }],
        total_predictions: 50,
        cached_at: '2025-11-26T14:30:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: exactThreshold,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.total_predictions).toBe(50);
    });

    it('should return data when above 50 predictions', async () => {
      const aboveThreshold = {
        data: [
          { predicted_date: '2026-11-19', count: 51 },
        ],
        total_predictions: 51,
        cached_at: '2025-11-26T14:30:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: aboveThreshold,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.total_predictions).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Privacy Preservation', () => {
    it('should not expose sensitive data (cookie_id, ip_hash, weight)', async () => {
      const predictions = {
        data: [
          { predicted_date: '2026-11-19', count: 1247 },
          { predicted_date: '2027-02-14', count: 823 },
        ],
        total_predictions: 2070,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());
      const body = await res.json();

      // Verify no sensitive fields in data
      body.data.forEach((item: any) => {
        expect(item).not.toHaveProperty('cookie_id');
        expect(item).not.toHaveProperty('ip_hash');
        expect(item).not.toHaveProperty('weight');
        expect(item).not.toHaveProperty('user_agent');
        expect(item).not.toHaveProperty('submitted_at');
        expect(item).not.toHaveProperty('updated_at');

        // Should only have these properties
        expect(item).toHaveProperty('predicted_date');
        expect(item).toHaveProperty('count');
        expect(Object.keys(item)).toHaveLength(2);
      });
    });
  });

  describe('Response Format', () => {
    it('should have correct response structure', async () => {
      const predictions = {
        data: [{ predicted_date: '2026-11-19', count: 100 }],
        total_predictions: 100,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());
      const body = await res.json();

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total_predictions');
      expect(body).toHaveProperty('cached_at');
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total_predictions).toBe('number');
      expect(typeof body.cached_at).toBe('string');
    });

    it('should have correct data item structure', async () => {
      const predictions = {
        data: [
          { predicted_date: '2026-11-19', count: 1247 },
        ],
        total_predictions: 1247,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());
      const body = await res.json();

      const item = body.data[0];
      expect(item).toHaveProperty('predicted_date');
      expect(item).toHaveProperty('count');
      expect(typeof item.predicted_date).toBe('string');
      expect(typeof item.count).toBe('number');

      // Verify ISO 8601 date format (YYYY-MM-DD)
      expect(item.predicted_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Empty Database', () => {
    it('should handle empty database gracefully', async () => {
      const emptyPredictions = {
        data: [],
        total_predictions: 0,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions: emptyPredictions,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.total_predictions).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should return predictions sorted by predicted_date ascending', async () => {
      const predictions = {
        data: [
          { predicted_date: '2025-06-15', count: 100 },
          { predicted_date: '2026-11-19', count: 500 },
          { predicted_date: '2027-02-14', count: 300 },
          { predicted_date: '2027-06-15', count: 200 },
        ],
        total_predictions: 1100,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());
      const body = await res.json();

      expect(body.data[0].predicted_date).toBe('2025-06-15');
      expect(body.data[1].predicted_date).toBe('2026-11-19');
      expect(body.data[2].predicted_date).toBe('2027-02-14');
      expect(body.data[3].predicted_date).toBe('2027-06-15');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on service error', async () => {
      vi.mocked(getAggregatedPredictionsWithCache).mockRejectedValue(
        new Error('Database connection failed')
      );

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toHaveProperty('code', 'SERVER_ERROR');
      expect(body.error).toHaveProperty('message');
      expect(body.error.message).toContain('Unable to fetch prediction data');
    });

    it('should not expose internal error details', async () => {
      vi.mocked(getAggregatedPredictionsWithCache).mockRejectedValue(
        new Error('Internal: SQL query failed on table xyz')
      );

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(500);
      const body = await res.json();

      // Should not expose internal error message
      expect(body.error.message).not.toContain('SQL');
      expect(body.error.message).not.toContain('table');
      expect(body.error.message).toBe('Unable to fetch prediction data. Please try again.');
    });
  });

  describe('Headers', () => {
    it('should set Cache-Control header with correct TTL', async () => {
      const predictions = {
        data: [{ predicted_date: '2026-11-19', count: 100 }],
        total_predictions: 100,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });

    it('should set X-Cache header for cache hit', async () => {
      const predictions = {
        data: [{ predicted_date: '2026-11-19', count: 100 }],
        total_predictions: 100,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: true,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.headers.get('X-Cache')).toBe('HIT');
    });

    it('should set X-Cache header for cache miss', async () => {
      const predictions = {
        data: [{ predicted_date: '2026-11-19', count: 100 }],
        total_predictions: 100,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.headers.get('X-Cache')).toBe('MISS');
    });
  });

  describe('Large Dataset', () => {
    it('should handle large number of unique dates', async () => {
      // Generate 1000 unique dates
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        predicted_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        count: Math.floor(Math.random() * 100) + 10,
      }));

      const predictions = {
        data: largeData,
        total_predictions: 50000,
        cached_at: '2025-11-26T10:00:00.000Z',
      };

      vi.mocked(getAggregatedPredictionsWithCache).mockResolvedValue({
        predictions,
        cacheHit: false,
      });

      const res = await app.request('/api/predictions', {}, createMockEnv());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1000);
    });
  });
});
