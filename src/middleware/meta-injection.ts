/**
 * Meta Injection Middleware - Stories 5.3 & 5.4
 *
 * Server-side injection of dynamic Open Graph, SEO, and Schema.org meta tags into HTML responses.
 * Enables rich social previews when links are shared on Twitter, Facebook, LinkedIn, etc.
 * Provides SEO optimization and structured data for search engines.
 *
 * Features:
 * - Dynamic OG tags with current median/total from /api/stats (Story 5.3)
 * - Personalized meta tags when ?u={hash} parameter present (FR23)
 * - SEO meta tags (title, description, keywords) - FR35, FR36
 * - Schema.org VideoGame structured data - FR37
 * - Schema.org Event structured data - FR38
 * - 5-minute cache TTL (aligns with stats API cache)
 * - Only processes HTML responses (checks Content-Type)
 * - Sanitizes all data to prevent XSS
 * - Graceful fallback if stats API fails
 *
 * @see docs/architecture.md - ADR-007: Dynamic Meta Tags via Workers Middleware
 * @see docs/sprint-artifacts/tech-spec-epic-5.md - MetaInjectionMiddleware
 */

import { Context, Next } from 'hono';
import type { Env, PersonalizedMetaData } from '../types';
import dayjs from 'dayjs';
import { getStatisticsWithCache, STATS_CACHE_KEY, STATS_CACHE_TTL } from '../services/statistics.service';

/**
 * Cache key for meta injection (5-minute TTL)
 */
const META_CACHE_PREFIX = 'meta_injection:';
const META_CACHE_TTL = 300; // 5 minutes (same as stats API)

/**
 * Default fallback stats if API fails
 */
const FALLBACK_STATS = {
  median: '2027-03-15',
  count: 0,
};

/**
 * Escape HTML entities to prevent XSS in meta tags
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format date for display in meta tags
 */
function formatDateForDisplay(isoDate: string): string {
  return dayjs(isoDate).format('MMM D, YYYY');
}

/**
 * Format number with commas (e.g., 10234 -> "10,234")
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Look up user prediction by cookie_id hash from database
 * Used for personalized meta tags (FR23)
 */
async function lookupUserPrediction(
  db: D1Database,
  cookieHash: string
): Promise<{ predicted_date: string } | null> {
  try {
    const result = await db
      .prepare('SELECT predicted_date FROM predictions WHERE cookie_id = ? LIMIT 1')
      .bind(cookieHash)
      .first<{ predicted_date: string }>();

    return result || null;
  } catch (error) {
    console.error('Error looking up user prediction:', error);
    return null;
  }
}

/**
 * Calculate delta days and sentiment for personalized meta tags
 */
function calculatePersonalization(userDate: string, medianDate: string): PersonalizedMetaData {
  const userDayjs = dayjs(userDate);
  const medianDayjs = dayjs(medianDate);
  const deltaDays = userDayjs.diff(medianDayjs, 'day');

  let sentiment: 'optimistic' | 'pessimistic' | 'aligned';
  if (deltaDays > 7) {
    sentiment = 'pessimistic'; // Later than median = pessimistic
  } else if (deltaDays < -7) {
    sentiment = 'optimistic'; // Earlier than median = optimistic
  } else {
    sentiment = 'aligned'; // Within 7 days = aligned
  }

  return {
    userDate,
    deltaDays: Math.abs(deltaDays),
    sentiment,
  };
}

/**
 * Generate SEO meta tags HTML (Story 5.4: FR35, FR36)
 */
