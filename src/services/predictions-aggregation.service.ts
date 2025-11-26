/**
 * Predictions Aggregation Service Module
 *
 * Provides functions for aggregating prediction data for chart visualization.
 * Returns privacy-preserving aggregated data grouped by date.
 *
 * Aggregated predictions include:
 * - Predicted date (ISO 8601: YYYY-MM-DD)
 * - Count of predictions for that date
 * - Total predictions count (for 50-prediction threshold check)
 *
 * @see Story 3.4b: Prediction Data API Endpoint
 * @see docs/sprint-artifacts/stories/3-4b-prediction-data-api-endpoint.md
 */

import dayjs from 'dayjs';

/**
 * Individual prediction data point (aggregated by date)
 * Privacy-preserving: No cookie_id, ip_hash, or weight exposed
 */
export interface PredictionData {
  predicted_date: string; // ISO 8601 date (YYYY-MM-DD)
  count: number; // Number of predictions for this date
}

/**
 * Predictions API response interface
 * Matches the API contract for GET /api/predictions
 */
export interface PredictionsResponse {
  data: PredictionData[]; // Array of date/count pairs
  total_predictions: number; // Total prediction count
  cached_at: string; // ISO 8601 timestamp when data was calculated
}

/**
 * Database row type for aggregation query
 */
interface AggregatedPredictionRow {
  predicted_date: string;
  count: number;
}

/**
 * Database row type for total count query
 */
interface CountRow {
  total_count: number;
}

/**
 * Minimum prediction threshold per FR99
 * Chart requires at least 50 predictions to display
 */
export const MINIMUM_PREDICTION_THRESHOLD = 50;

/**
 * Get aggregated prediction data from database
 *
 * Performs efficient aggregation query:
 * - Groups predictions by predicted_date
 * - Counts predictions per date
 * - Sorts by predicted_date ascending
 * - Privacy-preserving: No individual user data exposed
 *
 * @param db - D1Database instance
 * @returns PredictionsResponse with aggregated data
 *
 * @example
 * const predictions = await getAggregatedPredictions(c.env.DB);
 * // {
 * //   data: [
 * //     { predicted_date: "2026-11-19", count: 1247 },
 * //     { predicted_date: "2027-02-14", count: 823 }
 * //   ],
 * //   total_predictions: 10234,
 * //   cached_at: "2025-11-26T14:30:00Z"
 * // }
 */
export async function getAggregatedPredictions(
  db: D1Database
): Promise<PredictionsResponse> {
  const startTime = Date.now();

  // Query 1: Get total prediction count for threshold check
  const countResult = await db
    .prepare('SELECT COUNT(*) as total_count FROM predictions')
    .first<CountRow>();

  const totalCount = countResult?.total_count || 0;

  // Check 50-prediction minimum threshold (FR99)
  if (totalCount < MINIMUM_PREDICTION_THRESHOLD) {
    console.log('Prediction threshold not met', {
      current: totalCount,
      required: MINIMUM_PREDICTION_THRESHOLD,
    });

    return {
      data: [], // Empty array when threshold not met
      total_predictions: totalCount,
      cached_at: dayjs().toISOString(),
    };
  }

  // Query 2: Aggregate predictions by date
  // Privacy-preserving: Only exposes date and count, no individual records
  const aggregationResult = await db
    .prepare(
      `SELECT
        predicted_date,
        COUNT(*) as count
      FROM predictions
      GROUP BY predicted_date
      ORDER BY predicted_date ASC`
    )
    .all<AggregatedPredictionRow>();

  const calculationTime = Date.now() - startTime;

  // Performance monitoring: Log slow aggregations (>100ms)
  if (calculationTime > 100) {
    console.warn('Predictions aggregation slow', {
      duration_ms: calculationTime,
      total_predictions: totalCount,
      unique_dates: aggregationResult.results?.length || 0,
    });
  } else {
    console.log('Predictions aggregated', {
      duration_ms: calculationTime,
      total_predictions: totalCount,
      unique_dates: aggregationResult.results?.length || 0,
    });
  }

  return {
    data: aggregationResult.results || [],
    total_predictions: totalCount,
    cached_at: dayjs().toISOString(),
  };
}

