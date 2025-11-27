# Story 5.6: Performance Optimization for Fast Load Times

Status: ready-for-dev

## Story

As a user,
I want the site to load instantly,
so that I don't abandon it due to slow performance.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Lighthouse CI tests in GitHub Actions
- [ ] Test desktop load time (<2s)
- [ ] Test mobile 3G load time (<3s)
- [ ] Test Core Web Vitals (LCP, FID, CLS)
- [ ] Test asset caching (1-year headers)
- [ ] Test bundle sizes (<100KB total)

## Tasks / Subtasks

- [ ] Task 1: Minify HTML, CSS, JavaScript (AC: HTML/CSS optimization)
  - [ ] Configure Vite to minify JavaScript
  - [ ] Configure Tailwind CSS to minify and purge unused styles
  - [ ] Minify HTML via Cloudflare Pages build settings
  - [ ] Verify output sizes: HTML <10KB, CSS <10KB, JS <30KB

- [ ] Task 2: Implement critical CSS inlining (AC: HTML/CSS optimization)
  - [ ] Identify above-the-fold critical CSS
  - [ ] Inline critical CSS in <head>
  - [ ] Defer non-critical CSS with media="print" onload trick
  - [ ] Test with Lighthouse (eliminate render-blocking resources)

- [ ] Task 3: Optimize JavaScript loading (AC: JavaScript optimization)
  - [ ] Bundle JavaScript with Vite (tree-shaking enabled)
  - [ ] Defer non-critical JS (async/defer attributes)
  - [ ] Lazy load chart library (Chart.js only when toggled)
  - [ ] Code-split vendor dependencies (if applicable)

- [ ] Task 4: Optimize images (AC: Images optimization)
  - [ ] Convert images to WebP format
  - [ ] Provide JPEG fallback for older browsers
  - [ ] Implement responsive images with srcset
  - [ ] Add native lazy loading (loading="lazy")
  - [ ] Compress images with imagemin or Squoosh

- [ ] Task 5: Optimize fonts (AC: Fonts optimization)
  - [ ] Use system font stack (no web font download)
  - [ ] If web fonts needed: Use font-display: swap
  - [ ] Preload critical fonts with <link rel="preload">
  - [ ] Subset fonts (Latin only, reduce file size)

- [ ] Task 6: Configure caching headers (AC: Caching optimization)
  - [ ] Set Cache-Control: max-age=31536000 for static assets (1 year)
  - [ ] Set Cache-Control: max-age=300 for HTML (5 minutes)
  - [ ] Configure via Cloudflare Pages _headers file
  - [ ] Verify caching with Chrome DevTools Network tab

- [ ] Task 7: Optimize API calls (AC: API optimization)
  - [ ] Verify stats API cached 5 minutes (Story 2.10)
  - [ ] Minimize redundant API calls (cache client-side)
  - [ ] Use Cloudflare KV for global stats distribution
  - [ ] Batch requests if multiple endpoints needed

- [ ] Task 8: Run Lighthouse audit (AC: Lighthouse audit results)
  - [ ] Run Lighthouse on desktop (target >90)
  - [ ] Run Lighthouse on mobile (target >90)
  - [ ] Fix issues: Performance, Accessibility, Best Practices, SEO
  - [ ] Achieve >90 scores in all categories

- [ ] Task 9: Implement Core Web Vitals monitoring (AC: Monitoring - FR102)
  - [ ] Track LCP (Largest Contentful Paint, target <2.5s)
  - [ ] Track FID (First Input Delay, target <100ms)
  - [ ] Track CLS (Cumulative Layout Shift, target <0.1)
  - [ ] Use Cloudflare Web Analytics (built-in)
  - [ ] Set up alerts for p95 > 3 seconds (optional)

- [ ] Task 10: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/integration/performance.test.ts`
  - [ ] Configure Lighthouse CI in GitHub Actions
  - [ ] Test bundle sizes (<100KB total)
  - [ ] Test load times with throttling (desktop/mobile)
  - [ ] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.6 (Performance Optimization):**
- Desktop load time < 2 seconds (FR40)
- Mobile 3G load time < 3 seconds (FR40)
- Lighthouse Performance score >90 (FR94)
- Core Web Vitals monitoring (FR102)

[Source: docs/epics/epic-5-social-sharing-virality.md:309-381]

**From PRD - FR40 (Load Time Targets):**
- Site loads in < 2 seconds on desktop, < 3 seconds on mobile
- Performance is critical for viral growth (fast = shareable)

[Source: docs/PRD.md:296]

**From PRD - FR94 (Lighthouse Performance Score):**
- Lighthouse Performance score >90
- Ensures best practices and optimizations

[Source: docs/epics/epic-5-social-sharing-virality.md:324]

**From PRD - FR102 (Performance Monitoring):**
- Track Core Web Vitals (LCP, FID, CLS)
- Cloudflare Analytics tracks load times
- Alert if p95 > 3 seconds

[Source: docs/epics/epic-5-social-sharing-virality.md:367-370]

### Architecture Patterns

**From Architecture - Performance Considerations:**

**Optimization Strategies:**

1. **Minimal Bundle Size:**
   - Vanilla JS frontend (no framework overhead)
   - Tailwind CSS tree-shaken (~5-10KB)
   - Total JS: ~20-30KB (app.js + dependencies)
   - Total CSS: ~5-10KB

2. **Caching:**
   - `/api/stats`: Cache 5 minutes (Workers cache API)
   - `/widget`: Cache 5 minutes
   - `/api/predict`: Never cache (always fresh)
   - Static assets: 1-year cache via Cloudflare CDN

3. **Database Optimization:**
   - Indexes on frequently queried columns
   - Pre-calculate weights (stored in `weight` column)
   - Use `LIMIT` for pagination (future)

4. **API Response Times:**
   - `/api/stats`: < 200ms (cached)
   - `/api/predict`: < 500ms (database write)

5. **Concurrent Users:**
   - Target: 10,000 concurrent users without degradation
   - Cloudflare Workers auto-scale
   - D1 optimized for read-heavy (5M reads/day free)

6. **Critical Rendering Path:**
   - Inline critical CSS (above-the-fold)
   - Defer Google AdSense script (async load)
   - Lazy-load optional chart visualization (post-MVP)

[Source: docs/architecture.md:709-747]

**Cloudflare Pages _headers File:**
```
# Cache static assets for 1 year
/images/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/styles.css
  Cache-Control: public, max-age=31536000, immutable

