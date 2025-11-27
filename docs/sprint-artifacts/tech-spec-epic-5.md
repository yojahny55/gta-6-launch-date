# Epic Technical Specification: Social Sharing & Virality

Date: 2025-11-26
Author: yojahny
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers the viral growth engine for the GTA 6 Launch Date Prediction platform by implementing frictionless social sharing mechanisms across X (formerly Twitter), Reddit, and other social platforms. This epic transforms passive users into active distributors, enabling exponential growth through optimized share buttons, rich social previews (Open Graph), SEO discoverability, and mobile-first responsive design.

The implementation leverages the **X Web Intents API** (current 2025 best practices) for zero-friction sharing without OAuth requirements, **dynamic server-rendered meta tags** for rich social previews, and **Schema.org structured data** for search engine discoverability. Performance optimization ensures < 2s desktop and < 3s mobile load times to minimize bounce rates from shared links, critical for viral conversion.

## Objectives and Scope

**In Scope:**
- **Story 5.1:** X (Twitter) share button with Web Intents API, pre-filled personalized text, and tracking parameters
- **Story 5.2:** Reddit share button with pre-filled title/body template and subreddit suggestions
- **Story 5.3:** Dynamic Open Graph meta tags (server-rendered) with current median data for rich social previews
- **Story 5.4:** SEO meta tags, Schema.org VideoGame/Event structured data for search discoverability
- **Story 5.5:** Mobile-responsive design (320px-1920px) with 44x44px touch targets, passing Google Mobile-Friendly Test
- **Story 5.6:** Performance optimization achieving Lighthouse >90, < 2s desktop / < 3s mobile load times

**Out of Scope:**
- Email notifications (Epic 8 - Monetization & Analytics)
- Embeddable widget (Epic 6)
- Chart visualization toggle (deferred per ADR-005)
- A/B testing share button copy (post-MVP)
- Dynamic OG image generation (optional enhancement, static image acceptable for MVP)
- Advanced virality tracking beyond basic `ref` parameters
- Social login/OAuth integration (not required for sharing)

**Key Success Metrics:**
- Share CTR (shares / submissions) > 15%
- Referral traffic from social platforms > 30% of total
- Lighthouse Performance score >90 (all pages)
- Google Mobile-Friendly Test: Pass
- Load time p95: Desktop < 2s, Mobile < 3s

## System Architecture Alignment

This epic aligns with the following architectural components and decisions:

**Frontend (Vanilla JS + Tailwind CSS):**
- Share buttons integrate with existing `public/app.js` confirmation flow (Story 3.3)
- Tailwind responsive utilities (`sm:`, `md:`, `lg:`) handle mobile-first design
- No framework overhead maintains < 2s load target (ADR-002)

**Workers Middleware (Hono):**
- New `middleware/meta-injection.ts` module intercepts HTML responses
- Fetches current stats from cached API (`/api/stats`) to inject dynamic OG tags
- Leverages existing 5-min cache TTL (ADR-007: Dynamic meta via Workers)

**APIs (Cloudflare Workers):**
- Reuses existing `/api/stats` endpoint (Story 2.10) for median/total data
- No new API endpoints required (all data already available)

**Database (D1):**
- No schema changes needed
- Existing predictions table provides data for social share personalization

**Deployment (Multi-Environment):**
- ADR-012 multi-environment strategy: Test sharing on dev environment before production
- Environment-specific OG URLs (`VITE_API_URL` in meta tags)

**Performance Constraints:**
- Maintains architecture performance targets: < 2s desktop, < 3s mobile (Architecture section: Performance Considerations)
- Share button analytics tracked via Cloudflare Web Analytics (ADR-006)

**Security:**
- Share URLs use `https://` only (HTTPS enforced via Cloudflare)
- Tracking parameters (`ref`, `u`) do not leak PII
- No cookie requirement for social sharing (public data only)

## Detailed Design

### Services and Modules

| Module | Responsibility | Location | Inputs | Outputs | Owner |
|--------|---------------|----------|--------|---------|-------|
| **ShareButtonsComponent** | Render X/Reddit share buttons with personalized text | `public/app.js` | User prediction, stats data | Share button HTML, analytics events | Frontend |
| **MetaInjectionMiddleware** | Server-side inject dynamic OG tags into HTML | `src/middleware/meta-injection.ts` | Stats API data, request URL | Modified HTML with meta tags | Workers |
| **ShareAnalyticsService** | Track share button clicks and referral traffic | `public/app.js` + Cloudflare Analytics | Button click events, `ref` parameter | Analytics data | Frontend/Analytics |
| **ResponsiveLayoutModule** | Mobile-first responsive design implementation | `public/styles.css` (Tailwind) | Viewport width | Responsive layout | Frontend |
| **PerformanceOptimizationService** | Bundle optimization, lazy loading, caching | Vite build + Workers cache | Static assets, API responses | Optimized bundles, cached responses | Build/Workers |
| **SEOStructuredDataService** | Generate Schema.org JSON-LD for VideoGame/Event | `public/index.html` | Stats data | JSON-LD script tag | Frontend |

**Module Interactions:**
- `ShareButtonsComponent` → calls `ShareAnalyticsService` on click → opens X Web Intent URL
- `MetaInjectionMiddleware` → fetches `/api/stats` → injects OG tags → returns modified HTML
- `SEOStructuredDataService` → reads stats from page data → renders Schema.org JSON-LD
- All modules respect `ResponsiveLayoutModule` Tailwind breakpoints

### Data Models and Contracts

**ShareButtonConfig Interface:**
```typescript
// Frontend: public/app.js (converted to vanilla JS)
interface ShareButtonConfig {
  platform: 'twitter' | 'reddit';
  text: string;           // Pre-filled share text
  url: string;            // Full URL with tracking params
  hashtags?: string[];    // Twitter only
  via?: string;           // Twitter only (e.g., 'gta6tracker')
  subreddit?: string;     // Reddit only (default: 'GTA6')
}
```

**OpenGraphMetaTags Interface:**
```typescript
// Workers: src/middleware/meta-injection.ts
interface OpenGraphMetaTags {
  'og:title': string;
  'og:description': string;
  'og:image': string;
  'og:url': string;
  'og:type': 'website';
  'twitter:card': 'summary_large_image';
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image': string;
}
```

**ShareAnalyticsEvent:**
```typescript
// Frontend analytics tracking
interface ShareAnalyticsEvent {
  event: 'share_click';
  platform: 'twitter' | 'reddit';
  user_prediction?: string;  // Optional, only if user has submitted
  median_prediction: string;
  timestamp: string;
}
```

