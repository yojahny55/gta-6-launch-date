# GTA 6 Launch Date Prediction Tracker - Architecture

**Date:** 2025-11-13
**Author:** yojahny
**Version:** 1.0

---

## Executive Summary

This architecture uses **Hono + Cloudflare Workers + D1** with **vanilla HTML/CSS/JS** for a blazingly fast, zero-cost prediction tracker. The approach prioritizes **speed** (< 2s load), **simplicity** (minimal dependencies), and **viral growth** (optimized social sharing). All architectural decisions ensure AI agents implement the weighted median algorithm and API endpoints consistently.

**Key Architectural Principles:**
1. **Ruthlessly Simple:** Vanilla JS frontend, minimal framework overhead
2. **Edge-First:** Cloudflare Workers for global low-latency
3. **Type-Safe:** TypeScript throughout for reliability
4. **Test-Driven:** **MANDATORY** automated tests for all stories (ADR-011)
5. **Privacy-First:** SHA-256 IP hashing, GDPR-compliant

**Critical:** Per ADR-011, all stories MUST include automated tests. No exceptions.

---

## Project Initialization

**FIRST IMPLEMENTATION STORY: Project Setup**

```bash
# 1. Create Hono + Cloudflare Workers project
npm create hono@latest gta6-tracker -- --template cloudflare-workers

# 2. Navigate to project
cd gta6-tracker

# 3. Create D1 database
npx wrangler d1 create gta6-predictions

# 4. Install additional dependencies
npm install js-cookie dayjs tailwindcss
npm install -D vitest @cloudflare/workers-types

# 5. Initialize Tailwind CSS
npx tailwindcss init

# 6. Run local dev server
npm run dev
```

**This establishes the base architecture with these decisions:**
- ✅ TypeScript configuration (Hono default)
- ✅ Wrangler CLI for deployment
- ✅ Hono for API routing
- ✅ D1 database bindings
- ✅ Local dev server at localhost:8787
- ✅ ES Modules format
- ✅ Project structure following Cloudflare best practices

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Runtime** | Cloudflare Workers | Latest | All | Zero-cost, global edge compute, < 50ms latency |
| **Framework** | Hono | v4.10.0 | API endpoints | Lightweight (14KB), TypeScript-first, Cloudflare-optimized |
| **Database** | Cloudflare D1 (SQLite) | Latest | Data storage | Free tier (5M reads/day), serverless, auto-backups |
| **Language** | TypeScript | Latest | All code | Type safety, better DX, AI-friendly |
| **Frontend** | Vanilla HTML/CSS/JS | N/A | UI, forms, display | Fastest load, zero framework overhead |
| **CSS** | Tailwind CSS + Custom GTA Theme | v4.0 | Styling | Custom gaming aesthetic, tree-shaken, <15KB |
| **Cookie Library** | js-cookie | v3.0.5 | User tracking | Clean API, 2KB, handles edge cases |
| **Date Library** | day.js | v1.11.19 | Algorithm, display | Tiny (2KB), clean diff/format API |
| **IP Hashing** | SHA-256 (Web Crypto) | Built-in | Rate limiting, privacy | Zero dependencies, GDPR-compliant |
| **Testing** | Vitest | v3.2 | Algorithm, APIs | Fast, Vite-integrated, Workers-compatible |
| **Analytics** | Cloudflare Web Analytics | Built-in | Tracking | Free, <1KB, privacy-friendly, no cookie banner |
| **SEO** | Dynamic meta via Workers | N/A | Social sharing | Server-rendered tags for crawlers |
| **Widget** | Separate /widget endpoint | N/A | Embeds | Optimized <50KB, independent |
| **Chart Library** | Deferred to post-MVP | TBD | Optional viz | Focus on core value first |

---

## Project Structure

```
gta6-tracker/
├── src/
│   ├── index.ts                    # Hono app entry, routes, middleware
│   ├── routes/
│   │   ├── predict.ts              # POST /api/predict, PUT /api/predict/:id
│   │   ├── stats.ts                # GET /api/stats (cached 5min)
│   │   └── widget.ts               # GET /widget (embed endpoint)
│   ├── middleware/
│   │   ├── meta-injection.ts       # Dynamic meta tags for SEO
│   │   └── cache.ts                # 5min cache for stats/widget
│   ├── services/
│   │   ├── predictions.service.ts  # Weighted median, CRUD operations
│   │   └── analytics.service.ts    # Cloudflare Analytics helpers
│   ├── utils/
│   │   ├── weighted-median.ts      # Core algorithm implementation
│   │   ├── weighted-median.test.ts # 90%+ coverage required
│   │   ├── ip-hash.ts              # SHA-256 IP hashing utility
│   │   ├── ip-hash.test.ts
│   │   ├── cookie.ts               # Cookie generation/parsing
│   │   └── date.ts                 # Date utility functions (day.js wrappers)
│   ├── db/
│   │   ├── schema.sql              # D1 database schema (CREATE TABLE)
│   │   └── queries.ts              # Typed D1 query functions
│   └── types/
│       └── index.ts                # TypeScript interfaces (Prediction, Stats, etc.)
├── public/                         # Static assets (Cloudflare Pages)
│   ├── index.html                  # Main prediction page
│   ├── privacy.html                # Privacy policy (static)
│   ├── terms.html                  # Terms of service (static)
│   ├── styles.css                  # Tailwind output
│   └── app.js                      # Frontend vanilla JavaScript
├── wrangler.toml                   # Cloudflare Workers configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts                  # For Tailwind build + Vitest
├── .dev.vars                       # Local environment variables
└── README.md
```

---

## Epic to Architecture Mapping

| Epic/FR Group | Architecture Component | Key Files | Responsibilities |
|---------------|------------------------|-----------|------------------|
| **FR1-6: User Prediction Management** | `routes/predict.ts`<br>`public/app.js` | API endpoint<br>Form submission | Validate date, check IP, generate cookie, store prediction |
| **FR7-12: Data Aggregation & Algorithm** | `services/predictions.service.ts`<br>`utils/weighted-median.ts` | Business logic<br>Core algorithm | Calculate weighted median, apply weight rules, track min/max |
| **FR13-19: Results Display** | `routes/stats.ts`<br>`public/app.js` | Stats API<br>UI rendering | Fetch aggregate data, display median/min/max, social comparison |
| **FR20-23: Social Sharing** | `middleware/meta-injection.ts`<br>`public/app.js` | Dynamic meta tags<br>Share buttons | Inject Open Graph tags, pre-fill share text |
| **FR24-29: Embed Widget** | `routes/widget.ts` | Dedicated endpoint | Lightweight HTML, live stats, theme support |
| **FR30-34: Email Notifications** | Deferred to post-MVP | N/A | Optional growth feature |
| **FR35-40: SEO & Discoverability** | `middleware/meta-injection.ts`<br>`public/index.html` | Server-rendered tags<br>Static HTML | Dynamic title/description, Schema.org, mobile-responsive |
| **FR41-46: Analytics & Tracking** | Cloudflare Web Analytics | Built-in | Pageviews, traffic sources, geography |
| **FR47-49: Monetization** | `public/index.html` | Google AdSense script | Banner ad, user opt-out toggle |
| **FR50-55: Legal & Privacy** | `public/privacy.html`<br>`public/terms.html`<br>`utils/ip-hash.ts` | Static pages<br>Hashing utility | GDPR compliance, cookie consent, IP hashing |

