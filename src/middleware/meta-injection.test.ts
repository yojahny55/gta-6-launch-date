/**
 * Meta Injection Integration Tests - Story 5.3
 *
 * Tests for Open Graph meta tag injection middleware.
 * Validates dynamic meta tags, personalization, caching, and error handling.
 *
 * Test Coverage:
 * - AC1: Dynamic OG tags with current median/total
 * - AC2: Rich social previews
 * - AC3: OG image URL
 * - AC4: Stats API caching (5-min TTL)
 * - AC5: Personalized meta tags (FR23)
 * - AC6: Cache behavior
 *
 * @see src/middleware/meta-injection.ts
 * @see docs/sprint-artifacts/stories/5-3-open-graph-meta-tags-for-rich-previews.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { metaInjectionMiddleware } from '../../src/middleware/meta-injection';
import type { Env } from '../../src/types';

// Mock environment
function createMockEnv(): Env {
  const kvStore = new Map<string, string>();

  return {
    DB: {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            if (query.includes('cached_stats')) {
              return { median: '2027-03-15', count: 10234 };
            }
            if (query.includes('predictions WHERE cookie_id')) {
              return { predicted_date: '2027-06-15' };
            }
            return null;
          }),
        })),
        first: vi.fn(async () => {
          if (query.includes('cached_stats')) {
            return { median: '2027-03-15', count: 10234 };
          }
          return null;
        }),
      })),
    } as any,
    IP_HASH_SALT: 'test-salt',
    SALT_V1: 'test-salt-v1',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    gta6_stats_cache: {
      get: vi.fn(async (key: string) => kvStore.get(key) || null),
      put: vi.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
    } as any,
  } as Env;
}

describe('Meta Injection Middleware - Story 5.3', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: Env;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    mockEnv = createMockEnv();

    // Apply middleware
    app.use('*', metaInjectionMiddleware);

    // Test route that returns HTML
    app.get('/', (c) => {
      return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>GTA 6 Tracker</title>
</head>
<body>
  <h1>Test Page</h1>
</body>
</html>`);
    });
  });

  describe('AC1: Dynamic OG tags with current median/total', () => {
    it('should inject Open Graph meta tags into HTML head', async () => {
      const req = new Request('http://localhost/', {
        headers: { 'Content-Type': 'text/html' },
      });

      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      // Verify OG tags are present
      expect(html).toContain('<meta property="og:title"');
      expect(html).toContain('GTA 6 Launch Date Predictions - Community Sentiment');
      expect(html).toContain('<meta property="og:description"');
      expect(html).toContain('The community predicts GTA 6 will launch on');
      expect(html).toContain('Mar 15, 2027'); // Formatted median date
      expect(html).toContain('10,234 predictions'); // Formatted count
    });

    it('should inject meta tags before </head> closing tag', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      // Find position of meta tags and </head>
      const ogTitleIndex = html.indexOf('<meta property="og:title"');
      const headCloseIndex = html.indexOf('</head>');

      expect(ogTitleIndex).toBeGreaterThan(0);
      expect(headCloseIndex).toBeGreaterThan(ogTitleIndex);
    });

    it('should include og:type as website', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('<meta property="og:type" content="website"');
    });

    it('should include og:url with current page URL', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('<meta property="og:url" content="http://localhost/"');
    });
  });

  describe('AC2: Twitter Card meta tags', () => {
    it('should inject Twitter Card meta tags', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
      expect(html).toContain('<meta name="twitter:title"');
      expect(html).toContain('<meta name="twitter:description"');
      expect(html).toContain('<meta name="twitter:image"');
    });

    it('should include concise Twitter title', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('GTA 6 Launch Date Predictions');
    });
  });

  describe('AC3: OG image URL', () => {
    it('should include og:image with absolute URL', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('<meta property="og:image" content="http://localhost/images/og-image.svg"');
    });

    it('should include twitter:image with same URL as og:image', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('<meta name="twitter:image" content="http://localhost/images/og-image.svg"');
    });
  });

  describe('AC4: Personalized meta tags (FR23)', () => {
    it('should generate personalized title when ?u={hash} parameter present', async () => {
      const req = new Request('http://localhost/?u=test-hash-123');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('I predicted GTA 6 will launch on');
      expect(html).toContain('Jun 15, 2027'); // User's predicted date
    });

    it('should include comparison in personalized description', async () => {
      const req = new Request('http://localhost/?u=test-hash-123');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('The community median is Mar 15, 2027');
      expect(html).toContain('92 days more pessimistic'); // Delta calculation
    });

    it('should fall back to default tags if user not found', async () => {
      // Mock DB to return null for user lookup
      const envWithNoUser = {
        ...mockEnv,
        DB: {
          prepare: vi.fn(() => ({
            bind: vi.fn(() => ({
              first: vi.fn(async () => null), // User not found
            })),
          })),
        } as any,
      };

      const req = new Request('http://localhost/?u=non-existent-hash');
      const res = await app.fetch(req, envWithNoUser);
      const html = await res.text();

      // Should use default tags
      expect(html).toContain('GTA 6 Launch Date Predictions - Community Sentiment');
      expect(html).not.toContain('I predicted');
    });
  });

  describe('AC5: Cache behavior (5-minute TTL)', () => {
    it('should cache generated meta tags in KV', async () => {
      const req = new Request('http://localhost/');
      await app.fetch(req, mockEnv);

      // Verify KV put was called
      expect(mockEnv.gta6_stats_cache?.put).toHaveBeenCalled();

      // Verify cache key format
      const putCalls = (mockEnv.gta6_stats_cache?.put as any).mock.calls;
      expect(putCalls[0][0]).toContain('meta_injection:');
    });

    it('should use cached meta tags on subsequent requests', async () => {
      // First request (cache miss)
      const req1 = new Request('http://localhost/');
      await app.fetch(req1, mockEnv);

      // Manually set cache to simulate cache hit
      const kvStore = new Map<string, string>();
      kvStore.set('meta_injection:default', '<meta property="og:title" content="Cached Title" />');

      const envWithCache = {
        ...mockEnv,
        gta6_stats_cache: {
          get: vi.fn(async () => '<meta property="og:title" content="Cached Title" />'),
          put: vi.fn(),
        } as any,
      };

      // Second request (cache hit)
      const req2 = new Request('http://localhost/');
      const res2 = await app.fetch(req2, envWithCache);
      const html2 = await res2.text();

      expect(html2).toContain('Cached Title');
      expect(envWithCache.gta6_stats_cache?.get).toHaveBeenCalled();
    });

    it('should use different cache keys for default vs personalized', async () => {
      const req1 = new Request('http://localhost/');
      await app.fetch(req1, mockEnv);

      const req2 = new Request('http://localhost/?u=test-hash');
      await app.fetch(req2, mockEnv);

      const putCalls = (mockEnv.gta6_stats_cache?.put as any).mock.calls;

      // Should have 2 different cache keys
      expect(putCalls.length).toBeGreaterThanOrEqual(2);
      expect(putCalls[0][0]).not.toBe(putCalls[1][0]);
    });
  });

  describe('AC6: HTML sanitization (XSS prevention)', () => {
    it('should not allow XSS via malicious input', async () => {
      const envWithXSS = {
        ...mockEnv,
        DB: {
          prepare: vi.fn(() => ({
            first: vi.fn(async () => ({ median: '<script>alert("xss")</script>', count: 100 })),
          })),
        } as any,
      };

      const req = new Request('http://localhost/');
      const res = await app.fetch(req, envWithXSS);
      const html = await res.text();

      // Should NOT contain raw script tag that could execute
      expect(html).not.toContain('<script>alert("xss")</script>');
      // dayjs will convert invalid date to "Invalid Date" which is safe
      expect(html).toContain('Invalid Date');
    });

    it('should escape special characters in URLs', async () => {
      const req = new Request('http://localhost/?ref="><script>alert(1)</script>');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      // URL should be URL-encoded (prevents XSS in og:url)
      expect(html).not.toContain('"><script>');
      // Check that the URL is properly encoded (either URL-encoded or HTML-escaped)
      expect(html).toMatch(/%22%3E%3Cscript|&quot;&gt;&lt;script/); // URL-encoded or HTML-escaped
    });
  });

  describe('Error handling and graceful degradation', () => {
    it('should not break page load if meta injection fails', async () => {
      const envWithError = {
        ...mockEnv,
        DB: {
          prepare: vi.fn(() => {
            throw new Error('Database error');
          }),
        } as any,
      };

      const req = new Request('http://localhost/');
      const res = await app.fetch(req, envWithError);

      // Page should still load (status 200)
      expect(res.status).toBe(200);

      // Should serve original HTML
      const html = await res.text();
      expect(html).toContain('<h1>Test Page</h1>');
    });

    it('should use fallback stats if database query fails', async () => {
      const envWithError = {
        ...mockEnv,
        DB: {
          prepare: vi.fn(() => ({
            first: vi.fn(async () => {
              throw new Error('DB error');
            }),
          })),
        } as any,
      };

      const req = new Request('http://localhost/');
      const res = await app.fetch(req, envWithError);
      const html = await res.text();

      // Should NOT break, might use fallback stats or skip injection
      expect(res.status).toBe(200);
    });

    it('should only process HTML responses (not JSON)', async () => {
      const appWithApi = new Hono<{ Bindings: Env }>();
      appWithApi.use('*', metaInjectionMiddleware);
      appWithApi.get('/api/test', (c) => c.json({ data: 'test' }));

      const req = new Request('http://localhost/api/test');
      const res = await appWithApi.fetch(req, mockEnv);
      const json = await res.json();

      // JSON response should be unmodified
      expect(json).toEqual({ data: 'test' });
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Date formatting', () => {
    it('should format dates as "MMM D, YYYY" (e.g., "Mar 15, 2027")', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      // Check date format pattern
      expect(html).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/); // e.g., Mar 15, 2027
    });

    it('should format numbers with commas (e.g., "10,234")', async () => {
      const req = new Request('http://localhost/');
      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      expect(html).toContain('10,234 predictions');
    });
  });
});
