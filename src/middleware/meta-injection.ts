/**
 * Meta Injection Middleware - Story 5.3
 *
 * Server-side injection of dynamic Open Graph meta tags into HTML responses.
 * Enables rich social previews when links are shared on Twitter, Facebook, LinkedIn, etc.
 *
 * Features:
 * - Dynamic OG tags with current median/total from /api/stats
 * - Personalized meta tags when ?u={hash} parameter present (FR23)
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
function calculatePersonalization(
  userDate: string,
  medianDate: string
): PersonalizedMetaData {
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
 * Generate Open Graph meta tags HTML
 */
function generateOGTags(
  stats: { median: string; count: number },
  url: string,
  personalized?: PersonalizedMetaData
): string {
  const baseUrl = new URL(url).origin;
  // TODO: Convert SVG to PNG for production (social platforms prefer PNG)
  // For now, using SVG which works on most platforms
  const ogImageUrl = `${baseUrl}/images/og-image.svg`;

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
    twitterDescription = escapeHtml(`Community median: ${medianFormatted} (${formatNumber(stats.count)} predictions)`);
  } else {
    // Default meta tags
    const medianFormatted = formatDateForDisplay(stats.median);
    const countFormatted = formatNumber(stats.count);

    ogTitle = escapeHtml('GTA 6 Launch Date Predictions - Community Sentiment');
    ogDescription = escapeHtml(
      `The community predicts GTA 6 will launch on ${medianFormatted} (median of ${countFormatted} predictions). What do you think?`
    );

    twitterTitle = escapeHtml('GTA 6 Launch Date Predictions');
    twitterDescription = escapeHtml(`Community median: ${medianFormatted} (${countFormatted} predictions)`);
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
 * Fetch stats from /api/stats endpoint with caching
 */
async function fetchStats(c: Context<{ Bindings: Env }>): Promise<{ median: string; count: number }> {
  try {
    // Call internal /api/stats endpoint (uses existing cache)
    const response = await c.env.DB.prepare(
      'SELECT median_date as median, total_predictions as count FROM cached_stats WHERE id = 1'
    ).first<{ median: string; count: number }>();

    if (response && response.median && response.count >= 0) {
      return {
        median: response.median,
        count: response.count,
      };
    }

    // Fallback to hardcoded default
    return FALLBACK_STATS;
  } catch (error) {
    console.error('Error fetching stats for meta injection:', error);
    return FALLBACK_STATS;
  }
}

/**
 * Check if request is from a social crawler
 * Optimizes cache by only injecting for crawlers (currently unused, kept for future optimization)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isSocialCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const crawlers = [
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'whatsapp',
    'telegrambot',
    'pinterestbot',
    'redditbot',
  ];

  const lowerUA = userAgent.toLowerCase();
  return crawlers.some((crawler) => lowerUA.includes(crawler));
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

      metaTags = generateOGTags(stats, url, personalized);

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
