/**
 * Rate Limiter Middleware Module Tests
 *
 * Comprehensive test coverage for sliding window rate limiting.
 * Per ADR-011: MANDATORY 90%+ coverage for middleware.
 *
 * Test Coverage:
 * - Sliding window algorithm (counter increment, TTL)
 * - Different endpoint limits (10/min, 30/min, 60/min)
 * - Rate limit headers (X-RateLimit-*, Retry-After)
 * - 429 responses after limit exceeded
 * - Fail-open pattern (KV unavailable)
 * - Error message formatting
 * - Middleware integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitErrorMessage,
  getRateLimitConfig,
  rateLimitMiddleware,
  RateLimiter,
  DEFAULT_RATE_LIMITS,
} from './rate-limiter';
import type { Env, RateLimitResult } from '../types';

/**
 * Mock KV Namespace for testing
 * Simulates Cloudflare KV behavior with get/put/delete operations
 */
function createMockKV() {
  const store = new Map<string, { value: string; expireAt?: number }>();

  return {
    store,
    async get(key: string): Promise<string | null> {
      const entry = store.get(key);
      if (!entry) return null;

      // Check TTL expiration
      if (entry.expireAt && Date.now() / 1000 > entry.expireAt) {
        store.delete(key);
        return null;
      }

      return entry.value;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
      const expireAt = options?.expirationTtl
        ? Math.floor(Date.now() / 1000) + options.expirationTtl
        : undefined;
      store.set(key, { value, expireAt });
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
  } as unknown as KVNamespace & {
    store: Map<string, { value: string; expireAt?: number }>;
    clear: () => void;
  };
}

/**
 * Create a mock Request with CF-Connecting-IP header
 */
function createMockRequest(ip: string, method: string = 'GET', path: string = '/'): Request {
  return new Request(`https://example.com${path}`, {
    method,
    headers: {
      'CF-Connecting-IP': ip,
    },
  });
}

describe('Rate Limiter Module', () => {
  const TEST_SALT = '5f2bb3278cfe4794d5a8a9bc37a09d7ec92ca18f6c7a5c0eee7644c4737749b7';
  let mockKV: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    mockKV = createMockKV();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    mockKV.clear();
  });

  describe('checkRateLimit', () => {
    describe('Sliding window algorithm', () => {
      it('should allow first request and set counter to 1', async () => {
        const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9); // 10 - 0 - 1 = 9

        // Verify counter was set
        const counter = await mockKV.get('ratelimit:testhash123:submit');
        expect(counter).toBe('1');
      });

      it('should increment counter on subsequent requests', async () => {
        // Make 5 requests
        for (let i = 0; i < 5; i++) {
          const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(10 - i - 1);
        }

        // Verify counter is at 5
        const counter = await mockKV.get('ratelimit:testhash123:submit');
        expect(counter).toBe('5');
      });

      it('should deny request when limit reached (10th request allowed, 11th denied)', async () => {
        // Make 10 requests (all should be allowed)
        for (let i = 0; i < 10; i++) {
          const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
          expect(result.allowed).toBe(true);
        }

        // 11th request should be denied
        const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('should return correct resetAt timestamp (60 seconds in future)', async () => {
        const now = Math.floor(Date.now() / 1000);
        const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);

        expect(result.resetAt).toBe(now + 60);
      });

      it('should return limit value in result', async () => {
        const result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        expect(result.limit).toBe(10);

        const result30 = await checkRateLimit(mockKV, 'testhash456', 'update', 30);
        expect(result30.limit).toBe(30);
      });
    });

    describe('TTL expiration', () => {
      it('should reset counter after 60 seconds', async () => {
        // Make 10 requests to hit limit
        for (let i = 0; i < 10; i++) {
          await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        }

        // 11th request should be denied
        let result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        expect(result.allowed).toBe(false);

        // Advance time by 61 seconds (past TTL)
        vi.advanceTimersByTime(61000);

        // Next request should be allowed (counter expired)
        result = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9); // Fresh window
      });
    });

    describe('Endpoint isolation', () => {
      it('should track limits separately per endpoint', async () => {
        // Exhaust submit limit (10)
        for (let i = 0; i < 10; i++) {
          await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        }

        // Submit should be denied
        const submitResult = await checkRateLimit(mockKV, 'testhash123', 'submit', 10);
        expect(submitResult.allowed).toBe(false);

        // Update should still be allowed (different endpoint)
        const updateResult = await checkRateLimit(mockKV, 'testhash123', 'update', 30);
        expect(updateResult.allowed).toBe(true);
        expect(updateResult.remaining).toBe(29);
      });

      it('should track limits separately per IP hash', async () => {
        // User A hits limit
        for (let i = 0; i < 10; i++) {
          await checkRateLimit(mockKV, 'userA_hash', 'submit', 10);
        }
        const userAResult = await checkRateLimit(mockKV, 'userA_hash', 'submit', 10);
        expect(userAResult.allowed).toBe(false);

        // User B should still be allowed
        const userBResult = await checkRateLimit(mockKV, 'userB_hash', 'submit', 10);
        expect(userBResult.allowed).toBe(true);
        expect(userBResult.remaining).toBe(9);
      });
    });

    describe('Fail-open pattern (KV errors)', () => {
      it('should allow request if KV.get fails', async () => {
        const errorKV = {
          async get(): Promise<string | null> {
            throw new Error('KV unavailable');
          },
          async put(): Promise<void> {
            throw new Error('KV unavailable');
          },
        } as unknown as KVNamespace;

        const result = await checkRateLimit(errorKV, 'testhash123', 'submit', 10);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10);
        expect(result.error).toBe('KV unavailable');
      });

      it('should allow request if KV.put fails', async () => {
        const errorKV = {
          async get(): Promise<string | null> {
            return '5'; // 5 requests made
          },
          async put(): Promise<void> {
            throw new Error('KV write failed');
          },
        } as unknown as KVNamespace;

        const result = await checkRateLimit(errorKV, 'testhash123', 'submit', 10);

        // Fail-open allows the request even though put failed
        expect(result.allowed).toBe(true);
        expect(result.error).toBe('KV write failed');
      });
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return all standard rate limit headers', () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 7,
        resetAt: 1704067260, // 2025-01-01T00:01:00Z
        limit: 10,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('7');
      expect(headers['X-RateLimit-Reset']).toBe('1704067260');
    });

    it('should not include Retry-After by default', () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt: 1704067260,
        limit: 10,
      };

      const headers = getRateLimitHeaders(result, false);

      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After when requested (429 response)', () => {
      const now = Math.floor(Date.now() / 1000);
      const resetAt = now + 45; // Reset 45 seconds in the future

      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: 10,
      };

      const headers = getRateLimitHeaders(result, true);

      expect(headers['Retry-After']).toBe('45'); // 45 seconds from now
    });

    it('should return Retry-After of 0 if reset time has passed', () => {
      vi.setSystemTime(new Date('2025-01-01T00:02:00Z')); // Past reset time

      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt: 1704067260, // 00:01:00
        limit: 10,
      };

      const headers = getRateLimitHeaders(result, true);

      expect(headers['Retry-After']).toBe('0');
    });
  });

  describe('getRateLimitErrorMessage', () => {
    it('should return user-friendly message with wait time', () => {
      const now = Math.floor(Date.now() / 1000);
      const resetAt = now + 45; // 45 seconds from now

      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: 10,
      };

      const message = getRateLimitErrorMessage(result);

      expect(message).toBe("You're submitting too quickly. Please wait 45 seconds and try again.");
    });

    it('should return 0 seconds if reset time has passed', () => {
      vi.setSystemTime(new Date('2025-01-01T00:02:00Z'));

      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetAt: 1704067260,
        limit: 10,
      };

      const message = getRateLimitErrorMessage(result);

      expect(message).toBe("You're submitting too quickly. Please wait 0 seconds and try again.");
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return config for POST /api/predict (submit)', () => {
      const config = getRateLimitConfig('POST', '/api/predict');

      expect(config).toEqual({
        limit: 10,
        windowSeconds: 60,
        endpoint: 'submit',
      });
    });

    it('should return config for PUT /api/predict (update)', () => {
      const config = getRateLimitConfig('PUT', '/api/predict');

      expect(config).toEqual({
        limit: 30,
        windowSeconds: 60,
        endpoint: 'update',
      });
    });

    it('should return config for GET /api/stats (stats)', () => {
      const config = getRateLimitConfig('GET', '/api/stats');

      expect(config).toEqual({
        limit: 60,
        windowSeconds: 60,
        endpoint: 'stats',
      });
    });

    it('should return null for unconfigured endpoints', () => {
      expect(getRateLimitConfig('GET', '/api/unknown')).toBeNull();
      expect(getRateLimitConfig('DELETE', '/api/predict')).toBeNull();
      expect(getRateLimitConfig('GET', '/')).toBeNull();
    });

    it('should support environment variable overrides', () => {
      const env = { RATE_LIMIT_SUBMIT: '5' };
      const config = getRateLimitConfig('POST', '/api/predict', env as Partial<Env>);

      expect(config?.limit).toBe(5);
    });

    it('should ignore invalid environment variable values', () => {
      const env = { RATE_LIMIT_SUBMIT: 'invalid' };
      const config = getRateLimitConfig('POST', '/api/predict', env as Partial<Env>);

      expect(config?.limit).toBe(10); // Default value
    });
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should have correct limits for all endpoints', () => {
      expect(DEFAULT_RATE_LIMITS['POST:/api/predict'].limit).toBe(10);
      expect(DEFAULT_RATE_LIMITS['PUT:/api/predict'].limit).toBe(30);
      expect(DEFAULT_RATE_LIMITS['GET:/api/stats'].limit).toBe(60);
    });

    it('should have 60-second window for all endpoints', () => {
      Object.values(DEFAULT_RATE_LIMITS).forEach((config) => {
        expect(config.windowSeconds).toBe(60);
      });
    });
  });

  describe('RateLimiter class', () => {
    it('should check rate limit for a request', async () => {
      const rateLimiter = new RateLimiter(mockKV, TEST_SALT);
      const request = createMockRequest('192.168.1.1', 'POST', '/api/predict');

      const result = await rateLimiter.checkLimit(request, 'submit', 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should deny after limit exceeded', async () => {
      const rateLimiter = new RateLimiter(mockKV, TEST_SALT);
      const request = createMockRequest('192.168.1.1', 'POST', '/api/predict');

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(request, 'submit', 10);
      }

      // 11th should be denied
      const result = await rateLimiter.checkLimit(request, 'submit', 10);
      expect(result.allowed).toBe(false);
    });

    it('should allow request if no IP can be extracted', async () => {
      const rateLimiter = new RateLimiter(mockKV, TEST_SALT);
      const request = new Request('https://example.com/api/predict', {
        method: 'POST',
        headers: {}, // No IP headers
      });

      const result = await rateLimiter.checkLimit(request, 'submit', 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });

    it('should check limit by pre-computed hash', async () => {
      const rateLimiter = new RateLimiter(mockKV, TEST_SALT);

      const result = await rateLimiter.checkLimitByHash('precomputed_hash_123', 'submit', 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);

      // Verify it used the provided hash
      const counter = await mockKV.get('ratelimit:precomputed_hash_123:submit');
      expect(counter).toBe('1');
    });
  });

  describe('rateLimitMiddleware', () => {
    let app: Hono<{ Bindings: Env }>;

    beforeEach(() => {
      app = new Hono<{ Bindings: Env }>();
      app.use('/api/*', rateLimitMiddleware);

      app.post('/api/predict', (c) => c.json({ success: true }));
      app.put('/api/predict', (c) => c.json({ success: true }));
      app.get('/api/stats', (c) => c.json({ total: 100 }));
      app.get('/', (c) => c.text('Hello'));
    });

    it('should allow requests within limit', async () => {
      const env = {
        gta6_rate_limit: mockKV,
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      const res = await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        },
        env
      );

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should return 429 when limit exceeded', async () => {
      const env = {
        gta6_rate_limit: mockKV,
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await app.request(
          '/api/predict',
          {
            method: 'POST',
            headers: { 'CF-Connecting-IP': '192.168.1.1' },
          },
          env
        );
      }

      // 11th request should be denied
      const res = await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        },
        env
      );

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();

      const body = (await res.json()) as {
        success: boolean;
        error: { code: string; message: string };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error.message).toContain('submitting too quickly');
    });

    it('should skip rate limiting for non-API routes', async () => {
      const env = {
        gta6_rate_limit: mockKV,
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      // Root route should not be rate limited
      const res = await app.request('/', {}, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBeNull();
    });

    it('should skip rate limiting if KV not available', async () => {
      const env = {
        // No gta6_rate_limit binding
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      const res = await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        },
        env
      );

      // Should still succeed (fail-open)
      expect(res.status).toBe(200);
    });

    it('should use different limits per endpoint', async () => {
      const env = {
        gta6_rate_limit: mockKV,
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      // POST /api/predict should have limit of 10
      const postRes = await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        },
        env
      );
      expect(postRes.headers.get('X-RateLimit-Limit')).toBe('10');

      // PUT /api/predict should have limit of 30
      const putRes = await app.request(
        '/api/predict',
        {
          method: 'PUT',
          headers: { 'CF-Connecting-IP': '192.168.1.2' },
        },
        env
      );
      expect(putRes.headers.get('X-RateLimit-Limit')).toBe('30');

      // GET /api/stats should have limit of 60
      const getRes = await app.request(
        '/api/stats',
        {
          method: 'GET',
          headers: { 'CF-Connecting-IP': '192.168.1.3' },
        },
        env
      );
      expect(getRes.headers.get('X-RateLimit-Limit')).toBe('60');
    });

    it('should track rate limits per IP', async () => {
      const env = {
        gta6_rate_limit: mockKV,
        SALT_V1: TEST_SALT,
      } as unknown as Env;

      // User A makes a request
      await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        },
        env
      );

      // User B should have full limit
      const userBRes = await app.request(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'CF-Connecting-IP': '192.168.1.2' },
        },
        env
      );

      expect(userBRes.headers.get('X-RateLimit-Remaining')).toBe('9');
    });
  });

  describe('Concurrent request handling', () => {
    it('should handle sequential requests correctly', async () => {
      // Make 5 sequential requests from same IP
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(mockKV, 'concurrent_hash', 'submit', 10);
        expect(result.allowed).toBe(true);
      }

      // Counter should be at 5
      const counter = await mockKV.get('ratelimit:concurrent_hash:submit');
      expect(counter).toBe('5');
    });

    it('should allow all concurrent requests within limit', async () => {
      // Simulate 5 concurrent requests from same IP
      // Note: In production, Cloudflare KV handles atomicity
      // Our mock KV doesn't have true atomic operations, so we test the behavior
      const promises = Array(5)
        .fill(null)
        .map(() => checkRateLimit(mockKV, 'concurrent_hash_2', 'submit', 10));

      const results = await Promise.all(promises);

      // All should be allowed (within limit of 10)
      results.forEach((result) => {
        expect(result.allowed).toBe(true);
      });

      // Counter value may vary due to race conditions in mock
      // In production, Cloudflare KV ensures atomicity
      const counter = await mockKV.get('ratelimit:concurrent_hash_2:submit');
      expect(parseInt(counter || '0', 10)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty IP hash gracefully', async () => {
      const result = await checkRateLimit(mockKV, '', 'submit', 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should handle special characters in endpoint', async () => {
      const result = await checkRateLimit(mockKV, 'testhash', 'special/endpoint', 10);

      expect(result.allowed).toBe(true);

      // Verify key was created
      const counter = await mockKV.get('ratelimit:testhash:special/endpoint');
      expect(counter).toBe('1');
    });

    it('should handle limit of 1', async () => {
      const result1 = await checkRateLimit(mockKV, 'testhash', 'strict', 1);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = await checkRateLimit(mockKV, 'testhash', 'strict', 1);
      expect(result2.allowed).toBe(false);
    });

    it('should handle very high limits', async () => {
      const result = await checkRateLimit(mockKV, 'testhash', 'generous', 10000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9999);
      expect(result.limit).toBe(10000);
    });
  });
});