**Schema.org VideoGame Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Grand Theft Auto VI",
  "gamePlatform": ["PlayStation 5", "Xbox Series X"],
  "publisher": {
    "@type": "Organization",
    "name": "Rockstar Games"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "2027-02-14",  // Dynamic: median_date
    "ratingCount": 10234,          // Dynamic: total predictions
    "bestRating": "2099-01-01",    // Dynamic: max_date
    "worstRating": "2025-12-01"    // Dynamic: min_date
  }
}
```

**No Database Schema Changes Required:**
- Reuses existing `predictions` table for data
- No new tables or columns needed

### APIs and Interfaces

**No New API Endpoints Required** - This epic reuses existing APIs:

**Existing API Reused:**
- `GET /api/stats` (Story 2.10) - Provides median, min, max, total for share text and OG tags

**External APIs Integrated:**

**1. X (Twitter) Web Intents API**
```
Endpoint: https://twitter.com/intent/tweet
Method: GET (via window.open or <a> tag)
Parameters:
  - text: string (URL-encoded, max 280 chars combined with url)
  - url: string (URL-encoded, auto-shortened by X to t.co)
  - hashtags: string (comma-separated, no # symbols, e.g., "GTA6,Rockstar")
  - via: string (username without @, e.g., "gta6tracker")
  - related: string (comma-separated accounts)
  - lang: string (2-letter code, optional)

Example:
https://twitter.com/intent/tweet?text=I%20predicted%20GTA%206%20will%20launch%20on%202027-06-15.%20The%20community%20median%20is%202027-03-15.%20What%20do%20you%20think%3F%20%F0%9F%8E%AE&url=https%3A%2F%2Fgta6predictions.com%2F%3Fref%3Dtwitter&hashtags=GTA6,Rockstar

Response: Opens X compose dialog (not a JSON API)
```

**2. Reddit Submit API**
```
Endpoint: https://reddit.com/submit
Method: GET (via window.open or <a> tag)
Parameters:
  - url: string (URL-encoded)
  - title: string (URL-encoded)
  - resubmit: true (allow resubmit)

Example:
https://reddit.com/submit?url=https%3A%2F%2Fgta6predictions.com%2F%3Fref%3Dreddit&title=GTA%206%20Launch%20Date%20Predictions%20-%20What%20does%20the%20community%20think%3F&resubmit=true

Response: Opens Reddit submit page (not a JSON API)
Note: Body text cannot be pre-filled via URL parameters
```

**3. Open Graph / Twitter Card Validators (Testing Only)**
```
Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
Twitter Card Validator: https://cards-dev.twitter.com/validator
LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

Used for testing meta tag rendering, not part of runtime integration
```

**Frontend Share Button Interface:**
```javascript
// public/app.js
function generateShareUrl(platform, userData) {
  const baseUrl = 'https://gta6predictions.com';
  const trackingUrl = `${baseUrl}/?ref=${platform}`;

  if (platform === 'twitter') {
    const text = generateTwitterText(userData);
    return `https://twitter.com/intent/tweet?${new URLSearchParams({
      text: text,
      url: trackingUrl,
      hashtags: 'GTA6,Rockstar'
    })}`;
  }

  if (platform === 'reddit') {
    const title = 'GTA 6 Launch Date Predictions - What does the community think?';
    return `https://reddit.com/submit?${new URLSearchParams({
      url: trackingUrl,
      title: title,
      resubmit: true
    })}`;
  }
}
```

### Workflows and Sequencing

**Story 5.1: X (Twitter) Share Flow**
```
User submits prediction (Story 3.3)
  → Frontend displays confirmation with stats
  → Share buttons rendered (Twitter + Reddit)
  → User clicks Twitter share button
    → Analytics event tracked (share_click, platform: twitter)
    → Generate personalized share text:
        - Fetch user's prediction date from page state
        - Fetch current median from stats
        - Calculate delta (user_date - median_date)
        - Build text: "I predicted GTA 6 on {user_date}. Median is {median_date}. I'm {delta} days {optimistic/pessimistic}! 🎮"
    → Build X Web Intent URL with parameters (text, url, hashtags)
    → window.open(intentUrl, '_blank', 'width=550,height=420')
  → X compose dialog opens in new window
  → User reviews/edits text, posts tweet
  → New visitors click shared link
    → URL includes ?ref=twitter tracking parameter
    → Cloudflare Analytics tracks referral source
```

**Story 5.3: Open Graph Meta Injection Flow**
```
Social platform crawler requests page (e.g., Twitter bot, Facebook bot)
  → Request hits Cloudflare Workers
  → MetaInjectionMiddleware intercepts HTML response
    → Check if User-Agent is social crawler (Twitter, Facebook, LinkedIn, etc.)
    → Fetch /api/stats (uses 5-min cache)
      - median_date, total_predictions, min_date, max_date
    → Generate dynamic OG tags:
        og:title = "GTA 6 Launch Date Predictions - Community Sentiment"
        og:description = "The community predicts GTA 6 will launch on {median_date} (median of {total} predictions). What do you think?"
        og:image = "https://gta6predictions.com/og-image.png"
    → Inject meta tags into <head> before </head>
    → Return modified HTML to crawler
  → Crawler parses meta tags
  → Social platform displays rich preview card when link is shared
```

**Story 5.4: SEO Structured Data Flow**
```
Search engine crawler (Googlebot) requests page
  → Cloudflare Workers serves HTML with embedded JSON-LD
  → JSON-LD contains Schema.org VideoGame + Event data with dynamic stats
  → Google parses structured data
  → Rich results eligible for:
      - Knowledge panel (VideoGame entity)
      - Event cards (predicted launch date event)
      - Aggregate rating display (prediction stats)
  → Improved SERP visibility for "GTA 6 predictions" queries
```

**Story 5.5: Responsive Layout Flow**
```
User visits on mobile device (viewport < 768px)
  → Browser loads HTML + Tailwind CSS
  → Tailwind mobile-first classes applied:
      - Single column layout (flex-col)
      - Full-width form inputs (w-full)
      - Stacked share buttons (space-y-4)
      - Touch targets minimum 44x44px (p-3 on buttons)
  → Native mobile date picker activated (input type="date")
  → User interacts with touch-optimized UI
  → No horizontal scrolling, all content fits viewport
```

**Story 5.6: Performance Optimization Flow**
```
User clicks shared link from social media
  → DNS resolution (Cloudflare CDN, < 10ms)
  → TLS handshake (Cloudflare edge, < 50ms)
  → Worker executes (< 50ms cold start)
    → Check cache for /api/stats (hit: < 5ms, miss: < 100ms D1 query)
    → Inject meta tags (< 10ms)
  → HTML returned (gzipped, ~15KB)
  → Browser parses HTML (< 100ms)
    → Critical CSS inline (above-fold render)
    → Defer non-critical JS (share buttons)
  → First Contentful Paint (FCP) < 1s
  → Largest Contentful Paint (LCP) < 2s (desktop), < 3s (mobile)
  → Share buttons lazy-load after LCP
  → Total load time < 2s desktop, < 3s mobile
```

**Sequence Diagram (X Share Flow):**
```
User              Frontend           Analytics        X Web Intent       New Visitor
  |                  |                  |                  |                  |
  | Submit pred      |                  |                  |                  |
  |----------------->|                  |                  |                  |
  |                  | Display confirm  |                  |                  |
  |<-----------------|                  |                  |                  |
  | Click Twitter btn|                  |                  |                  |
  |----------------->| Track click      |                  |                  |
  |                  |----------------->|                  |                  |
  |                  | Open intent URL  |                  |                  |
  |                  |---------------------------------->|                  |
  |                  |                  |                  | Show compose    |
  |                  |                  |                  | dialog          |
  | Post tweet       |                  |                  |                  |
  |-------------------------------------------------->|                  |
  |                  |                  |                  |                  |
  |                  |                  |                  | Click link      |
  |                  |                  |                  |---------------->|
  |                  |                  |                  |   GET /?ref=tw  |
  |                  |                  |                  |<----------------|
  |                  |                  | Track referral   |                  |
  |                  |                  |<------------------------------------|
```

## Non-Functional Requirements

### Performance

**Load Time Targets (Story 5.6):**
- Desktop (good connection): < 2 seconds (First Contentful Paint < 1s, LCP < 2s)
- Mobile (3G connection): < 3 seconds (FCP < 1.5s, LCP < 3s)
- Time to Interactive (TTI): < 3s desktop, < 5s mobile
- Core Web Vitals:
  - Largest Contentful Paint (LCP): < 2.5s (good)
  - First Input Delay (FID): < 100ms (good)
  - Cumulative Layout Shift (CLS): < 0.1 (good)

**Lighthouse Performance Scores:**
- Performance: >90 (target: 95+)
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**Bundle Size Targets:**
- Total HTML: < 20KB (gzipped)
- Total CSS: < 10KB (gzipped, Tailwind tree-shaken)
- Total JS: < 30KB (gzipped, including share button logic)
- OG Image: < 300KB (1200x630px WebP format)
- Total page weight: < 200KB

**API Response Times:**
- `/api/stats` (cached): < 50ms p50, < 200ms p95
- Meta injection middleware: < 10ms overhead per request
- Share button click analytics: < 5ms (async, non-blocking)

**Caching Strategy:**
- `/api/stats`: 5 minutes (Cloudflare Workers cache)
- Static assets (CSS, JS, images): 1 year (immutable, cache-busting via hash)
- HTML with dynamic meta tags: No cache (always fresh for crawlers)
- OG image: 1 hour cache

**Optimization Techniques:**
- Minify HTML, CSS, JS (Vite production build)
- Inline critical CSS (above-the-fold styles)
- Defer non-critical JavaScript (share button logic loads after LCP)
- Lazy load images with `loading="lazy"` attribute
- Use WebP image format with JPEG fallback
- Tree-shake Tailwind CSS (remove unused classes)
- Code splitting: Load share button logic only after user submission
- Preconnect to external domains: `<link rel="preconnect" href="https://twitter.com">`

**Mobile-Specific Performance:**
- Native mobile date picker (no custom JavaScript picker, faster)
- Reduce JavaScript execution time (< 1s on low-end mobile)
- Optimize for 3G networks (target median mobile connection speed)
- Touch event optimization (passive event listeners, no blocking)

### Security

**Share URL Security:**
- All share URLs use HTTPS only (enforced by Cloudflare)
- Tracking parameters (`ref`, `u`) do not expose PII
- URL encoding prevents XSS in share text (`encodeURIComponent()` for all user data)
- No authentication tokens in share URLs (public data only)

**Open Graph Meta Tag Security:**
- Server-side rendering prevents client-side XSS in meta tags
- Sanitize stats data before injection (escape HTML entities)
- Validate median/min/max dates are valid ISO 8601 format
- No user-generated content in meta tags (only system-generated stats)

**Content Security Policy (CSP):**
- Allow Twitter Web Intents: `connect-src https://twitter.com`
- Allow Reddit Submit: `connect-src https://reddit.com`
- Inline scripts forbidden (use external JS files with nonce/hash)
- Upgrade insecure requests: `upgrade-insecure-requests` directive

**External API Security:**
- X Web Intents API: Read-only, no API keys required (public endpoint)
- Reddit Submit API: Read-only, no authentication (public endpoint)
- No sensitive data sent to external platforms (only public prediction stats)

**Analytics Security:**
- Share click events do not log cookie IDs or IP addresses
- `ref` parameter tracking uses anonymous aggregation (Cloudflare Analytics)
- No PII in analytics events (only platform, timestamp)

**Image Security:**
- OG image served from same domain (no external CDN vulnerabilities)
- Image CORS headers configured for social platform access
- No dynamic image generation from user input (static image or server-generated only)

### Reliability/Availability

**Uptime Target:**
- 99.9% availability (Cloudflare Workers SLA)
- Planned maintenance window: < 1 hour/month (if needed)

**Graceful Degradation:**
- If `/api/stats` fails: Display static fallback median in meta tags (hardcoded default: "2027-03-15")
- If share button analytics fails: Share still works (analytics is non-blocking)
- If OG image missing: Fallback to default branded image (always available)
- If meta injection middleware fails: Serve HTML without dynamic tags (static meta tags as fallback)

**Error Handling:**
- Meta injection errors logged but do not block page load
- Share button click errors caught and logged (console.error), UI shows generic error message
- Analytics tracking failures are silent (do not alert user)
- External API timeouts (X Web Intents, Reddit Submit): 5s timeout, fallback to generic share URL

**Fallback Strategies:**
- X Web Intents unavailable: Fallback to direct X post URL format (less optimal but functional)
- Stats API cache miss: Fetch from D1, if D1 fails, use cached value from previous request (stale-while-revalidate)
- OG image CDN unavailable: Inline base64 image or text-only meta description

**Rate Limiting:**
- No rate limiting on share button clicks (public action, no abuse vector)
- Meta injection middleware respects existing `/api/stats` rate limits (5-min cache prevents overload)

**Monitoring & Alerting:**
- Alert if share CTR drops below 10% (indicates broken share buttons)
- Alert if Lighthouse Performance score < 85 (performance regression)
- Alert if OG image returns 404 (broken social previews)
- Alert if load time p95 > 4s (degraded user experience)

### Observability

**Metrics to Track:**

**Share Button Engagement:**
- Share button clicks (by platform: Twitter, Reddit)
- Share CTR = (share clicks / total predictions) * 100%
- Share button impressions (how many users see share buttons)
- Share conversion rate = (shares / share button impressions) * 100%

**Referral Traffic:**
- Inbound traffic with `?ref=twitter` parameter
- Inbound traffic with `?ref=reddit` parameter
- Conversion rate from referral (referral visits → predictions submitted)
- Viral coefficient = (new users from shares / total sharers)

**Performance Metrics:**
- Lighthouse scores (daily automated runs)
- Core Web Vitals (LCP, FID, CLS) via Cloudflare RUM
- Page load time distribution (p50, p95, p99)
- Mobile vs desktop performance comparison
- Time to First Byte (TTFB) for meta-injected pages

**Social Platform Engagement (External):**
- OG tag validation pass rate (Facebook Debugger, Twitter Card Validator)
- Social preview render success rate (manual testing)
- Twitter/X impressions per shared link (via X analytics, if available)
- Reddit upvotes per shared link (manual tracking)

**Error Rates:**
- Meta injection middleware errors (logged to Cloudflare Workers logs)
- Share button JavaScript errors (logged to browser console, aggregated via error tracking)
- Analytics tracking failures (non-critical, logged only)

**Logging Strategy:**

**Share Button Clicks:**
```javascript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  event: 'share_click',
  platform: 'twitter',
  user_prediction: '2027-06-15',
  median_prediction: '2027-03-15',
  delta_days: 92
}));
```

**Meta Injection:**
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  event: 'meta_injection',
  user_agent: 'Twitterbot/1.0',
  og_title: 'GTA 6 Launch Date Predictions...',
  cache_hit: true
}));
```

**Performance Monitoring:**
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  event: 'page_load',
  lcp: 1.8,
  fid: 85,
  cls: 0.05,
  device_type: 'mobile'
}));
```