---

## Technology Stack Details

### Core Technologies

**Runtime Environment:**
- **Cloudflare Workers:** Serverless edge compute, runs globally
- **Free Tier:** 100,000 requests/day (sufficient for MVP validation)
- **Latency:** < 50ms globally via Cloudflare's edge network
- **Why:** Zero cost, automatic scaling, handles viral spikes

**Web Framework:**
- **Hono v4.10.0:** Ultrafast API framework
- **Size:** < 14KB (minimal overhead)
- **Features:** Type-safe routing, middleware, Cloudflare-first
- **Why:** Built specifically for Workers, excellent DX

**Database:**
- **Cloudflare D1:** Serverless SQLite
- **Free Tier:** 5GB storage, 5M reads/day, 100K writes/day
- **Backups:** Automatic with Time Travel feature
- **Why:** Zero cost, optimized for read-heavy workloads (stats display)

**Frontend:**
- **Vanilla JavaScript:** No framework, native DOM APIs
- **Build Tool:** Vite (for Tailwind CSS processing)
- **Why:** Fastest possible load, < 10s total bundle

**CSS:**
- **Tailwind CSS v4.0:** Utility-first framework
- **Configuration:** CSS-first (new v4 approach)
- **Tree-shaking:** PurgeCSS removes unused styles
- **Output Size:** ~5-10KB after optimization
- **Why:** Rapid development, built-in responsive utilities

**Type System:**
- **TypeScript:** All source code
- **Type Generation:** `wrangler types` for D1 bindings
- **Strict Mode:** Enabled for maximum safety

### Dependencies

**Production:**
```json
{
  "hono": "^4.10.0",
  "js-cookie": "^3.0.5",
  "dayjs": "^1.11.19",
  "tailwindcss": "^4.0.0"
}
```

**Development:**
```json
{
  "vitest": "^4.0.0",
  "@cloudflare/workers-types": "latest",
  "wrangler": "latest",
  "typescript": "latest"
}
```

### Integration Points

**Cloudflare Workers → D1 Database:**
- Connection via environment binding: `c.env.DB`
- Query execution: `await c.env.DB.prepare(sql).bind(params).all()`
- Caching: Workers cache API for 5min TTL

**Frontend (Static Pages) → API (Workers):**
- Communication: `fetch('/api/predict', {method: 'POST', ...})`
- CORS: Not needed (same origin via Cloudflare Pages)
- Response Format: Standardized JSON wrapper

**Workers → External Services:**
- Google AdSense: `<script>` tag in HTML (async load)
- Cloudflare Web Analytics: Automatic injection via dashboard
- No other external dependencies

---

## Data Architecture

### Database Schema

**File:** `src/db/schema.sql`

```sql
-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
) STRICT;

-- Email subscriptions table (optional, for post-MVP)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  cookie_id TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  unsubscribe_token TEXT UNIQUE
) STRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date);
CREATE INDEX IF NOT EXISTS idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX IF NOT EXISTS idx_predictions_submitted ON predictions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_email_verified ON email_subscriptions(verified);
```

**Design Decisions:**
- `STRICT` tables prevent type mismatches (SQLite best practice)
- `ip_hash` UNIQUE constraint enforces one submission per IP
- `cookie_id` UNIQUE allows updates via cookie
- `weight` pre-calculated and stored for performance
- Indexes on frequently queried columns

**Future Multi-Game Expansion:**
- Add `game_id TEXT DEFAULT 'gta6'` column to predictions table
- Composite index on `(game_id, predicted_date)`
- No schema changes needed for current MVP

### Data Models (TypeScript)

**File:** `src/types/index.ts`

```typescript
export interface Prediction {
  id: number;
  predicted_date: string; // ISO 8601: "2027-03-15"
  submitted_at: string;   // ISO 8601: "2025-11-13T10:30:00Z"
  updated_at: string;
  ip_hash: string;
  cookie_id: string;
  user_agent: string | null;
  weight: number;
}

export interface Stats {
  median: string;      // Weighted median date
  min: string;         // Earliest prediction
  max: string;         // Latest prediction
  total: number;       // Total predictions count
}

export interface PredictionResponse {
  success: true;
  data: {
    prediction: Prediction;
    stats: Stats;
    delta_days: number;
    comparison: 'optimistic' | 'pessimistic' | 'aligned';
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## API Contracts

### POST /api/predict

**Purpose:** Submit new prediction

**Request:**
```json
{
  "predicted_date": "2027-06-15"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "cookie_id": "abc123def456...",
      "predicted_date": "2027-06-15",
      "submitted_at": "2025-11-13T10:30:00Z"
    },
    "stats": {
      "median": "2027-03-15",
      "min": "2025-12-01",
      "max": "2099-01-01",
      "total": 10234
    },
    "delta_days": 92,
    "comparison": "optimistic"
  }
}
```

**Error Response (429 - Rate Limit):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You've already submitted a prediction. Use your cookie to update.",
    "details": {}
  }
}
```

**Validation Rules:**
- Date must be valid ISO 8601 format
- Date must be within 2025-2125 range
- One submission per IP address (hashed)

**Rate Limiting:** 1 initial submission per IP, unlimited updates via cookie

---

### PUT /api/predict/:cookie_id

**Purpose:** Update existing prediction

**Request:**
```json
{
  "predicted_date": "2027-08-20"
}
```

**Success Response (200):** Same format as POST

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Prediction not found for this cookie.",
    "details": {}
  }
}
```

---

### GET /api/stats

**Purpose:** Fetch aggregate statistics

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "median": "2027-03-15",
    "min": "2025-12-01",
    "max": "2099-01-01",
    "total": 10234
  }
}
```

**Caching:** 5 minutes via Cloudflare Workers cache API

---

### GET /api/status

