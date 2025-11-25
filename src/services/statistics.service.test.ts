/**
 * Statistics Service Unit Tests
 *
 * Tests for the statistics calculation and caching service.
 * Covers: calculateStatistics, getStatisticsWithCache, invalidateStatsCache
 *
 * @see Story 2.10: Statistics Calculation and Caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateStatistics,
  getStatisticsWithCache,
  invalidateStatsCache,
  STATS_CACHE_KEY,
  STATS_CACHE_TTL,
  type StatsResponse,
} from './statistics.service';

// Mock the weighted median module
vi.mock('../utils/weighted-median', () => ({
  calculateWeightedMedianFromRows: vi.fn(
    (rows: Array<{ predicted_date: string; weight: number }>) => {
      if (rows.length === 0) return null;
      // Simple implementation for testing: return middle element
      const sorted = [...rows].sort((a, b) => a.predicted_date.localeCompare(b.predicted_date));
      const midIndex = Math.floor((sorted.length - 1) / 2);
      return sorted[midIndex].predicted_date;
    }
  ),
}));

// Mock D1Database interface
function createMockDB(options: {
  aggregationResult?: {
    min_date: string | null;
    max_date: string | null;
    total_count: number;
  } | null;
  predictionsResult?: Array<{ predicted_date: string; weight: number }>;
  aggregationError?: Error;
  predictionsError?: Error;
}) {
  const db = {
    prepare: vi.fn().mockImplementation((sql: string) => {
      // Determine which query is being executed
      const isAggregation = sql.includes('MIN(predicted_date)');
      const isPredictions = sql.includes('SELECT predicted_date, weight');

      return {
        first: vi.fn().mockImplementation(async () => {
          if (options.aggregationError && isAggregation) {
            throw options.aggregationError;
          }
          return isAggregation ? options.aggregationResult : null;
        }),
        all: vi.fn().mockImplementation(async () => {
          if (options.predictionsError && isPredictions) {
            throw options.predictionsError;
          }
          return { results: isPredictions ? options.predictionsResult || [] : [] };
        }),
      };
    }),
  } as unknown as D1Database;

  return db;
}

// Mock KVNamespace interface
function createMockKV(options: {
  getResult?: string | null;
  getError?: Error;
  putError?: Error;
  deleteError?: Error;
}) {
  const kv = {
    get: vi.fn().mockImplementation(async () => {
      if (options.getError) throw options.getError;
      return options.getResult ?? null;
    }),
    put: vi.fn().mockImplementation(async () => {
      if (options.putError) throw options.putError;
    }),
    delete: vi.fn().mockImplementation(async () => {
      if (options.deleteError) throw options.deleteError;
    }),
  } as unknown as KVNamespace;

  return kv;
}

describe('Statistics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateStatistics', () => {
    it('should return statistics with correct values', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 100,
        },
        predictionsResult: [
          { predicted_date: '2025-06-15', weight: 1.0 },
          { predicted_date: '2026-11-19', weight: 1.0 },
          { predicted_date: '2027-03-15', weight: 1.0 },
          { predicted_date: '2099-12-31', weight: 0.1 },
        ],
      });

      const stats = await calculateStatistics(mockDB);

      expect(stats.min).toBe('2025-06-15');
      expect(stats.max).toBe('2099-12-31');
      expect(stats.count).toBe(100);
      expect(stats.median).toBeDefined();
      expect(stats.cached_at).toBeDefined();
      expect(new Date(stats.cached_at).getTime()).not.toBeNaN();
    });

    it('should return empty stats for empty database', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: null,
          max_date: null,
          total_count: 0,
        },
        predictionsResult: [],
      });

      const stats = await calculateStatistics(mockDB);

      expect(stats.median).toBe('');
      expect(stats.min).toBe('');
      expect(stats.max).toBe('');
      expect(stats.count).toBe(0);
      expect(stats.cached_at).toBeDefined();
    });

    it('should return empty stats when aggregation returns null', async () => {
      const mockDB = createMockDB({
        aggregationResult: null,
        predictionsResult: [],
      });

      const stats = await calculateStatistics(mockDB);

      expect(stats.count).toBe(0);
      expect(stats.median).toBe('');
    });

    it('should handle single prediction', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2026-11-19',
          max_date: '2026-11-19',
          total_count: 1,
        },
        predictionsResult: [{ predicted_date: '2026-11-19', weight: 1.0 }],
      });

      const stats = await calculateStatistics(mockDB);

      expect(stats.min).toBe('2026-11-19');
      expect(stats.max).toBe('2026-11-19');
      expect(stats.count).toBe(1);
      expect(stats.median).toBe('2026-11-19');
    });

    it('should use min_date as fallback when median calculation fails', async () => {
      // This tests the fallback scenario where calculateWeightedMedianFromRows returns null
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 100,
        },
        predictionsResult: [], // Empty array will cause median to return null
      });

      const stats = await calculateStatistics(mockDB);

      // Should fallback to min_date
      expect(stats.median).toBe('2025-06-15');
    });
  });

  describe('getStatisticsWithCache', () => {
    it('should return cached stats on cache hit', async () => {
      const cachedStats: StatsResponse = {
        median: '2026-11-19',
        min: '2025-06-15',
        max: '2099-12-31',
        count: 100,
        cached_at: '2025-11-24T10:00:00.000Z',
      };

      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 100,
        },
        predictionsResult: [],
      });
      const mockKV = createMockKV({ getResult: JSON.stringify(cachedStats) });

      const result = await getStatisticsWithCache(mockDB, mockKV);

      expect(result.cacheHit).toBe(true);
      expect(result.stats).toEqual(cachedStats);
      expect(mockKV.get).toHaveBeenCalledWith(STATS_CACHE_KEY);
      expect(mockDB.prepare).not.toHaveBeenCalled(); // DB should not be queried
    });

    it('should calculate and cache stats on cache miss', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 100,
        },
        predictionsResult: [
          { predicted_date: '2025-06-15', weight: 1.0 },
          { predicted_date: '2026-11-19', weight: 1.0 },
        ],
      });
      const mockKV = createMockKV({ getResult: null });

      const result = await getStatisticsWithCache(mockDB, mockKV);

      expect(result.cacheHit).toBe(false);
      expect(result.stats.min).toBe('2025-06-15');
      expect(result.stats.max).toBe('2099-12-31');
      expect(result.stats.count).toBe(100);
      expect(mockKV.put).toHaveBeenCalledWith(STATS_CACHE_KEY, expect.any(String), {
        expirationTtl: STATS_CACHE_TTL,
      });
    });

    it('should work without KV (direct database query)', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 50,
        },
        predictionsResult: [{ predicted_date: '2026-11-19', weight: 1.0 }],
      });

      const result = await getStatisticsWithCache(mockDB, undefined);

      expect(result.cacheHit).toBe(false);
      expect(result.stats.count).toBe(50);
    });

    it('should fall back to database on KV read error', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 75,
        },
        predictionsResult: [{ predicted_date: '2026-11-19', weight: 1.0 }],
      });
      const mockKV = createMockKV({ getError: new Error('KV read failed') });

      const result = await getStatisticsWithCache(mockDB, mockKV);

      expect(result.cacheHit).toBe(false);
      expect(result.stats.count).toBe(75);
    });

    it('should still return stats on KV write error', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 60,
        },
        predictionsResult: [{ predicted_date: '2026-11-19', weight: 1.0 }],
      });
      const mockKV = createMockKV({
        getResult: null,
        putError: new Error('KV write failed'),
      });

      // Should not throw, just log warning
      const result = await getStatisticsWithCache(mockDB, mockKV);

      expect(result.cacheHit).toBe(false);
      expect(result.stats.count).toBe(60);
    });

    it('should use custom cache key and TTL', async () => {
      const mockDB = createMockDB({
        aggregationResult: {
          min_date: '2025-06-15',
          max_date: '2099-12-31',
          total_count: 100,
        },
        predictionsResult: [],
      });
      const mockKV = createMockKV({ getResult: null });

      const customKey = 'custom:stats:key';
      const customTtl = 600;

      await getStatisticsWithCache(mockDB, mockKV, customKey, customTtl);

      expect(mockKV.get).toHaveBeenCalledWith(customKey);
      expect(mockKV.put).toHaveBeenCalledWith(customKey, expect.any(String), {
        expirationTtl: customTtl,
      });
    });
  });

  describe('invalidateStatsCache', () => {
    it('should delete cache key', async () => {
      const mockKV = createMockKV({});

      await invalidateStatsCache(mockKV);

      expect(mockKV.delete).toHaveBeenCalledWith(STATS_CACHE_KEY);
    });

    it('should use custom cache key', async () => {
      const mockKV = createMockKV({});
      const customKey = 'custom:key';

      await invalidateStatsCache(mockKV, customKey);

      expect(mockKV.delete).toHaveBeenCalledWith(customKey);
    });

    it('should not throw when KV is undefined', async () => {
      // Should not throw
      await expect(invalidateStatsCache(undefined)).resolves.not.toThrow();
    });

    it('should not throw on KV delete error', async () => {
      const mockKV = createMockKV({ deleteError: new Error('Delete failed') });

      // Should not throw, just log warning
      await expect(invalidateStatsCache(mockKV)).resolves.not.toThrow();
    });
  });

  describe('Constants', () => {
    it('should have correct cache key', () => {
      expect(STATS_CACHE_KEY).toBe('stats:latest');
    });

    it('should have correct TTL (5 minutes)', () => {
      expect(STATS_CACHE_TTL).toBe(300);
    });
  });
});