**Dashboards:**
- Cloudflare Analytics: Referral traffic, load times, Core Web Vitals
- Custom dashboard (optional): Share CTR trends, platform comparison, viral coefficient
- Lighthouse CI: Daily performance score trends

**Alerts:**
- Share CTR < 10% (critical: broken share functionality)
- Lighthouse Performance < 85 (warning: performance regression)
- Load time p95 > 4s (warning: user experience degradation)
- OG image 404 rate > 5% (critical: broken social previews)

## Dependencies and Integrations

**Production Dependencies (No New Dependencies Required):**

All dependencies already exist in `package.json` - Epic 5 adds **zero new npm packages**:

```json
{
  "hono": "^4.10.0",          // API framework (existing)
  "dayjs": "^1.11.19",        // Date formatting for share text (existing)
  "js-cookie": "^3.0.5",      // Not used in Epic 5 (existing)
  "tailwindcss": "^4.0.0"     // Responsive design (existing)
}
```

**External API Integrations:**

| Service | Purpose | Authentication | Version | SLA | Cost |
|---------|---------|----------------|---------|-----|------|
| **X (Twitter) Web Intents API** | Share button functionality | None (public API) | Current (2025) | No SLA | Free |
| **Reddit Submit API** | Share button functionality | None (public endpoint) | Current | No SLA | Free |
| **Facebook Sharing Debugger** | Testing only (OG tags) | None | Current | N/A | Free |
| **Twitter Card Validator** | Testing only (Twitter Cards) | None | Current | N/A | Free |
| **Google Mobile-Friendly Test** | Testing only (responsive design) | None | Current | N/A | Free |
| **Google Lighthouse** | Performance testing | None | Latest | N/A | Free |