function generateSEOTags(
  stats: { median: string; count: number; min?: string; max?: string },
  url: string
): string {
  const medianFormatted = formatDateForDisplay(stats.median);
  const countFormatted = formatNumber(stats.count);

  // FR35: Meta title optimized for "GTA 6 predictions"
  const title = escapeHtml('GTA 6 Launch Date Predictions - Community Sentiment Tracker');

  // FR36: Meta description with dynamic median and total count
  const description = escapeHtml(
    `Track community predictions for GTA 6's launch date. Submit your prediction and see what ${countFormatted} other fans think. Current median: ${medianFormatted}.`
  );

  // Keywords (optional, low SEO value per modern SEO best practices)
  const keywords = escapeHtml('GTA 6, launch date, predictions, community, Rockstar, Grand Theft Auto 6');

  // Canonical URL (must be absolute)
  const baseUrl = new URL(url).origin;
  const canonicalUrl = escapeHtml(`${baseUrl}/`);

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
  `.trim();
}

/**
 * Generate Schema.org VideoGame structured data (Story 5.4: FR37)
 */
function generateSchemaVideoGame(
  stats: { median: string; count: number; min?: string; max?: string }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Grand Theft Auto VI',
    gamePlatform: ['PlayStation 5', 'Xbox Series X'],
    publisher: {
      '@type': 'Organization',
      name: 'Rockstar Games',
    },
    datePublished: 'TBD',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stats.median,
      ratingCount: stats.count,
      bestRating: stats.max || '2099-01-01',
      worstRating: stats.min || '2025-12-01',
    },
  };
}

/**
 * Generate Schema.org Event structured data (Story 5.4: FR38)
 */
function generateSchemaEvent(stats: { median: string }): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'GTA 6 Launch Date',
    startDate: stats.median,
    location: {
      '@type': 'VirtualLocation',
      url: 'https://rockstargames.com',
    },
    organizer: {
      '@type': 'Organization',
      name: 'Rockstar Games',
    },
  };
}

/**
 * Generate Open Graph meta tags HTML
 */
function generateOGTags(
  stats: { median: string; count: number },
  url: string,
  personalized?: PersonalizedMetaData
): string {
  const baseUrl = new URL(url).origin;
  // Use PNG for Twitter compatibility (Twitter doesn't support SVG)
  // SVG version available at og-image.svg for platforms that support it
  const ogImageUrl = `${baseUrl}/images/og-image.png`;

  let ogTitle: string;
  let ogDescription: string;
  let twitterTitle: string;
  let twitterDescription: string;

  if (personalized) {
    // Personalized meta tags (FR23)
    const userDateFormatted = formatDateForDisplay(personalized.userDate);
    const medianFormatted = formatDateForDisplay(stats.median);

    ogTitle = escapeHtml(`I predicted GTA 6 will launch on ${userDateFormatted}`);

    const sentimentText =
      personalized.sentiment === 'optimistic'
        ? `I'm ${personalized.deltaDays} days more optimistic`
        : personalized.sentiment === 'pessimistic'
          ? `I'm ${personalized.deltaDays} days more pessimistic`
          : "I'm aligned with the community";

    ogDescription = escapeHtml(
      `The community median is ${medianFormatted}. ${sentimentText}. What do you think?`
    );

    twitterTitle = ogTitle;
    twitterDescription = escapeHtml(
      `Community median: ${medianFormatted} (${formatNumber(stats.count)} predictions)`
    );
  } else {
    // Default meta tags
    const medianFormatted = formatDateForDisplay(stats.median);
    const countFormatted = formatNumber(stats.count);

    ogTitle = escapeHtml('GTA 6 Launch Date Predictions - Community Sentiment');
    ogDescription = escapeHtml(
      `The community predicts GTA 6 will launch on ${medianFormatted} (median of ${countFormatted} predictions). What do you think?`
    );

    twitterTitle = escapeHtml('GTA 6 Launch Date Predictions');
    twitterDescription = escapeHtml(
      `Community median: ${medianFormatted} (${countFormatted} predictions)`
    );
  }

  // Generate meta tags HTML
  return `
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${twitterTitle}" />
    <meta name="twitter:description" content="${twitterDescription}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
  `.trim();
}

/**
 * Fetch stats from statistics service with caching
 * Story 5.4: Extended to include min/max for Schema.org aggregateRating
 * Uses the same statistics service and KV cache as /api/stats endpoint
 */
