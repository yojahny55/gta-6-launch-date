# Story 5.4: SEO Meta Tags and Structured Data

Status: ready-for-dev

## Story

As a site owner,
I want optimized meta tags and structured data,
so that the site ranks well for "GTA 6 predictions" searches.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Integration tests for SEO meta tags
- [ ] Test dynamic meta description with current median
- [ ] Test Schema.org VideoGame structured data
- [ ] Test Schema.org Event structured data
- [ ] Validate JSON-LD syntax
- [ ] Test with Google Rich Results Test

## Tasks / Subtasks

- [ ] Task 1: Implement basic SEO meta tags (AC: Basic meta tags)
  - [ ] Add `<title>` tag optimized for "GTA 6 predictions" (FR35)
  - [ ] Add meta description with dynamic median + total count (FR36)
  - [ ] Add meta keywords (optional, low SEO value)
  - [ ] Ensure tags updated on every page load (server-side)

- [ ] Task 2: Implement Schema.org VideoGame structured data (AC: VideoGame - FR37)
  - [ ] Create JSON-LD script in <head>
  - [ ] Set VideoGame name: "Grand Theft Auto VI"
  - [ ] Set platforms: PlayStation 5, Xbox Series X
  - [ ] Set publisher: Rockstar Games
  - [ ] Add aggregateRating with dynamic median/min/max/count
  - [ ] Use current stats from API

- [ ] Task 3: Implement Schema.org Event structured data (AC: Event - FR38)
  - [ ] Create JSON-LD script for Event
  - [ ] Set event name: "GTA 6 Launch Date"
  - [ ] Set startDate to community median
  - [ ] Set location to VirtualLocation (Rockstar Games URL)
  - [ ] Set organizer to Rockstar Games

- [ ] Task 4: Add canonical URL and mobile meta tags (AC: Additional SEO tags)
  - [ ] Add canonical link: `https://gta6predictions.com/`
  - [ ] Add viewport meta tag for mobile
  - [ ] Set HTML lang attribute to "en"
  - [ ] Ensure proper charset declaration (UTF-8)

- [ ] Task 5: Add favicon and app icons (AC: Additional SEO tags)
  - [ ] Create favicon.ico (16x16, 32x32, 48x48)
  - [ ] Create apple-touch-icon.png (180x180)
  - [ ] Create icon-192.png and icon-512.png (PWA)
  - [ ] Add manifest.json for PWA metadata (optional)

- [ ] Task 6: Implement dynamic meta tag updates (AC: Meta tag updates)
  - [ ] Fetch current stats on every page load
  - [ ] Update meta description with current median
  - [ ] Update Schema.org aggregateRating values
  - [ ] Update Schema.org Event startDate
  - [ ] Cache for 5 minutes (same as stats API)

- [ ] Task 7: Validate structured data (AC: All)
  - [ ] Test with Google Rich Results Test
  - [ ] Validate JSON-LD syntax
  - [ ] Ensure no schema errors
  - [ ] Check mobile-friendliness (Google Mobile-Friendly Test)