**Internal API Dependencies:**

| API Endpoint | Provider | Version | Purpose | Breaking Changes Risk |
|--------------|----------|---------|---------|----------------------|
| `GET /api/stats` | Story 2.10 | v1 | Fetch median, min, max, total for share text and OG tags | Low (stable contract) |

**Infrastructure Dependencies:**

| Component | Purpose | Version | Notes |
|-----------|---------|---------|-------|
| **Cloudflare Workers** | Meta injection middleware, hosting | Latest | ADR-012 multi-environment strategy |
| **Cloudflare Pages** | Static asset serving (HTML, CSS, JS, images) | Latest | Automatic deployment on git push |
| **Cloudflare D1** | Database for stats (via `/api/stats`) | Latest | No schema changes required |
| **Cloudflare Web Analytics** | Share button click tracking, referral tracking | Latest | ADR-006 (zero-cost analytics) |
| **Vite** | Build tool for Tailwind CSS, JS bundling | ^5.0.0 | Production builds, tree-shaking |

**Development Dependencies:**

| Package | Purpose | Version | Notes |
|---------|---------|---------|-------|
| `@tailwindcss/cli` | CSS build tool | ^4.1.17 | Tailwind v4 CSS-first config |
| `vitest` | Testing framework | ^3.2.4 | ADR-011 mandatory testing |
| `happy-dom` | DOM testing environment | ^20.0.10 | For share button tests |
| `typescript` | Type checking | latest | All TypeScript code |
| `wrangler` | Cloudflare deployment CLI | ^4.48.0 | Deploy to dev/production environments |

**Image Asset Dependencies:**

| Asset | Size | Format | Purpose | Source |
|-------|------|--------|---------|--------|
| `og-image.png` | < 300KB | WebP (fallback: PNG) | Open Graph social preview | Design team / generated |
| `favicon.ico` | < 10KB | ICO | Browser tab icon | Design team |
| Twitter/X logo SVG | < 2KB | SVG | Share button icon | Official X brand assets |
| Reddit logo SVG | < 2KB | SVG | Share button icon | Official Reddit brand assets |

**Integration Points:**

