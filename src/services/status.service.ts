/**
 * Status Service Module (Story 10.4)
 *
 * Calculates community sentiment status based on the weighted median prediction
 * compared to the official Rockstar-announced release date.
 *
 * Status determination:
 * - Early Release Possible (Green): median < official - 60 days
 * - On Track (Blue): median within ±60 days of official
 * - Delay Likely (Amber): median between +60 and +180 days of official
 * - Major Delay Expected (Red): median > official + 180 days
 *
 * Features:
 * - Cloudflare KV caching with 5-minute TTL
 * - Reuses weighted median calculation from stats service
 * - Invalidates on new submission/update
 *
 * @see Story 10.4: Dynamic Status Badge
 * @see Sprint Change Proposal 2025-11-28
 * @see docs/epics/epic-10-dashboard-enhancements.md
 */

import dayjs from 'dayjs';
import { calculateWeightedMedianFromRows } from '../utils/weighted-median';
import {
  calculateStatus,
  OFFICIAL_RELEASE_DATE,
  type StatusValue,
  type StatusColor,
} from '../utils/status-calculator';

/**
 * Cache key for status data in Cloudflare KV
 */
export const STATUS_CACHE_KEY = 'status:current';

/**
 * Status response interface
 * Matches the API contract for GET /api/status
 */
export interface StatusResponse {
  status: StatusValue | 'Gathering Data';
  status_color: StatusColor;
  median_date: string | null;
  official_date: string;
  days_difference: number;
  cached_at: string;
  total_count?: number; // For threshold checking
}

/**
 * Calculate community status from the database
 *
 * Performs the following:
 * 1. Calculates weighted median from predictions (reuses existing utility)
 * 2. Determines status based on median vs official date thresholds
 * 3. Returns status with color and days difference
 *
 * @param db - D1Database instance
 * @returns StatusResponse with status, color, and median information
 *
 * @example
 * const status = await calculateStatusFromDB(c.env.DB);
 * // {
 * //   status: "Delay Likely",
 * //   status_color: "amber",
 * //   median_date: "2027-03-15",
 * //   official_date: "2026-11-19",
 * //   days_difference: 116,
 * //   cached_at: "2025-11-28T14:30:00Z",
 * //   total_count: 10234
 * // }
 */
export async function calculateStatusFromDB(db: D1Database): Promise<StatusResponse> {
  const startTime = Date.now();

  // Get total prediction count
  const countResult = await db
    .prepare('SELECT COUNT(*) as total_count FROM predictions')
    .first<{ total_count: number }>();

  const totalCount = countResult?.total_count || 0;

  // Handle empty database case
  if (totalCount === 0) {
    return {
      status: 'Gathering Data',
      status_color: 'blue',
      median_date: null,
      official_date: OFFICIAL_RELEASE_DATE,
      days_difference: 0,
      cached_at: dayjs().toISOString(),
      total_count: 0,
    };
  }

  // Calculate weighted median (reuses existing utility from Story 2.9)
  // Query all predictions with their weights
  const predictionsResult = await db
    .prepare('SELECT predicted_date, weight FROM predictions ORDER BY predicted_date ASC')
    .all<{ predicted_date: string; weight: number }>();

  const medianDate = calculateWeightedMedianFromRows(predictionsResult.results || []);

  // Handle case where median calculation fails
  if (!medianDate) {
    return {
      status: 'Gathering Data',
      status_color: 'blue',
      median_date: null,
      official_date: OFFICIAL_RELEASE_DATE,
      days_difference: 0,
      cached_at: dayjs().toISOString(),
      total_count: totalCount,
    };
  }

  // Calculate status using status-calculator utility
  const statusResult = calculateStatus(medianDate, OFFICIAL_RELEASE_DATE);

  console.log('Status calculated', {
    status: statusResult.status,
    color: statusResult.color,
    median_date: medianDate,
    days_difference: statusResult.daysDifference,
    total_count: totalCount,
    duration_ms: Date.now() - startTime,
  });

  return {
    status: statusResult.status,
    status_color: statusResult.color,
    median_date: medianDate,
    official_date: OFFICIAL_RELEASE_DATE,
    days_difference: statusResult.daysDifference,
    cached_at: dayjs().toISOString(),
    total_count: totalCount,
  };
}

/**
 * Get status with caching (Story 10.4 - AC4: Caching Strategy)
 *
 * Cache-first strategy:
 * 1. Check KV cache for existing status data
 * 2. If cache hit and not expired, return cached data
 * 3. If cache miss or expired, calculate fresh status
 * 4. Store in cache with TTL
 *
 * @param db - D1Database instance
 * @param kv - KV namespace for caching
 * @param cacheKey - Cache key to use (default: STATUS_CACHE_KEY)
 * @param cacheTTL - Cache TTL in seconds (default: 300 = 5 minutes)
 * @returns Object with status data and cache hit status
 *
 * @example
 * const { status, cacheHit } = await getStatusWithCache(
 *   c.env.DB,
 *   c.env.gta6_stats_cache,
 *   STATUS_CACHE_KEY,
 *   300
 * );
 */
export async function getStatusWithCache(
  db: D1Database,
  kv: KVNamespace | undefined,
  cacheKey: string = STATUS_CACHE_KEY,
  cacheTTL: number = 300 // 5 minutes default
): Promise<{ status: StatusResponse; cacheHit: boolean }> {
  // Try to get from cache first (cache-first strategy) if KV is available
  const cached = kv ? await kv.get<StatusResponse>(cacheKey, 'json') : null;

  if (cached) {
    console.log('Status cache HIT');
    return { status: cached, cacheHit: true };
  }

  console.log('Status cache MISS - calculating fresh status');

  // Cache miss - calculate fresh status
  const status = await calculateStatusFromDB(db);

  // Store in cache with TTL (if KV is available)
  if (kv) {
    await kv.put(cacheKey, JSON.stringify(status), {
      expirationTtl: cacheTTL,
    });
  }

  return { status, cacheHit: false };
}

/**
 * Invalidate status cache (Story 10.4 - AC4: Cache Invalidation)
 *
 * Called when a new prediction is submitted or updated to ensure
 * fresh status data on next request.
 *
 * @param kv - KV namespace for caching
 * @param cacheKey - Cache key to invalidate (default: STATUS_CACHE_KEY)
 *
 * @example
 * // After successful prediction submission
 * await invalidateStatusCache(c.env.gta6_stats_cache);
 */
export async function invalidateStatusCache(
  kv: KVNamespace | undefined,
  cacheKey: string = STATUS_CACHE_KEY
): Promise<void> {
  if (kv) {
    await kv.delete(cacheKey);
    console.log('Status cache invalidated');
  }
}
