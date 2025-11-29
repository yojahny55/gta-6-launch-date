/**
 * Capacity Monitoring Service (Story 3.7)
 * Tracks daily request count and determines degradation level
 * Implements graceful degradation under Cloudflare free tier limits
 */

import type { CapacityLevel, QueuedSubmission } from '../types';

/**
 * Cloudflare free tier daily request limit
 * Source: Architecture - Cloudflare Free Tier Limits
 */
export const DAILY_REQUEST_LIMIT = 100000; // 100K requests/day

/**
 * Capacity thresholds as percentage of daily limit
 * Source: Tech Spec Epic 3 - AC7
 */
export const CAPACITY_THRESHOLDS = {
  ELEVATED: 0.8, // 80K requests - log warning
  HIGH: 0.9, // 90K requests - extend cache, disable chart
  CRITICAL: 0.95, // 95K requests - queue submissions
  EXCEEDED: 1.0, // 100K requests - read-only mode
} as const;

/**
 * KV keys for capacity tracking
 */
const KV_KEYS = {
  REQUEST_COUNT: 'capacity:requests:today',
  ALERT_SENT: 'capacity:alert:sent',
} as const;

/**
 * Get current capacity level and request count
 * @param kv - Cloudflare KV namespace for capacity tracking
 * @returns Capacity level, request count, and reset timestamp
 */
export async function getCapacityLevel(kv: KVNamespace | undefined): Promise<{
  level: CapacityLevel;
  requestsToday: number;
  resetAt: Date;
}> {
  // Fail-open if KV unavailable
  if (!kv) {
    console.warn('[Capacity] KV namespace unavailable - failing open to normal capacity');
    return {
      level: 'normal',
      requestsToday: 0,
      resetAt: getNextMidnightUTC(),
    };
  }

  try {
    // Get current request count from KV
    const countStr = await kv.get(KV_KEYS.REQUEST_COUNT);
    const requestsToday = countStr ? parseInt(countStr, 10) : 0;

    // Calculate capacity percentage
    const capacityPercentage = requestsToday / DAILY_REQUEST_LIMIT;

    // Determine capacity level
    let level: CapacityLevel;
    if (capacityPercentage >= CAPACITY_THRESHOLDS.EXCEEDED) {
      level = 'exceeded';
    } else if (capacityPercentage >= CAPACITY_THRESHOLDS.CRITICAL) {
      level = 'critical';
    } else if (capacityPercentage >= CAPACITY_THRESHOLDS.HIGH) {
      level = 'high';
    } else if (capacityPercentage >= CAPACITY_THRESHOLDS.ELEVATED) {
      level = 'elevated';
    } else {
      level = 'normal';
    }

    return {
      level,
      requestsToday,
      resetAt: getNextMidnightUTC(),
    };
  } catch (error) {
    console.error('[Capacity] Error getting capacity level:', error);
    // Fail-open to normal capacity on error
    return {
      level: 'normal',
      requestsToday: 0,
      resetAt: getNextMidnightUTC(),
    };
  }
}

/**
 * Increment daily request counter
 * @param kv - Cloudflare KV namespace for capacity tracking
 * @returns New request count
 */
export async function incrementRequestCount(kv: KVNamespace | undefined): Promise<number> {
  if (!kv) {
    console.warn('[Capacity] KV namespace unavailable - cannot increment counter');
    return 0;
  }

  try {
    // Get current count
    const countStr = await kv.get(KV_KEYS.REQUEST_COUNT);
    const currentCount = countStr ? parseInt(countStr, 10) : 0;
    const newCount = currentCount + 1;

    // Calculate seconds until midnight UTC
    const now = new Date();
    const midnight = getNextMidnightUTC();
    const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

    // Update count with TTL (expires at midnight UTC)
    await kv.put(KV_KEYS.REQUEST_COUNT, newCount.toString(), {
      expirationTtl: secondsUntilMidnight,
    });

    return newCount;
  } catch (error) {
    console.error('[Capacity] Error incrementing request count:', error);
    return 0;
  }
}

/**
 * Check if alert has been sent for current day
 * @param kv - Cloudflare KV namespace
 * @returns True if alert already sent today
 */
export async function hasAlertBeenSent(kv: KVNamespace | undefined): Promise<boolean> {
  if (!kv) return false;

  try {
    const alertSent = await kv.get(KV_KEYS.ALERT_SENT);
    return alertSent === 'true';
  } catch (error) {
    console.error('[Capacity] Error checking alert status:', error);
    return false;
  }
}

/**
 * Mark alert as sent for current day
 * @param kv - Cloudflare KV namespace
 */