**Purpose:** Fetch current community sentiment status based on median prediction

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "Delay Likely",
    "status_color": "amber",
    "median_date": "2027-03-15",
    "official_date": "2026-11-19",
    "days_difference": 116,
    "cached_at": "2025-11-28T14:30:00Z"
  }
}
```

**Status Values:**
- `"Early Release Possible"` - Median is 60+ days before official date (Green)
- `"On Track"` - Median is within ±60 days of official date (Blue)
- `"Delay Likely"` - Median is 60-180 days after official date (Amber)
- `"Major Delay Expected"` - Median is 180+ days after official date (Red)

**Caching:** 5 minutes via Cloudflare Workers cache API

**Minimum Threshold (FR99):**
- If total predictions < 50: Returns `"Gathering Data"` status with blue color

**Error Response (500):**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "Unable to fetch status data. Please try again."
  },
  "data": {
    "status": "Unknown",
    "status_color": "blue",
    "median_date": null,
    "official_date": "2026-11-19",
    "days_difference": 0,
    "cached_at": "2025-11-28T14:30:00Z"
  }
}
```

---

### GET /widget

**Purpose:** Embeddable widget for streamers/sites

**Query Parameters:**
- `theme=light|dark` (optional, default: light)

**Response:** Minimal HTML page (<50KB)

**Content:**
- Current median prediction
- Total predictions count
- Link back to main site
- Lightweight styling (inline CSS)

**Caching:** 5 minutes

---

## Implementation Patterns

### Weighted Median Algorithm

**File:** `src/utils/weighted-median.ts`

**Implementation:**

```typescript
import dayjs from 'dayjs';

interface WeightedPrediction {
  date: string; // ISO 8601
  weight: number;
}

export function calculateWeight(predictedDate: string): number {
  const officialDate = dayjs('2026-11-19');
  const predicted = dayjs(predictedDate);
  const yearsDiff = Math.abs(predicted.diff(officialDate, 'year', true));

  if (yearsDiff <= 5) return 1.0;    // 2025-2030: full weight
  if (yearsDiff <= 50) return 0.3;   // 2030-2075: reduced weight
  return 0.1;                        // Beyond 50 years: minimal weight
}

export function calculateWeightedMedian(predictions: WeightedPrediction[]): string {
  if (predictions.length === 0) return '2026-11-19'; // Default to official date

  // Sort by date
  const sorted = [...predictions].sort((a, b) =>
    dayjs(a.date).unix() - dayjs(b.date).unix()
  );

  // Calculate total weight
  const totalWeight = sorted.reduce((sum, p) => sum + p.weight, 0);
  const targetWeight = totalWeight / 2;

  // Find weighted median
  let cumulativeWeight = 0;
  for (const item of sorted) {
    cumulativeWeight += item.weight;
    if (cumulativeWeight >= targetWeight) {
      return item.date;
    }
  }

  return sorted[sorted.length - 1].date; // Fallback to latest
}
```

**Tests Required (90%+ coverage):**
- Test case: All predictions in reasonable range
- Test case: Mix of reasonable + outlier predictions
- Test case: Extreme outliers (year 2099)
- Test case: Empty predictions array
- Test case: Single prediction
- Test case: Edge case at weight boundaries

---

### IP Hashing

**File:** `src/utils/ip-hash.ts`

**Implementation:**

```typescript
export async function hashIpAddress(
  ip: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ip);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
```

**Environment Variable:** `IP_HASH_SALT` (stored in Cloudflare dashboard)

**Usage:**
```typescript
const ipHash = await hashIpAddress(request.headers.get('CF-Connecting-IP'), c.env.IP_HASH_SALT);
```

---

### Cookie Management

**File:** `src/utils/cookie.ts`

**Frontend (public/app.js):**
```javascript
import Cookies from 'js-cookie';

// Generate unique cookie ID
function generateCookieId() {
  return crypto.randomUUID();
}

// Set user cookie (365 days)
Cookies.set('gta6_user_id', generateCookieId(), {
  expires: 365,
  secure: true,
  sameSite: 'strict'
});

// Get user cookie
const userId = Cookies.get('gta6_user_id');
```

**Backend validation:**
- Cookie ID must be valid UUID format
- Match cookie_id from database for updates

---

### Status Calculation

**File:** `src/utils/status-calculator.ts`

**Purpose:** Calculate community sentiment status based on median prediction vs official date

**Implementation:**

```typescript
export interface StatusResult {
  status: 'Early Release Possible' | 'On Track' | 'Delay Likely' | 'Major Delay Expected';
  color: 'green' | 'blue' | 'amber' | 'red';
  daysDifference: number;
}

export function calculateStatus(
  medianDate: string,
  officialDate: string = '2026-11-19'
): StatusResult {
  const official = new Date(officialDate);
  const median = new Date(medianDate);

  const daysDiff = Math.round(
    (median.getTime() - official.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysDiff < -60) {
    return {
      status: 'Early Release Possible',
      color: 'green',
      daysDifference: daysDiff
    };
  } else if (daysDiff >= -60 && daysDiff <= 60) {
    return {
      status: 'On Track',
      color: 'blue',
      daysDifference: daysDiff
    };
  } else if (daysDiff > 60 && daysDiff <= 180) {
    return {
      status: 'Delay Likely',
      color: 'amber',
      daysDifference: daysDiff
    };
  } else {
    return {
      status: 'Major Delay Expected',
      color: 'red',
      daysDifference: daysDiff
    };
  }
}
```

**Thresholds:**
- **Early Release Possible:** < -60 days from official
- **On Track:** -60 to +60 days from official
- **Delay Likely:** +60 to +180 days from official
- **Major Delay Expected:** > +180 days from official

**Usage:**
```typescript
const median = await getWeightedMedian();
const status = calculateStatus(median);
// Returns: { status: 'Delay Likely', color: 'amber', daysDifference: 116 }
```

**Test Coverage:**
- Test case: Median 90 days before official → "Early Release Possible"
- Test case: Median exactly on official date → "On Track"
- Test case: Median 30 days after official → "On Track"
- Test case: Median 90 days after official → "Delay Likely"
- Test case: Median 200 days after official → "Major Delay Expected"
- Test case: Boundary at -60 days (should be "On Track")
- Test case: Boundary at +60 days (should be "Delay Likely")
- Test case: Boundary at +180 days (should be "Major Delay Expected")

---

## Consistency Rules

### Naming Conventions

**API Endpoints:**
- Format: `/api/{resource}` (plural nouns)
- Examples: `/api/stats`, `/api/predict`
- Parameters: `/api/predict/:cookie_id` (kebab-case)

