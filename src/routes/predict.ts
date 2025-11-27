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
import type { Env, ErrorResponse, QueuedSubmission } from '../types';
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
import { calculateStatistics } from '../services/statistics.service';
import { invalidateAllCaches } from '../services/predictions-aggregation.service';
import {
  getCapacityLevel,
  incrementRequestCount,
  queueSubmission,
  hasAlertBeenSent,
  markAlertSent,
} from '../services/capacity.service';
import { getDegradationState } from '../utils/degradation';

/**
 * Retry helper for database deadlocks and BUSY errors (Story 3.6 - AC: Scenario 3)
 * Implements exponential backoff: 100ms, 200ms, 400ms
 *
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delays - Delay in ms between retries (default: [100, 200, 400])
 * @returns Result from successful execution
 * @throws Error if all retries fail
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delays: number[] = [100, 200, 400]
): Promise<T> {
  let lastError: Error | null = null;
  let deadlockCount = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();

      // Check if error is a deadlock or BUSY error (SQLite specific)
      const isDeadlock =
        errorMessage.includes('busy') ||
        errorMessage.includes('deadlock') ||
        errorMessage.includes('locked');

      if (!isDeadlock || attempt === maxAttempts - 1) {
        // Not a deadlock error, or final attempt - rethrow
        throw lastError;
      }

      // Log deadlock detection (Story 3.6 - AC: Transaction logging)
      deadlockCount++;
      const delay = delays[attempt] || delays[delays.length - 1];
      console.warn('Database deadlock/BUSY detected - retrying', {
        attempt: attempt + 1,
        maxAttempts,
        nextDelay: delay,
        error: errorMessage.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Log deadlock rate for monitoring (Story 3.6 - AC: Alert if rate > 1%)
  if (deadlockCount > 0) {
    console.log('Deadlock retry completed', {
      totalAttempts: maxAttempts,
      deadlockCount,
      success: false,
      timestamp: new Date().toISOString(),
    });
  }

  // All retries failed
  throw lastError || new Error('Retry failed - unknown error');
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
      // Step 0: Check capacity and increment request counter (Story 3.7)
      const kv = c.env.gta6_capacity;
      await incrementRequestCount(kv);

      const { level: capacityLevel, requestsToday, resetAt } = await getCapacityLevel(kv);
      const degradationState = getDegradationState(capacityLevel, requestsToday, resetAt);

      // AC12: Alert at 80% threshold
      if (capacityLevel === 'elevated' && !(await hasAlertBeenSent(kv))) {
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message: 'Capacity threshold reached: 80%',
            context: { requestsToday, capacityLevel },
          })
        );
        await markAlertSent(kv);
      }

      // AC8-AC10: At 100% capacity - read-only mode
      if (!degradationState.features.submissionsEnabled) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: "We've reached capacity for today. Try again later.",
            details: {
              capacityLevel,
              resetAt: degradationState.resetAt,
            },
          },
        };
        return c.json(errorResponse, 503);
      }

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

      // DEBUG: Log cookie detection
      console.log('POST /api/predict - Cookie detection', {
        hasCookieHeader: !!cookieHeader,
        cookieHeaderLength: cookieHeader?.length || 0,
        extractedCookieId: cookieId ? cookieId.substring(0, 8) + '...' : null,
        cookieName: COOKIE_NAME,
      });

      // Generate new cookie if not present or invalid
      let isNewCookie = false;
      if (!cookieId || !validateCookieID(cookieId)) {
        const oldCookie = cookieId;
        cookieId = generateCookieID();
        isNewCookie = true;
        console.log('POST /api/predict - Generated new cookie', {
          reason: !oldCookie ? 'no_cookie' : 'invalid_cookie',
          oldCookiePrefix: oldCookie ? oldCookie.substring(0, 8) : null,
          newCookiePrefix: cookieId.substring(0, 8),
        });
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

      // Step 7: Check if cookie_id already exists (Story 3.6 - Cookie-first logic)
      // If exists, route to UPDATE instead of INSERT (handles double-click scenario)
      console.log('POST /api/predict - Checking for existing prediction by cookie', {
        cookieIdPrefix: cookieId.substring(0, 8),
        isNewCookie,
      });

      const existingByCookie = await c.env.DB.prepare(
        'SELECT id, predicted_date FROM predictions WHERE cookie_id = ?'
      )
        .bind(cookieId)
        .first();

      console.log('POST /api/predict - Database lookup result', {
        cookieIdPrefix: cookieId.substring(0, 8),
        foundExisting: !!existingByCookie,
        existingId: existingByCookie?.id,
        existingDate: existingByCookie?.predicted_date,
      });

      if (existingByCookie) {
        // Cookie exists - check if this is an idempotent resubmission (AC: Scenario 2 - Double-click)
        console.log('POST /api/predict - Found existing prediction by cookie', {
          cookieIdPrefix: cookieId.substring(0, 8),
          existingDate: existingByCookie.predicted_date,
          newDate: predicted_date,
          dateChanged: existingByCookie.predicted_date !== predicted_date,
        });

        // If date is the SAME, return success immediately (idempotent - handles double-click)
        // This prevents duplicate submissions when user rapidly clicks submit button
        if (existingByCookie.predicted_date === predicted_date) {
          console.log(
            'POST /api/predict - Idempotent resubmission (same date) - returning success'
          );
          const stats = await calculateStatistics(c.env.DB);
          const userDate = new Date(predicted_date);
          const medianDate = new Date(stats.median);
          const delta_days = Math.round(
            (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          let comparison: 'optimistic' | 'pessimistic' | 'aligned';
          if (delta_days === 0) comparison = 'aligned';
          else if (delta_days > 0) comparison = 'pessimistic';
          else comparison = 'optimistic';

          return c.json(
            {
              success: true,
              data: {
                prediction_id: existingByCookie.id,
                predicted_date,
                submitted_at: new Date().toISOString(),
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

        // Different date - this is an intentional update attempt
        // Return 409 to let frontend handle update flow (maintains existing UI behavior)
        console.log(
          'POST /api/predict - Different date detected - returning 409 for frontend to handle'
        );
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: "You've already submitted a prediction. Use update instead.",
          },
        };
        return c.json(errorResponse, 409);
      }

      // Step 8a: Check if capacity is critical - queue instead of direct insert (Story 3.7 - AC5-AC7)
      if (capacityLevel === 'critical') {
        // AC6: Queue submissions at 95% capacity
        const queuedSubmission: QueuedSubmission = {
          predicted_date,
          cookie_id: cookieId,
          ip_hash: ipHash,
          user_agent: userAgent,
          queued_at: new Date().toISOString(),
        };

        const { position } = await queueSubmission(kv, queuedSubmission);

        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Submission queued - critical capacity',
            context: { capacityLevel, position, cookieIdPrefix: cookieId.substring(0, 8) },
          })
        );

        // Return success with queue position (AC7)
        return c.json(
          {
            success: true,
            data: {
              queued: true,
              position,
              message:
                "We're experiencing high traffic. Your submission will be processed shortly.",
              resetAt: degradationState.resetAt,
            },
          },
          202 // Accepted
        );
      }

      // Step 8b: Database transaction - INSERT prediction with retry (Story 3.6 - AC: Scenario 3)
      console.log('POST /api/predict - Proceeding to INSERT', {
        cookieIdPrefix: cookieId.substring(0, 8),
        ipHashPrefix: ipHash.substring(0, 8),
        isNewCookie,
        predicted_date,
      });

      const now = new Date().toISOString();

      try {
        // Wrap INSERT in retry logic for deadlock/BUSY handling
        const insertResult = await retryWithBackoff(async () => {
          const result = await c.env.DB.prepare(
            `INSERT INTO predictions (predicted_date, submitted_at, updated_at, ip_hash, cookie_id, user_agent, weight)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(predicted_date, now, now, ipHash, cookieId, userAgent, weight)
            .run();

          if (!result.success) {
            throw new Error('Database insert failed');
          }

          return result;
        });

        // Get the inserted prediction_id
        const predictionId = insertResult.meta.last_row_id;

        // Invalidate both stats and predictions caches after successful submission (Story 2.10, 3.4b)
        await invalidateAllCaches(c.env.gta6_stats_cache);

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

        // Check for UNIQUE constraint violation on ip_hash (Story 3.6 - AC: Scenario 1, Story 4.7 - AC: Scenario 2 & 3)
        if (errorMessage.includes('UNIQUE constraint failed') && errorMessage.includes('ip_hash')) {
          // Enhanced logging for constraint violations (Story 3.6 - AC: Transaction logging, Story 4.7 - AC: Conflict logging)
          console.warn('IP conflict detected - same IP, different cookie', {
            constraint: 'ip_hash',
            ipHashPrefix: ipHash.substring(0, 8),
            cookieIdPrefix: cookieId.substring(0, 8),
            predicted_date,
            timestamp: new Date().toISOString(),
            scenario: 'Same IP, different cookies - likely cookie loss or multiple users',
            conflictType: 'ip_already_used',
          });

          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'IP_ALREADY_USED',
              message:
                'This IP address has already submitted a prediction. If you previously submitted and lost your cookie, you can restore it from your browser settings. Updates work across IP changes (WiFi, VPN, mobile networks).',
              details: {
                help: 'Your cookie allows updates from any IP. Check your browser cookies for "gta6_prediction_id".',
                aboutPage: '/about#how-it-works',
              },
            },
          };
          return c.json(errorResponse, 409);
        }

        // Check for UNIQUE constraint violation on cookie_id
        if (
          errorMessage.includes('UNIQUE constraint failed') &&
          errorMessage.includes('cookie_id')
        ) {
          // Enhanced logging for cookie constraint violations (Story 3.6 - AC: Transaction logging)
          console.warn('UNIQUE constraint violation: cookie_id', {
            constraint: 'cookie_id',
            cookieIdPrefix: cookieId.substring(0, 8),
            ipHashPrefix: ipHash.substring(0, 8),
            predicted_date,
            timestamp: new Date().toISOString(),
            scenario: 'Cookie collision (rare - 1 in 1 trillion chance)',
          });

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

              // Invalidate both stats and predictions caches after successful submission (Story 2.10, 3.4b)
              await invalidateAllCaches(c.env.gta6_stats_cache);

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

        // Check for deadlock/BUSY errors after all retries exhausted (Story 3.6 - AC: Scenario 3)
        const isDeadlock =
          errorMessage.toLowerCase().includes('busy') ||
          errorMessage.toLowerCase().includes('deadlock') ||
          errorMessage.toLowerCase().includes('locked');

        if (isDeadlock) {
          console.error('Database deadlock - all retries exhausted', {
            error: errorMessage,
            ipHashPrefix: ipHash?.substring(0, 8),
            timestamp: new Date().toISOString(),
          });
          const errorResponse: ErrorResponse = {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Service temporarily unavailable due to high load. Please try again.',
            },
          };
          return c.json(errorResponse, 503);
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

      // Step 9: Detect IP change for IP conflict resolution (FR67, Story 4.7 - AC: Scenario 1)
      // Cookie_id takes precedence - update ip_hash to new IP
      const ipChanged = storedIpHash !== ipHash;
      if (ipChanged) {
        console.log('IP change detected - cookie allows update from any IP', {
          cookieIdPrefix: cookieId.substring(0, 8),
          oldIpHashPrefix: storedIpHash.substring(0, 8),
          newIpHashPrefix: ipHash.substring(0, 8),
          timestamp: new Date().toISOString(),
          scenario: 'User changed networks (WiFi/mobile/VPN)',
          conflictType: 'ip_change_allowed',
          resolution: 'Update ip_hash to new IP, keep cookie_id (FR67)',
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

        // Invalidate both stats and predictions caches after successful update (Story 2.10, 3.4b)
        await invalidateAllCaches(c.env.gta6_stats_cache);

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
              prediction_id: existingPrediction.id,
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
            // Invalidate both stats and predictions caches after successful update (Story 2.10, 3.4b)
            await invalidateAllCaches(c.env.gta6_stats_cache);

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

            console.log('Prediction updated (IP conflict resolved - kept original IP)', {
              cookie_id_prefix: cookieId.substring(0, 8),
              predicted_date,
              previous_date: previousDate,
              delta_days,
              comparison,
            });

            return c.json(
              {
                success: true,
                data: {
                  prediction_id: existingPrediction.id,
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
