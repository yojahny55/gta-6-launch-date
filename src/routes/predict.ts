/**
 * Prediction Submission Route - POST /api/predict
 *
 * Handles prediction submission with multi-layered validation:
 * 1. Cookie ID extraction and validation (Story 2.1)
 * 2. IP address hashing (Story 2.2)
 * 3. Input validation (Story 2.4)
 * 4. Turnstile verification (Story 2.5B)
 * 5. Rate limiting (Story 2.6 - via middleware)
 * 6. Weight calculation (Story 2.9)
 * 7. Database transaction with UNIQUE constraint handling (Story 1.4)
 *
 * @see Story 2.7: Prediction Submission API Endpoint
 * @see docs/architecture.md - API Contracts: POST /api/predict
 */

import { Hono } from 'hono';
import type { Env, ErrorResponse } from '../types';
import { PredictionRequestSchema } from '../utils/validation';
import { getCookie, validateCookieID, generateCookieID, setCookie, COOKIE_NAME, getDefaultCookieOptions } from '../utils/cookie';
import { hashRequestIP } from '../utils/ip-hash';
import { verifyAndEvaluateTurnstile } from '../utils/turnstile';

/**
 * Calculate weight based on date reasonableness (Story 2.9)
 *
 * Weight formula: Predictions closer to reasonable dates get higher weight
 * - Reasonable range: 2026-01-01 to 2028-12-31 (high probability window)
 * - Outside this range: weight decreases
 *
 * Per tech spec, this is a placeholder until Story 2.9 implements full algorithm
 *
 * @param predictedDate - ISO 8601 date string (YYYY-MM-DD)
 * @returns Weight value between 0.1 and 1.0
 */
function calculateWeight(predictedDate: string): number {
  const date = new Date(predictedDate);
  const now = new Date();

  // Reasonable window: 2026-01-01 to 2028-12-31
  const windowStart = new Date('2026-01-01');
  const windowEnd = new Date('2028-12-31');

  // Base weight
  let weight = 1.0;

  // If date is in the past relative to current date, reduce weight
  if (date < now) {
    weight = 0.1;
  }
  // If date is within reasonable window, full weight
  else if (date >= windowStart && date <= windowEnd) {
    weight = 1.0;
  }
  // If before reasonable window (2025), slightly reduce
  else if (date < windowStart) {
    weight = 0.8;
  }
  // If after reasonable window, reduce weight based on distance
  else {
    const yearsAfter = (date.getTime() - windowEnd.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    weight = Math.max(0.1, 1.0 - yearsAfter * 0.1);
  }

  return weight;
}

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
          ipHashPrefix: ipHash.substring(0, 8),
          duration_ms: Date.now() - startTime,
        });

        // Return 201 Created response
        return c.json(
          {
            success: true,
            prediction_id: predictionId,
            predicted_date,
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
        if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('cookie_id')) {
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

              // Set new cookie in response
              const cookieOptions = getDefaultCookieOptions();
              c.header('Set-Cookie', setCookie(COOKIE_NAME, cookieId, cookieOptions));

              console.log('Prediction submitted (cookie regenerated)', {
                prediction_id: predictionId,
                predicted_date,
                weight,
              });

              return c.json(
                {
                  success: true,
                  prediction_id: predictionId,
                  predicted_date,
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

  return app;
}

export default createPredictRoutes;