export async function markAlertSent(kv: KVNamespace | undefined): Promise<void> {
  if (!kv) return;

  try {
    // Calculate seconds until midnight UTC
    const now = new Date();
    const midnight = getNextMidnightUTC();
    const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

    // Set flag with TTL (expires at midnight UTC)
    await kv.put(KV_KEYS.ALERT_SENT, 'true', {
      expirationTtl: secondsUntilMidnight,
    });
  } catch (error) {
    console.error('[Capacity] Error marking alert sent:', error);
  }
}

/**
 * Queue a submission for later processing (Story 3.7 - AC6)
 * Used when capacity is critical (95%+)
 * @param kv - Cloudflare KV namespace
 * @param submission - Queued submission data
 * @returns Queue position (approximate)
 */
export async function queueSubmission(
  kv: KVNamespace | undefined,
  submission: QueuedSubmission
): Promise<{ position: number }> {
  if (!kv) {
    throw new Error('KV namespace unavailable - cannot queue submission');
  }

  try {
    // Generate queue key with timestamp for FIFO ordering
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const queueKey = `queue:${timestamp}:${uuid}`;

    // Store submission with 24-hour TTL (per AC11)
    await kv.put(queueKey, JSON.stringify(submission), {
      expirationTtl: 24 * 60 * 60, // 24 hours
    });

    // Get approximate queue position (count keys with earlier timestamps)
    const queueList = await kv.list({ prefix: 'queue:' });
    const position = queueList.keys.filter((k) => {
      const keyTimestamp = parseInt(k.name.split(':')[1], 10);
      return keyTimestamp <= timestamp;
    }).length;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Submission queued',
        context: { queueKey, position, cookie_id: submission.cookie_id },
      })
    );

    return { position };
  } catch (error) {
    console.error('[Capacity] Error queuing submission:', error);
    throw error;
  }
}

/**
 * Process queued submissions in FIFO order (Story 3.7 - AC11)
 * @param kv - Cloudflare KV namespace
 * @param db - D1 database
 * @param batchSize - Number of submissions to process
 * @returns Number of submissions processed
 */
export async function processQueue(
  kv: KVNamespace | undefined,
  db: D1Database,
  batchSize: number = 10
): Promise<{ processed: number }> {
  if (!kv) {
    console.warn('[Capacity] KV namespace unavailable - cannot process queue');
    return { processed: 0 };
  }

  try {
    // Get queue items (sorted by timestamp - FIFO)
    const queueList = await kv.list({ prefix: 'queue:', limit: batchSize });
    const queueKeys = queueList.keys.sort((a, b) => {
      const tsA = parseInt(a.name.split(':')[1], 10);
      const tsB = parseInt(b.name.split(':')[1], 10);
      return tsA - tsB; // Oldest first
    });

    let processed = 0;

    for (const key of queueKeys) {
      try {
        // Get submission data
        const dataStr = await kv.get(key.name);
        if (!dataStr) continue;

        const submission: QueuedSubmission = JSON.parse(dataStr);

        // Insert prediction into database
        // Note: This is a simplified version - actual implementation would use
        // the same logic as POST /api/predict endpoint
        await db
          .prepare(
            `INSERT INTO predictions (predicted_date, ip_hash, cookie_id, user_agent, weight, submitted_at, updated_at)
             VALUES (?, ?, ?, ?, 1.0, ?, ?)`
          )
          .bind(
            submission.predicted_date,
            submission.ip_hash,
            submission.cookie_id,
            submission.user_agent,
            submission.queued_at,
            new Date().toISOString()
          )
          .run();

        // Delete from queue after successful processing
        await kv.delete(key.name);
        processed++;

        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Queued submission processed',
            context: { queueKey: key.name, cookie_id: submission.cookie_id },
          })
        );
      } catch (error) {
        console.error(`[Capacity] Error processing queue item ${key.name}:`, error);
        // Continue processing other items
      }
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Queue processing completed',
        context: { processed, remaining: queueList.keys.length - processed },
      })
    );

    return { processed };
  } catch (error) {
    console.error('[Capacity] Error processing queue:', error);
    return { processed: 0 };
  }
}

/**
 * Calculate next midnight UTC for daily reset
 * @returns Date object for next midnight UTC
 */
function getNextMidnightUTC(): Date {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return midnight;
}

/**
 * Calculate hours until midnight UTC for countdown display
 * @returns Hours until reset (rounded up)
 */
export function getHoursUntilReset(): number {
  const now = new Date();
  const midnight = getNextMidnightUTC();
  const hoursUntilReset = Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
  return hoursUntilReset;
}