async function fetchStats(
  c: Context<{ Bindings: Env }>
): Promise<{ median: string; count: number; min?: string; max?: string }> {
  try {
    // Use the statistics service with KV cache (same as /api/stats)
    const { stats } = await getStatisticsWithCache(
      c.env.DB,
      c.env.gta6_stats_cache,
      STATS_CACHE_KEY,
      STATS_CACHE_TTL
    );

    // Return stats in the format expected by meta tag generation
    if (stats && stats.median && stats.count >= 0) {
      return {
        median: stats.median,
        count: stats.count,
        min: stats.min,
        max: stats.max,
      };
    }

    // Fallback to hardcoded default if no stats available
    return FALLBACK_STATS;
  } catch (error) {
    console.error('Error fetching stats for meta injection:', error);
    return FALLBACK_STATS;
  }
}

/**
 * Meta Injection Middleware
 *
 * Intercepts HTML responses and injects dynamic Open Graph meta tags.
 * Only processes HTML Content-Type. Caches generated tags for 5 minutes.
 *
 * @param c Hono context
 * @param next Next middleware
 */
export async function metaInjectionMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<void> {
  // Call next middleware first to get response
  await next();

  // Only process HTML responses
  const contentType = c.res.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return;
  }

  const startTime = Date.now();

  try {
    // Get request URL
    const url = c.req.url;

    // Optional: Only inject for social crawlers (optimization)
    // For MVP, inject for all HTML requests to ensure consistency
    // const userAgent = c.req.header('user-agent') || null;
    // const isCrawler = isSocialCrawler(userAgent);
    // if (!isCrawler) {
    //   return;
    // }

    // Check for ?u={hash} parameter for personalized meta tags
    const urlObj = new URL(url);
    const userHash = urlObj.searchParams.get('u');

    // Build cache key
    const cacheKey = `${META_CACHE_PREFIX}${userHash || 'default'}`;

    // Try to get cached meta tags from KV
    let metaTags: string | null = null;
    if (c.env.gta6_stats_cache) {
      metaTags = await c.env.gta6_stats_cache.get(cacheKey);
    }

    if (!metaTags) {
      // Cache miss - generate meta tags
      const stats = await fetchStats(c);

      let personalized: PersonalizedMetaData | undefined;

      if (userHash) {
        // Look up user prediction for personalization
        const userPrediction = await lookupUserPrediction(c.env.DB, userHash);
        if (userPrediction) {
          personalized = calculatePersonalization(userPrediction.predicted_date, stats.median);
        }
      }

      // Generate all meta tags (OG, SEO, Schema.org)
      const ogTags = generateOGTags(stats, url, personalized);
      const seoTags = generateSEOTags(stats, url);
      const schemaVideoGame = generateSchemaVideoGame(stats);
      const schemaEvent = generateSchemaEvent(stats);

      // Generate JSON-LD script tags for Schema.org
      const schemaVideoGameScript = `<script type="application/ld+json">${JSON.stringify(schemaVideoGame, null, 2)}</script>`;
      const schemaEventScript = `<script type="application/ld+json">${JSON.stringify(schemaEvent, null, 2)}</script>`;

      // Combine all meta tags
      metaTags = `${seoTags}\n${ogTags}\n${schemaVideoGameScript}\n${schemaEventScript}`;

      // Cache generated meta tags
      if (c.env.gta6_stats_cache) {
        await c.env.gta6_stats_cache.put(cacheKey, metaTags, { expirationTtl: META_CACHE_TTL });
      }

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          event: 'meta_injection',
          cache_hit: false,
          personalized: !!personalized,
          duration_ms: Date.now() - startTime,
        })
      );
    } else {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          event: 'meta_injection',
          cache_hit: true,
          duration_ms: Date.now() - startTime,
        })
      );
    }

    // Get HTML body
    const html = await c.res.text();

    // Inject meta tags before </head>
    const modifiedHtml = html.replace('</head>', `${metaTags}\n  </head>`);

    // Replace response with modified HTML
    c.res = new Response(modifiedHtml, {
      status: c.res.status,
      headers: c.res.headers,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        event: 'meta_injection_error',
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startTime,
      })
    );
    // Don't block page load on meta injection errors
    // Original HTML is served without dynamic tags
  }
}