**Database:**
- Tables: Lowercase plural: `predictions`, `email_subscriptions`
- Columns: snake_case: `predicted_date`, `cookie_id`, `ip_hash`
- Foreign keys: `{table}_id` format (for future expansion)

**TypeScript:**
- Files: camelCase: `predictions.service.ts`, `weightedMedian.ts`
- Tests: `{name}.test.ts` co-located
- Functions: camelCase: `calculateWeightedMedian()`, `hashIpAddress()`
- Async functions: Prefix clear: `async getStats()`, `async savePrediction()`
- Constants: SCREAMING_SNAKE_CASE: `IP_HASH_SALT`, `CACHE_TTL_SECONDS`
- Interfaces: PascalCase: `Prediction`, `Stats`, `PredictionResponse`

**CSS Classes (Custom GTA Theme):**
- Use Tailwind utilities: `px-4`, `py-2`, `bg-gta-pink`
- Custom theme tokens: `gta-dark`, `gta-card`, `gta-pink`, `gta-purple`, `gta-blue`
- Component classes: kebab-case: `.prediction-form`, `.stats-display`

### Code Organization

**Test Location:**
- Co-located with source: `weighted-median.test.ts` next to `weighted-median.ts`

**Component Organization:**
- By feature: API routes in `routes/`, business logic in `services/`
- Utilities: Pure functions in `utils/`

**Configuration:**
- Environment variables: `.dev.vars` (local), Cloudflare dashboard (production)
- No secrets in code
- Required vars: `IP_HASH_SALT`, `DATABASE` (D1 binding)

### Error Handling

**Standard Error Response:**
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR',
    message: 'User-friendly message',
    details: {} // Optional context
  }
}
```

**Error Categories:**
- `VALIDATION_ERROR` (400): Invalid date, bad format
- `RATE_LIMIT_EXCEEDED` (429): Duplicate IP submission
- `NOT_FOUND` (404): Cookie ID not found
- `SERVER_ERROR` (500): Database errors, system failures

**Logging on Errors:**
```typescript
console.error(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  message: 'Database query failed',
  context: { query, error: error.message }
}));
```

**User-Facing Messages:**
- Friendly, actionable
- Example: "You've already submitted a prediction. Use your cookie to update."

### Logging Strategy

**Structured Logging Format:**
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO' | 'WARN' | 'ERROR',
  message: 'Description',
  context: { /* relevant data */ }
}));
```

**Log Levels:**
- `INFO`: Prediction submissions, stats requests
- `WARN`: Rate limit hits, validation failures
- `ERROR`: Database errors, system failures

**What to Log:**
- All prediction submissions (for debugging algorithm)
- Rate limit violations (monitor spam)
- Database errors
- API response times > 500ms (performance monitoring)

**What NOT to Log:**
- Raw IP addresses (only hashed values)
- Cookie IDs in logs (privacy)
- Sensitive data

**Cloudflare Automatic Logs:**
- Request logs, analytics, and traces available in dashboard
- Application logs supplement, not replace, Cloudflare logs

---

## Security Architecture

**HTTPS:**
- All traffic via Cloudflare (automatic TLS 1.3)
- Certificate managed by Cloudflare

**IP Address Privacy:**
- Hash with SHA-256 + salt before storage
- Use `request.headers.get('CF-Connecting-IP')` for real IP
- Never log raw IPs

**Cookie Security:**
- Flags: `httpOnly`, `secure`, `sameSite=strict`
- js-cookie handles encoding/decoding safely

**Input Validation:**
- Date format: ISO 8601 only
- Date range: 2025-2125 (validate before storage)
- SQL injection: Parameterized queries only (D1 prepared statements)
- XSS: Sanitize all user inputs (though no user-generated text displayed)

**Rate Limiting:**
- IP-based: 1 initial submission per IP
- Cookie-based: Unlimited updates (own cookie only)
- Implemented via UNIQUE constraint on `ip_hash`

**GDPR Compliance:**
- Cookie consent banner (via simple HTML modal)
- Privacy Policy page (`public/privacy.html`)
- Terms of Service page (`public/terms.html`)
- IP hashing (SHA-256 with salt)
- Data deletion: Implement DELETE endpoint (on request)
- Right to be forgotten: Delete prediction by cookie_id

---

## Performance Considerations

**Load Time Requirements:**
- Desktop (3G): < 2 seconds
- Mobile (3G): < 3 seconds

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

---

## Deployment Architecture

**Hosting:**
- **Frontend:** Cloudflare Pages (static HTML/CSS/JS)
- **API:** Cloudflare Workers (serverless functions)
- **Database:** Cloudflare D1 (serverless SQLite)

**Multi-Environment Strategy:**

The project uses **three deployment environments** to ensure safe iteration and testing before production:

| Environment | Branch | Worker URL | Pages URL | Use Case |
|-------------|--------|------------|-----------|----------|
| **Local** | N/A | `localhost:8787` | `localhost:5173` | Local development and testing |
| **Dev** | `dev` | `gta6-tracker-dev.*.workers.dev` | `<hash>.gta6-tracker.pages.dev` | Preview changes before production |
| **Production** | `main` | `gta6-tracker.*.workers.dev` | `gta6-tracker.pages.dev` | Live production environment |

**Deployment Process:**

1. **Build:**
   ```bash
   # Build Tailwind CSS
   npm run build:css

   # TypeScript compilation (Wrangler handles)
   npm run build
   ```

2. **Deploy to Dev Environment:**
   ```bash
   # Deploy Workers to dev environment
   npx wrangler deploy --env dev

   # Push to dev branch (Pages auto-deploys preview)
   git push origin dev
   ```

3. **Deploy to Production:**
   ```bash
   # Deploy Workers to production environment
   npx wrangler deploy --env production

   # Push to main branch (Pages auto-deploys production)
   git push origin main
   ```

**Wrangler Environments Configuration:**

```toml
# wrangler.toml
name = "gta6-tracker"
main = "src/index.ts"
compatibility_date = "2025-11-09"
compatibility_flags = ["nodejs_compat"]

# Shared D1 binding across all environments
[[d1_databases]]
binding = "DB"
database_name = "gta6-predictions"
database_id = "150217ee-5408-406e-98be-37b15a8e5990"

# PRODUCTION ENVIRONMENT (main branch)
[env.production]
name = "gta6-tracker"
vars = { ENVIRONMENT = "production" }

# DEV ENVIRONMENT (dev branch)
[env.dev]
name = "gta6-tracker-dev"
vars = { ENVIRONMENT = "dev" }

# PREVIEW ENVIRONMENT (pull requests)
[env.preview]
name = "gta6-tracker-preview"
vars = { ENVIRONMENT = "preview" }
```