# Cache HTML for 5 minutes
/
  Cache-Control: public, max-age=300
```

### Project Structure Notes

**File Structure:**
```
public/
├── _headers                       (NEW - Cloudflare Pages caching rules)
├── styles.css                     (OPTIMIZE - minify, purge unused)
├── js/
│   └── app.js                     (OPTIMIZE - minify, bundle)
├── images/
│   └── *.webp                     (OPTIMIZE - WebP format)
vite.config.ts                     (MODIFY - minification, code splitting)
tailwind.config.js                 (MODIFY - PurgeCSS configuration)
.github/
├── workflows/
│   └── lighthouse-ci.yml          (NEW - Lighthouse CI GitHub Action)
tests/
├── integration/
│   └── performance.test.ts        (NEW - performance tests)
```

**Deployment Notes:**
- Vite build optimizations (minification, tree-shaking)
- Cloudflare Pages automatic optimizations (Brotli, minification)
- Cloudflare CDN caching (global edge network)

### Learnings from Previous Story

**From Story 5.5 (Mobile-Responsive Design):**
- ✅ **Mobile performance optimization:** Reuse lazy loading, critical CSS
- ✅ **3G testing requirement:** Use Chrome DevTools throttling
- **Recommendation:** Verify mobile load time < 3s on Slow 3G

**From Story 5.4 (SEO Meta Tags):**
- ✅ **Meta tag injection middleware:** Ensure caching doesn't slow down
- **Recommendation:** Cache middleware output for 5 minutes

**From Story 2.10 (Statistics Calculation and Caching):**
- ✅ **Stats API cached 5 minutes:** Reduces database load
- ✅ **Cloudflare Workers cache:** Global edge caching
- **Recommendation:** Verify cache is working correctly

**From Story 1.3 (CI/CD Pipeline):**
- ✅ **GitHub Actions configured:** Add Lighthouse CI to pipeline
- **Recommendation:** Run Lighthouse on every PR

**From Architecture - ADR-002, ADR-003:**
- ✅ **Vanilla JS (no framework):** Minimal bundle size
- ✅ **Tailwind CSS tree-shaking:** Minimal CSS overhead
- **Recommendation:** Verify bundle sizes meet targets (<100KB total)

**New Patterns Created:**
- Lighthouse CI integration in GitHub Actions
- Critical CSS inlining strategy
- Core Web Vitals monitoring

**Files to Modify:**
- `vite.config.ts` - Build optimizations
- `tailwind.config.js` - PurgeCSS configuration
- `.github/workflows/ci.yml` - Add Lighthouse CI step

**Technical Debt to Address:**
- Audit existing bundle sizes (may already be optimized)
- Remove any unused dependencies

### References

**Epic Breakdown:**
- [Epic 5 Story 5.6 Definition](docs/epics/epic-5-social-sharing-virality.md:309-381)

**PRD:**
- [PRD - FR40: <2s Desktop, <3s Mobile Load Time](docs/PRD.md:296)
- [PRD - FR94: Lighthouse >90 Score](docs/epics/epic-5-social-sharing-virality.md:324)
- [PRD - FR102: Performance Monitoring](docs/epics/epic-5-social-sharing-virality.md:367-370)

**Architecture:**
- [Architecture - Performance Considerations](docs/architecture.md:709-747)
- [Architecture - ADR-002: Vanilla JS](docs/architecture.md:992-1010)
- [Architecture - ADR-003: Tailwind CSS](docs/architecture.md:1012-1024)

**Dependencies:**
- Story 5.5 (Mobile-responsive - mobile performance)
- Story 2.10 (Stats caching - API performance)
- Story 1.3 (CI/CD - add Lighthouse CI)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**External Resources:**
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Cloudflare Pages Optimization](https://developers.cloudflare.com/pages/platform/serving-pages/)
- [WebPageTest](https://www.webpagetest.org/)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-6-performance-optimization-for-fast-load-times.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