- [ ] Task 8: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/integration/seo-meta-tags.test.ts`
  - [ ] Test title tag generation
  - [ ] Test meta description with dynamic data
  - [ ] Test Schema.org VideoGame JSON-LD
  - [ ] Test Schema.org Event JSON-LD
  - [ ] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.4 (SEO Meta Tags and Structured Data):**
- Meta title optimized for "GTA 6 predictions" (FR35)
- Meta description with community median (FR36)
- Schema.org VideoGame structured data (FR37)
- Schema.org Event structured data (FR38)
- Dynamic meta tags updated on every page load

[Source: docs/epics/epic-5-social-sharing-virality.md:164-238]

**From PRD - FR35 (Meta Title Optimization):**
- System generates meta title tag optimized for "GTA 6 predictions"
- Title should be compelling for search results

[Source: docs/PRD.md:291]

**From PRD - FR36 (Meta Description with Community Median):**
- System generates meta description tag with community median
- Description dynamically updated with current data

[Source: docs/PRD.md:292]

**From PRD - FR37 (Schema.org VideoGame):**
- System implements Schema.org structured data for VideoGame
- Helps search engines understand content context

[Source: docs/PRD.md:293]

**From PRD - FR38 (Schema.org Event):**
- System implements Schema.org structured data for Event (launch date)
- Treats median as "event date" for search engines

[Source: docs/PRD.md:294]

### Architecture Patterns

**From Architecture - Meta Tag Injection:**
```typescript
// Extend meta injection middleware from Story 5.3
export async function injectMetaTags(c: Context, next: () => Promise<void>) {
  await next();

  // Fetch current stats (cached 5min)
  const stats = await fetchStats(c.env.DB);

  // Generate SEO meta tags
  const seoTags = `
    <title>GTA 6 Launch Date Predictions - Community Sentiment Tracker</title>
    <meta name="description" content="Track community predictions for GTA 6's launch date. Submit your prediction and see what ${stats.total} other fans think. Current median: ${stats.median}." />
    <meta name="keywords" content="GTA 6, launch date, predictions, community, Rockstar, Grand Theft Auto 6" />
    <link rel="canonical" href="https://gta6predictions.com/" />
  `;

  // Generate Schema.org JSON-LD
  const schemaVideoGame = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Grand Theft Auto VI",
    "gamePlatform": ["PlayStation 5", "Xbox Series X"],
    "publisher": { "@type": "Organization", "name": "Rockstar Games" },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": stats.median,
      "ratingCount": stats.total,
      "bestRating": stats.max,
      "worstRating": stats.min
    }
  };

  const schemaEvent = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "GTA 6 Launch Date",
    "startDate": stats.median,
    "location": { "@type": "VirtualLocation", "url": "https://rockstargames.com" },
    "organizer": { "@type": "Organization", "name": "Rockstar Games" }
  };

  // Inject into HTML
  const html = await c.res.text();
  const modifiedHtml = html.replace(
    '</head>',
    `${seoTags}
    <script type="application/ld+json">${JSON.stringify(schemaVideoGame)}</script>
    <script type="application/ld+json">${JSON.stringify(schemaEvent)}</script>
    </head>`
  );

  return c.html(modifiedHtml);
}
```

[Source: docs/architecture.md:1086-1106 - ADR-007 Extended]

**Schema.org Best Practices:**
- Use JSON-LD format (recommended by Google)
- Place in <head> section
- Validate with Google Rich Results Test
- Use specific types (VideoGame, Event, Organization)

### Project Structure Notes

**File Structure:**
```
src/
├── middleware/
│   └── meta-injection.ts          (MODIFY - add SEO tags + Schema.org)
public/
├── images/
│   ├── favicon.ico                (NEW - favicon)
│   ├── apple-touch-icon.png       (NEW - Apple icon)
│   ├── icon-192.png               (NEW - PWA icon)
│   └── icon-512.png               (NEW - PWA icon)
├── manifest.json                  (NEW - PWA manifest, optional)
tests/
├── integration/
│   └── seo-meta-tags.test.ts      (NEW - SEO tests)
```

**Deployment Notes:**
- Server-side rendering required (Cloudflare Workers middleware)
- Static icons hosted on Cloudflare Pages
- Dynamic meta tags via Workers middleware
- Cache via Cloudflare Workers Cache API (5min TTL)

### Learnings from Previous Story

**From Story 5.3 (Open Graph Meta Tags):**
- ✅ **Meta injection middleware exists:** Extend for SEO tags
- ✅ **Stats fetching with cache:** Reuse for dynamic SEO tags
- **Recommendation:** Combine OG tags and SEO tags in same middleware

**From Story 2.10 (Statistics Calculation and Caching):**
- ✅ **Stats API with 5-minute cache:** Reuse stats data for SEO
- ✅ **Median, min, max, total available:** Use for Schema.org aggregateRating
- **Recommendation:** Use cached stats to populate structured data

**New Patterns Created:**
- Schema.org JSON-LD structured data generation
- Dynamic SEO meta tag generation
- Favicon and app icon management

**Files to Modify:**
- `src/middleware/meta-injection.ts` - Add SEO tags and Schema.org
- `public/index.html` - Add placeholders for meta tags

**Technical Debt to Address:**
- Consolidate meta injection (OG tags + SEO tags) to avoid duplication

### References

**Epic Breakdown:**
- [Epic 5 Story 5.4 Definition](docs/epics/epic-5-social-sharing-virality.md:164-238)

**PRD:**
- [PRD - FR35: Meta Title Optimized for "GTA 6 predictions"](docs/PRD.md:291)
- [PRD - FR36: Meta Description with Community Median](docs/PRD.md:292)
- [PRD - FR37: Schema.org VideoGame](docs/PRD.md:293)
- [PRD - FR38: Schema.org Event](docs/PRD.md:294)

**Architecture:**
- [Architecture - ADR-007: Dynamic Meta Tags via Workers Middleware](docs/architecture.md:1086-1106)
- [Architecture - Caching Strategy](docs/architecture.md:709-747)

**Dependencies:**
- Story 5.3 (Open Graph meta tags - extend middleware)
- Story 2.10 (Stats API - data for SEO tags)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**External Resources:**
- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [JSON-LD Playground](https://json-ld.org/playground/)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-4-seo-meta-tags-and-structured-data.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