**Frontend-to-Backend API Configuration:**

The frontend needs to know which Worker URL to call based on the deployment environment. This is handled via **Vite environment variables**:

**Cloudflare Pages Environment Variables** (set in dashboard):
- **Production:** `VITE_API_URL = https://gta6-tracker.yojahnychavez.workers.dev`
- **Preview/Dev:** `VITE_API_URL = https://gta6-tracker-dev.yojahnychavez.workers.dev`

**Local Development** (`.env.development`):
```env
VITE_API_URL=http://localhost:8787
VITE_ENVIRONMENT=local
```

**Frontend Code Usage:**
```javascript
// Environment-aware API calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

async function callAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
}

// Usage
await callAPI('/api/predict', { method: 'POST', body: ... });
await callAPI('/api/stats');
```

**Environment Variables:**
- **Secrets (Cloudflare Dashboard):** `IP_HASH_SALT`, `CLOUDFLARE_API_TOKEN`
- **Runtime Variables (wrangler.toml):** `ENVIRONMENT` (production/dev/preview)
- **Build-time Variables (Pages Dashboard):** `VITE_API_URL`, `VITE_ENVIRONMENT`
- **Local Development (.dev.vars):** `IP_HASH_SALT=your-random-salt`

**Branch Strategy:**
```
main (production)
  ↑
  └── Pull Request (preview deployment)
        ↑
        └── dev (dev environment)
              ↑
              └── feature/* (local dev, no auto-deploy)
```

**Deployment Flow:**
1. Developer works on `feature/xyz` branch locally
2. Push to `dev` branch → Auto-deploys to dev environment
3. Test changes on dev Worker + Pages preview
4. Create PR from `dev` → `main` → Preview deployment created
5. Merge PR → Auto-deploys to production

**Rollback:**
- **Workers:** Revert to previous deployment via Cloudflare dashboard or `wrangler rollback`
- **Pages:** Git revert + redeploy via dashboard or CLI
- **D1:** Time Travel feature for database rollback (point-in-time recovery)

**Monitoring:**
- Cloudflare Analytics (built-in, per-environment)
- Workers logs in dashboard (filterable by environment)
- Alerts: Set up via Cloudflare Notifications (optional)

---

## Development Environment

### Prerequisites

**Required:**
- Node.js >= 18
- npm >= 9
- Cloudflare account (free tier)
- Git

**Installation:**
```bash
# Install Node.js (via nvm recommended)
nvm install 18
nvm use 18

# Install Wrangler CLI globally (optional)
npm install -g wrangler

# Login to Cloudflare
npx wrangler login
```

### Setup Commands

```bash
# 1. Clone repository (or create via Hono)
npm create hono@latest gta6-tracker -- --template cloudflare-workers
cd gta6-tracker

# 2. Install dependencies
npm install js-cookie dayjs tailwindcss
npm install -D vitest @cloudflare/workers-types

# 3. Initialize Tailwind
npx tailwindcss init

# 4. Create D1 database
npx wrangler d1 create gta6-predictions
# Copy binding config to wrangler.toml

# 5. Initialize database schema
npx wrangler d1 execute gta6-predictions --file=./src/db/schema.sql

# 6. Create .dev.vars file
echo "IP_HASH_SALT=your-random-salt-here" > .dev.vars

# 7. Run development server
npm run dev
```

**Local Development:**
- Frontend: http://localhost:8787
- Workers: http://localhost:8787/api/stats
- D1: Local SQLite database (via Miniflare)

**Testing:**
```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Type Checking:**
```bash
# Generate D1 types
npx wrangler types

# TypeScript check
npx tsc --noEmit
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Hono instead of vanilla Workers

**Context:** Need lightweight API framework for Cloudflare Workers

**Decision:** Use Hono v4.10.0

**Rationale:**
- Tiny (14KB), designed specifically for Cloudflare Workers
- Type-safe routing and middleware
- Excellent DX with TypeScript
- Active community and maintained

**Consequences:**
- +14KB bundle size (acceptable)
- Framework lock-in (minimal, can migrate easily)
- Cleaner code vs vanilla Workers

---

### ADR-002: Vanilla JS instead of React/Vue/Svelte

**Context:** Frontend framework choice for simple prediction form

**Decision:** Vanilla HTML/CSS/JavaScript

**Rationale:**
- PRD emphasizes speed (< 2s load time)
- Simple UI (one form, one results display)
- Every KB matters for viral growth
- Modern vanilla JS is clean enough for this scope

**Consequences:**
- Manual DOM manipulation (acceptable for simple UI)
- No reactivity framework (not needed)
- Fastest possible load time

---

### ADR-003: Tailwind CSS v4 over vanilla CSS

**Context:** CSS strategy for rapid development and responsive design

**Decision:** Use Tailwind CSS v4.0 with tree-shaking

**Rationale:**
- Rapid development with utility classes
- Built-in responsive utilities
- Tree-shaking reduces to ~5-10KB
- Modern v4 CSS-first configuration

**Consequences:**
- Requires build step (Vite)
- Class names can be verbose (acceptable trade-off)
- Faster development outweighs minimal overhead

---

### ADR-004: SHA-256 for IP hashing over BLAKE2/PBKDF2

**Context:** Need to hash IP addresses for GDPR compliance and rate limiting

**Decision:** Use SHA-256 with salt (Web Crypto API)

**Rationale:**
- Built into Cloudflare Workers (zero dependencies)
- Fast enough for edge compute
- Industry standard, well-understood
- Sufficient security for IP hashing use case

**Consequences:**
- Slightly slower than BLAKE2 (negligible)
- Simpler than PBKDF2 (no iterations needed)
- No external dependencies

---

### ADR-005: Defer chart visualization to post-MVP

**Context:** FR19 specifies optional chart toggle for prediction distribution

**Decision:** Defer to Growth Features phase (post-MVP)

**Rationale:**
- Optional feature, not critical for validation
- Adds bundle size and complexity
- Focus on core value prop first (prediction + stats)
- Can add Chart.js later when real data exists

**Consequences:**
- Faster MVP ship
- Simpler codebase initially
- Placeholder UI prepared for future

---

### ADR-006: Cloudflare Web Analytics over Google Analytics

**Context:** Need analytics tracking for FR41-46 requirements

**Decision:** Use Cloudflare Web Analytics for MVP