**1. Frontend → X Web Intents:**
```javascript
// public/app.js
function openTwitterShare(text, url) {
  const intentUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url, hashtags: 'GTA6,Rockstar' })}`;
  window.open(intentUrl, '_blank', 'width=550,height=420');
}
```

**2. Frontend → Reddit Submit:**
```javascript
// public/app.js
function openRedditShare(url, title) {
  const submitUrl = `https://reddit.com/submit?${new URLSearchParams({ url, title, resubmit: true })}`;
  window.open(submitUrl, '_blank');
}
```

**3. Workers Middleware → /api/stats:**
```typescript
// src/middleware/meta-injection.ts
async function injectMetaTags(html: string, env: Env): Promise<string> {
  const stats = await fetch(`${env.API_URL}/api/stats`).then(r => r.json());
  const ogTags = generateOGTags(stats.data);
  return html.replace('</head>', `${ogTags}\n</head>`);
}
```

**4. Frontend → Cloudflare Analytics:**
```javascript
// public/app.js (analytics auto-injected by Cloudflare Pages)
function trackShareClick(platform) {
  // Cloudflare Analytics automatically tracks page events
  console.log('share_click', { platform });
}
```

**Version Constraints:**

- **X Web Intents API:** No versioning, uses latest endpoint (backward compatible since 2010)
- **Tailwind CSS:** v4.0+ required (CSS-first config, ADR-003)
- **Vitest:** v3.2+ required (Cloudflare Workers pool support, ADR-009)
- **Node.js:** >= 18.0.0 (required by Cloudflare Workers tooling)

**No Breaking Changes Expected:**
- X Web Intents API has been stable for 10+ years
- Reddit Submit API is public and stable
- Internal `/api/stats` contract is frozen (Story 2.10)
- Cloudflare Workers/Pages platform is LTS (long-term support)

## Acceptance Criteria (Authoritative)

**Story 5.1: X (Twitter) Share Button**

**AC-5.1.1:** Given a user has submitted a prediction, when they view the confirmation page, then a Twitter/X share button is visible above-the-fold with Twitter blue styling and X logo icon.

**AC-5.1.2:** Given a user clicks the Twitter share button, when the X Web Intent opens, then the compose dialog is pre-filled with: "I predicted GTA 6 will launch on {user_date}. The community median is {median_date}. I'm {delta} days {optimistic/pessimistic}! 🎮" where delta and sentiment are calculated dynamically.

**AC-5.1.3:** Given the share text is generated, when the text includes user and median dates, then it includes the full tracking URL with `?ref=twitter` parameter for referral tracking.

**AC-5.1.4:** Given a user clicks the share button, when analytics tracks the event, then a `share_click` event is logged with platform='twitter', user_prediction, median_prediction, and delta_days.

**AC-5.1.5:** Given a new visitor clicks a shared Twitter link, when they land on the site, then Cloudflare Analytics records the `ref=twitter` referral source.

**AC-5.1.6:** And automated tests exist covering share button rendering, URL generation, and analytics tracking.

---

**Story 5.2: Reddit Share Button**

**AC-5.2.1:** Given a user has submitted a prediction, when they view the confirmation page, then a Reddit share button is visible next to the Twitter button with Reddit orange styling and Reddit logo icon.

**AC-5.2.2:** Given a user clicks the Reddit share button, when the Reddit submit page opens, then the title is pre-filled with "GTA 6 Launch Date Predictions - What does the community think?" and the URL includes `?ref=reddit`.

**AC-5.2.3:** Given the Reddit share opens, when the user views the submit form, then the default subreddit suggestion is r/GTA6 (user can change before posting).

**AC-5.2.4:** Given a user clicks the share button, when analytics tracks the event, then a `share_click` event is logged with platform='reddit'.

**AC-5.2.5:** And automated tests exist covering share button rendering, URL generation, and analytics tracking.

---

**Story 5.3: Open Graph Meta Tags**

**AC-5.3.1:** Given a social platform crawler (Twitter bot, Facebook bot) requests the page, when the Workers middleware intercepts the request, then dynamic Open Graph meta tags are injected with current median date and total predictions count.

**AC-5.3.2:** Given the meta tags are injected, when a user shares the link on Twitter/Facebook, then the social platform displays a rich preview card with title "GTA 6 Launch Date Predictions - Community Sentiment" and description showing current median.

**AC-5.3.3:** Given the OG tags include an image, when the link is shared, then the image is `og-image.png` (1200x630px) hosted on the same domain.

**AC-5.3.4:** Given the meta injection middleware executes, when it fetches stats, then it uses the cached `/api/stats` endpoint (5-min TTL) to avoid database overload.

**AC-5.3.5:** Given the meta tags are generated, when they are validated with Facebook Sharing Debugger and Twitter Card Validator, then both tools show no errors and render the preview correctly.

**AC-5.3.6:** And automated tests exist covering meta tag injection, cache behavior, and fallback handling.

---

**Story 5.4: SEO Meta Tags and Structured Data**

**AC-5.4.1:** Given a search engine crawler requests the page, when the HTML is served, then meta title is "GTA 6 Launch Date Predictions - Community Sentiment Tracker" and meta description includes current median date and total predictions.

**AC-5.4.2:** Given the page HTML includes structured data, when Google parses the JSON-LD, then Schema.org VideoGame and Event entities are recognized with dynamic median, min, max dates and total count.

**AC-5.4.3:** Given the structured data is validated, when tested with Google Rich Results Test, then the page is eligible for rich snippets (VideoGame knowledge panel, Event cards, aggregate rating).

**AC-5.4.4:** Given the page includes SEO meta tags, when indexed by Google, then the canonical URL is `https://gta6predictions.com/` and the page passes Core Web Vitals requirements.

**AC-5.4.5:** And automated tests exist covering meta tag generation, Schema.org JSON-LD structure, and dynamic data injection.

---

**Story 5.5: Mobile-Responsive Design**

**AC-5.5.1:** Given a user visits on mobile (viewport < 768px), when the page loads, then the layout is single-column with full-width form inputs and stacked share buttons.

**AC-5.5.2:** Given a user interacts with the page on mobile, when they tap buttons, then all touch targets are minimum 44x44px (WCAG 2.1 Level AAA).

**AC-5.5.3:** Given the page is tested on mobile devices, when run through Google Mobile-Friendly Test, then the page passes with no mobile usability issues.

**AC-5.5.4:** Given the page loads on different devices, when tested on viewports 320px to 1920px, then all content is visible without horizontal scrolling and layout adapts correctly at Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px).

**AC-5.5.5:** Given a user on iOS Safari or Android Chrome, when they interact with the date picker, then the native mobile date picker is used (no custom JavaScript picker).

**AC-5.5.6:** And automated tests exist covering responsive layout breakpoints, touch target sizes, and mobile-specific behavior.

---

**Story 5.6: Performance Optimization**

**AC-5.6.1:** Given a user visits the site on desktop, when the page loads, then Largest Contentful Paint (LCP) is < 2 seconds and First Contentful Paint (FCP) is < 1 second.

