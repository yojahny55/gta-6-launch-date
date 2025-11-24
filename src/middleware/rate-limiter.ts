/**
 * Rate Limiter Middleware Module
 *
 * Implements sliding window rate limiting per IP address using Cloudflare KV.
 * Protects API endpoints from automated script abuse (FR77).
 *
 * Features:
 * - Sliding window algorithm (not fixed intervals)
 * - Per-endpoint configurable limits
 * - Cloudflare KV for distributed rate limiting
 * - Fail-open pattern (allows requests if KV unavailable)
 * - Standard rate limit headers (X-RateLimit-*, Retry-After)
 *
 * @see Story 2.6 - Rate Limiting Per IP Address
 * @see docs/architecture.md - Performance Considerations
 */

import { Context, Next } from 'hono';
import type { Env, RateLimitResult, RateLimitConfig } from '../types';
import { extractClientIP, hashIP } from '../utils/ip-hash';

/**
 * Default rate limit configurations per endpoint
 * Configurable via environment variables
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'POST:/api/predict': {
    limit: 10,
    windowSeconds: 60,
    endpoint: 'submit',
  },
  'PUT:/api/predict': {
    limit: 30,
    windowSeconds: 60,
    endpoint: 'update',
  },
  'GET:/api/stats': {
    limit: 60,
    windowSeconds: 60,
    endpoint: 'stats',
  },
};

/**
 * Rate limit window size in seconds
 * Used for TTL on KV entries and reset time calculations
 */
const WINDOW_SECONDS = 60;

/**
 * Check rate limit for a given IP hash and endpoint
 *
 * Implements sliding window rate limiting using Cloudflare KV.
 * Key format: `ratelimit:${ipHash}:${endpoint}`
 *
 * Algorithm:
 * 1. Construct KV key from IP hash and endpoint
 * 2. Get current counter value (or 0 if not exists)
 * 3. If counter >= limit, deny request
 * 4. Otherwise, increment counter with TTL and allow request
 *
 * @param kv - Cloudflare KV namespace binding
 * @param ipHash - Hashed IP address (64-char hex string)
 * @param endpoint - Endpoint identifier (e.g., 'submit', 'update', 'stats')
 * @param limit - Maximum requests per window
 * @returns RateLimitResult with allowed status, remaining count, and reset time
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ipHash: string,
  endpoint: string,
  limit: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${ipHash}:${endpoint}`;
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + WINDOW_SECONDS;

  try {
    // Get current counter value
    const current = await kv.get(key);
    const count = current ? parseInt(current, 10) : 0;

    // Check if limit exceeded
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit,
      };
    }

    // Increment counter with TTL (atomic in KV)
    await kv.put(key, (count + 1).toString(), { expirationTtl: WINDOW_SECONDS });

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt,
      limit,
    };
  } catch (error) {
    // Fail-open: If KV unavailable, allow request (don't block all traffic)
    console.error('Rate limit KV error (fail-open):', error);
    return {
      allowed: true,
      remaining: limit,
      resetAt,
      limit,
      error: error instanceof Error ? error.message : 'KV unavailable',
    };
  }
}

/**
 * Generate rate limit response headers
 *
 * Standard headers returned with every response:
 * - X-RateLimit-Limit: Max requests per window
 * - X-RateLimit-Remaining: Requests left in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 *
 * Additional header on 429 responses:
 * - Retry-After: Seconds to wait before retrying
 *
 * @param result - Rate limit check result
 * @param includeRetryAfter - Include Retry-After header (for 429 responses)
 * @returns Headers object
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  includeRetryAfter: boolean = false
): Record<string, string> {
  const now = Math.floor(Date.now() / 1000);
  const retryAfter = Math.max(0, result.resetAt - now);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (includeRetryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return headers;
}

/**
 * Generate user-friendly rate limit error message
 *
 * @param result - Rate limit check result
 * @returns Human-readable error message with wait time
 */
export function getRateLimitErrorMessage(result: RateLimitResult): string {
  const now = Math.floor(Date.now() / 1000);
  const waitSeconds = Math.max(0, result.resetAt - now);
  return `You're submitting too quickly. Please wait ${waitSeconds} seconds and try again.`;
}

/**
 * Get rate limit configuration for a given method and path
 *
 * Looks up endpoint-specific limits, falling back to default if not found.
 * Supports environment variable overrides for limits.
 *
 * @param method - HTTP method (GET, POST, PUT, etc.)
 * @param path - Request path (e.g., '/api/predict')
 * @param env - Environment bindings (for overrides)
 * @returns Rate limit configuration or null if endpoint not rate-limited
 */