**Rationale:**
- Free, built into Cloudflare Pages
- < 1KB (vs GA4's 45KB)
- Privacy-friendly (no cookie banner needed)
- Sufficient for core metrics (pageviews, sources, geography)

**Consequences:**
- Less detailed than GA4 (acceptable for MVP)
- Can add GA4 later if needed for funnel analysis
- Faster load time, better privacy

---

### ADR-007: Dynamic meta tags via Workers middleware

**Context:** Social sharing requires server-rendered meta tags with current median

**Decision:** Workers middleware intercepts HTML, injects dynamic meta tags

**Rationale:**
- Social crawlers (Twitter, Reddit) don't execute JavaScript
- Current median must be in meta tags for viral sharing
- Workers can fetch stats and inject before serving HTML
- Aligned with distribution strategy (embeds, social)

**Consequences:**
- Adds complexity to Workers code
- Requires caching (5min) to avoid D1 overload
- Better social sharing, improved SEO

---

### ADR-008: Separate /widget endpoint over iframe to main page

**Context:** Embed widget must be < 50KB and optimized for streamers

**Decision:** Create dedicated `/widget` endpoint with minimal HTML

**Rationale:**
- Widget optimization independent of main app
- Streamers embed on slow connections
- Can remove ads, analytics, unnecessary CSS
- Clean separation of concerns

**Consequences:**
- Two HTML templates to maintain (acceptable)
- Shared data fetching logic (same API)
- Better performance for embeds

---

### ADR-009: Vitest over Jest for testing

**Context:** Need testing framework for weighted median algorithm and APIs

**Decision:** Use Vitest v3.2 with @cloudflare/vitest-pool-workers

**Rationale:**
- Integrates seamlessly with Vite (already using for Tailwind)
- Faster test execution than Jest
- Modern, well-maintained
- Works with Cloudflare Workers via @cloudflare/vitest-pool-workers
- Version 3.2 required for Cloudflare Workers pool compatibility

**Consequences:**
- Newer than Jest (less mature)
- Excellent DX, fast iteration
- Compatible with existing Vite setup
- Workers pool enables D1 database testing in local environment

**Implementation:**
- Test infrastructure established in Story 1.2
- 30 tests (9 endpoint + 21 schema) as baseline
- vitest.config.ts configured for Cloudflare Workers
- Test setup auto-applies database schema

---

### ADR-010: day.js over date-fns or native Date

**Context:** Need date library for weighted median calculations and display

**Decision:** Use day.js v1.11.19

**Rationale:**
- Tiny (2KB core)
- Clean API for date differences (critical for algorithm)
- Plugin system (only add what you need)
- PRD pseudocode uses date differences heavily

**Consequences:**
- Another dependency (2KB is negligible)
- Cleaner code vs native Date API
- Better maintainability

---

### ADR-011: Mandatory Automated Testing for All Stories

**Context:** Story 1.2 was initially implemented without automated tests, violating ADR-009 (Vitest) and Epic 1 Tech Spec requirements. This created a critical gap in code quality and regression protection.

**Decision:** **MANDATORY** automated testing for every story going forward

**Requirements:**

1. **All Stories MUST Include:**
   - Acceptance Criterion explicitly stating: "And automated tests exist covering main functionality"
   - Testing Requirements subsection in Acceptance Criteria
   - Test files created alongside implementation code
   - Tests passing before story can be marked "done"

2. **Minimum Test Coverage by Story Type:**
   - **Infrastructure Stories:** Integration tests for connectivity, configuration validation
   - **API Endpoint Stories:** Request/response tests, error handling, validation
   - **Algorithm Stories:** Unit tests with 90%+ coverage, edge cases, boundary conditions
   - **UI Stories:** Component tests, user interaction tests
   - **Database Stories:** Schema tests, constraint validation, index verification

3. **Test File Location:**
   - Co-located with source: `src/foo.ts` → `src/foo.test.ts`
   - Or in dedicated test directory: `tests/unit/`, `tests/integration/`

4. **CI/CD Integration (Story 1.3):**
   - All tests run automatically in CI/CD pipeline
   - Failed tests block deployment
   - Test coverage reports generated

5. **Story Template Update:**
   ```markdown
   ## Acceptance Criteria

   **Given** [scenario]
   **When** [action]
   **Then** [expected outcome]
   **And** automated tests exist covering main functionality

   ### Testing Requirements
   - [ ] Unit tests for [component/function]
   - [ ] Integration tests for [API/database interaction]
   - [ ] Error handling tests
   - [ ] Edge case validation
   ```

**Rationale:**
- **Quality Assurance:** Prevents regressions in production
- **Documentation:** Tests serve as executable specifications
- **Confidence:** Developers can refactor safely with test coverage
- **Compliance:** Meets architecture ADR-009 and tech spec requirements
- **CI/CD Enablement:** Automated tests enable continuous deployment (Story 1.3)
- **AI Agent Guidance:** Clear testing requirements prevent future oversights

**Consequences:**
- ✅ Higher code quality and reliability
- ✅ Faster debugging (failing tests pinpoint issues)
- ✅ Better documentation (tests show usage examples)
- ✅ Enables refactoring with confidence
- ⚠️ Slightly longer development time per story (~15-20% overhead)
- ⚠️ Requires test infrastructure setup (already done in Story 1.2)

**Non-Negotiable:**
- Stories without tests will be **BLOCKED** in code review
- "Changes Requested" status until tests are added
- No exceptions unless explicitly justified and documented

**Reference Implementation:**
- Story 1.2: 30 tests (9 endpoint + 21 schema tests)
- Test files: `src/index.test.ts`, `src/db/schema.test.ts`
- Test setup: `vitest.config.ts`, `src/test-setup.ts`

**6. Test Resource Constraints:**

**Context:** During Story 3.5 implementation (Error Handling with Retry Mechanisms), tests were found to consume excessive resources (32GB RAM + 100% CPU) due to uncontrolled parallel test execution and fake timer memory leaks. This made local development testing impossible and created risk of CI/CD failures.

**Root Causes Identified:**
- No `maxConcurrency` or thread limits in Vitest configurations
- Fake timers (`vi.useFakeTimers()`) not properly cleaned up in `afterEach()` hooks
- Heavy DOM manipulation tests running in parallel without resource constraints
- Async timer advancement (`vi.advanceTimersByTimeAsync()`) causing memory leaks

**Requirements:**

**Parallelism Limits:**
- **Unit tests:** Max 4 threads, max 3 concurrent tests (`vitest.config.unit.ts`)
- **Workers tests:** Max 2 concurrent tests (`vitest.config.ts`)
- **Sequential execution:** Required for tests with >100 DOM nodes or heavy fake timer usage

**Fake Timer Best Practices:**
- **MANDATORY:** Always call `vi.clearAllTimers()` in `afterEach()` before `vi.useRealTimers()`
- **Pattern:**
  ```javascript
  afterEach(() => {
    vi.clearAllTimers(); // Clear pending timers FIRST
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (global.gc) global.gc(); // Hint for GC
  });
  ```

**CI/CD Constraints:**
- Configure 4GB RAM limit per test runner (`NODE_OPTIONS: --max-old-space-size=4096`)
- Set timeout: 10 minutes maximum per test suite
- Monitor memory usage and fail if exceeding limits

**Local Development:**
- Use `--no-threads` flag if system has < 16GB RAM
- Separate watch mode commands for development (`test:unit:watch`, `test:workers:watch`)
- Tests should complete in < 4GB RAM with < 100% CPU usage

**Configuration Files:**
- `vitest.config.unit.ts`: Includes `maxConcurrency: 3`, `maxThreads: 4`, `sequence.concurrent: false`
- `vitest.config.ts`: Includes `maxConcurrency: 2` (Workers pool)
- `package.json`: Test scripts use `vitest run --no-threads` for unit tests

**Enforcement:**
- CI pipeline monitors memory usage and fails if exceeding 4GB
- Test configurations include resource limits by default
- Code review checklist verifies timer cleanup in all new tests
- ESLint rules (future) to detect missing `vi.clearAllTimers()`

**Rationale:**
Ensures tests run reliably across all development and CI/CD environments without resource exhaustion. Prevents recurrence of 32GB RAM consumption issues that block local development and cause environment crashes.

**Impact:**
- Test execution time may increase 10-20% (sequential vs parallel) - acceptable trade-off
- Tests now run in < 4GB RAM with 50-70% CPU usage (vs 32GB+ and 100% before)
- Local development testing is reliable and doesn't crash systems
- CI/CD tests complete within timeout windows

**Resolution Date:** 2025-11-26 (Sprint Change Proposal: Test Optimization)

---

### ADR-012: Multi-Environment Deployment Strategy

**Context:** Initial CI/CD implementation (Story 1.3) deployed directly to production on main branch. This creates risk: developers cannot preview changes in a live environment before production deployment. Need a safe way to test changes before they reach end users.

**Decision:** Implement **three-tier environment strategy** using Wrangler environments and branch-based deployments

**Environments:**

1. **Local Development:**
   - Branch: Any (feature/*, dev, main)
   - Worker: `localhost:8787` via `wrangler dev`
   - Pages: `localhost:5173` via `vite dev`
   - Database: Local D1 via Miniflare
   - Purpose: Rapid development iteration

2. **Dev Environment:**
   - Branch: `dev`
   - Worker: `gta6-tracker-dev.*.workers.dev` via `wrangler deploy --env dev`
   - Pages: Preview deployment (automatic on push to dev)
   - Database: Shared production D1 (same database)
   - Purpose: Preview changes in live environment before production

3. **Production Environment:**
   - Branch: `main`
   - Worker: `gta6-tracker.*.workers.dev` via `wrangler deploy --env production`
   - Pages: Production deployment (automatic on push to main)
   - Database: Production D1
   - Purpose: Live user-facing environment

**Implementation:**

**wrangler.toml configuration:**
```toml
# Base configuration (shared)
name = "gta6-tracker"
main = "src/index.ts"
[[d1_databases]]
binding = "DB"
database_name = "gta6-predictions"
database_id = "150217ee-5408-406e-98be-37b15a8e5990"

# Production environment
[env.production]
name = "gta6-tracker"
vars = { ENVIRONMENT = "production" }

# Dev environment
[env.dev]
name = "gta6-tracker-dev"
vars = { ENVIRONMENT = "dev" }

# Preview environment (PRs)
[env.preview]
name = "gta6-tracker-preview"
vars = { ENVIRONMENT = "preview" }
```

**GitHub Actions workflow:**
```yaml
# Deploy to dev environment (dev branch)
- name: Deploy to Cloudflare Workers (DEV)
  if: github.ref == 'refs/heads/dev'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env dev

# Deploy to production (main branch)
- name: Deploy to Cloudflare Workers (PRODUCTION)
  if: github.ref == 'refs/heads/main'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env production
```

**Frontend-to-Backend Configuration:**

Problem: Frontend needs to know which Worker URL to call based on environment.

Solution: **Vite environment variables** configured in Cloudflare Pages dashboard:
- Production: `VITE_API_URL = https://gta6-tracker.*.workers.dev`
- Preview/Dev: `VITE_API_URL = https://gta6-tracker-dev.*.workers.dev`
- Local: `.env.development` → `VITE_API_URL=http://localhost:8787`

Frontend code:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
await fetch(`${API_URL}/api/predict`, { ... });
```

**Rationale:**
- **Risk Reduction:** Test changes in dev before production, catch issues early
- **Developer Confidence:** See actual behavior in live Cloudflare environment
- **Fast Iteration:** Push to dev branch → auto-deploy → test → merge to main
- **Zero Additional Cost:** All environments run on Cloudflare free tier
- **Simple Database Strategy:** Shared D1 database (dev data doesn't conflict with production)
- **Standard Industry Practice:** Dev/staging/production is industry standard
- **Cloudflare Native:** Uses Wrangler's built-in environment support

**Consequences:**
- ✅ Safer deployments (test before production)
- ✅ Faster debugging (dev environment for reproducing issues)
- ✅ Better developer experience (confidence in changes)
- ✅ No additional cost (free tier covers all environments)
- ✅ Automatic preview URLs for each environment
- ⚠️ Need to manage dev branch (additional git workflow)
- ⚠️ Dev environment can have stale/test data in shared database (acceptable trade-off)
- ⚠️ Pages environment variables must be configured in dashboard

**Alternative Considered: Separate D1 Databases**
- Rejected because:
  - More complex (schema migrations for both databases)
  - Additional cost (multiple databases)
  - Unnecessary for MVP (shared database is acceptable)
  - Can migrate to separate databases post-MVP if needed

**Migration Path:**
1. Update `wrangler.toml` with environment configurations
2. Update GitHub Actions workflow for branch-based deployments
3. Configure Pages environment variables in Cloudflare dashboard
4. Create `.env.development` for local development
5. Update frontend code to use `import.meta.env.VITE_API_URL`
6. Test dev deployment workflow
7. Document in README

**Reference:**
- Implemented in Story 1.7 (Multi-Environment CI/CD Setup)
- Cloudflare Workers Environments: https://developers.cloudflare.com/workers/wrangler/environments/
- Cloudflare Pages Environment Variables: https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables

### ADR-014: PNG over SVG for Open Graph Images

**Decision:** Use PNG format for Open Graph social sharing images instead of SVG.

**Context:** Story 5.3 (Open Graph Meta Tags) required creating a 1200x630px social sharing image. SVG was initially considered for its smaller file size (~2KB) and scalability, but Twitter/X does not support SVG in Twitter Cards.

**Decision Rationale:**

1. **Twitter Compatibility:** Twitter Card specification requires raster formats (PNG/JPG/GIF) for `twitter:image`. SVG images are not displayed in Twitter Cards, resulting in broken social previews on Twitter/X.

2. **Universal Support:** PNG is universally supported across all social platforms (Facebook, LinkedIn, Twitter, Reddit, Discord, Slack, WhatsApp, etc.), while SVG support is inconsistent.

3. **File Size Acceptable:** The PNG implementation is 66KB, well under the 300KB recommended size and far below the 1MB maximum. This is acceptable for Cloudflare's global CDN with edge caching.

4. **Visual Quality:** PNG provides better rendering quality on social platforms that apply compression or transformations to shared images.

**Implementation:**

- **File:** `public/images/og-image.png` (1200x630px, 66KB)
- **Meta Tags:** Both `og:image` and `twitter:image` reference the PNG file
- **SVG Alternative:** An SVG version exists at `public/images/og-image.svg` for potential future use in other contexts, but is not used for social sharing

**Alternatives Considered:**

- **SVG Only:** Rejected due to Twitter incompatibility
- **Dynamic SVG→PNG Conversion:** Rejected as over-engineering for MVP; adds complexity without significant benefit
- **Dual Format (SVG for OG, PNG for Twitter):** Rejected to avoid confusion and maintain consistency across platforms

**Trade-offs:**

- ✅ **Pro:** Universal social platform compatibility
- ✅ **Pro:** Better visual quality on compressed platforms
- ✅ **Pro:** Simpler implementation (single file format)
- ❌ **Con:** Larger file size than SVG (66KB vs 2KB)
- ⚠️ **Neutral:** File size is still very small and well-cached by CDN

**Validation:**

- Tested with Twitter Card Validator: https://cards-dev.twitter.com/validator
- Tested with Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Automated test coverage: 23/23 tests passing (src/middleware/meta-injection.test.ts)

**Reference:**

- Implemented in Story 5.3 (Open Graph Meta Tags for Rich Previews)
- Twitter Card Specification: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
- Open Graph Protocol: https://ogp.me/

---

### ADR-015: Custom GTA Gaming Theme over DaisyUI

**Decision:** Replace DaisyUI component library with custom GTA-themed design system using Tailwind CSS utilities.

**Context:** ADR-003 selected DaisyUI v4.x for rapid development with semantic class names. During UI implementation (2025-11-27), the team recognized that DaisyUI's clean, minimal aesthetic conflicted with the viral sharing goals and target audience preferences identified in UX research.

**Decision Rationale:**

1. **Target Audience Alignment:** Gaming community (r/GTA6, Discord) responds better to bold, energetic aesthetics than corporate-minimal design
2. **Viral Mechanics:** Screenshot-worthy results require visual boldness (Spotify Wrapped pattern)
3. **Brand Differentiation:** Generic countdown sites use clean designs; gaming aesthetic differentiates
4. **UX Spec Fulfillment:** Gaming Energy color theme was documented in UX spec but DaisyUI couldn't deliver the intensity needed
5. **Performance Maintained:** Custom CSS (~184 additional lines) still keeps total CSS under 15KB

**Implementation:**

**Custom Color System:**
```css
/* Custom GTA Theme Colors */
--gta-dark: #0f172a;      /* Base background */
--gta-card: #1e293b;      /* Card backgrounds */
--gta-pink: #db2777;      /* Primary accent */
--gta-purple: #7c3aed;    /* Secondary accent */
--gta-blue: #0ea5e9;      /* Tertiary accent */
```

**Component Migration:**
- **DaisyUI `btn`** → Custom gradient buttons with `bg-gradient-to-r from-gta-pink to-gta-purple`
- **DaisyUI `card`** → Custom cards with `bg-gta-card border border-gray-700 rounded-xl`
- **DaisyUI `stats`** → Custom dashboard grid with 4-card layout
- **DaisyUI semantic classes** → Utility-first Tailwind approach

**CSS Organization:**
- File: `public/styles.css` (+184 lines)
- Tailwind config: `tailwind.config.js` (custom color tokens)
- No DaisyUI plugin dependency removed (breaking change)

**Trade-offs:**

- ✅ **Pro:** Complete design control, perfect brand alignment
- ✅ **Pro:** Gaming aesthetic resonates with target audience
- ✅ **Pro:** Screenshot-worthy for social sharing
- ❌ **Con:** Lost DaisyUI's semantic class names (developer convenience)
- ❌ **Con:** More custom CSS to maintain (184 lines vs 0 custom)
- ⚠️ **Neutral:** Development velocity slightly slower without pre-built components

**Consequences:**

1. **All Epic 3 stories require DOM updates** (stats display, confirmation, comparison)
2. **All UI tests broken** (DOM selectors changed from DaisyUI classes)
3. **Epic 10 required** (new dashboard features: Optimism Score, My Prediction card)
4. **Documentation debt created** (15+ stories reference DaisyUI in acceptance criteria)
5. **ADR-003 superseded** (DaisyUI selection no longer active)

**Validation:**

- Performance budget maintained: Total CSS <15KB (target was <10KB, acceptable)
- Load time testing required: Verify <2s desktop, <3s mobile still met
- New images (5 files, 463KB each) need compression validation
- Accessibility re-audit required (WCAG AA compliance)

**Migration Path:**

1. Update all story acceptance criteria to use new class names
2. Rewrite UI tests with new DOM selectors
3. Create Epic 10 for dashboard enhancements
4. Document custom theme in style guide
5. Remove DaisyUI from dependencies: `npm uninstall daisyui`

**Alternatives Considered:**

- **DaisyUI theme customization:** Rejected - couldn't achieve gaming intensity needed
- **Hybrid approach (DaisyUI + custom):** Rejected - inconsistent visual language
- **Revert to DaisyUI:** Rejected - loses momentum, doesn't solve viral sharing goals

**Resolution Date:** 2025-11-27 (Sprint Change Proposal: UI Redesign & Integration)

**Status:** ✅ Approved - Implements Option 3A (Embrace Gaming Aesthetic)

---

_Generated by BMad Decision Architecture Workflow v1.0_
_Date: 2025-11-13_
_Updated: 2025-11-27 (Added ADR-014 PNG over SVG for Open Graph Images, ADR-015 Custom GTA Gaming Theme)_
_For: yojahny_
