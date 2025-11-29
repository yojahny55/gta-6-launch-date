/**
 * Status Routes - GET /api/status
 *
 * Provides dynamic community sentiment status based on weighted median prediction
 * compared to the official Rockstar-announced release date (2026-11-19).
 *
 * Status Values:
 * - "Early Release Possible" (Green): median < official - 60 days
 * - "On Track" (Blue): median within ±60 days of official
 * - "Delay Likely" (Amber): median between +60 and +180 days of official
 * - "Major Delay Expected" (Red): median > official + 180 days
 *
 * Features:
 * - Cache-first strategy with 5-minute TTL
 * - X-Cache header indicating HIT/MISS
 * - Cache-Control header for browser caching
 * - Rate limiting via middleware (60/min per IP)
 * - Respects 50-prediction minimum threshold (FR99)
 *
 * @see Story 10.4: Dynamic Status Badge
 * @see docs/epics/epic-10-dashboard-enhancements.md
 * @see Sprint Change Proposal 2025-11-28
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { getStatusWithCache, STATUS_CACHE_KEY } from '../services/status.service';
import { getCapacityLevel } from '../services/capacity.service';
import { getStatsCacheTTL } from '../utils/degradation';

/**
 * Minimum prediction threshold (FR99)
 * Don't show calculated status until we have at least 50 predictions
 */
const STATS_THRESHOLD = 50;

/**
 * Create status routes
 *
 * @returns Hono app with /api/status route configured
 */
export function createStatusRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/status - Get community sentiment status
   *
   * Success Response (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "status": "Delay Likely",
   *     "status_color": "amber",
   *     "median_date": "2027-03-15",
   *     "official_date": "2026-11-19",
   *     "days_difference": 116,
   *     "cached_at": "2025-11-28T14:30:00Z"
   *   }
   * }
   *
   * Below Threshold Response (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "status": "Gathering Data",
   *     "status_color": "blue",
   *     "median_date": null,
   *     "official_date": "2026-11-19",
   *     "days_difference": 0,
   *     "cached_at": "2025-11-28T14:30:00Z",
   *     "message": "Need 50 predictions"
   *   }
   * }
   *
   * Response Headers:
   * - Cache-Control: public, max-age=300
   * - X-Cache: HIT | MISS
   * - X-Capacity-Level: green | yellow | red
   *
   * Rate Limit: 60/min per IP (handled by middleware)
   */
  app.get('/api/status', async (c) => {
    const startTime = Date.now();

    try {
      // Get current capacity level to determine cache TTL (same as stats endpoint)
      const { level } = await getCapacityLevel(c.env.gta6_capacity);
      const cacheTTL = getStatsCacheTTL(level);

      // Get status with dynamic caching based on capacity
      const { status, cacheHit } = await getStatusWithCache(
        c.env.DB,
        c.env.gta6_stats_cache,
        STATUS_CACHE_KEY,
        cacheTTL
      );

      // Set cache headers with dynamic TTL
      c.header('Cache-Control', `public, max-age=${cacheTTL}`);
      c.header('X-Cache', cacheHit ? 'HIT' : 'MISS');
      c.header('X-Capacity-Level', level); // Debugging header

      // Check FR99 threshold (< 50 predictions)
      if (status.total_count !== undefined && status.total_count < STATS_THRESHOLD) {
        console.log('Status request - below threshold', {
          total_count: status.total_count,
          threshold: STATS_THRESHOLD,
          duration_ms: Date.now() - startTime,
        });

        // Return response with "Gathering Data" status
        return c.json(
          {
            success: true,
            data: {
              status: 'Gathering Data',
              status_color: 'blue',
              median_date: null,
              official_date: status.official_date,
              days_difference: 0,
              cached_at: status.cached_at,
              message: 'Need 50 predictions',
            },
          },
          200
        );
      }

      // Log request
      console.log('Status request processed', {
        cacheHit,
        status: status.status,
        color: status.status_color,
        days_difference: status.days_difference,
        duration_ms: Date.now() - startTime,
      });

      // Return status data
      return c.json(
        {
          success: true,
          data: status,
        },
        200
      );
    } catch (error) {
      console.error('Error fetching status:', error);

      // Return error response with fallback "Unknown" status
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to fetch status data. Please try again.',
          },
          data: {
            status: 'Unknown',
            status_color: 'blue',
            median_date: null,
            official_date: '2026-11-19',
            days_difference: 0,
            cached_at: new Date().toISOString(),
          },
        },
        500
      );
    }
  });

  return app;
}

export default createStatusRoutes;
