/**
 * Prediction Routes - POST /api/predict and PUT /api/predict
 *
 * Handles prediction submission and update with multi-layered validation:
 * 1. Cookie ID extraction and validation (Story 2.1)
 * 2. IP address hashing (Story 2.2)
 * 3. Input validation (Story 2.4)
 * 4. Turnstile verification (Story 2.5B)
 * 5. Rate limiting (Story 2.6 - via middleware)
 * 6. Weight calculation (Story 2.9)
 * 7. Database transaction with UNIQUE constraint handling (Story 1.4)
 *
 * @see Story 2.7: Prediction Submission API Endpoint (POST)
 * @see Story 2.8: Prediction Update API Endpoint (PUT)
 * @see docs/architecture.md - API Contracts
 */

import { Hono } from 'hono';
import type { Env, ErrorResponse } from '../types';
import { PredictionRequestSchema } from '../utils/validation';
import {
  getCookie,
  validateCookieID,
  generateCookieID,
  setCookie,
  COOKIE_NAME,
  getDefaultCookieOptions,
} from '../utils/cookie';
import { hashRequestIP } from '../utils/ip-hash';
import { verifyAndEvaluateTurnstile } from '../utils/turnstile';
import { calculateWeight } from '../utils/weighted-median';
import { invalidateStatsCache, calculateStatistics } from '../services/statistics.service';

/**
 * Create prediction submission routes
 *
 * @returns Hono app with /api/predict routes configured
 */
