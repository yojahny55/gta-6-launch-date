# Story 5.3: Open Graph Meta Tags for Rich Previews

Status: ready-for-dev

## Story

As a system,
I want dynamic Open Graph meta tags,
so that shared links show rich previews with current data.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Integration tests for meta tag injection
- [ ] Test default meta tags (no u parameter)
- [ ] Test personalized meta tags (with u parameter)
- [ ] Test cache behavior (5-minute TTL)
- [ ] Test dynamic description with current median
- [ ] Test fallback to static image

## Tasks / Subtasks

- [ ] Task 1: Create Workers middleware for meta tag injection (AC: Meta tags)
  - [ ] Create `src/middleware/meta-injection.ts`
  - [ ] Intercept HTML responses
  - [ ] Fetch current stats from `/api/stats`
  - [ ] Inject dynamic meta tags into HTML <head>
  - [ ] Apply 5-minute cache to avoid D1 overload

- [ ] Task 2: Implement default Open Graph tags (AC: Meta tags)
  - [ ] Generate og:title: "GTA 6 Launch Date Predictions - Community Sentiment"
  - [ ] Generate og:description with current median + total count
  - [ ] Set og:image to static branded image
  - [ ] Set og:url to canonical URL
  - [ ] Set og:type to "website"

- [ ] Task 3: Implement Twitter Card tags (AC: Meta tags)
  - [ ] Set twitter:card to "summary_large_image"
  - [ ] Set twitter:title to concise version
  - [ ] Set twitter:description with median + count
  - [ ] Set twitter:image to same OG image

- [ ] Task 4: Implement personalized meta tags (AC: Personalized sharing - FR23)
  - [ ] Detect `?u={hash}` parameter in URL
  - [ ] Look up user prediction from database by cookie_id hash
  - [ ] Generate personalized title: "I predicted {user_date} for GTA 6"
  - [ ] Generate personalized description with comparison
  - [ ] Fall back to default tags if user not found

- [ ] Task 5: Create static Open Graph image (AC: Dynamic image - fallback)
  - [ ] Design 1200x630px image
  - [ ] Include branding: "GTA 6 Launch Date Predictions"
  - [ ] Include placeholder text or visual
  - [ ] Optimize for social sharing (< 1MB)
  - [ ] Place in `public/images/og-image.png`

- [ ] Task 6: (Optional) Implement dynamic image generation (AC: Dynamic image)
  - [ ] Create image generation endpoint `/api/og-image`
  - [ ] Use Canvas API or image generation library
  - [ ] Render current median + total count
  - [ ] Cache generated image for 1 hour
  - [ ] Return PNG with proper headers

- [ ] Task 7: Implement cache strategy (AC: Meta tag updates)
  - [ ] Cache meta tag injection for 5 minutes (Cloudflare Workers Cache API)
  - [ ] Cache OG image generation for 1 hour (if implemented)
  - [ ] Invalidate cache on stats update (optional optimization)
  - [ ] Ensure fresh data on social crawler requests

- [ ] Task 8: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/integration/meta-injection.test.ts`
  - [ ] Test default meta tags generation
  - [ ] Test personalized meta tags with u parameter
  - [ ] Test cache TTL behavior
  - [ ] Test fallback to default when user not found
  - [ ] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.3 (Open Graph Meta Tags):**
- Dynamic Open Graph meta tags (FR22)
- Personalized prediction in shared links (FR23)
- Server-side rendering required for social crawlers
- Cache for 5 minutes (same as stats API)

[Source: docs/epics/epic-5-social-sharing-virality.md:110-161]

**From PRD - FR22 (Dynamic Open Graph Meta Tags):**
- System generates dynamic Open Graph meta tags for rich previews
- Social platforms display rich cards when links are shared

[Source: docs/PRD.md:269]

**From PRD - FR23 (Personalized Prediction in Shared Links):**
- Shared links show personalized prediction + community median
- Enables "I predicted X" viral sharing

[Source: docs/PRD.md:270]

### Architecture Patterns

**From Architecture - Dynamic Meta Tags via Workers Middleware:**
```typescript
// src/middleware/meta-injection.ts
import { Context } from 'hono';

