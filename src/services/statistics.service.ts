/**
 * Statistics Service Module
 *
 * Provides functions for calculating and caching prediction statistics.
 * Implements efficient database queries for min/max/count and calls
 * the weighted median algorithm from Story 2.9.
 *
 * Statistics include:
 * - Weighted median date (reduces troll influence)
 * - Minimum predicted date (earliest prediction)
 * - Maximum predicted date (latest prediction)
 * - Total prediction count
 *
 * @see Story 2.10: Statistics Calculation and Caching
 * @see docs/architecture.md - API Contracts: GET /api/stats
 */

import dayjs from 'dayjs';
import { calculateWeightedMedianFromRows } from '../utils/weighted-median';

/**
 * Statistics response interface
 * Matches the API contract for GET /api/stats
 */
export interface StatsResponse {
  median: string; // Weighted median date (ISO 8601: YYYY-MM-DD)
  min: string; // Earliest prediction date
  max: string; // Latest prediction date
  count: number; // Total prediction count
  cached_at: string; // ISO 8601 timestamp when stats were calculated
}

/**
 * Database row type for aggregation query
 */
interface StatsAggregation {
  min_date: string | null;
  max_date: string | null;
  total_count: number;
}

/**
 * Database row type for predictions query
 */
interface PredictionRow {
  predicted_date: string;
  weight: number;
}

/**
 * Calculate statistics from the database
 *
 * Performs two efficient queries:
 * 1. Aggregation query for min/max/count (single pass)
 * 2. Ordered predictions query for weighted median calculation
 *
 * @param db - D1Database instance
 * @returns StatsResponse with all calculated statistics
 *
 * @example
 * const stats = await calculateStatistics(c.env.DB);
 * // {
 * //   median: "2026-11-19",
 * //   min: "2025-06-15",
 * //   max: "2099-12-31",
 * //   count: 10234,
 * //   cached_at: "2025-11-24T14:30:00Z"
 * // }
 */
export async function calculateStatistics(db: D1Database): Promise<StatsResponse> {
  const startTime = Date.now();

  // Query 1: Get min, max, and count in a single efficient query
  const aggregationResult = await db
    .prepare(
      `SELECT
        MIN(predicted_date) as min_date,
        MAX(predicted_date) as max_date,
        COUNT(*) as total_count
      FROM predictions`
    )
    .first<StatsAggregation>();

  // Handle empty database case
  if (
    !aggregationResult ||
    aggregationResult.total_count === 0 ||
    !aggregationResult.min_date ||
    !aggregationResult.max_date
  ) {
    return {
      median: '',
      min: '',
      max: '',
      count: 0,
      cached_at: dayjs().toISOString(),
    };
  }

  // Query 2: Get all predictions with weights for median calculation
  // Ordered by predicted_date for efficient median finding
  const predictionsResult = await db
    .prepare(
      `SELECT predicted_date, weight
       FROM predictions
       ORDER BY predicted_date ASC`
    )
    .all<PredictionRow>();

  // Calculate weighted median using Story 2.9 algorithm
  const median = calculateWeightedMedianFromRows(predictionsResult.results || []);

  const calculationTime = Date.now() - startTime;

  // Performance monitoring: Log slow calculations (>100ms)
  if (calculationTime > 100) {
    console.warn('Stats calculation slow', {
      duration_ms: calculationTime,
      prediction_count: aggregationResult.total_count,
    });
  }

  return {
    median: median || aggregationResult.min_date, // Fallback to min if median calculation fails
    min: aggregationResult.min_date,
    max: aggregationResult.max_date,
    count: aggregationResult.total_count,
    cached_at: dayjs().toISOString(),
  };
}

/**
 * Get statistics with caching support
 *
 * Checks the Cloudflare KV cache first. On cache miss, calculates
 * statistics from database and stores in cache with TTL.
 *
 * @param db - D1Database instance
 * @param kv - KVNamespace for stats cache (optional, direct calculation if not provided)
 * @param cacheKey - Cache key (default: 'stats:latest')
 * @param ttlSeconds - Cache TTL in seconds (default: 300 = 5 minutes)
 * @returns Object with stats and cache hit indicator
 *
 * @example
 * const { stats, cacheHit } = await getStatisticsWithCache(
 *   c.env.DB,
 *   c.env.gta6_stats_cache,
 *   'stats:latest',
 *   300
 * );
 */
export async function getStatisticsWithCache(
  db: D1Database,
  kv: KVNamespace | undefined,
  cacheKey: string = 'stats:latest',
  ttlSeconds: number = 300
): Promise<{ stats: StatsResponse; cacheHit: boolean }> {
  // Try cache first if KV is available
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        const stats = JSON.parse(cached) as StatsResponse;
        return { stats, cacheHit: true };
      }
    } catch (error) {
      // Cache read failed - continue with database query
      console.warn('KV cache read failed, falling back to database:', error);
    }
  }

  // Cache miss - calculate from database
  const stats = await calculateStatistics(db);

  // Store in cache if KV is available
  if (kv) {
    try {
      await kv.put(cacheKey, JSON.stringify(stats), {
        expirationTtl: ttlSeconds,
      });
    } catch (error) {
      // Cache write failed - log but don't fail the request
      console.warn('KV cache write failed:', error);
    }
  }

  return { stats, cacheHit: false };
}

/**
 * Invalidate statistics cache
 *
 * Called after prediction submission, update, or deletion to ensure
 * fresh data is returned on next request.
 *
 * @param kv - KVNamespace for stats cache
 * @param cacheKey - Cache key (default: 'stats:latest')
 *
 * @example
 * // After successful prediction submission
 * await invalidateStatsCache(c.env.gta6_stats_cache);
 */
export async function invalidateStatsCache(
  kv: KVNamespace | undefined,
  cacheKey: string = 'stats:latest'
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    await kv.delete(cacheKey);
  } catch (error) {
    // Cache invalidation failed - log but don't fail
    console.warn('Stats cache invalidation failed:', error);
  }
}

/**
 * Statistics cache key constant
 * Used for consistent key naming across the application
 */
export const STATS_CACHE_KEY = 'stats:latest';

/**
 * Default cache TTL in seconds (5 minutes per FR12)
 */
export const STATS_CACHE_TTL = 300;
