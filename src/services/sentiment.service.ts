/**
 * Sentiment Service Module (Story 10.1)
 *
 * Calculates community sentiment ("Optimism Score") based on how many predictions
 * believe GTA 6 will launch before the official Rockstar-announced date.
 *
 * Optimism Score = (count of predictions < official date) / total count * 100
 *
 * Features:
 * - Cloudflare KV caching with 5-minute TTL
 * - Efficient SQL aggregation query
 * - Invalidates on new submission/update
 *
 * @see Story 10.1: Optimism Score Calculation & API
 * @see docs/epics/epic-10-dashboard-enhancements.md
 */

import dayjs from 'dayjs';

/**
 * Official GTA 6 release date announced by Rockstar
 * November 19, 2026 (subject to delays, but this is our baseline)
 */
export const OFFICIAL_RELEASE_DATE = '2026-11-19';

/**
 * Cache key for sentiment data in Cloudflare KV
 */
export const SENTIMENT_CACHE_KEY = 'sentiment:score';

/**
 * Sentiment response interface
 * Matches the API contract for GET /api/sentiment
 */
export interface SentimentResponse {
  optimism_score: number; // Percentage (0-100, rounded to 1 decimal)
  optimistic_count: number; // Count of predictions before official date
  pessimistic_count: number; // Count of predictions on/after official date
  total_count: number; // Total predictions
  official_date: string; // The official date used for comparison (YYYY-MM-DD)
  cached_at: string; // ISO 8601 timestamp when sentiment was calculated
}

/**
 * Database row type for sentiment aggregation query
 */
interface SentimentAggregation {
  optimistic_count: number;
  pessimistic_count: number;
  total_count: number;
}

/**
 * Calculate sentiment (optimism score) from the database
 *
 * Performs efficient aggregation query using CASE statements:
 * - Optimistic: predictions < official date
 * - Pessimistic: predictions >= official date
 * - Score: (optimistic / total) * 100
 *
 * @param db - D1Database instance
 * @returns SentimentResponse with optimism score and counts
 *
 * @example
 * const sentiment = await calculateSentiment(c.env.DB);
 * // {
 * //   optimism_score: 42.5,
 * //   optimistic_count: 4234,
 * //   pessimistic_count: 5766,
 * //   total_count: 10000,
 * //   official_date: "2026-11-19",
 * //   cached_at: "2025-11-27T14:30:00Z"
 * // }
 */
export async function calculateSentiment(db: D1Database): Promise<SentimentResponse> {
  // Query: Count optimistic vs pessimistic predictions using CASE
  const result = await db
    .prepare(
      `SELECT
        COUNT(CASE WHEN predicted_date < ? THEN 1 END) as optimistic_count,
        COUNT(CASE WHEN predicted_date >= ? THEN 1 END) as pessimistic_count,
        COUNT(*) as total_count
      FROM predictions`
    )
    .bind(OFFICIAL_RELEASE_DATE, OFFICIAL_RELEASE_DATE)
    .first<SentimentAggregation>();

  // Handle empty database case
  if (!result || result.total_count === 0) {
    return {
      optimism_score: 0,
      optimistic_count: 0,
      pessimistic_count: 0,
      total_count: 0,
      official_date: OFFICIAL_RELEASE_DATE,
      cached_at: dayjs().toISOString(),
    };
  }

  // Calculate optimism score: (optimistic / total) * 100
  // Round to 1 decimal place
  const optimismScore = Math.round((result.optimistic_count / result.total_count) * 1000) / 10;

  return {
    optimism_score: optimismScore,
    optimistic_count: result.optimistic_count,
    pessimistic_count: result.pessimistic_count,
    total_count: result.total_count,
    official_date: OFFICIAL_RELEASE_DATE,
    cached_at: dayjs().toISOString(),
  };
}

/**
 * Get sentiment with caching (Story 10.1 - AC3: Caching Strategy)
 *
 * Cache-first strategy:
 * 1. Check KV cache for existing sentiment data
 * 2. If cache hit and not expired, return cached data
 * 3. If cache miss or expired, calculate fresh sentiment
 * 4. Store in cache with TTL
 *
 * @param db - D1Database instance
 * @param kv - KV namespace for caching
 * @param cacheKey - Cache key to use (default: SENTIMENT_CACHE_KEY)
 * @param cacheTTL - Cache TTL in seconds (default: 300 = 5 minutes)
 * @returns Object with sentiment data and cache hit status
 *
 * @example
 * const { sentiment, cacheHit } = await getSentimentWithCache(
 *   c.env.DB,
 *   c.env.gta6_stats_cache,
 *   SENTIMENT_CACHE_KEY,
 *   300
 * );
 */
export async function getSentimentWithCache(
  db: D1Database,
  kv: KVNamespace | undefined,
  cacheKey: string = SENTIMENT_CACHE_KEY,
  cacheTTL: number = 300 // 5 minutes default
): Promise<{ sentiment: SentimentResponse; cacheHit: boolean }> {
  // Try to get from cache first (cache-first strategy) if KV is available
  const cached = kv ? await kv.get<SentimentResponse>(cacheKey, 'json') : null;

  if (cached) {
    return { sentiment: cached, cacheHit: true };
  }

  // Cache miss - calculate fresh sentiment
  const sentiment = await calculateSentiment(db);

  // Store in cache with TTL (if KV is available)
  if (kv) {
    await kv.put(cacheKey, JSON.stringify(sentiment), {
      expirationTtl: cacheTTL,
    });
  }

  return { sentiment, cacheHit: false };
}

/**
 * Invalidate sentiment cache (Story 10.1 - AC3: Cache Invalidation)
 *
 * Called when a new prediction is submitted or updated to ensure
 * fresh sentiment data on next request.
 *
 * @param kv - KV namespace for caching
 * @param cacheKey - Cache key to invalidate (default: SENTIMENT_CACHE_KEY)
 *
 * @example
 * // After successful prediction submission
 * await invalidateSentimentCache(c.env.gta6_stats_cache);
 */
export async function invalidateSentimentCache(
  kv: KVNamespace | undefined,
  cacheKey: string = SENTIMENT_CACHE_KEY
): Promise<void> {
  if (kv) {
    await kv.delete(cacheKey);
  }
}