export async function injectMetaTags(c: Context, next: () => Promise<void>) {
  await next();

  // Only process HTML responses
  const contentType = c.res.headers.get('content-type');
  if (!contentType?.includes('text/html')) {
    return;
  }

  // Fetch current stats (cached 5min)
  const stats = await c.env.DB.prepare(
    'SELECT * FROM cached_stats WHERE id = 1'
  ).first();

  // Generate meta tags
  const metaTags = `
    <meta property="og:title" content="GTA 6 Launch Date Predictions - Community Sentiment" />
    <meta property="og:description" content="The community predicts GTA 6 will launch on ${stats.median} (median of ${stats.total} predictions). What do you think?" />
    <meta property="og:image" content="https://gta6predictions.com/og-image.png" />
    <meta property="og:url" content="${c.req.url}" />
    <meta property="og:type" content="website" />
  `;

  // Inject into <head>
  const html = await c.res.text();
  const modifiedHtml = html.replace('</head>', `${metaTags}</head>`);

  return c.html(modifiedHtml);
}
```

[Source: docs/architecture.md:1086-1106 - ADR-007: Dynamic meta tags via Workers middleware]

**Open Graph Image Specifications:**
- Dimensions: 1200x630px (optimal for all platforms)
- Format: PNG or JPG
- Size: < 1MB (< 300KB recommended)
- Aspect ratio: 1.91:1

### Project Structure Notes

**File Structure:**
```
src/
├── middleware/
│   └── meta-injection.ts          (NEW - dynamic meta tag injection)
├── routes/
│   └── og-image.ts                (NEW - optional dynamic image generation)
public/
├── images/
│   └── og-image.png               (NEW - static fallback image)
tests/
├── integration/
│   └── meta-injection.test.ts     (NEW - meta tag tests)
```

**Deployment Notes:**
- Server-side rendering required (Cloudflare Workers middleware)
- Static image hosted on Cloudflare Pages
- Dynamic image (optional) served via Workers endpoint
- Cache via Cloudflare Workers Cache API (5min TTL)

### Learnings from Previous Story

**From Story 5.2 (Reddit Share Button):**
- ✅ **URL parameter pattern:** Reuse `u={hash}` for personalization
- **Recommendation:** Look up user prediction by hash for personalized meta tags

**From Story 2.10 (Statistics Calculation and Caching):**
- ✅ **Stats API with 5-minute cache:** Reuse stats data for meta tags
- ✅ **Cached stats available:** Access via `/api/stats` or direct DB query
- **Recommendation:** Use same 5-minute cache for meta tag injection

**From Story 2.1 (Secure Cookie ID Generation):**
- ✅ **Cookie ID hashing:** Use SHA-256 hash for `u` parameter lookup
- **Recommendation:** Query predictions table by cookie_id hash

**From Story 3.2 (Social Comparison Messaging):**
- ✅ **Comparison logic exists:** Reuse optimistic/pessimistic/aligned logic
- **Recommendation:** Use for personalized meta tag descriptions

**New Patterns Created:**
- Workers middleware for HTML interception
- Dynamic meta tag injection with caching
- Personalized meta tags based on URL parameters

**Files to Modify:**
- `src/index.ts` - Register meta injection middleware
- `public/index.html` - Add placeholder meta tags (overridden by middleware)

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 5 Story 5.3 Definition](docs/epics/epic-5-social-sharing-virality.md:110-161)

**PRD:**
- [PRD - FR22: Dynamic Open Graph Meta Tags](docs/PRD.md:269)
- [PRD - FR23: Personalized Prediction in Shared Links](docs/PRD.md:270)

**Architecture:**
- [Architecture - ADR-007: Dynamic Meta Tags via Workers Middleware](docs/architecture.md:1086-1106)
- [Architecture - Caching Strategy](docs/architecture.md:709-747)

**Dependencies:**
- Story 2.10 (Stats API - data for meta tags)
- Story 2.1 (Cookie ID generation - hash for personalization)
- Story 5.1, 5.2 (Share buttons - u parameter pattern)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**External Resources:**
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-3-open-graph-meta-tags-for-rich-previews.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
