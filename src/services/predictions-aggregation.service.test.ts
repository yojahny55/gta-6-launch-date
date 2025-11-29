/**
 * Predictions Aggregation Service Tests
 *
 * Tests for the predictions aggregation service including:
 * - Data aggregation by date
 * - 50-prediction minimum threshold
 * - Privacy preservation (no sensitive data)
 * - Caching behavior
 * - Empty database handling
 * - Performance requirements
 *
 * @see Story 3.4b: Prediction Data API Endpoint
 * @see src/services/predictions-aggregation.service.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAggregatedPredictions,
  getAggregatedPredictionsWithCache,
  invalidatePredictionsCache,
  invalidateAllCaches,
  MINIMUM_PREDICTION_THRESHOLD,
  PREDICTIONS_CACHE_KEY,
  PREDICTIONS_CACHE_TTL,
  type PredictionData,
  type PredictionsResponse,
} from './predictions-aggregation.service';

describe('Predictions Aggregation Service', () => {
  describe('getAggregatedPredictions', () => {
    it('should aggregate predictions by date', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [
              { predicted_date: '2026-11-19', count: 30 },
              { predicted_date: '2027-02-14', count: 45 },
              { predicted_date: '2027-06-15', count: 25 },
            ],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.total_predictions).toBe(100);
      expect(result.data[0]).toEqual({
        predicted_date: '2026-11-19',
        count: 30,
      });
      expect(result.cached_at).toBeDefined();
    });

    it('should return empty data when below 50-prediction threshold (FR99)', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 42 })),
          all: vi.fn(async () => ({ results: [] })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      expect(result.data).toEqual([]);
      expect(result.total_predictions).toBe(42);
      expect(result.total_predictions).toBeLessThan(MINIMUM_PREDICTION_THRESHOLD);
    });

    it('should handle empty database', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 0 })),
          all: vi.fn(async () => ({ results: [] })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      expect(result.data).toEqual([]);
      expect(result.total_predictions).toBe(0);
    });

    it('should preserve privacy (no sensitive data in response)', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [
              { predicted_date: '2026-11-19', count: 30 },
              { predicted_date: '2027-02-14', count: 45 },
            ],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      // Verify no sensitive data in response
      result.data.forEach((item: PredictionData) => {
        expect(item).not.toHaveProperty('cookie_id');
        expect(item).not.toHaveProperty('ip_hash');
        expect(item).not.toHaveProperty('weight');
        expect(item).not.toHaveProperty('user_agent');
        expect(item).toHaveProperty('predicted_date');
        expect(item).toHaveProperty('count');
      });
    });

    it('should sort predictions by predicted_date ascending', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [
              { predicted_date: '2025-06-15', count: 10 },
              { predicted_date: '2026-11-19', count: 30 },
              { predicted_date: '2027-02-14', count: 45 },
              { predicted_date: '2027-06-15', count: 15 },
            ],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      expect(result.data[0].predicted_date).toBe('2025-06-15');
      expect(result.data[1].predicted_date).toBe('2026-11-19');
      expect(result.data[2].predicted_date).toBe('2027-02-14');
      expect(result.data[3].predicted_date).toBe('2027-06-15');
    });

    it('should handle exactly 50 predictions (threshold boundary)', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 50 })),
          all: vi.fn(async () => ({
            results: [{ predicted_date: '2026-11-19', count: 50 }],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      // Should return data at exactly 50 predictions (inclusive threshold)
      expect(result.data).toHaveLength(1);
      expect(result.total_predictions).toBe(50);
    });

    it('should group multiple predictions for the same date', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 150 })),
          all: vi.fn(async () => ({
            results: [
              { predicted_date: '2026-11-19', count: 150 }, // All 150 predictions for same date
            ],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictions(mockDb);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].count).toBe(150);
    });
  });

  describe('getAggregatedPredictionsWithCache', () => {
    it('should return cached data on cache HIT', async () => {
      const cachedData: PredictionsResponse = {
        data: [{ predicted_date: '2026-11-19', count: 100 }],
        total_predictions: 100,
        cached_at: '2025-11-26T10:00:00Z',
      };

      const mockKV = {
        get: vi.fn(async () => JSON.stringify(cachedData)),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as KVNamespace;

      const mockDb = {} as D1Database;

      const result = await getAggregatedPredictionsWithCache(
        mockDb,
        mockKV,
        PREDICTIONS_CACHE_KEY,
        PREDICTIONS_CACHE_TTL
      );

      expect(result.cacheHit).toBe(true);
      expect(result.predictions).toEqual(cachedData);
      expect(mockKV.get).toHaveBeenCalledWith(PREDICTIONS_CACHE_KEY);
    });

    it('should calculate and cache on cache MISS', async () => {
      const mockKV = {
        get: vi.fn(async () => null), // Cache miss
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as KVNamespace;

      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [{ predicted_date: '2026-11-19', count: 100 }],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictionsWithCache(
        mockDb,
        mockKV,
        PREDICTIONS_CACHE_KEY,
        PREDICTIONS_CACHE_TTL
      );

      expect(result.cacheHit).toBe(false);
      expect(result.predictions.data).toHaveLength(1);
      expect(mockKV.get).toHaveBeenCalledWith(PREDICTIONS_CACHE_KEY);
      expect(mockKV.put).toHaveBeenCalledWith(PREDICTIONS_CACHE_KEY, expect.any(String), {
        expirationTtl: PREDICTIONS_CACHE_TTL,
      });
    });

    it('should work without KV cache (direct calculation)', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [{ predicted_date: '2026-11-19', count: 100 }],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictionsWithCache(
        mockDb,
        undefined, // No KV
        PREDICTIONS_CACHE_KEY,
        PREDICTIONS_CACHE_TTL
      );

      expect(result.cacheHit).toBe(false);
      expect(result.predictions.data).toHaveLength(1);
    });

    it('should handle cache read failure gracefully', async () => {
      const mockKV = {
        get: vi.fn(async () => {
          throw new Error('KV read failed');
        }),
        put: vi.fn(),
        delete: vi.fn(),
      } as unknown as KVNamespace;

      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => ({ total_count: 100 })),
          all: vi.fn(async () => ({
            results: [{ predicted_date: '2026-11-19', count: 100 }],
          })),
        })),
      } as unknown as D1Database;

      const result = await getAggregatedPredictionsWithCache(
        mockDb,
        mockKV,
        PREDICTIONS_CACHE_KEY,
        PREDICTIONS_CACHE_TTL
      );

      // Should fall back to database query
      expect(result.cacheHit).toBe(false);
      expect(result.predictions.data).toHaveLength(1);
    });
  });

  describe('invalidatePredictionsCache', () => {
    it('should delete predictions cache key', async () => {
      const mockKV = {
        delete: vi.fn(),
      } as unknown as KVNamespace;

      await invalidatePredictionsCache(mockKV, PREDICTIONS_CACHE_KEY);

      expect(mockKV.delete).toHaveBeenCalledWith(PREDICTIONS_CACHE_KEY);
    });

    it('should handle KV not available gracefully', async () => {
      await expect(invalidatePredictionsCache(undefined)).resolves.not.toThrow();
    });

    it('should handle cache deletion failure gracefully', async () => {
      const mockKV = {
        delete: vi.fn(async () => {
          throw new Error('KV delete failed');
        }),
      } as unknown as KVNamespace;

      await expect(
        invalidatePredictionsCache(mockKV, PREDICTIONS_CACHE_KEY)
      ).resolves.not.toThrow();
    });
  });

  describe('invalidateAllCaches', () => {
    it('should invalidate both stats and predictions caches', async () => {
      const mockKV = {
        delete: vi.fn(),
      } as unknown as KVNamespace;

      await invalidateAllCaches(mockKV);

      expect(mockKV.delete).toHaveBeenCalledTimes(3);
      // Should delete all cache keys including sentiment (Story 10.1)
      expect(mockKV.delete).toHaveBeenCalledWith('stats:latest');
      expect(mockKV.delete).toHaveBeenCalledWith('predictions:aggregated');
      expect(mockKV.delete).toHaveBeenCalledWith('sentiment:score');
    });

    it('should handle KV not available gracefully', async () => {
      await expect(invalidateAllCaches(undefined)).resolves.not.toThrow();
    });

    it('should handle invalidation failure gracefully', async () => {
      const mockKV = {
        delete: vi.fn(async () => {
          throw new Error('KV delete failed');
        }),
      } as unknown as KVNamespace;

      await expect(invalidateAllCaches(mockKV)).resolves.not.toThrow();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete aggregation in reasonable time', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          first: vi.fn(async () => {
            // Simulate query delay
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { total_count: 1000 };
          }),
          all: vi.fn(async () => {
            // Simulate query delay
            await new Promise((resolve) => setTimeout(resolve, 50));
            const results = Array.from({ length: 100 }, (_, i) => ({
              predicted_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
              count: Math.floor(Math.random() * 50) + 10,
            }));
            return { results };
          }),
        })),
      } as unknown as D1Database;

      const startTime = Date.now();
      const result = await getAggregatedPredictions(mockDb);
      const duration = Date.now() - startTime;

      // Should complete in under 300ms (cache miss target)
      expect(duration).toBeLessThan(300);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Constants', () => {
    it('should have correct cache key', () => {
      expect(PREDICTIONS_CACHE_KEY).toBe('predictions:aggregated');
    });

    it('should have correct cache TTL (5 minutes)', () => {
      expect(PREDICTIONS_CACHE_TTL).toBe(300); // 5 minutes in seconds
    });

    it('should have correct minimum threshold', () => {
      expect(MINIMUM_PREDICTION_THRESHOLD).toBe(50);
    });
  });
});