**AC-5.6.2:** Given a user visits on mobile (3G connection), when the page loads, then LCP is < 3 seconds and total page weight is < 200KB.

**AC-5.6.3:** Given the page is audited with Lighthouse, when the performance test runs, then all scores are >90 (Performance, Accessibility, Best Practices, SEO).

**AC-5.6.4:** Given the page serves static assets, when cached by Cloudflare CDN, then CSS/JS/images have 1-year cache headers and use content hashing for cache-busting.

**AC-5.6.5:** Given JavaScript is loaded, when the page renders, then critical CSS is inlined and non-critical JS (share buttons) is deferred until after LCP.

**AC-5.6.6:** Given Core Web Vitals are measured, when tracked over 28 days, then FID < 100ms, CLS < 0.1, and LCP < 2.5s (p75).

**AC-5.6.7:** And automated tests exist covering bundle sizes, lazy loading behavior, and cache headers validation.

## Traceability Mapping

| Acceptance Criteria | Spec Section | Components/APIs | Test Approach |
|---------------------|--------------|-----------------|---------------|
| **AC-5.1.1** (Twitter button visible) | Services: ShareButtonsComponent | `public/app.js`, Tailwind CSS | Unit test: Button renders with correct classes, icon, text |
| **AC-5.1.2** (Pre-filled tweet text) | APIs: X Web Intents, Workflows: X Share Flow | `generateShareUrl()`, X Web Intent URL | Integration test: URL generation with dynamic user/median data |
| **AC-5.1.3** (Tracking URL parameter) | APIs: X Web Intents | `?ref=twitter` parameter | Unit test: URL includes ref parameter |
| **AC-5.1.4** (Share click analytics) | Services: ShareAnalyticsService | `trackShareClick()`, console.log | Unit test: Analytics event logged on click |
| **AC-5.1.5** (Referral tracking) | NFR: Observability | Cloudflare Analytics | Manual test: Visit `/?ref=twitter`, verify analytics dashboard |
| **AC-5.1.6** (Automated tests) | Test Strategy | Vitest tests | Meta-test: Verify test coverage >80% for share button code |
| **AC-5.2.1** (Reddit button visible) | Services: ShareButtonsComponent | `public/app.js`, Tailwind CSS | Unit test: Button renders with Reddit styling |
| **AC-5.2.2** (Reddit pre-filled title) | APIs: Reddit Submit API | `generateShareUrl('reddit')` | Integration test: Reddit URL with title parameter |
| **AC-5.2.3** (Subreddit suggestion) | Epic 5 Story 5.2 | Reddit Submit URL | Manual test: Default subreddit is r/GTA6 |
| **AC-5.2.4** (Reddit analytics) | Services: ShareAnalyticsService | `trackShareClick('reddit')` | Unit test: Analytics event logged |
| **AC-5.2.5** (Automated tests) | Test Strategy | Vitest tests | Meta-test: Test coverage for Reddit share |
| **AC-5.3.1** (Dynamic OG tags) | Services: MetaInjectionMiddleware | `src/middleware/meta-injection.ts` | Integration test: Middleware injects tags with current stats |
| **AC-5.3.2** (Rich social previews) | Data Models: OpenGraphMetaTags | OG title, description, image | Manual test: Facebook Debugger, Twitter Card Validator |
| **AC-5.3.3** (OG image) | Dependencies: Image assets | `public/og-image.png` | Unit test: Image exists, dimensions 1200x630 |
| **AC-5.3.4** (Stats API caching) | NFR: Performance, APIs: /api/stats | 5-min cache TTL | Integration test: Verify cache hit on subsequent requests |
| **AC-5.3.5** (Validator passes) | Test Strategy: Manual testing | Facebook/Twitter validators | Manual test: Run URLs through validators, verify green status |
| **AC-5.3.6** (Automated tests) | Test Strategy | Vitest tests | Meta-test: Middleware test coverage |
| **AC-5.4.1** (SEO meta tags) | Services: SEOStructuredDataService | `<title>`, `<meta name="description">` | Unit test: Meta tags in HTML include dynamic stats |
| **AC-5.4.2** (Schema.org JSON-LD) | Data Models: Schema.org VideoGame/Event | JSON-LD script tag | Unit test: JSON-LD validates against Schema.org spec |
| **AC-5.4.3** (Rich Results eligible) | Test Strategy: Manual testing | Google Rich Results Test | Manual test: Run URL through Rich Results Test, verify eligible |
| **AC-5.4.4** (Canonical URL, CWV) | NFR: Performance, SEO best practices | `<link rel="canonical">`, Core Web Vitals | Integration test: Canonical URL correct, CWV within limits |
| **AC-5.4.5** (Automated tests) | Test Strategy | Vitest tests | Meta-test: SEO test coverage |
| **AC-5.5.1** (Mobile single-column) | Services: ResponsiveLayoutModule | Tailwind `flex-col`, `w-full` classes | Visual regression test: Screenshot comparison at 375px |
| **AC-5.5.2** (44x44px touch targets) | NFR: Performance (mobile-specific) | Tailwind `p-3` on buttons | Unit test: Computed button size >= 44x44px |
| **AC-5.5.3** (Google Mobile-Friendly) | Test Strategy: Manual testing | Google Mobile-Friendly Test | Manual test: Run URL through test, verify pass |
| **AC-5.5.4** (Responsive 320-1920px) | Services: ResponsiveLayoutModule | Tailwind breakpoints (sm, md, lg) | Visual regression test: Screenshots at 320, 640, 768, 1024, 1920px |
| **AC-5.5.5** (Native date picker) | Architecture: Vanilla JS, no custom picker | `<input type="date">` | Manual test: iOS Safari, Android Chrome native pickers |
| **AC-5.5.6** (Automated tests) | Test Strategy | Vitest tests | Meta-test: Responsive layout test coverage |
| **AC-5.6.1** (Desktop LCP < 2s) | NFR: Performance | Vite build, inline CSS, deferred JS | Lighthouse test: Verify LCP metric |
| **AC-5.6.2** (Mobile LCP < 3s) | NFR: Performance | Bundle optimization, tree-shaking | Lighthouse test: Mobile 3G throttling |
| **AC-5.6.3** (Lighthouse >90) | NFR: Performance | All optimization techniques | Lighthouse CI: Automated daily runs |
| **AC-5.6.4** (Cache headers) | NFR: Performance, Dependencies: Cloudflare CDN | Cloudflare Pages cache config | Integration test: Verify response headers |
| **AC-5.6.5** (Inline CSS, deferred JS) | NFR: Performance | Vite build config | Unit test: HTML includes inline `<style>`, JS has `defer` |
| **AC-5.6.6** (CWV p75 targets) | NFR: Performance | Core Web Vitals monitoring | Production monitoring: Cloudflare RUM |
| **AC-5.6.7** (Automated tests) | Test Strategy | Vitest tests | Meta-test: Bundle size tests, lazy load tests |

