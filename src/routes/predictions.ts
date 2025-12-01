/**
 * Predictions Routes - GET /api/predictions
 *
 * Provides aggregated prediction distribution data for chart visualization.
 * Returns predictions grouped by date with counts (privacy-preserving).
 *
 * Features:
 * - Cache-first strategy with 5-minute TTL (matches stats cache)
 * - X-Cache header indicating HIT/MISS
 * - Cache-Control header for browser caching
 * - Rate limiting via middleware (60/min per IP)
 * - 50-prediction minimum threshold (FR99)
 *
 * @see Story 3.4b: Prediction Data API Endpoint
 * @see docs/sprint-artifacts/stories/3-4b-prediction-data-api-endpoint.md
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import {
  getAggregatedPredictionsWithCache,
  PREDICTIONS_CACHE_KEY,
  PREDICTIONS_CACHE_TTL,
} from '../services/predictions-aggregation.service';

/**
 * Create predictions routes
 *
 * @returns Hono app with /api/predictions route configured
 */
export function createPredictionsRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/predictions - Get aggregated prediction distribution data
   *
   * Success Response (200 OK):
   * {
   *   "data": [
   *     { "predicted_date": "2026-11-19", "count": 1247 },
   *     { "predicted_date": "2027-02-14", "count": 823 }
   *   ],
   *   "total_predictions": 10234,
   *   "cached_at": "2025-11-26T14:30:00Z"
   * }
   *
   * Empty Response (when < 50 predictions, FR99):
   * {
   *   "data": [],
   *   "total_predictions": 42,
   *   "cached_at": "2025-11-26T14:30:00Z"
   * }
   *
   * Error Response (500):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "SERVER_ERROR",
   *     "message": "Unable to fetch prediction data. Please try again."
   *   }
   * }
   *
   * Response Headers:
   * - Cache-Control: public, max-age=300
   * - X-Cache: HIT | MISS
   *
   * Privacy Considerations:
   * - Only returns aggregated data (date + count)
   * - No cookie_id, ip_hash, or weight exposed
   * - No individual prediction records revealed
   *
   * Rate Limit: 60/min per IP (handled by middleware)
   */
  app.get('/api/predictions', async (c) => {
  

    try {
      // Get aggregated predictions with caching
      const { predictions, cacheHit } = await getAggregatedPredictionsWithCache(
        c.env.DB,
        c.env.gta6_stats_cache,
        PREDICTIONS_CACHE_KEY,
        PREDICTIONS_CACHE_TTL
      );

      // Set cache headers
      c.header('Cache-Control', `public, max-age=${PREDICTIONS_CACHE_TTL}`);
      c.header('X-Cache', cacheHit ? 'HIT' : 'MISS');

      // Return predictions
      return c.json(predictions, 200);
    } catch (error) {
      console.error('Error fetching predictions:', error);

      // Return error response
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to fetch prediction data. Please try again.',
          },
        },
        500
      );
    }
  });

  return app;
}

export default createPredictionsRoutes;
