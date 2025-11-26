/**
 * Statistics Routes - GET /api/stats
 *
 * Provides aggregated prediction statistics with Cloudflare KV caching.
 * Returns weighted median, min/max dates, and total count.
 *
 * Features:
 * - Cache-first strategy with 5-minute TTL (FR12)
 * - X-Cache header indicating HIT/MISS
 * - Cache-Control header for browser caching
 * - Rate limiting via middleware (60/min per IP)
 *
 * @see Story 2.10: Statistics Calculation and Caching
 * @see docs/architecture.md - API Contracts: GET /api/stats
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import {
  getStatisticsWithCache,
  STATS_CACHE_KEY,
  STATS_CACHE_TTL,
} from '../services/statistics.service';
import { getCapacityLevel } from '../services/capacity.service';
import { getStatsCacheTTL } from '../utils/degradation';

/**
 * Create statistics routes
 *
 * @returns Hono app with /api/stats route configured
 */
export function createStatsRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/stats - Get aggregated prediction statistics
   *
   * Success Response (200 OK):
   * {
   *   "median": "2026-11-19",
   *   "min": "2025-06-15",
   *   "max": "2099-12-31",
   *   "count": 10234,
   *   "cached_at": "2025-11-24T14:30:00Z"
   * }
   *
   * Response Headers:
   * - Cache-Control: public, max-age=300
   * - X-Cache: HIT | MISS
   *
   * Rate Limit: 60/min per IP (handled by middleware)
   */
  app.get('/api/stats', async (c) => {
    const startTime = Date.now();

    try {
      // Get current capacity level to determine cache TTL (Story 3.7 - AC2)
      const { level } = await getCapacityLevel(c.env.gta6_capacity);
      const cacheTTL = getStatsCacheTTL(level);

      // Get statistics with dynamic caching based on capacity
      const { stats, cacheHit } = await getStatisticsWithCache(
        c.env.DB,
        c.env.gta6_stats_cache,
        STATS_CACHE_KEY,
        cacheTTL
      );

      // Set cache headers with dynamic TTL
      c.header('Cache-Control', `public, max-age=${cacheTTL}`);
      c.header('X-Cache', cacheHit ? 'HIT' : 'MISS');
      c.header('X-Capacity-Level', level); // Debugging header

      // Log request
      console.log('Stats request processed', {
        cacheHit,
        count: stats.count,
        duration_ms: Date.now() - startTime,
      });

      // Return statistics
      return c.json(stats, 200);
    } catch (error) {
      console.error('Error fetching statistics:', error);

      // Return error response
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to fetch statistics. Please try again.',
          },
        },
        500
      );
    }
  });

  return app;
}

export default createStatsRoutes;
