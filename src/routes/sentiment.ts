/**
 * Sentiment Routes - GET /api/sentiment
 *
 * Provides community sentiment analysis ("Optimism Score") based on predictions
 * relative to the official Rockstar-announced release date.
 *
 * Features:
 * - Cache-first strategy with 5-minute TTL
 * - X-Cache header indicating HIT/MISS
 * - Cache-Control header for browser caching
 * - Rate limiting via middleware (60/min per IP)
 * - Respects 50-prediction minimum threshold (FR99)
 *
 * @see Story 10.1: Optimism Score Calculation & API
 * @see docs/epics/epic-10-dashboard-enhancements.md
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSentimentWithCache, SENTIMENT_CACHE_KEY } from '../services/sentiment.service';
import { getCapacityLevel } from '../services/capacity.service';
import { getStatsCacheTTL } from '../utils/degradation';

/**
 * Minimum prediction threshold (FR99)
 * Don't show sentiment score until we have at least 50 predictions
 */
const STATS_THRESHOLD = 50;

/**
 * Create sentiment routes
 *
 * @returns Hono app with /api/sentiment route configured
 */
export function createSentimentRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/sentiment - Get community sentiment (optimism score)
   *
   * Success Response (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "optimism_score": 42.5,
   *     "optimistic_count": 4234,
   *     "pessimistic_count": 5766,
   *     "total_count": 10000,
   *     "official_date": "2026-11-19",
   *     "cached_at": "2025-11-27T14:30:00Z"
   *   }
   * }
   *
   * Below Threshold Response (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "optimism_score": null,
   *     "optimistic_count": 0,
   *     "pessimistic_count": 0,
   *     "total_count": 45,
   *     "official_date": "2026-11-19",
   *     "cached_at": "2025-11-27T14:30:00Z",
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
  app.get('/api/sentiment', async (c) => {
    const startTime = Date.now();

    try {
      // Get current capacity level to determine cache TTL (same as stats endpoint)
      const { level } = await getCapacityLevel(c.env.gta6_capacity);
      const cacheTTL = getStatsCacheTTL(level);

      // Get sentiment with dynamic caching based on capacity
      const { sentiment, cacheHit } = await getSentimentWithCache(
        c.env.DB,
        c.env.gta6_stats_cache,
        SENTIMENT_CACHE_KEY,
        cacheTTL
      );

      // Set cache headers with dynamic TTL
      c.header('Cache-Control', `public, max-age=${cacheTTL}`);
      c.header('X-Cache', cacheHit ? 'HIT' : 'MISS');
      c.header('X-Capacity-Level', level); // Debugging header

      // Check FR99 threshold (< 50 predictions)
      if (sentiment.total_count < STATS_THRESHOLD) {
        // Return response with null optimism_score
        return c.json(
          {
            success: true,
            data: {
              optimism_score: null,
              optimistic_count: 0,
              pessimistic_count: 0,
              total_count: sentiment.total_count,
              official_date: sentiment.official_date,
              cached_at: sentiment.cached_at,
              message: 'Need 50 predictions',
            },
          },
          200
        );
      }

      // Return sentiment data
      return c.json(
        {
          success: true,
          data: sentiment,
        },
        200
      );
    } catch (error) {
      console.error('Error fetching sentiment:', error);

      // Return error response
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to fetch sentiment data. Please try again.',
          },
        },
        500
      );
    }
  });

  return app;
}

export default createSentimentRoutes;