## Risks, Assumptions, Open Questions

**Risks:**

**R1: X (Twitter) Web Intents API Deprecation** (Medium Impact, Low Likelihood)
- **Description:** X could deprecate the Web Intents API without notice, breaking share buttons
- **Mitigation:** Monitor X Developer Platform changelog, implement fallback to direct post URL format
- **Contingency:** If deprecated, switch to X API v2 (requires OAuth, more complex but stable)
- **Status:** Monitoring - X Web Intents has been stable since 2010, unlikely to break

**R2: Open Graph Image 404** (High Impact, Low Likelihood)
- **Description:** OG image fails to load, social previews show broken image
- **Mitigation:** Implement fallback to text-only meta description, host image on CDN with redundancy
- **Contingency:** Generate dynamic OG images server-side (Cloudflare Workers + canvas API)
- **Status:** Mitigated - Static image hosted on Cloudflare Pages with 99.9% uptime

**R3: Performance Regression from Bundle Bloat** (Medium Impact, Medium Likelihood)
- **Description:** Adding share button logic increases JS bundle size, breaching < 30KB target
- **Mitigation:** Code splitting (load share logic only after user submission), tree-shaking, minification
- **Contingency:** Lazy load share buttons as separate chunk, defer until user scrolls to confirmation
- **Status:** Monitoring - Current bundle size tracked in CI/CD, alerts if >30KB

**R4: Mobile-Responsive Design Edge Cases** (Low Impact, Medium Likelihood)
- **Description:** Layout breaks on uncommon viewport sizes (e.g., 360px, foldable phones)
- **Mitigation:** Test on Chrome DevTools device emulator with common viewports, use Tailwind container queries
- **Contingency:** Add custom CSS media queries for edge cases, fallback to safe minimum width (320px)
- **Status:** Mitigated - Tailwind responsive utilities handle 95% of cases

**R5: Lighthouse Score Degradation in Production** (Medium Impact, Low Likelihood)
- **Description:** Production environment shows lower Lighthouse scores than local/dev (network latency, CDN misconfig)
- **Mitigation:** Run Lighthouse CI against production URLs daily, monitor Core Web Vitals via Cloudflare RUM
- **Contingency:** Investigate production-specific bottlenecks (TTFB, cache misses), optimize Workers code
- **Status:** Monitoring - Lighthouse CI configured to alert if score < 85

**Assumptions:**

**A1:** X (Twitter) Web Intents API will remain stable and free
- **Validation:** Historical evidence (stable since 2010), no announced deprecation plans
- **Impact if wrong:** High - would require migration to X API v2 (OAuth required)

**A2:** Users will share predictions organically without incentives
- **Validation:** Industry benchmarks show 10-15% share CTR for viral content
- **Impact if wrong:** Low - can add share incentives later (e.g., "Share to see global predictions")

**A3:** Open Graph meta tags are sufficient for social previews (no dynamic image generation needed)
- **Validation:** Static OG images work for most viral sites (e.g., Product Hunt, Hacker News)
- **Impact if wrong:** Medium - dynamic image generation adds complexity but enhances shares

**A4:** Cloudflare Pages supports server-side meta tag injection via Workers middleware
- **Validation:** Documented in Cloudflare Pages/Workers integration guide, tested in dev environment
- **Impact if wrong:** High - would require migration to different SSR solution (e.g., Remix, SvelteKit)

**A5:** Share button clicks correlate with actual social media posts (not just intent clicks)
- **Validation:** Assume 50-70% conversion from intent click → actual post
- **Impact if wrong:** Low - analytics will track both clicks and referral traffic, can calculate actual conversion

**Open Questions:**

**Q1:** Should we add Facebook/LinkedIn share buttons in addition to Twitter/Reddit?
- **Answer Required By:** Before Story 5.1 implementation
- **Decision Maker:** Product Owner (yojahny)
- **Impact:** Adds development time (~2 hours per platform), increases bundle size (~5KB per button)
- **Recommendation:** Defer to post-MVP, focus on Twitter/Reddit for GTA 6 audience

**Q2:** Should OG image be dynamically generated with current median, or static branded image?
- **Answer Required By:** Before Story 5.3 implementation
- **Decision Maker:** Product Owner + Dev team
- **Impact:** Dynamic image increases complexity, requires image generation library or external service
- **Recommendation:** Start with static image (MVP), iterate to dynamic if share engagement is high

**Q3:** What is the fallback strategy if share CTR is < 10% (below target)?
- **Answer Required By:** Post-launch, after 2 weeks of data
- **Decision Maker:** Product Owner
- **Impact:** May require A/B testing share button copy, adding share incentives, or redesigning share flow
- **Recommendation:** Monitor metrics, prepare A/B test variants for share button text

**Q4:** Should we implement share incentives (e.g., "Share to unlock global prediction map")?
- **Answer Required By:** Post-MVP, if organic CTR is low
- **Decision Maker:** Product Owner
- **Impact:** Increases complexity, requires gated content, potential UX friction
- **Recommendation:** Defer until data shows organic sharing is insufficient

**Q5:** Do we need to support Twitter/X app deep links on mobile (in addition to Web Intents)?
- **Answer Required By:** Before Story 5.1 implementation
- **Decision Maker:** Dev team
- **Impact:** Adds complexity (detect mobile browser, construct deep link), better UX on mobile
- **Recommendation:** Web Intents handle mobile app handoff automatically (iOS/Android), no custom deep links needed

## Test Strategy Summary

**Testing Levels:**

**1. Unit Tests (Vitest + happy-dom)**
- **Coverage Target:** >80% for all JavaScript modules
- **Focus Areas:**
  - Share button URL generation (`generateShareUrl()`)
  - Share text personalization logic (delta calculation, optimistic/pessimistic)
  - Analytics event tracking (`trackShareClick()`)
  - Meta tag generation (OG tags, Schema.org JSON-LD)
  - Responsive layout CSS class application