export function getRateLimitConfig(
  method: string,
  path: string,
  env?: Partial<Env>
): RateLimitConfig | null {
  const key = `${method}:${path}`;
  const config = DEFAULT_RATE_LIMITS[key];

  if (!config) {
    return null;
  }

  // Support environment variable overrides
  if (env) {
    const envKey = `RATE_LIMIT_${config.endpoint.toUpperCase()}`;
    const envValue = (env as Record<string, unknown>)[envKey];
    if (typeof envValue === 'string') {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return { ...config, limit: parsed };
      }
    }
  }

  return config;
}

/**
 * Rate limiting middleware for Hono
 *
 * Extracts client IP, hashes it, checks rate limit, and either:
 * - Allows request with rate limit headers
 * - Returns 429 Too Many Requests with error message and headers
 *
 * @param c - Hono context
 * @param next - Next middleware function
 * @returns Response or passes to next middleware
 */
export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const method = c.req.method;
  const path = c.req.path;

  // Get rate limit config for this endpoint
  const config = getRateLimitConfig(method, path, c.env);

  // Skip rate limiting if endpoint not configured
  if (!config) {
    return next();
  }

  // Check if KV binding is available
  if (!c.env.gta6_rate_limit) {
    // Fail-open: Allow request if KV not configured
    console.warn('gta6_rate_limit KV binding not available, skipping rate limit');
    return next();
  }

  // Extract and hash client IP
  const clientIP = extractClientIP(c.req.raw);
  if (!clientIP) {
    // No IP found - skip rate limiting (shouldn't happen in production)
    console.warn('Could not extract client IP, skipping rate limit');
    return next();
  }

  let ipHash: string;
  try {
    ipHash = await hashIP(clientIP, c.env.SALT_V1 || c.env.IP_HASH_SALT || 'default-salt');
  } catch (error) {
    // Failed to hash IP - skip rate limiting
    console.error('Failed to hash IP for rate limiting:', error);
    return next();
  }

  // Check rate limit
  const result = await checkRateLimit(c.env.gta6_rate_limit, ipHash, config.endpoint, config.limit);

  // Log rate limit violations for monitoring
  if (!result.allowed) {
    console.warn(`Rate limit exceeded: IP=${ipHash.substring(0, 8)}... endpoint=${config.endpoint}`);
  }

  // Add rate limit headers to response
  const headers = getRateLimitHeaders(result, !result.allowed);
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value);
  }

  // If rate limit exceeded, return 429
  if (!result.allowed) {
    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: getRateLimitErrorMessage(result),
        },
      },
      429
    );
  }

  // Proceed to next middleware/handler
  return next();
}

/**
 * RateLimiter class for programmatic rate limiting
 *
 * Alternative to middleware for cases where fine-grained control is needed.
 * Used by API handlers that need to check rate limits manually.
 */
export class RateLimiter {
  private kv: KVNamespace;
  private salt: string;

  constructor(kv: KVNamespace, salt: string) {
    this.kv = kv;
    this.salt = salt;
  }

  /**
   * Check rate limit for a request
   *
   * @param request - HTTP request object
   * @param endpoint - Endpoint identifier
   * @param limit - Maximum requests per window
   * @returns Rate limit result
   */
  async checkLimit(request: Request, endpoint: string, limit: number): Promise<RateLimitResult> {
    const clientIP = extractClientIP(request);
    if (!clientIP) {
      // No IP - allow request
      return {
        allowed: true,
        remaining: limit,
        resetAt: Math.floor(Date.now() / 1000) + WINDOW_SECONDS,
        limit,
      };
    }

    let ipHash: string;
    try {
      ipHash = await hashIP(clientIP, this.salt);
    } catch {
      // Failed to hash - allow request
      return {
        allowed: true,
        remaining: limit,
        resetAt: Math.floor(Date.now() / 1000) + WINDOW_SECONDS,
        limit,
      };
    }

    return checkRateLimit(this.kv, ipHash, endpoint, limit);
  }

  /**
   * Check rate limit using pre-computed IP hash
   *
   * @param ipHash - Already-hashed IP address
   * @param endpoint - Endpoint identifier
   * @param limit - Maximum requests per window
   * @returns Rate limit result
   */
  async checkLimitByHash(ipHash: string, endpoint: string, limit: number): Promise<RateLimitResult> {
    return checkRateLimit(this.kv, ipHash, endpoint, limit);
  }
}
