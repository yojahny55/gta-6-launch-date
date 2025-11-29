# GTA 6 Launch Date Prediction Tracker - Product Requirements Document

**Author:** yojahny
**Date:** 2025-11-13
**Version:** 1.0

---

## Executive Summary

**Vision:** Create the ONLY place where the GTA 6 community can voice what they actually believe about the launch date - not what Rockstar says, but what fans think. Transform community skepticism into engagement through a simple, viral prediction tracker.

**The Problem:** Rockstar delayed GTA 6 from May to November 2026. The community is skeptical. Existing countdown sites treat the official date as gospel, but NO tool captures what the community actually believes. There's a gap between official announcements and community sentiment.

**The Solution:** A frictionless web app where fans anonymously predict when GTA 6 will actually launch. Aggregate predictions show community sentiment (median, min, max), validate individual skepticism ("Am I crazy or does everyone agree?"), and provide shareable data that streamers and media can embed.

**Market Opportunity:** 1M+ Reddit subscribers, 366K+ Discord members, 268M+ YouTube views = massive engaged audience with zero competition in prediction tracking space.

### What Makes This Special

**Community sentiment tracking disguised as a prediction game.**

While others build passive countdown timers, we give fans a voice. The weighted algorithm handles trolls democratically (extreme predictions count but have less influence). Simplicity IS the competitive advantage - one clean tool that does one thing perfectly beats complex forums through frictionlessness.

**Viral mechanics by design:** Bold, screenshot-worthy results (Spotify Wrapped-style), social comparison ("Am I the only one?"), embeddable widgets for streamers (250M+ content views), and SEO optimization create natural growth without paid acquisition.

---

## Project Classification

**Technical Type:** Web Application (SaaS-like, but free/ad-supported)
**Domain:** Gaming / Community Tools
**Complexity:** Low-Medium (Simple MVP, sophisticated algorithm)

**Project Classification:** Greenfield web application with clear product-market fit validation from research. Consumer-facing tool with B2B distribution channel (streamers, news sites).

---

## Success Criteria

**MVP Success (2-Week Launch):**
- Ship functional prediction tracker with weighted algorithm
- Zero cost infrastructure (Cloudflare free tier)
- Embeddable widgets ready for distribution
- Initial traction on r/GTA6

**6-Month Validation Criteria:**
- **10K predictions** = Decent validation (consider iteration)
- **100K predictions** = Strong validation (execute multi-game expansion)
- **10+ creators** using embed widget
- **3+ gaming news sites** reference or embed data
- **<80% bounce rate** (user experience is working)
- **Organic sharing** happening without prompting

**Business Success:**
- Ad revenue covers domain costs ($10-15/year) - low bar
- Viral coefficient > 1.0 (each user brings more than 1 new user)
- Data becomes reference point for GTA 6 community sentiment

**When We Know We've Won:**
- Gaming journalists cite community predictions in articles
- Streamers embed widget in their channels
- "What does the community think?" becomes synonymous with our tool
- Community median prediction becomes newsworthy when it shifts

---

## Product Scope

### MVP - Minimum Viable Product (2 Weeks)

**Core Prediction Engine:**
1. Anonymous prediction submission via browser cookies
2. Simple date picker (reasonable validation, 100-year max)
3. One submission per IP address (anti-spam)
4. Update capability for returning users (via cookie)
5. Weighted median algorithm (outliers have reduced influence)
6. Real-time statistics display:
   - Community median prediction
   - Minimum date predicted
   - Maximum date predicted
   - Total predictions count

**Sharing & Distribution:**
7. Social sharing buttons (Twitter/X, Reddit) with pre-filled text
8. Embeddable iframe widget (copy-paste code)
9. SEO optimization (meta tags, structured data)
10. Mobile-responsive design

**User Experience:**
11. Clean, fast-loading interface (< 2 second load)
12. Social comparison messaging ("You're optimistic/pessimistic compared to community")
13. Delta from median display ("[X days earlier/later] than community")
14. Dashboard grid layout (Total Predictions, Community Median, Official Date, Optimism Score)
15. Optimism Score calculation (% believing launch before official date)
16. "My Prediction" display card for returning users

