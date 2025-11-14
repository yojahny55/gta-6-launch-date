# Epic 6: Embeddable Widget

**Epic Goal:** Enable streamers and media sites to embed live data - passive distribution to 250M+ content viewers.

**Epic Value:** B2B distribution channel. Streamers = credibility + massive reach.

## Story 6.1: Widget Iframe Embed Code Generator

As a content creator,
I want to easily get embed code for the widget,
So that I can add it to my stream or website.

**Acceptance Criteria:**

**Given** a user wants to embed the widget
**When** they visit /widget or click "Embed Widget" link
**Then** an embed code generator page is displayed:

**Page Content:**

1. **Live Preview:**
   - Shows what widget looks like
   - Real data (median, count)
   - Responsive preview (mobile/desktop toggle)

2. **Customization Options (FR29):**
   - Theme: Light | Dark
   - Size: Small (250x150) | Medium (400x250) | Large (600x350)
   - Auto-refresh: Yes (every 5 min) | No

3. **Generated Code:**
```html
<iframe
  src="https://gta6predictions.com/widget?theme=dark&size=medium"
  width="400"
  height="250"
  frameborder="0"
  scrolling="no"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  title="GTA 6 Predictions Widget"
></iframe>
```

4. **Copy Button:**
   - One-click copy to clipboard
   - Confirmation: "Copied!"

5. **Instructions:**
   - Paste code into your site's HTML
   - Widget updates automatically
   - Link back to main site included

**And** widget URL parameters:
- `theme=light|dark` - Controls color scheme
- `size=small|medium|large` - Controls dimensions
- `refresh=true|false` - Auto-refresh enabled

**Prerequisites:** None (static page with embed generator)

**Technical Notes:**
- Implements FR24 (embeddable iframe code generator)
- Implements FR29 (light/dark theming)
- Simple HTML generator (no backend needed)
- Preview uses actual widget endpoint
- Clipboard API for copy functionality

---

## Story 6.2: Widget Endpoint with Live Data

As a widget embedder,
I want the widget to display live community data,
So that my audience sees current predictions.

**Acceptance Criteria:**

**Given** a widget is embedded on a third-party site
**When** the iframe loads
**Then** the widget displays:

**Widget Content (FR25-26):**
- Community median prediction (large text)
- Total predictions count
- Tagline: "What does the community think?"
- Link: "Add your prediction →" (links to main site, FR27)

**Widget HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Minimal CSS for performance */
    body { margin: 0; font-family: system-ui; }
    .widget { padding: 20px; text-align: center; }
    .median { font-size: 32px; font-weight: bold; }
    .count { font-size: 14px; color: #666; }
    .cta { margin-top: 10px; }
  </style>
</head>
<body class="theme-{theme}">
  <div class="widget">
    <div class="median">{median_date}</div>
    <div class="count">{count} predictions</div>
    <div class="cta">
      <a href="https://gta6predictions.com/?ref=widget" target="_blank">
        Add your prediction →
      </a>
    </div>
  </div>
</body>
</html>
```

**And** data fetching:
- Call stats API: GET /api/stats (Story 2.10)
- Cache result: 5 minutes (same as main site)
- Render server-side for performance

**And** auto-refresh (if enabled):
- JavaScript polls API every 5 minutes
- Updates DOM without full reload
- Minimal bandwidth usage

**And** theming support:
- Light theme: White background, dark text
- Dark theme: Dark background, light text
- CSS variables for easy customization

**Prerequisites:** Story 2.10 (stats API)

**Technical Notes:**
- Implements FR25 (widget displays median)
- Implements FR26 (widget displays count)
- Implements FR27 (widget links to main site)
- Implements FR28 (lightweight <50KB)
- Keep HTML minimal (no external dependencies)
- Inline CSS for single request
- Server-side render for instant display

---

## Story 6.3: Widget Security with Iframe Sandbox

As a site owner,
I want widgets sandboxed for security,
So that embedded sites can't exploit the widget.

**Acceptance Criteria:**

**Given** a widget is embedded on a third-party site
**When** the iframe loads
**Then** security restrictions are enforced:

**Iframe Sandbox Attributes (FR85):**
```html
sandbox="allow-scripts allow-same-origin"
```

**Allowed:**
- `allow-scripts` - JavaScript can run (for auto-refresh)
- `allow-same-origin` - Fetch data from same origin (stats API)

**Blocked:**
- `allow-forms` - No form submission from widget
- `allow-popups` - No popups
- `allow-top-navigation` - Can't navigate parent page
- `allow-modals` - No alerts/confirms

**And** Content Security Policy (CSP):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self';
  connect-src 'self';
```

**And** additional security:
- No cookies set by widget
- No local storage access
- No access to parent window (cross-origin)
- HTTPS only (Cloudflare enforces)

**And** clickjacking protection:
- X-Frame-Options: SAMEORIGIN (allows embedding)
- Widget can only be embedded, not framed maliciously

**Prerequisites:** Story 6.2 (widget endpoint)

**Technical Notes:**
- Implements FR85 (iframe sandbox restrictions)
- Sandbox prevents XSS from widget to parent
- CSP prevents loading external resources
- Balance security with functionality (need scripts for refresh)
- Test widget on various platforms (Twitch, WordPress, etc.)

---

## Story 6.4: Widget-Specific Rate Limiting

As a system,
I want separate rate limits for widget endpoints,
So that widget traffic doesn't exhaust API quotas.

**Acceptance Criteria:**

**Given** widgets are embedded on high-traffic sites
**When** widget requests arrive
**Then** separate rate limits apply (FR86):

**Widget Rate Limits:**
- Per origin (embedding domain): 120 requests/minute
- Per IP: No limit (widgets share IPs via streamers)
- Global widget traffic: No limit (widgets are read-only)

**Rationale:**
- Widget on streamer with 10K viewers = 10K requests
- If IP-based limiting: All blocked after 60/min
- Origin-based: Each embedding site gets own quota

**And** rate limit headers (widget-specific):
```
X-Widget-RateLimit-Limit: 120
X-Widget-RateLimit-Remaining: 95
X-Widget-RateLimit-Reset: 1640000000
X-Widget-Origin: twitch.tv
```

**And** rate limit exceeded response:
- Status: 429 Too Many Requests
- Body: Cached stats (stale but functional)
- Retry-After: 60 seconds

**And** caching strategy:
- Widget endpoint cached aggressively (5 min)
- Even rate-limited requests get cached data
- Gradual degradation (not complete failure)

**And** monitoring:
- Track widget traffic by origin
- Identify top embedding sites
- Optimize or whitelist high-value partners

**Prerequisites:** Story 6.2 (widget endpoint)

**Technical Notes:**
- Implements FR86 (widget separate rate limiting)
- Origin header identifies embedding site
- Cloudflare Workers can extract origin from Referer
- Different limits than main site (widgets are passive)
- Cache-first strategy prevents most rate limit hits
- Consider paid tier for high-traffic partners (future)

---
