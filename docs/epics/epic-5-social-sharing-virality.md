# Epic 5: Social Sharing & Virality

**Epic Goal:** Enable organic viral growth through frictionless sharing - each share brings 10+ new users.

**Epic Value:** Distribution IS the strategy. Without sharing, growth is linear (death). Exponential growth requires viral mechanics.

## Story 5.1: Twitter/X Share Button with Pre-filled Text

As a user,
I want to easily share my prediction to Twitter/X,
So that I can show my friends and start conversations.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** they click the Twitter/X share button
**Then** a Twitter compose window opens with pre-filled text:

**Tweet Template:**
```
I predicted GTA 6 will launch on {user_date}. The community median is {median_date}.
What do you think? 🎮

{url}
```

**And** tweet personalization:
- If user = median: "I'm aligned with the community! 🎯"
- If user < median: "I'm {X} days more optimistic 🤞"
- If user > median: "I'm {X} days more pessimistic 😬"

**And** URL parameters track source:
- URL: `https://gta6predictions.com/?ref=twitter&u={hash}`
- `ref=twitter` tracks traffic source (FR42)
- `u={hash}` optional unique identifier for virality tracking

**And** button placement (FR100):
- Displayed immediately after submission confirmation
- Above-the-fold (no scrolling required)
- Prominent visual design (Twitter blue color)
- Icon: Twitter/X logo

**And** share analytics (FR45):
- Track: Share button clicks
- Track: Click-through from Twitter (URL ref parameter)
- Calculate: Share CTR = shares / submissions

**Prerequisites:** Story 3.3 (submission confirmation), Story 2.10 (median data)

**Technical Notes:**
- Implements FR20 (Twitter/X share with pre-filled text)
- Implements FR100 (prominent above-the-fold placement)
- Implements FR45 (social share CTR tracking)
- Use Twitter Web Intent API: `https://twitter.com/intent/tweet?text={encoded_text}`
- URL shortener not needed (direct link)
- Track clicks via onclick event before opening window

---

## Story 5.2: Reddit Share Button with Pre-filled Text

As a user,
I want to easily share my prediction to Reddit,
So that I can engage with the GTA 6 community.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** they click the Reddit share button
**Then** Reddit submit page opens with pre-filled content:

**Reddit Post Template:**
```
Title: GTA 6 Launch Date Predictions - What does the community think?

Body:
I just submitted my prediction: {user_date}
Community median: {median_date}

I'm {X} days {optimistic/pessimistic} compared to everyone else!

Check out the full data and add your prediction:
{url}
```

**And** subreddit suggestions:
- Default: r/GTA6 (largest community)
- Alternative: r/gaming, r/Games, r/rockstar
- User can change subreddit before posting

**And** URL parameters:
- URL: `https://gta6predictions.com/?ref=reddit&u={hash}`
- Tracks Reddit traffic (FR42)

**And** button placement (FR100):
- Next to Twitter button
- Same visual prominence
- Icon: Reddit logo (orange)

**Prerequisites:** Story 3.3 (submission confirmation)

**Technical Notes:**
- Implements FR21 (Reddit share with pre-filled text)
- Reddit URL: `https://reddit.com/submit?url={url}&title={title}`
- Pre-fill body not supported by Reddit API (user copies template)
- Consider Reddit-specific share image (Open Graph)

---

## Story 5.3: Open Graph Meta Tags for Rich Previews

As a system,
I want dynamic Open Graph meta tags,
So that shared links show rich previews with current data.

**Acceptance Criteria:**

**Given** a URL is shared on social media
**When** the platform fetches meta tags
**Then** dynamic Open Graph tags are returned:

**Meta Tags (Server-side rendered):**
```html
<meta property="og:title" content="GTA 6 Launch Date Predictions - Community Sentiment" />
<meta property="og:description" content="The community predicts GTA 6 will launch on Feb 14, 2027 (median of 10,234 predictions). What do you think?" />
<meta property="og:image" content="https://gta6predictions.com/og-image.png" />
<meta property="og:url" content="https://gta6predictions.com/" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="GTA 6 Launch Date Predictions" />
<meta name="twitter:description" content="Community median: Feb 14, 2027 (10,234 predictions)" />
<meta name="twitter:image" content="https://gta6predictions.com/og-image.png" />
```

**And** personalized sharing (FR23):
- If URL has `?u={hash}` parameter: Show user's specific prediction
- Title: "I predicted {user_date} for GTA 6"
- Description: "The community median is {median_date}. I'm {X} days {optimistic/pessimistic}."

**And** dynamic image generation (optional):
- Generate image with current median + total count
- Update every hour (cached)
- Fallback: Static branded image

**And** meta tag updates:
- Reflect current median (not stale data)
- Update on every page load (server-side rendering)
- Cache for 5 minutes (same as stats API)

**Prerequisites:** Story 2.10 (stats API for data)

**Technical Notes:**
- Implements FR22 (dynamic Open Graph meta tags)
- Implements FR23 (personalized prediction in shared links)
- Server-side rendering required (Cloudflare Pages supports SSR)
- Test with Facebook Debugger, Twitter Card Validator
- Image dimension: 1200x630px (optimal for all platforms)
- Canonical URL prevents duplicate content issues

---

## Story 5.4: SEO Meta Tags and Structured Data

As a site owner,
I want optimized meta tags and structured data,
So that the site ranks well for "GTA 6 predictions" searches.

**Acceptance Criteria:**