**Monetization:**
17. Google AdSense integration (small banner)
18. User opt-out for ads (builds goodwill)

**Legal/Privacy:**
19. Cookie consent banner
20. Privacy Policy page
21. Terms of Service page
22. Hashed IP storage (GDPR compliant)

### Growth Features (Post-MVP, Month 2-6)

**Enhanced Engagement:**
- Email notifications (optional registration)
  - Major data shifts
  - User wants to update prediction
  - Milestone achievements (10K predictions, etc.)
- Optional charts/visualizations (default hidden, user toggle)
- Prediction history for returning users
- "Confidence level" indicator (how far from median)

**Content & Community:**
- News aggregator crawling GTA 6 updates
- Event correlation: "Predictions shifted +/- X days after [trailer/announcement]"
- "Community confidence" trending metrics
- RSS feed for prediction data

**Distribution:**
- Widget customization (themes, sizes)
- API for advanced integrations
- Partnership program for creators

### Vision (Future, Year 2+)

**Multi-Game Platform:**
- Expand to Elder Scrolls 6, other highly anticipated games
- Cross-game leaderboards ("Best predictor in gaming")
- Community-requested game additions
- Transform into "Gaming Prediction Hub"

**Advanced Features:**
- Live chat organized by prediction clusters
- Betting/gamification (confidence wagering, prizes)
- Premium tier (early access to news, advanced analytics)
- Post-launch DLC prediction tracking
- Developer/insider AMA sessions

---

## Web Application Specific Requirements

**Platform:** Progressive Web App (PWA-ready but not required for MVP)
**Deployment:** Cloudflare Pages (static frontend) + Workers (API) + D1 (database)
**Access:** Public, no authentication required for core features

**Technical Constraints:**
- Must work on Cloudflare free tier (100K requests/day, 5M DB reads/day)
- Must be globally accessible (Cloudflare CDN)
- Must load in < 2 seconds on 3G connection
- Must work on all modern browsers (Chrome, Firefox, Safari, Edge)

**Data Architecture:**
- SQLite database via Cloudflare D1
- Cookie-based user tracking (no accounts)
- IP hashing for rate limiting (privacy-preserving)
- Optional email collection (double opt-in)

