/**
 * Delete Routes - POST /api/delete
 *
 * Handles GDPR data deletion requests with immediate deletion:
 * 1. Cookie ID validation (UUID v4)
 * 2. Deletion execution (immediate)
 *
 * @see Story 4.6: GDPR Data Deletion Request Form
 * @see docs/architecture.md - Security Architecture: GDPR Compliance
 */

import { Hono } from 'hono';
import type { Env, ErrorResponse } from '../types';
import { validateCookieID } from '../utils/cookie';
import { z } from 'zod';

/**
 * Deletion request validation schema
 */
const DeletionRequestSchema = z.object({
  cookie_id: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
      message: 'Invalid cookie ID format (must be UUID v4)',
    }),
  reason: z.enum(['privacy-concerns', 'no-longer-interested', 'other', '']).optional(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must confirm this action is permanent',
  }),
});

type DeletionRequest = z.infer<typeof DeletionRequestSchema>;

/**
 * Delete prediction record by cookie_id
 * @param db - D1 database instance
 * @param cookieId - Cookie ID to delete
 * @returns Number of deleted records
 */
async function deletePrediction(db: D1Database, cookieId: string): Promise<number> {
  const result = await db
    .prepare('DELETE FROM predictions WHERE cookie_id = ?')
    .bind(cookieId)
    .run();

  // Log deletion for compliance audit trail
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'GDPR data deletion executed',
      context: {
        cookie_id: cookieId.substring(0, 8) + '...', // Partial ID for privacy
        deleted_rows: result.meta.changes,
      },
    })
  );

  return result.meta.changes || 0;
}

/**
 * Create delete routes
 */
export function createDeleteRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * POST /api/delete - Request data deletion
   *
   * AC: Form submission process (Story 4.6)
   * - Validate cookie_id exists in database
   * - Immediate deletion
   */
  app.post('/api/delete', async (c) => {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const parseResult = DeletionRequestSchema.safeParse(body);

      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return c.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: firstError.message,
              field: firstError.path.join('.'),
            },
          },
          400
        );
      }

      const { cookie_id, reason } = parseResult.data;

      // Check if cookie_id exists in database
      const prediction = await c.env.DB.prepare(
        'SELECT cookie_id FROM predictions WHERE cookie_id = ?'
      )
        .bind(cookie_id)
        .first();

      if (!prediction) {
        return c.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message:
                'No prediction found for this Cookie ID. It may have already been deleted.',
            },
          },
          404
        );
      }

      // Immediate deletion
      const deletedCount = await deletePrediction(c.env.DB, cookie_id);

      if (deletedCount === 0) {
        return c.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Failed to delete prediction. Please try again.',
            },
          },
          500
        );
      }

      // Log deletion reason (if provided) for analytics
      if (reason) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Deletion reason logged',
            context: { reason },
          })
        );
      }

      return c.json({
        success: true,
        message: 'Your data has been deleted successfully.',
      });
    } catch (error) {
      console.error('Deletion request failed:', error);
      return c.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again.',
          },
        },
        500
      );
    }
  });

  return app;
}
