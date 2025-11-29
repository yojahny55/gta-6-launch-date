/**
 * Degradation API Route (Story 3.7)
 * Provides current degradation state for frontend
 * Returns capacity level and feature flags
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { getCapacityLevel } from '../services/capacity.service';
import { getDegradationState, getDegradationMessage } from '../utils/degradation';
import { getHoursUntilReset } from '../services/capacity.service';

/**
 * Create degradation routes
 * GET /api/degradation - Get current degradation state
 */
export function createDegradationRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * GET /api/degradation
   * Returns current capacity level and feature flags
   * Used by frontend to show degradation notices and disable features
   */
  app.get('/api/degradation', async (c) => {
    try {
      const kv = c.env.gta6_capacity;

      // Get current capacity level
      const { level, requestsToday, resetAt } = await getCapacityLevel(kv);

      // Get degradation state and feature flags
      const degradationState = getDegradationState(level, requestsToday, resetAt);

      // Get user-facing message (if applicable)
      let message = getDegradationMessage(level);

      // Replace {hours} placeholder with actual countdown
      if (message && message.includes('{hours}')) {
        const hours = getHoursUntilReset();
        message = message.replace('{hours}', hours.toString());
      }

      return c.json({
        success: true,
        data: {
          ...degradationState,
          message, // null for normal/elevated, string for high/critical/exceeded
        },
      });
    } catch (error) {
      console.error('[Degradation API] Error getting degradation state:', error);

      // Fail-open: Return normal capacity on error
      return c.json({
        success: true,
        data: {
          level: 'normal',
          requestsToday: 0,
          limitToday: 100000,
          resetAt: new Date().toISOString(),
          features: {
            statsEnabled: true,
            submissionsEnabled: true,
            chartEnabled: true,
            cacheExtended: false,
          },
          message: null,
        },
      });
    }
  });

  return app;
}