**Given** search engines crawl the site
**When** they parse the HTML
**Then** SEO-optimized meta tags are present:

**Basic Meta Tags:**
```html
<title>GTA 6 Launch Date Predictions - Community Sentiment Tracker</title>
<meta name="description" content="Track community predictions for GTA 6's launch date. Submit your prediction and see what {count} other fans think. Current median: {median_date}." />
<meta name="keywords" content="GTA 6, launch date, predictions, community, Rockstar, Grand Theft Auto 6" />
```

**And** Schema.org structured data for VideoGame:
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
  "datePublished": "TBD",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{median_date}",
    "ratingCount": "{prediction_count}",
    "bestRating": "{max_date}",
    "worstRating": "{min_date}"
  }
}
```

**And** Schema.org Event data:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "GTA 6 Launch Date",
  "startDate": "{median_date}",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://rockstargames.com"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Rockstar Games"
  }
}
```

**And** additional SEO tags:
- Canonical URL: `<link rel="canonical" href="https://gta6predictions.com/" />`
- Mobile viewport: `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- Language: `<html lang="en">`
- Favicon and app icons

**Prerequisites:** Story 2.10 (stats for dynamic content)

**Technical Notes:**
- Implements FR35 (meta title optimized for "GTA 6 predictions")
- Implements FR36 (meta description with community median)
- Implements FR37 (Schema.org VideoGame)
- Implements FR38 (Schema.org Event)
- Dynamic meta tags updated on every page load
- Test with Google Rich Results Test
- Submit sitemap to Google Search Console

---

## Story 5.5: Mobile-Responsive Design

As a user on mobile,
I want the site to work perfectly on my phone,
So that I can participate regardless of device.

**Acceptance Criteria:**

**Given** a user accesses the site on mobile
**When** the page loads
**Then** responsive layout is applied:

**Mobile Layout (<768px):**
- Single column layout
- Full-width date picker (native mobile picker)
- Large touch targets (44x44px minimum, FR87)
- Stacked stats (median above min/max)
- Share buttons stacked vertically
- Footer links collapsed or accordion

**Tablet Layout (768px-1024px):**
- Two-column layout (form left, stats right)
- Medium touch targets
- Side-by-side share buttons

**Desktop Layout (>1024px):**
- Three-column layout (stats, form, visualization)
- Hover states on buttons
- Expanded navigation

**And** responsive images:
- Hero image scales to viewport
- OG image optimized for mobile sharing
- Icons use SVG (scalable)

**And** touch optimization:
- No hover-dependent interactions
- Tap targets minimum 44x44px (FR87)
- No tiny text (minimum 16px base font)
- Comfortable spacing between tappable elements

**And** performance on mobile:
- Lazy load images
- Minimize JavaScript
- Critical CSS inline
- Load time < 3s on 3G (FR40)

**And** testing requirements (FR93):
- Test on iOS Safari (latest)
- Test on Android Chrome (latest)
- Test on various screen sizes (320px to 1920px)
- Pass Google Mobile-Friendly Test

**Prerequisites:** Story 3.1 (landing page layout)

**Technical Notes:**
- Implements FR39 (mobile-responsive, passes Google test)
- Implements FR40 (<3s mobile load time)
- Implements FR87 (44x44px touch targets)
- Implements FR93 (mobile testing requirement)
- Use CSS media queries or Tailwind breakpoints
- Mobile-first approach (design for mobile, enhance for desktop)
- Test with Chrome DevTools device emulator
- Real device testing critical for touch interactions

---

## Story 5.6: Performance Optimization for Fast Load Times

As a user,
I want the site to load instantly,
So that I don't abandon it due to slow performance.

**Acceptance Criteria:**

**Given** a user visits the site
**When** the page loads
**Then** performance targets are met:

**Load Time Targets (FR40):**
- Desktop (good connection): < 2 seconds
- Mobile (3G connection): < 3 seconds
- Lighthouse Performance score: >90 (FR94)

**Optimization Techniques:**

1. **HTML/CSS:**
   - Minify HTML, CSS, JS
   - Inline critical CSS
   - Defer non-critical CSS
   - Remove unused CSS

2. **JavaScript:**
   - Minify and bundle
   - Code splitting (load what's needed)
   - Defer non-critical JS
   - Lazy load chart library (only if user clicks)

3. **Images:**
   - WebP format with JPG fallback
   - Responsive images (srcset)
   - Lazy loading (native loading="lazy")
   - Compress with imagemin

4. **Fonts:**
   - System fonts preferred (no web font load)
   - If web fonts: font-display: swap
   - Preload critical fonts

5. **Caching:**
   - Cloudflare CDN (automatic)
   - Cache-Control headers (1 year for static assets)
   - Service Worker for offline (optional PWA)

6. **API:**
   - Stats API cached (5 min, Story 2.10)
   - Cloudflare KV global distribution
   - Minimize API calls (batch requests)

**And** Lighthouse audit results:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**And** monitoring (FR102):
- Track Core Web Vitals (LCP, FID, CLS)
- Cloudflare Analytics tracks load times
- Alert if p95 > 3 seconds

**Prerequisites:** All frontend stories complete

**Technical Notes:**
- Implements FR40 (<2s desktop, <3s mobile)
- Implements FR94 (Lighthouse >90)
- Implements FR102 (performance monitoring)
- Use Vite for build optimization (tree shaking, minification)
- Cloudflare Pages provides automatic optimizations
- Test with Lighthouse CI in pipeline
- WebPageTest.org for detailed waterfall analysis

---