/**
 * Get aggregated predictions with caching support
 *
 * Checks the Cloudflare KV cache first. On cache miss, aggregates
 * predictions from database and stores in cache with TTL.
 *
 * Cache is shared with stats invalidation (both invalidated on
 * prediction submission/update).
 *
 * @param db - D1Database instance
 * @param kv - KVNamespace for predictions cache (optional, direct calculation if not provided)
 * @param cacheKey - Cache key (default: 'predictions:aggregated')
 * @param ttlSeconds - Cache TTL in seconds (default: 300 = 5 minutes)
 * @returns Object with predictions data and cache hit indicator
 *
 * @example
 * const { predictions, cacheHit } = await getAggregatedPredictionsWithCache(
 *   c.env.DB,
 *   c.env.gta6_stats_cache,
 *   'predictions:aggregated',
 *   300
 * );
 */
export async function getAggregatedPredictionsWithCache(
  db: D1Database,
  kv: KVNamespace | undefined,
  cacheKey: string = 'predictions:aggregated',
  ttlSeconds: number = 300
): Promise<{ predictions: PredictionsResponse; cacheHit: boolean }> {
  // Try cache first if KV is available
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        const predictions = JSON.parse(cached) as PredictionsResponse;
        console.log('Predictions cache HIT', { cacheKey });
        return { predictions, cacheHit: true };
      }
      console.log('Predictions cache MISS', { cacheKey });
    } catch (error) {
      // Cache read failed - continue with database query
      console.warn('KV cache read failed, falling back to database:', error);
    }
  }

  // Cache miss - aggregate from database
  const predictions = await getAggregatedPredictions(db);

  // Store in cache if KV is available
  if (kv) {
    try {
      await kv.put(cacheKey, JSON.stringify(predictions), {
        expirationTtl: ttlSeconds,
      });
      console.log('Predictions cached', {
        cacheKey,
        ttl: ttlSeconds,
        data_size: predictions.data.length,
      });
    } catch (error) {
      // Cache write failed - log but don't fail the request
      console.warn('KV cache write failed:', error);
    }
  }

  return { predictions, cacheHit: false };
}

/**
 * Invalidate predictions cache
 *
 * Called after prediction submission, update, or deletion to ensure
 * fresh data is returned on next request.
 *
 * Should be called alongside stats cache invalidation.
 *
 * @param kv - KVNamespace for predictions cache
 * @param cacheKey - Cache key (default: 'predictions:aggregated')
 *
 * @example
 * // After successful prediction submission
 * await invalidatePredictionsCache(c.env.gta6_stats_cache);
 */
export async function invalidatePredictionsCache(
  kv: KVNamespace | undefined,
  cacheKey: string = 'predictions:aggregated'
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    await kv.delete(cacheKey);
    console.log('Predictions cache invalidated', { cacheKey });
  } catch (error) {
    // Cache invalidation failed - log but don't fail
    console.warn('Predictions cache invalidation failed:', error);
  }
}

/**
 * Invalidate both stats and predictions caches
 *
 * Convenience function to invalidate both caches atomically.
 * Called after prediction submission, update, or deletion.
 *
 * @param kv - KVNamespace for cache
 *
 * @example
 * // After successful prediction submission
 * await invalidateAllCaches(c.env.gta6_stats_cache);
 */
export async function invalidateAllCaches(
  kv: KVNamespace | undefined
): Promise<void> {
  if (!kv) {
    return;
  }

  try {
    // Invalidate both caches in parallel
    await Promise.all([
      kv.delete('stats:latest'),
      kv.delete('predictions:aggregated'),
    ]);
    console.log('All caches invalidated', {
      keys: ['stats:latest', 'predictions:aggregated'],
    });
  } catch (error) {
    // Cache invalidation failed - log but don't fail
    console.warn('Cache invalidation failed:', error);
  }
}

/**
 * Predictions cache key constant
 * Used for consistent key naming across the application
 */
export const PREDICTIONS_CACHE_KEY = 'predictions:aggregated';

/**
 * Default cache TTL in seconds (5 minutes, matches stats cache)
 */
export const PREDICTIONS_CACHE_TTL = 300;
