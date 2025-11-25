/**
 * Statistics Route Integration Tests
 *
 * Tests for GET /api/stats endpoint including:
 * - Cache hit/miss behavior
 * - Response format validation
 * - Header verification (Cache-Control, X-Cache)
 * - Error handling
 *
 * @see Story 2.10: Statistics Calculation and Caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import { createStatsRoutes } from './stats';

// Mock the statistics service
vi.mock('../services/statistics.service', () => ({
  getStatisticsWithCache: vi.fn(),
  STATS_CACHE_KEY: 'stats:latest',
  STATS_CACHE_TTL: 300,
}));

import { getStatisticsWithCache } from '../services/statistics.service';

// Create test app with stats routes
function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/', createStatsRoutes());
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

describe('GET /api/stats', () => {
  let app: Hono<{ Bindings: Env }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache Hit', () => {
    it('should return cached stats with X-Cache: HIT', async () => {
      const cachedStats = {
        median: '2026-11-19',
        min: '2025-06-15',
        max: '2099-12-31',
        count: 100,
        cached_at: '2025-11-24T10:00:00.000Z',
      };

      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: cachedStats,
        cacheHit: true,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('HIT');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');

      const body = await res.json();
      expect(body).toEqual(cachedStats);
    });
  });

  describe('Cache Miss', () => {
    it('should return calculated stats with X-Cache: MISS', async () => {
      const calculatedStats = {
        median: '2026-11-19',
        min: '2025-06-15',
        max: '2099-12-31',
        count: 50,
        cached_at: '2025-11-24T14:30:00.000Z',
      };

      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: calculatedStats,
        cacheHit: false,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Cache')).toBe('MISS');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');

      const body = await res.json();
      expect(body).toEqual(calculatedStats);
    });
  });

  describe('Response Format', () => {
    it('should return all required fields', async () => {
      const stats = {
        median: '2027-03-15',
        min: '2025-01-01',
        max: '2125-12-31',
        count: 10234,
        cached_at: '2025-11-24T15:00:00.000Z',
      };

      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats,
        cacheHit: false,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());
      const body = await res.json();

      expect(body).toHaveProperty('median');
      expect(body).toHaveProperty('min');
      expect(body).toHaveProperty('max');
      expect(body).toHaveProperty('count');
      expect(body).toHaveProperty('cached_at');

      expect(typeof body.median).toBe('string');
      expect(typeof body.min).toBe('string');
      expect(typeof body.max).toBe('string');
      expect(typeof body.count).toBe('number');
      expect(typeof body.cached_at).toBe('string');
    });

    it('should return valid ISO 8601 cached_at timestamp', async () => {
      const stats = {
        median: '2026-11-19',
        min: '2025-06-15',
        max: '2099-12-31',
        count: 100,
        cached_at: new Date().toISOString(),
      };

      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats,
        cacheHit: false,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());
      const body = await res.json();

      // Verify cached_at is valid ISO 8601
      const parsedDate = new Date(body.cached_at);
      expect(parsedDate.getTime()).not.toBeNaN();
      expect(body.cached_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('Empty Database', () => {
    it('should return empty stats for empty database', async () => {
      const emptyStats = {
        median: '',
        min: '',
        max: '',
        count: 0,
        cached_at: '2025-11-24T15:00:00.000Z',
      };

      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: emptyStats,
        cacheHit: false,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.count).toBe(0);
      expect(body.median).toBe('');
      expect(body.min).toBe('');
      expect(body.max).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on service error', async () => {
      vi.mocked(getStatisticsWithCache).mockRejectedValue(new Error('Database connection failed'));

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('SERVER_ERROR');
      expect(body.error.message).toBeDefined();
    });
  });

  describe('Headers', () => {
    it('should set Cache-Control header with 5 minute max-age', async () => {
      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: {
          median: '2026-11-19',
          min: '2025-06-15',
          max: '2099-12-31',
          count: 100,
          cached_at: '2025-11-24T10:00:00.000Z',
        },
        cacheHit: true,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    });

    it('should set X-Cache header to HIT on cache hit', async () => {
      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: {
          median: '2026-11-19',
          min: '2025-06-15',
          max: '2099-12-31',
          count: 100,
          cached_at: '2025-11-24T10:00:00.000Z',
        },
        cacheHit: true,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.headers.get('X-Cache')).toBe('HIT');
    });

    it('should set X-Cache header to MISS on cache miss', async () => {
      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: {
          median: '2026-11-19',
          min: '2025-06-15',
          max: '2099-12-31',
          count: 100,
          cached_at: '2025-11-24T10:00:00.000Z',
        },
        cacheHit: false,
      });

      const res = await app.request('/api/stats', {}, createMockEnv());

      expect(res.headers.get('X-Cache')).toBe('MISS');
    });
  });

  describe('Service Integration', () => {
    it('should pass correct parameters to service', async () => {
      vi.mocked(getStatisticsWithCache).mockResolvedValue({
        stats: {
          median: '2026-11-19',
          min: '2025-06-15',
          max: '2099-12-31',
          count: 100,
          cached_at: '2025-11-24T10:00:00.000Z',
        },
        cacheHit: true,
      });

      const mockEnv = createMockEnv();
      await app.request('/api/stats', {}, mockEnv);

      expect(getStatisticsWithCache).toHaveBeenCalledWith(
        mockEnv.DB,
        mockEnv.gta6_stats_cache,
        'stats:latest',
        300
      );
    });
  });
});