**API Endpoints:**

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/api/predict` | POST | Submit new prediction | 1 per IP |
| `/api/predict/:cookie_id` | PUT | Update existing prediction | Unlimited (own cookie) |
| `/api/stats` | GET | Fetch aggregate statistics | Cached 5min |
| `/api/embed` | GET | Widget data (lightweight) | Cached 5min |

**Security Requirements:**
- HTTPS only (Cloudflare automatic)
- IP addresses hashed before storage
- Cookie-based sessions (httpOnly, secure, sameSite)
- Input validation (date range limits)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized outputs)

---

## User Experience Principles

**Design Philosophy:** "Ruthlessly simple with optional depth"

**Core Values:**
1. **Friction-Free:** Submit prediction in 10 seconds or less
2. **Instant Gratification:** See community sentiment immediately
3. **Social Validation:** "Am I crazy?" answered instantly
4. **Shareable by Default:** Every result wants to be shared

**Visual Personality:**
- **Bold & Energetic:** Gaming aesthetic with neon purple/pink gradients, GTA-themed visual identity
- **Screenshot-Worthy:** Designed for social sharing (Spotify Wrapped-style results presentation)
- **Trustworthy:** Data-driven with transparent methodology, real-time calculations (no placeholders)
- **Playful:** Community-focused humor about delays and hype
- **Fast:** Minimal animations, instant feedback, optimized for viral sharing

**Key Interaction Patterns:**

1. **Landing Experience:**
   - Headline: "When Will GTA 6 Actually Launch?"
   - Subhead: "Rockstar says November 19, 2026. What does the community think?"
   - Prominent date picker + submit button
   - Live stats visible (builds trust)

2. **Submission Flow:**
   - Pick date → Click submit → Instant results
   - No loading spinners (optimistic UI)
   - Celebrate submission ("You're #10,234!")

3. **Results Display:**
   - Primary: Community median (big, bold)
   - Secondary: Your prediction vs median ("3 months more optimistic")
   - Tertiary: Min/max range + total predictions
   - CTA: Share buttons (pre-filled tweets)

4. **Returning Users:**
   - Recognize via cookie
   - Show previous prediction
   - Allow update (not re-submission)
   - Show how prediction changed

**Mobile Experience:**
- Touch-friendly date picker
- Thumb-optimized button placement
- Readable without zoom
- Fast on 3G/4G

---

## Functional Requirements

**CRITICAL: This section defines ALL capabilities that must exist. Everything below will be designed (UX), architected (tech), and implemented (dev).**

### User Prediction Management

**FR1:** Users can submit anonymous predictions for GTA 6 launch date via date picker
**FR2:** Users can select any date within a reasonable range (2025-2125, 100-year max)
**FR3:** Users receive unique cookie identifier for future updates
**FR4:** Users can update their prediction unlimited times (via cookie recognition)
**FR5:** System enforces one initial submission per IP address (anti-spam)
**FR6:** Users receive immediate visual confirmation of submission with prediction count

### Data Aggregation & Algorithm

**FR7:** System calculates community median prediction using weighted algorithm
**FR8:** System applies weights based on prediction reasonableness:
  - 2025-2030: weight = 1.0 (full influence)
  - 2030-2075: weight = 0.3 (reduced influence)
  - Beyond 2075: weight = 0.1 (minimal influence)
**FR9:** System tracks actual minimum date predicted (unweighted)
**FR10:** System tracks actual maximum date predicted (unweighted)
**FR11:** System counts total predictions submitted
**FR12:** System updates statistics in near real-time (< 5 minute cache)

### Results Display

**FR13:** Users can view community median prediction prominently
**FR14:** Users can view minimum date predicted by community
**FR15:** Users can view maximum date predicted by community
**FR16:** Users can view total number of predictions submitted
**FR17:** Users can see social comparison ("You're optimistic/pessimistic compared to community")
**FR18:** Users can see quantified delta from median ("[X] days earlier/later than community")
**FR19:** Users can toggle optional chart visualization (default: off)

### Social Sharing

**FR20:** Users can share their prediction to Twitter/X with pre-filled text
**FR21:** Users can share their prediction to Reddit with pre-filled text
**FR22:** System generates dynamic Open Graph meta tags for rich previews
**FR23:** Shared links show personalized prediction + community median

### Embed Widget

**FR24:** Anyone can generate embeddable iframe code via copy-paste
**FR25:** Widget displays live community median prediction
**FR26:** Widget displays total predictions count
**FR27:** Widget links back to main site for full experience
**FR28:** Widget is lightweight (< 50KB total load)
**FR29:** Widget supports basic theming (light/dark)

### Email Notifications (Optional Feature)

**FR30:** Users can optionally provide email address for notifications
**FR31:** System sends double opt-in confirmation email
**FR32:** Users receive notification when community median shifts significantly (> 7 days)
**FR33:** Users receive reminder to update prediction after major news events
**FR34:** Users can unsubscribe from all emails with one click

### SEO & Discoverability

**FR35:** System generates meta title tag optimized for "GTA 6 predictions"
**FR36:** System generates meta description tag with community median
**FR37:** System implements Schema.org structured data for VideoGame
**FR38:** System implements Schema.org structured data for Event (launch date)
**FR39:** Site is mobile-responsive and passes Google mobile-friendly test
**FR40:** Site loads in < 2 seconds on desktop, < 3 seconds on mobile

### Analytics & Tracking

**FR41:** System tracks prediction submissions over time
**FR42:** System tracks traffic sources (Reddit, Google, Direct, etc.)
**FR43:** System tracks user geography (country-level)
**FR44:** System tracks returning user rate (cookie-based)
**FR45:** System tracks social share click-through rate
**FR46:** System tracks embed widget usage (referrer tracking)

### Monetization

**FR47:** System displays Google AdSense banner advertisement (non-intrusive placement)
**FR48:** Users can disable ads via simple toggle (saved to localStorage)
**FR49:** Ad preference persists across sessions (cookie-based)

### Legal & Privacy

**FR50:** System displays cookie consent banner on first visit (GDPR)
**FR51:** Users can access Privacy Policy via footer link
**FR52:** Users can access Terms of Service via footer link
**FR53:** System hashes IP addresses before storage (BLAKE2 or similar)
**FR54:** Users can request data deletion via contact form
**FR55:** System complies with GDPR "right to be forgotten"

### Administration (Future)

**FR56:** Admin can view prediction distribution histogram
**FR57:** Admin can view traffic and usage analytics
**FR58:** Admin can moderate/remove abusive predictions (spam filter)

---

## Non-Functional Requirements

### Performance

**NFR-P1:** Page load time < 2 seconds on desktop (3G connection)
**NFR-P2:** Page load time < 3 seconds on mobile (3G connection)
**NFR-P3:** API response time < 200ms for /api/stats (cached)
**NFR-P4:** API response time < 500ms for /api/predict (database write)
**NFR-P5:** System handles 10,000 concurrent users without degradation
**NFR-P6:** Database queries optimized with proper indexing
**NFR-P7:** Static assets cached with 1-year expiry (Cloudflare CDN)

**Why:** Friction kills viral growth. Fast = shareable. Slow = abandoned.

### Security

**NFR-S1:** All traffic served over HTTPS (TLS 1.3)
**NFR-S2:** IP addresses hashed with salt before storage (BLAKE2 or PBKDF2)
**NFR-S3:** Cookies set with httpOnly, secure, sameSite=Strict flags
**NFR-S4:** All user inputs validated and sanitized (XSS prevention)
**NFR-S5:** All database queries use parameterized statements (SQL injection prevention)
**NFR-S6:** Rate limiting enforced at IP and cookie levels
**NFR-S7:** No sensitive data stored in plain text

**Why:** Gaming communities attract trolls. Privacy matters for GDPR. Trust = growth.

### Scalability

**NFR-SC1:** Architecture supports 100K+ predictions without code changes
**NFR-SC2:** Database schema designed for future multi-game expansion
**NFR-SC3:** Cloudflare free tier handles expected traffic (100K req/day)
**NFR-SC4:** System degrades gracefully if traffic exceeds limits (caching, queueing)
**NFR-SC5:** Horizontal scaling possible via Cloudflare paid tier (if needed)

**Why:** Viral spikes are unpredictable. Must handle 10x traffic without crashing.

### Reliability

**NFR-R1:** System uptime > 99.5% (Cloudflare SLA)
**NFR-R2:** Database backups daily (Cloudflare D1 automatic)
**NFR-R3:** Zero data loss tolerance for predictions
**NFR-R4:** Graceful error handling (user-friendly messages)
**NFR-R5:** Monitoring and alerts for downtime (Cloudflare analytics)

**Why:** If site is down during Rockstar announcement, we lose trust permanently.

### Usability

**NFR-U1:** Core prediction flow completable in < 10 seconds
**NFR-U2:** No account creation required for core features
**NFR-U3:** Works on all modern browsers (Chrome, Firefox, Safari, Edge, last 2 versions)
**NFR-U4:** Works on mobile devices (iOS Safari, Android Chrome)
**NFR-U5:** Accessible keyboard navigation (tab order logical)
**NFR-U6:** Minimum contrast ratio 4.5:1 for text (WCAG AA)

**Why:** Friction = drop-off. Simplicity = viral growth. Accessibility = broader reach.

### Maintainability

**NFR-M1:** Code written in TypeScript (type safety)
**NFR-M2:** Database schema documented with comments
**NFR-M3:** API endpoints documented (OpenAPI/Swagger optional)
**NFR-M4:** Git repository with clear commit messages
**NFR-M5:** README with setup instructions
**NFR-M6:** Environment variables for configuration (no hardcoded secrets)

**Why:** Solo developer needs clean code for future iteration. AI tools work better with typed code.

---

## Implementation Planning

### Technical Stack (Validated via Research)

**Frontend:**
- Cloudflare Pages (static hosting, global CDN)
- HTML/CSS/JavaScript (or lightweight framework like Preact/Svelte)
- Minimal dependencies for fast load

**Backend:**
- Cloudflare Workers (serverless edge compute)
- TypeScript for type safety
- API endpoints for predictions and stats

**Database:**
- Cloudflare D1 (serverless SQLite)
- Schema: predictions table, email_subscriptions table (optional)
- Indexes on: predicted_date, cookie_id, ip_hash

**Third-Party:**
- Google AdSense (monetization)
- Google Analytics (free tier, analytics)
- Optional: Plausible or Simple Analytics (privacy-friendly alternative)

**Cost:** $0/month on free tiers (100K requests/day ample for MVP validation)

### Database Schema

```sql
CREATE TABLE predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
);