- **Example Test:**
  ```javascript
  describe('generateShareUrl', () => {
    it('generates Twitter Web Intent URL with personalized text', () => {
      const userData = { predicted_date: '2027-06-15' };
      const stats = { median: '2027-03-15' };
      const url = generateShareUrl('twitter', userData, stats);
      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain('text=I%20predicted%20GTA%206');
      expect(url).toContain('ref=twitter');
      expect(url).toContain('hashtags=GTA6');
    });
  });
  ```

**2. Integration Tests (Vitest + Cloudflare Workers pool)**
- **Coverage Target:** All API integrations, middleware
- **Focus Areas:**
  - MetaInjectionMiddleware injects OG tags correctly
  - `/api/stats` cache behavior (5-min TTL)
  - Share button click → analytics event → logged correctly
  - Window.open() called with correct parameters (mock)
- **Example Test:**
  ```typescript
  describe('MetaInjectionMiddleware', () => {
    it('injects dynamic OG tags with current median', async () => {
      const html = '<html><head></head><body></body></html>';
      const env = { API_URL: 'http://localhost:8787' };
      const result = await injectMetaTags(html, env);
      expect(result).toContain('<meta property="og:title"');
      expect(result).toContain('GTA 6 Launch Date Predictions');
      expect(result).toContain('2027-03-15'); // Current median
    });
  });
  ```

**3. End-to-End Tests (Manual + Automated)**
- **Coverage Target:** Critical user flows
- **Focus Areas:**
  - User submits prediction → share buttons appear → click Twitter → X dialog opens
  - Shared link clicked by new user → referral tracked → stats updated
  - Social crawler requests page → OG tags served → preview renders correctly
- **Tools:** Playwright (optional for automation), manual testing

**4. Performance Tests (Lighthouse CI)**
- **Coverage Target:** All pages, mobile + desktop
- **Focus Areas:**
  - Lighthouse Performance score >90
  - LCP < 2s desktop, < 3s mobile
  - Bundle size < 30KB JS, < 10KB CSS
  - Core Web Vitals within targets
- **Automated:** Daily Lighthouse CI runs against production URL

**5. Visual Regression Tests (Optional)**
- **Coverage Target:** Key breakpoints (320px, 640px, 768px, 1024px, 1920px)
- **Focus Areas:**
  - Mobile responsive layout (single-column, stacked buttons)
  - Tablet layout (two-column)
  - Desktop layout (three-column)
- **Tools:** Percy, Chromatic, or manual screenshot comparison

**6. Manual Testing Checklist:**

**Story 5.1 (Twitter Share):**
- [ ] Click Twitter share button → X dialog opens with pre-filled text
- [ ] Verify share text includes user prediction, median, delta, emoji
- [ ] Verify hashtags include #GTA6, #Rockstar
- [ ] Verify tracking URL includes `?ref=twitter`
- [ ] Post tweet → verify new visitor clicks link → landing page loads
- [ ] Verify Cloudflare Analytics shows referral from twitter.com

**Story 5.2 (Reddit Share):**
- [ ] Click Reddit share button → Reddit submit page opens
- [ ] Verify title is pre-filled correctly
- [ ] Verify default subreddit is r/GTA6
- [ ] Verify tracking URL includes `?ref=reddit`
- [ ] Submit post → verify new visitor clicks link → landing page loads

**Story 5.3 (Open Graph):**
- [ ] Run URL through Facebook Sharing Debugger → verify OG tags present
- [ ] Run URL through Twitter Card Validator → verify Twitter Card valid
- [ ] Share link on Twitter → verify preview card renders with image
- [ ] Share link on Facebook → verify preview card renders with image
- [ ] Verify OG image is 1200x630px, < 300KB

**Story 5.4 (SEO):**
- [ ] Run URL through Google Rich Results Test → verify VideoGame/Event entities
- [ ] View page source → verify meta title, description include dynamic stats
- [ ] Verify canonical URL is correct
- [ ] Verify Schema.org JSON-LD validates at schema.org validator

**Story 5.5 (Mobile-Responsive):**
- [ ] Test on iPhone (Safari) → verify single-column layout, native date picker
- [ ] Test on Android (Chrome) → verify touch targets 44x44px, no horizontal scroll
- [ ] Run through Google Mobile-Friendly Test → verify pass
- [ ] Test viewports: 320px, 375px, 640px, 768px, 1024px, 1920px

**Story 5.6 (Performance):**
- [ ] Run Lighthouse on desktop → verify Performance >90, LCP < 2s
- [ ] Run Lighthouse on mobile (throttled 3G) → verify LCP < 3s
- [ ] Verify bundle sizes: JS < 30KB, CSS < 10KB, total < 200KB
- [ ] Verify cache headers: static assets have 1-year cache
- [ ] Verify critical CSS inlined, non-critical JS deferred

**Test Automation Strategy:**

**CI/CD Pipeline (GitHub Actions):**
```yaml
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests
  run: npm run test:workers

- name: Run Lighthouse CI
  run: npm run lighthouse:ci

- name: Check Bundle Size
  run: npm run build && du -sh dist/
```

**Daily Scheduled Tests:**
- Lighthouse CI against production URL (6am UTC)
- OG tag validation (Facebook/Twitter validators via API)
- Social preview screenshot comparison

**Test Data:**
- Use mock stats data for unit/integration tests
- Use production stats (via cache) for E2E tests
- Generate sample OG images for visual regression

**Edge Cases to Test:**

**Share Buttons:**
- User has not submitted prediction (share buttons hidden)
- Stats API returns error (share buttons show generic text)
- User blocks window.open() (fallback: copy link to clipboard)

**Meta Injection:**
- Stats API cache miss (fetch from D1)
- D1 query fails (fallback to static median)
- OG image 404 (fallback to text-only description)

**Responsive Design:**
- Extremely small viewport (280px - uncommon but possible)
- Landscape orientation on mobile (viewport width > height)
- Foldable phone (dual screen, unusual aspect ratio)

**Performance:**
- Slow 3G connection (test with Lighthouse throttling)
- High CPU load (test on low-end mobile device)
- Cold cache (first visit, no assets cached)

**Test Coverage Requirements (ADR-011):**
- Minimum 80% code coverage for all Epic 5 modules
- All Acceptance Criteria must have corresponding tests
- Failed tests block deployment to production
- Test execution time < 2 minutes (unit + integration)

**Sources for Research:**

This technical specification was informed by current best practices research:
- [Working with Web Intents - X Developer Platform](https://developer.x.com/en/docs/x-for-websites/web-intents/overview)
- [Web Intent Parameters - X Developer Platform](https://developer.x.com/en/docs/x-for-websites/tweet-button/guides/web-intent)
- [X Developer Policy](https://developer.x.com/en/developer-terms/policy)