export function createPredictRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  /**
   * POST /api/predict - Submit a new prediction
   *
   * Request body:
   * {
   *   "predicted_date": "2026-11-19",
   *   "turnstile_token": "0x1aBcDeFg..."
   * }
   *
   * Success (201 Created):
   * {
   *   "success": true,
   *   "prediction_id": 1234,
   *   "predicted_date": "2026-11-19",
   *   "message": "Your prediction has been recorded!"
   * }
   *
   * Error responses:
   * - 400: Validation error
   * - 409: IP already submitted (UNIQUE constraint)
   * - 429: Rate limit exceeded (handled by middleware)
   * - 503: Bot detected (Turnstile failed)
   * - 500: Server/database error
   */
  app.post('/api/predict', async (c) => {
    const startTime = Date.now();
    let cookieId: string | null = null;
    let ipHash: string | null = null;

    try {
      // Step 1: Parse and validate request body
      const body = await c.req.json();
      const validationResult = PredictionRequestSchema.safeParse(body);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstError.message,
            field: firstError.path.join('.'),
          },
        };
        return c.json(errorResponse, 400);
      }

      const { predicted_date, turnstile_token } = validationResult.data;

      // Step 2: Extract and validate cookie_id
      const cookieHeader = c.req.header('Cookie') || '';
      cookieId = getCookie(cookieHeader, COOKIE_NAME) || null;

      // Generate new cookie if not present or invalid
      let isNewCookie = false;
      if (!cookieId || !validateCookieID(cookieId)) {
        cookieId = generateCookieID();
        isNewCookie = true;
      }

      // Step 3: Extract and hash IP address
      try {
        ipHash = await hashRequestIP(c.req.raw, c.env.SALT_V1 || c.env.IP_HASH_SALT || '');
      } catch (error) {
        console.error('IP hash error:', error);
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to process request. Please try again.',
          },
        };
        return c.json(errorResponse, 500);
      }

      // Step 4: Verify Turnstile token (bot protection)
      const { passed, result: turnstileResult } = await verifyAndEvaluateTurnstile(
        turnstile_token,
        c.env.TURNSTILE_SECRET_KEY || ''
      );

      if (!passed) {
        console.warn('Turnstile verification failed', {
          errorCodes: turnstileResult['error-codes'],
          ipHashPrefix: ipHash.substring(0, 8),
        });
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'BOT_DETECTED',
            message: 'Verification failed. Please complete the challenge and try again.',
          },
        };
        return c.json(errorResponse, 503);
      }

      // Step 5: Calculate weight based on date reasonableness
      const weight = calculateWeight(predicted_date);

      // Step 6: Get user agent (optional)
      const userAgent = c.req.header('User-Agent') || null;

      // Step 7: Database transaction - INSERT prediction
      const now = new Date().toISOString();

      try {
        // Attempt insert with current cookie_id
        const insertResult = await c.env.DB.prepare(
          `INSERT INTO predictions (predicted_date, submitted_at, updated_at, ip_hash, cookie_id, user_agent, weight)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(predicted_date, now, now, ipHash, cookieId, userAgent, weight)
          .run();

        if (!insertResult.success) {
          throw new Error('Database insert failed');
        }

        // Get the inserted prediction_id
        const predictionId = insertResult.meta.last_row_id;

        // Invalidate stats cache after successful submission (Story 2.10)
        await invalidateStatsCache(c.env.gta6_stats_cache);

        // Calculate fresh stats for comparison (Story 3.2)
        const stats = await calculateStatistics(c.env.DB);

        // Calculate delta_days for social comparison
        const userDate = new Date(predicted_date);
        const medianDate = new Date(stats.median);
        const delta_days = Math.round(
          (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Determine comparison direction
        let comparison: 'optimistic' | 'pessimistic' | 'aligned';
        if (delta_days === 0) comparison = 'aligned';
        else if (delta_days > 0) comparison = 'pessimistic';
        else comparison = 'optimistic';

        // Set cookie in response if new
        if (isNewCookie) {
          const cookieOptions = getDefaultCookieOptions();
          c.header('Set-Cookie', setCookie(COOKIE_NAME, cookieId, cookieOptions));
        }

        // Log successful submission
        console.log('Prediction submitted', {
          prediction_id: predictionId,
          predicted_date,
          weight,
          delta_days,
          comparison,
          ipHashPrefix: ipHash.substring(0, 8),
          duration_ms: Date.now() - startTime,
        });

        // Return 201 Created response with stats for comparison (Story 3.2)
        return c.json(
          {
            success: true,
            data: {
              prediction_id: predictionId,
              predicted_date,
              submitted_at: now,
              stats: {
                median: stats.median,
                min: stats.min,
                max: stats.max,
                count: stats.count,
              },
              delta_days,
              comparison,
            },
            message: 'Your prediction has been recorded!',
          },
          201
        );
      } catch (dbError) {
        // Handle specific database errors
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

        // Check for UNIQUE constraint violation on ip_hash
        if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('ip_hash')) {
          console.warn('Duplicate IP submission attempt', {
            ipHashPrefix: ipHash.substring(0, 8),
          });
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: "You've already submitted a prediction. Use update instead.",
            },
          };
          return c.json(errorResponse, 409);
        }

        // Check for UNIQUE constraint violation on cookie_id
        if (
          errorMessage.includes('UNIQUE constraint failed') &&
          errorMessage.includes('cookie_id')
        ) {
          // Cookie collision - regenerate and retry once
          if (!isNewCookie) {
            // Only retry if we haven't already generated a new cookie
            cookieId = generateCookieID();
            isNewCookie = true;

            // Retry insert with new cookie_id
            const retryResult = await c.env.DB.prepare(
              `INSERT INTO predictions (predicted_date, submitted_at, updated_at, ip_hash, cookie_id, user_agent, weight)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(predicted_date, now, now, ipHash, cookieId, userAgent, weight)
              .run();

            if (retryResult.success) {
              const predictionId = retryResult.meta.last_row_id;

              // Invalidate stats cache after successful submission (Story 2.10)
              await invalidateStatsCache(c.env.gta6_stats_cache);

              // Calculate fresh stats for comparison (Story 3.2)
              const stats = await calculateStatistics(c.env.DB);

              // Calculate delta_days for social comparison
              const userDate = new Date(predicted_date);
              const medianDate = new Date(stats.median);
              const delta_days = Math.round(
                (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
              );

              // Determine comparison direction
              let comparison: 'optimistic' | 'pessimistic' | 'aligned';
              if (delta_days === 0) comparison = 'aligned';
              else if (delta_days > 0) comparison = 'pessimistic';
              else comparison = 'optimistic';

              // Set new cookie in response
              const cookieOptions = getDefaultCookieOptions();
              c.header('Set-Cookie', setCookie(COOKIE_NAME, cookieId, cookieOptions));

              console.log('Prediction submitted (cookie regenerated)', {
                prediction_id: predictionId,
                predicted_date,
                weight,
                delta_days,
                comparison,
              });

              return c.json(
                {
                  success: true,
                  data: {
                    prediction_id: predictionId,
                    predicted_date,
                    submitted_at: now,
                    stats: {
                      median: stats.median,
                      min: stats.min,
                      max: stats.max,
                      count: stats.count,
                    },
                    delta_days,
                    comparison,
                  },
                  message: 'Your prediction has been recorded!',
                },
                201
              );
            }
          }

          // If retry also failed or we already had a new cookie, return error
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Unable to process request. Please try again.',
            },
          };
          return c.json(errorResponse, 500);
        }

        // Generic database error
        console.error('Database error during prediction insert', {
          error: errorMessage,
          ipHashPrefix: ipHash?.substring(0, 8),
        });
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'An error occurred while saving your prediction. Please try again.',
          },
        };
        return c.json(errorResponse, 500);
      }
    } catch (error) {
      // Top-level error handler
      console.error('Unexpected error in POST /api/predict', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipHashPrefix: ipHash?.substring(0, 8),
      });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      };
      return c.json(errorResponse, 500);
    }
  });

  /**
   * PUT /api/predict - Update an existing prediction
   *
   * Updates a prediction using cookie_id lookup.
   * Per Story 2.8 and AC8, implements IP conflict resolution where
   * cookie_id takes precedence over IP (FR67).
   *
   * Request body:
   * {
   *   "predicted_date": "2027-02-14",
   *   "turnstile_token": "0x1aBcDeFg..."
   * }
   *
   * Success (200 OK):
   * {
   *   "success": true,
   *   "predicted_date": "2027-02-14",
   *   "previous_date": "2026-11-19",
   *   "message": "Your prediction has been updated!"
   * }
   *
   * Error responses:
   * - 400: Validation error
   * - 404: No prediction found for cookie_id
   * - 429: Rate limit exceeded (handled by middleware, 30/min)
   * - 503: Bot detected (Turnstile failed)
   * - 500: Server/database error
   */
  app.put('/api/predict', async (c) => {
    const startTime = Date.now();
    let cookieId: string | null = null;
    let ipHash: string | null = null;

    try {
      // Step 1: Parse and validate request body
      const body = await c.req.json();
      const validationResult = PredictionRequestSchema.safeParse(body);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstError.message,
            field: firstError.path.join('.'),
          },
        };
        return c.json(errorResponse, 400);
      }

      const { predicted_date, turnstile_token } = validationResult.data;

      // Step 2: Extract and validate cookie_id (REQUIRED for updates)
      const cookieHeader = c.req.header('Cookie') || '';
      cookieId = getCookie(cookieHeader, COOKIE_NAME) || null;

      // For updates, cookie_id must be present and valid
      if (!cookieId || !validateCookieID(cookieId)) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No prediction found. Please submit first.',
          },
        };
        return c.json(errorResponse, 404);
      }

      // Step 3: Extract and hash IP address (for IP update if changed)
      try {
        ipHash = await hashRequestIP(c.req.raw, c.env.SALT_V1 || c.env.IP_HASH_SALT || '');
      } catch (error) {
        console.error('IP hash error:', error);
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Unable to process request. Please try again.',
          },
        };
        return c.json(errorResponse, 500);
      }

      // Step 4: Verify Turnstile token (bot protection)
      const { passed, result: turnstileResult } = await verifyAndEvaluateTurnstile(
        turnstile_token,
        c.env.TURNSTILE_SECRET_KEY || ''
      );

      if (!passed) {
        console.warn('Turnstile verification failed on update', {
          errorCodes: turnstileResult['error-codes'],
          ipHashPrefix: ipHash.substring(0, 8),
        });
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'BOT_DETECTED',
            message: 'Verification failed. Please complete the challenge and try again.',
          },
        };
        return c.json(errorResponse, 503);
      }

      // Step 5: Query existing prediction by cookie_id
      const existingPrediction = await c.env.DB.prepare(
        'SELECT id, predicted_date, ip_hash FROM predictions WHERE cookie_id = ?'
      )
        .bind(cookieId)
        .first();

      // Step 6: Return 404 if not found
      if (!existingPrediction) {
        console.warn('Update attempted for non-existent cookie_id', {
          cookieIdPrefix: cookieId.substring(0, 8),
        });
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No prediction found. Please submit first.',
          },
        };
        return c.json(errorResponse, 404);
      }

      const previousDate = existingPrediction.predicted_date as string;
      const storedIpHash = existingPrediction.ip_hash as string;

      // Step 7: Check if date is the same (idempotent - skip update)
      if (previousDate === predicted_date) {
        console.log('Idempotent update - date unchanged', {
          cookieIdPrefix: cookieId.substring(0, 8),
          predicted_date,
        });
        return c.json(
          {
            success: true,
            predicted_date,
            previous_date: previousDate,
            message: 'Your prediction remains unchanged.',
          },
          200
        );
      }

      // Step 8: Calculate new weight
      const weight = calculateWeight(predicted_date);

      // Step 9: Detect IP change for IP conflict resolution (FR67)
      // Cookie_id takes precedence - update ip_hash to new IP
      const ipChanged = storedIpHash !== ipHash;
      if (ipChanged) {
        console.log('IP change detected during update - updating ip_hash', {
          cookieIdPrefix: cookieId.substring(0, 8),
          oldIpHashPrefix: storedIpHash.substring(0, 8),
          newIpHashPrefix: ipHash.substring(0, 8),
        });
      }

      // Step 10: Perform UPDATE with prepared statement
      const now = new Date().toISOString();

      try {
        // Update prediction with new date, weight, updated_at, and optionally ip_hash
        const updateResult = await c.env.DB.prepare(
          `UPDATE predictions
           SET predicted_date = ?,
               weight = ?,
               updated_at = ?,
               ip_hash = ?
           WHERE cookie_id = ?`
        )
          .bind(predicted_date, weight, now, ipHash, cookieId)
          .run();

        if (!updateResult.success || updateResult.meta.changes === 0) {
          // No rows updated - should not happen since we checked existence
          console.error('Database update failed - no rows affected', {
            cookieIdPrefix: cookieId.substring(0, 8),
          });
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'An error occurred while updating your prediction. Please try again.',
            },
          };
          return c.json(errorResponse, 500);
        }

        // Invalidate stats cache after successful update (Story 2.10)
        await invalidateStatsCache(c.env.gta6_stats_cache);

        // Calculate fresh stats for comparison (Story 3.2)
        const stats = await calculateStatistics(c.env.DB);

        // Calculate delta_days for social comparison
        const userDate = new Date(predicted_date);
        const medianDate = new Date(stats.median);
        const delta_days = Math.round(
          (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Determine comparison direction
        let comparison: 'optimistic' | 'pessimistic' | 'aligned';
        if (delta_days === 0) comparison = 'aligned';
        else if (delta_days > 0) comparison = 'pessimistic';
        else comparison = 'optimistic';

        // Step 11: Log successful update
        console.log('Prediction updated', {
          cookie_id_prefix: cookieId.substring(0, 8),
          predicted_date,
          previous_date: previousDate,
          weight,
          delta_days,
          comparison,
          ip_changed: ipChanged,
          duration_ms: Date.now() - startTime,
        });

        // Step 12: Return 200 OK with stats for comparison (Story 3.2)
        return c.json(
          {
            success: true,
            data: {
              predicted_date,
              previous_date: previousDate,
              updated_at: now,
              stats: {
                median: stats.median,
                min: stats.min,
                max: stats.max,
                count: stats.count,
              },
              delta_days,
              comparison,
            },
            message: 'Your prediction has been updated!',
          },
          200
        );
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

        // Handle potential UNIQUE constraint violation on ip_hash
        // This can happen if user tries to update to an IP that another user already has
        // Per FR67, cookie_id takes precedence, so this is a conflict scenario
        if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('ip_hash')) {
          console.warn('IP conflict during update - another user already has this IP', {
            cookieIdPrefix: cookieId.substring(0, 8),
            ipHashPrefix: ipHash.substring(0, 8),
          });
          // Still allow the update but keep the old IP hash
          // Re-run update without changing ip_hash
          const retryResult = await c.env.DB.prepare(
            `UPDATE predictions
             SET predicted_date = ?,
                 weight = ?,
                 updated_at = ?
             WHERE cookie_id = ?`
          )
            .bind(predicted_date, weight, now, cookieId)
            .run();

          if (retryResult.success && retryResult.meta.changes > 0) {
            // Invalidate stats cache after successful update (Story 2.10)
            await invalidateStatsCache(c.env.gta6_stats_cache);

            console.log('Prediction updated (IP conflict resolved - kept original IP)', {
              cookie_id_prefix: cookieId.substring(0, 8),
              predicted_date,
              previous_date: previousDate,
            });

            return c.json(
              {
                success: true,
                predicted_date,
                previous_date: previousDate,
                message: 'Your prediction has been updated!',
              },
              200
            );
          }
        }

        // Generic database error
        console.error('Database error during prediction update', {
          error: errorMessage,
          cookieIdPrefix: cookieId?.substring(0, 8),
        });
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'An error occurred while updating your prediction. Please try again.',
          },
        };
        return c.json(errorResponse, 500);
      }
    } catch (error) {
      // Top-level error handler
      console.error('Unexpected error in PUT /api/predict', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cookieIdPrefix: cookieId?.substring(0, 8),
      });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      };
      return c.json(errorResponse, 500);
    }
  });

  return app;
}

export default createPredictRoutes;