CREATE TABLE email_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  cookie_id TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  unsubscribe_token TEXT UNIQUE
);

CREATE INDEX idx_predictions_date ON predictions(predicted_date);
CREATE INDEX idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX idx_predictions_submitted ON predictions(submitted_at);
CREATE INDEX idx_email_verified ON email_subscriptions(verified);
```

### Weighted Median Algorithm (Pseudocode)

```typescript
function calculateWeightedMedian(predictions: Prediction[]): Date {
  // Apply weights based on reasonableness
  const weighted = predictions.map(p => ({
    date: p.predicted_date,
    weight: calculateWeight(p.predicted_date)
  }));

  // Sort by date
  weighted.sort((a, b) => a.date - b.date);

  // Find weighted median (50th percentile by cumulative weight)
  const totalWeight = weighted.reduce((sum, p) => sum + p.weight, 0);
  const targetWeight = totalWeight / 2;

  let cumulativeWeight = 0;
  for (const item of weighted) {
    cumulativeWeight += item.weight;
    if (cumulativeWeight >= targetWeight) {
      return item.date;
    }
  }
}

function calculateWeight(date: Date): number {
  const officialDate = new Date('2026-11-19');
  const yearsDiff = Math.abs((date - officialDate) / (365.25 * 24 * 60 * 60 * 1000));

  if (yearsDiff <= 5) return 1.0;    // 2025-2030: full weight
  if (yearsDiff <= 50) return 0.3;   // 2030-2075: reduced weight
  return 0.1;                        // Beyond 50 years: minimal weight
}
```

### MVP Development Timeline (2 Weeks)

**Week 1: Core Build**
- Day 1-2: Project setup, Cloudflare configuration, database schema
- Day 3-4: API endpoints (POST /predict, GET /stats)
- Day 4-5: Weighted median algorithm implementation
- Day 6-7: Frontend UI (landing page, prediction form, results display)

**Week 2: Polish & Launch**
- Day 8-9: Social sharing buttons, embed widget
- Day 10-11: SEO optimization (meta tags, structured data)
- Day 11-12: Ads integration, legal pages (Privacy/ToS)
- Day 13: Testing (mobile, browsers, edge cases)
- Day 14: Deploy and launch (Reddit r/GTA6, Twitter/X)

### Epic Breakdown Required

Requirements must be decomposed into epics and bite-sized stories (200k context limit).

**Next Step:** Run `workflow create-epics-and-stories` to create the implementation breakdown.

---

## References

- **Brainstorming Session:** docs/bmm-brainstorming-session-2025-11-13.md
- **Comprehensive Research:** docs/bmm-research-comprehensive-2025-11-13.md
- **Market Data:** 1M+ Reddit subscribers, 366K+ Discord, 268M+ YouTube views
- **Competitive Analysis:** 6 countdown sites analyzed - zero prediction tracking
- **Technical Validation:** Cloudflare free tier + SQLite D1 + TypeScript Workers

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow create-epics-and-stories`
2. **Architecture** - Run: `workflow create-architecture` (recommended for technical decisions)
3. **UX Design** (optional) - Run: `workflow ux-design` for detailed mockups

---

_This PRD captures the essence of GTA 6 Launch Date Prediction Tracker - **community sentiment tracking disguised as a prediction game**. The weighted algorithm (democratic but not mob-ruled) and ruthless simplicity create a viral tool that gives fans a voice while remaining technically feasible on zero budget._

_Created through collaborative discovery between yojahny and AI facilitator using the BMad Method._
