# Epic Technical Specification: Core Prediction Engine

Date: 2025-11-19
Author: yojahny
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 implements the **Core Prediction Engine** - the foundational product value of the GTA 6 Launch Date Prediction Tracker. This epic enables users to submit anonymous predictions for when GTA 6 will actually launch and calculates a democratic community sentiment using a weighted median algorithm that reduces the influence of troll submissions.

**Strategic Importance:** Without this epic, there is no product. This is the core value proposition: capturing what the GTA 6 community ACTUALLY believes (not what Rockstar says) through frictionless prediction submissions and algorithmic consensus calculation. Every subsequent epic (Results Display, Social Sharing, Widgets) enhances or distributes this core capability.

The epic implements 10 stories covering the full prediction lifecycle: secure user identification (cookies), privacy-preserving anti-spam (IP hashing), input validation and security, bot protection (reCAPTCHA v3), rate limiting, submission/update API endpoints, the weighted median algorithm, and statistics calculation with caching.

## Objectives and Scope

**In Scope:**
- Secure cookie-based user identification (UUID v4, Web Crypto API)
- Privacy-preserving IP address hashing (BLAKE2b with salt)
- Client and server-side date validation (HTML5 date picker, ISO 8601)
- Comprehensive input validation and XSS/injection prevention (Zod validation)
- Invisible bot protection (reCAPTCHA v3 with score-based evaluation)
- IP-based rate limiting (Cloudflare KV, sliding window)
- Prediction submission API endpoint (POST /api/predict)
- Prediction update API endpoint (PUT /api/predict)
- Weighted median algorithm implementation (FR8 weight rules)
- Statistics calculation and caching (Cloudflare KV, 5-min TTL)

**Out of Scope:**
- User interface and results display (Epic 3)
- Social sharing functionality (Epic 5)
- Embeddable widgets (Epic 6)
- Email notifications (deferred to post-MVP)
- Advanced analytics or prediction history visualization

**Success Metrics:**
- Prediction submission completes in < 500ms (FR, NFR-P4)
- Statistics API responds in < 200ms cached (NFR-P3)
- Zero successful bot submissions in testing
- Cookie persists 2 years without regeneration
- Weighted median correctly reduces troll influence (test with 2099 dates)
- Rate limiting prevents >10 submissions/min per IP
- 100% of user inputs pass validation before database storage

## System Architecture Alignment

**Architecture Components Referenced:**

1. **Cookie Management** (ADR-010: day.js)
   - Frontend uses `js-cookie` library (3.0.5) for cookie operations
   - Secure flags: `httpOnly: false, secure: true, sameSite: 'Strict'`
   - Supports FR3 (unique cookie identifier) and FR4 (unlimited updates)

2. **IP Hashing** (Architecture Section: Security Architecture)
   - BLAKE2b hashing via Cloudflare Workers Web Crypto API
   - Salt stored in environment variable (`SALT_V1`)
   - Implements NFR-S2 (IP addresses hashed before storage)
   - Uses `CF-Connecting-IP` header for real client IP

3. **Date Handling** (ADR-010: day.js)
   - day.js library (1.11.19) for date calculations
   - ISO 8601 format throughout (`YYYY-MM-DD`)
   - UTC storage per FR73 requirements

4. **Input Validation** (NFR-S4, NFR-S5)
   - Zod library for TypeScript-first validation
   - Centralized validation module in `src/utils/validation.ts`
   - Prevents XSS (NFR-S4) and SQL injection (NFR-S5)

5. **Rate Limiting** (Architecture Section: Performance Considerations)
   - Cloudflare KV for distributed rate limiting
   - Sliding window algorithm (not fixed intervals)
   - Different limits per endpoint (10/min submit, 30/min update, 60/min stats)

6. **API Endpoints** (Architecture Section: API Contracts)
   - Hono framework for routing and middleware
   - Standardized JSON response format
   - RESTful design (POST creates, PUT updates, GET retrieves)

7. **Caching** (Architecture Section: Performance Considerations)
   - Cloudflare KV for statistics cache
   - 5-minute TTL (FR12 near real-time requirement)
   - Cache invalidation on write operations

**Architectural Constraints:**
- Must work on Cloudflare free tier (100K req/day, 5M D1 reads/day)
- Database schema established in Epic 1 (predictions table with weight field)
- All API responses must use standardized error format
- TypeScript strict mode throughout (NFR-M1)
- Parameterized queries for all database operations (NFR-S5)

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Cookie Service** | Generate and validate UUID v4 cookies | Browser request | cookie_id (UUID) | Story 2.1 |
| **IP Hashing Service** | Hash IP addresses with BLAKE2b | IP address, salt | ip_hash (hex string) | Story 2.2 |
| **Date Picker Component** | HTML5 date input with validation | User interaction | ISO 8601 date string | Story 2.3 |
| **Validation Service** | Centralized input validation | Any user input | Valid data or error | Story 2.4 |
| **reCAPTCHA Service** | Bot detection and verification | User action, token | Score (0.0-1.0) | Story 2.5 |
| **Rate Limiter** | Sliding window rate limiting | IP hash, endpoint | Allow/deny + headers | Story 2.6 |
| **Prediction Service** | Submit new predictions | Prediction data | 201 Created + ID | Story 2.7 |
| **Update Service** | Update existing predictions | cookie_id, new date | 200 OK + previous | Story 2.8 |
| **Weighted Median Calculator** | Calculate community median | All predictions | Weighted median date | Story 2.9 |
| **Statistics Service** | Aggregate stats with caching | Database query | Stats JSON (cached) | Story 2.10 |

### Data Models and Contracts

**Database Schema** (Established in Epic 1, Story 1.2):

```sql
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

CREATE INDEX idx_predictions_date ON predictions(predicted_date);
CREATE INDEX idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX idx_predictions_submitted ON predictions(submitted_at);
```

**TypeScript Interfaces:**

```typescript
// Cookie ID type (Story 2.1)
type CookieID = string; // UUID v4 format

// IP Hash type (Story 2.2)
type IPHash = string; // 64-character hex string

// Prediction submission request (Story 2.7)
interface PredictionRequest {
  predicted_date: string; // ISO 8601: "YYYY-MM-DD"
  recaptcha_token: string;
}

// Prediction response (Story 2.7, 2.8)
interface PredictionResponse {
  success: true;
  prediction_id?: number;
  predicted_date: string;
  previous_date?: string; // Only for updates
  message: string;
}

// Statistics response (Story 2.10)
interface StatsResponse {
  median: string; // Weighted median date
  min: string;    // Earliest prediction
  max: string;    // Latest prediction
  count: number;  // Total predictions
  cached_at: string; // ISO 8601 timestamp
}

// Error response (Story 2.4)
interface ErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR' | 'BOT_DETECTED';
    message: string;
    field?: string;
  };
}

// Weight calculation (Story 2.9)
interface WeightCalculation {
  predictedDate: Date;
  weight: number; // 1.0, 0.3, or 0.1
}
```

**Validation Schemas (Story 2.4):**

```typescript
import { z } from 'zod';

// Date validation schema
const DateSchema = z.string()
  .regex(/^202[5-9]|20[3-9]\d|21[0-2]\d)-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/)
  .refine((date) => new Date(date) >= new Date('2025-01-01'))
  .refine((date) => new Date(date) <= new Date('2125-12-31'));

// UUID validation schema
const UUIDSchema = z.string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

// Prediction request validation
const PredictionRequestSchema = z.object({
  predicted_date: DateSchema,
  recaptcha_token: z.string().min(1)
});
```

### APIs and Interfaces

**POST /api/predict** (Story 2.7 - Prediction Submission)

```typescript
Request:
POST /api/predict
Headers:
  Cookie: gta6_user_id=<uuid>
  Content-Type: application/json
Body:
{
  "predicted_date": "2026-11-19",
  "recaptcha_token": "03AGdBq25..."
}

Success Response (201 Created):
{
  "success": true,
  "prediction_id": 1234,
  "predicted_date": "2026-11-19",
  "message": "Your prediction has been recorded!"
}

Error Responses:
- 400 Bad Request (Invalid date, validation failed)
- 409 Conflict (IP already submitted, use update instead)
- 429 Too Many Requests (Rate limit exceeded, 10/min)
- 503 Service Unavailable (reCAPTCHA verification failed)
```

**PUT /api/predict** (Story 2.8 - Prediction Update)

```typescript
Request:
PUT /api/predict
Headers:
  Cookie: gta6_user_id=<uuid>
  Content-Type: application/json
Body:
{
  "predicted_date": "2027-02-14",
  "recaptcha_token": "03AGdBq25..."
}

Success Response (200 OK):
{
  "success": true,
  "predicted_date": "2027-02-14",
  "previous_date": "2026-11-19",
  "message": "Your prediction has been updated!"
}

Error Responses:
- 400 Bad Request (Invalid date)
- 404 Not Found (No prediction found for cookie_id)
- 429 Too Many Requests (30/min limit)
```

**GET /api/stats** (Story 2.10 - Statistics)

```typescript
Request:
GET /api/stats

Success Response (200 OK):
{
  "median": "2026-11-19",
  "min": "2025-06-15",
  "max": "2099-12-31",
  "count": 10234,
  "cached_at": "2025-11-19T14:30:00Z"
}

Headers:
  Cache-Control: public, max-age=300
  X-Cache: HIT | MISS

Rate Limit: 60/min per IP
```

**Internal Utility Functions:**

```typescript
// Story 2.1: Cookie generation
function generateCookieID(): string {
  return crypto.randomUUID(); // Web Crypto API
}

// Story 2.2: IP hashing
async function hashIP(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ip);
  const hashBuffer = await crypto.subtle.digest('BLAKE2b-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Story 2.9: Weight calculation
function calculateWeight(predictedDate: Date): number {
  const officialDate = new Date('2026-11-19');
  const yearsDiff = Math.abs(
    (predictedDate.getTime() - officialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (yearsDiff <= 5) return 1.0;   // 2021-2031: Full weight
  if (yearsDiff <= 50) return 0.3;  // 2031-2076: Reduced
  return 0.1;                        // Beyond 50 years: Minimal
}

// Story 2.9: Weighted median calculation
async function calculateWeightedMedian(db: D1Database): Promise<string> {
  const predictions = await db.prepare(
    'SELECT predicted_date, weight FROM predictions ORDER BY predicted_date ASC'
  ).all();

  const totalWeight = predictions.results.reduce((sum, p) => sum + p.weight, 0);
  const targetWeight = totalWeight / 2;
  let cumulativeWeight = 0;

  for (const p of predictions.results) {
    cumulativeWeight += p.weight;
    if (cumulativeWeight >= targetWeight) {
      return p.predicted_date;
    }
  }

  return predictions.results[predictions.results.length - 1].predicted_date;
}
```

### Workflows and Sequencing

**Prediction Submission Workflow** (Story 2.7):

```
1. User lands on page (First visit)
2. Frontend checks for existing cookie (Story 2.1)
   → If no cookie: Generate UUID v4 → Set cookie (2-year expiry)
   → If cookie exists: Validate UUID format
3. User selects date via HTML5 date picker (Story 2.3)
4. Frontend validates date (2025-2125 range)
5. User clicks "Submit Prediction"
6. Frontend executes reCAPTCHA v3 (Story 2.5)
   → grecaptcha.execute(SITE_KEY, {action: 'submit_prediction'})
7. Frontend sends POST /api/predict with date + token

BACKEND PROCESSING:
8. Extract cookie_id from Cookie header
9. Extract IP from CF-Connecting-IP header
10. Validate inputs (Story 2.4)
    → Date format (ISO 8601)
    → Date range (2025-2125)
    → Cookie ID (UUID v4 format)
11. Verify reCAPTCHA token (Story 2.5)
    → POST to Google API
    → Score >= 0.5: Continue
    → Score < 0.5: Return 503 "Please try again"
12. Check rate limit (Story 2.6)
    → Increment counter in Cloudflare KV
    → Key: ratelimit:{ipHash}:submit
    → Limit: 10/min
    → If exceeded: Return 429
13. Hash IP address (Story 2.2)
    → BLAKE2b(SALT_V1 + ip)
14. Calculate weight (Story 2.9)
    → Based on yearsDiff from official date
15. BEGIN TRANSACTION (Epic 1, Story 1.4)
16. INSERT INTO predictions
    → Handle UNIQUE ip_hash constraint (409 if duplicate)
17. COMMIT TRANSACTION
18. Invalidate stats cache (Story 2.10)
19. Return 201 Created with prediction_id
```

**Prediction Update Workflow** (Story 2.8):

```
1. User returns to site (Cookie persists)
2. Frontend detects existing cookie
3. User changes date → Submits update
4. Frontend executes reCAPTCHA v3
5. Frontend sends PUT /api/predict with new date + token

BACKEND PROCESSING:
6. Extract cookie_id from cookie
7. Verify reCAPTCHA (same as submission)
8. Validate new date
9. Check rate limit (30/min for updates)
10. Calculate new weight
11. UPDATE predictions SET predicted_date, weight, updated_at WHERE cookie_id = ?
    → If cookie not found: Return 404
12. Invalidate stats cache
13. Return 200 OK with previous_date
```

**Statistics Calculation Workflow** (Story 2.10):

```
REQUEST:
1. GET /api/stats received
2. Check rate limit (60/min per IP)
3. Check Cloudflare KV cache
   → Key: stats:latest
   → If HIT: Return cached JSON immediately (<50ms)

CACHE MISS:
4. Query database:
   → MIN(predicted_date)
   → MAX(predicted_date)
   → COUNT(*)
   → SELECT all predictions with weights for median
5. Calculate weighted median (Story 2.9)
   → Sort by date
   → Find 50th percentile by cumulative weight
6. Store result in KV cache (TTL: 300 seconds)
7. Return JSON with median, min, max, count, cached_at
```

**Rate Limiting Sequence** (Story 2.6):

```
1. Request arrives with IP address
2. Hash IP → ip_hash
3. Construct key: ratelimit:{ip_hash}:{endpoint}
4. Atomic operations in Cloudflare KV:
   → GET counter
   → If null: SET counter = 1, TTL = 60s
   → If exists: INCREMENT counter
   → If counter > limit: Return 429
5. Set response headers:
   → X-RateLimit-Limit
   → X-RateLimit-Remaining
   → X-RateLimit-Reset (Unix timestamp)
   → Retry-After (seconds)
```

## Non-Functional Requirements

### Performance

**Targets:**
- **Prediction Submission:** < 500ms end-to-end (NFR-P4)
  - Includes: reCAPTCHA verification, validation, IP hashing, DB insert
  - Measurement: Cloudflare Workers logs + D1 query time

- **Statistics API (Cached):** < 200ms response time (NFR-P3)
  - Cloudflare KV cache hit: < 50ms
  - Cache miss: < 200ms (includes median calculation)

- **Date Picker Validation:** < 50ms client-side
  - Native HTML5 validation (instant)
  - Regex validation (synchronous)

- **Cookie Generation:** < 10ms
  - crypto.randomUUID() is synchronous and fast

**Optimization Strategies:**
- Pre-calculate weights during submission (avoid recalculation)
- Index predictions table on `predicted_date` for median query
- Use Cloudflare KV for distributed caching (edge locations)
- Rate limiting prevents resource exhaustion attacks

**Source:** NFR-P3 (API response < 200ms), NFR-P4 (Prediction submission < 500ms), PRD Section: Performance Requirements

### Security

**Requirements:**
- **IP Hashing (Story 2.2):** SHA-256 or BLAKE2b with salt before storage (NFR-S2, FR53)
  - Salt stored in environment variable (`SALT_V1`)
  - Versioned salt supports future rotation (FR79)
  - Original IP NEVER stored in database

- **Cookie Security (Story 2.1):** Secure cookie flags (NFR-S3)
  - `httpOnly: false` (JavaScript needs access for submission)
  - `secure: true` (HTTPS only)
  - `sameSite: 'Strict'` (CSRF protection)

- **Input Validation (Story 2.4):** All user inputs validated (NFR-S4, NFR-S5)
  - Server-side validation (never trust client)
  - Zod schemas for type-safe validation
  - Regex for date format, UUID format
  - HTML encoding prevents XSS

- **SQL Injection Prevention:** Parameterized queries only (NFR-S5, FR78)
  - D1 prepared statements: `db.prepare(sql).bind(params)`
  - No string interpolation in SQL queries

- **Bot Protection (Story 2.5):** reCAPTCHA v3 (FR76)
  - Score-based evaluation (>= 0.5 passes)
  - Invisible to users (no checkbox friction)
  - Fail open on network errors (don't block legitimate users)

- **Rate Limiting (Story 2.6):** IP-based DoS prevention (FR77, NFR-S6)
  - 10/min for submissions
  - 30/min for updates
  - 60/min for stats
  - Sliding window algorithm

**Validation:**
- Penetration testing with common attack vectors (XSS, SQL injection)
- Test IP hashing with rainbow tables (should fail)
- Verify cookie flags in browser DevTools
- Load test rate limiting (confirm 429 after limit)

**Source:** NFR-S2 (IP hashing), NFR-S3 (secure cookies), NFR-S4 (XSS prevention), NFR-S5 (SQL injection), NFR-S6 (rate limiting)

### Reliability/Availability

**Targets:**
- **Uptime:** > 99.5% (Cloudflare SLA, NFR-R1)
  - Cloudflare Workers auto-scaling and failover
  - Multi-region edge deployment

- **Data Integrity:** Zero data loss for predictions (NFR-R3)
  - Database transactions (Epic 1, Story 1.4)
  - D1 automatic backups with Time Travel

- **Graceful Degradation:**
  - reCAPTCHA failure: Fail open, allow submission (FR60)
  - Cache miss: Fall back to database query (slower but functional)
  - Rate limit errors: User-friendly message with retry guidance

- **Error Handling:** User-friendly messages for all failures (NFR-R4)
  - Validation errors: "Please select a date between..." (FR59)
  - Rate limit: "Please wait 45 seconds and try again"
  - Server errors: "Something went wrong. Please try again later."

**Mechanisms:**
- Cloudflare Workers automatic failover
- D1 database replication across regions
- Transaction rollback on errors
- Retry logic for transient failures (3 attempts max)

**Source:** NFR-R1 (uptime), NFR-R3 (zero data loss), NFR-R4 (graceful errors), FR60 (degrade gracefully)

### Observability

**Logging:**
- **Structure:** JSON format with timestamp, level, message, context (Architecture: Logging Strategy)
- **Levels:**
  - INFO: Prediction submissions, updates, stats requests
  - WARN: Rate limit hits, reCAPTCHA failures, validation errors
  - ERROR: Database errors, transaction rollbacks, external API failures

**Metrics (Epic 1, Story 1.6 - Cloudflare Analytics):**
- Prediction submission rate (per minute, per hour, per day)
- reCAPTCHA success/failure rate (detect bot attacks)
- Rate limit violations per IP (identify abuse patterns)
- Cache hit/miss ratio for stats endpoint
- Weighted median value over time (trending)
- API response times (p50, p95, p99)

**What to Log:**
- All prediction submissions (cookie_id, date, weight, ip_hash)
- reCAPTCHA scores (for tuning threshold)
- Rate limit violations (IP hash, endpoint, timestamp)
- Cache invalidations (when and why)
- Validation failures (input type, error reason)

**What NOT to Log:**
- Raw IP addresses (only hashed values, NFR-S2)
- reCAPTCHA tokens (sensitive, Google ToS)
- Cookie values (privacy)

**Cloudflare Dashboard Monitoring:**
- Workers logs (real-time tail + search)
- D1 database metrics (query latency, reads/writes)
- KV namespace metrics (cache hit ratio)

**Source:** NFR-R5 (monitoring), Architecture Section: Logging Strategy, Architecture Section: Observability

## Dependencies and Integrations

**Core Dependencies (from package.json):**

```json
{
  "dependencies": {
    "hono": "^4.10.0",          // Web framework for Cloudflare Workers
    "dayjs": "^1.11.19",         // Date manipulation and formatting
    "js-cookie": "^3.0.5",       // Cookie management (frontend)
    "tailwindcss": "^4.0.0"      // CSS framework (frontend styling)
  },
  "devDependencies": {
    "@cloudflare/workers-types": "latest", // TypeScript types for Workers
    "vitest": "^3.2.4",                    // Testing framework (ADR-009)
    "typescript": "latest",                 // Type safety (NFR-M1)
    "wrangler": "^4.48.0"                  // Cloudflare CLI
  }
}
```

**Additional Dependencies (to be added):**

```json
{
  "dependencies": {
    "zod": "^3.22.0"  // Input validation (Story 2.4)
  }
}
```

**External Services:**
- **Google reCAPTCHA v3** (Story 2.5)
  - Site Key: Public (embedded in frontend)
  - Secret Key: Environment variable `RECAPTCHA_SECRET_KEY`
  - API: `https://www.google.com/recaptcha/api/siteverify`
  - Free tier: Unlimited requests

- **Cloudflare D1** (Epic 1 dependency)
  - Database binding: `c.env.DB`
  - Accessed via D1Database interface

- **Cloudflare KV** (Story 2.6, 2.10)
  - Namespace binding: `c.env.RATE_LIMIT_KV` (rate limiting)
  - Namespace binding: `c.env.STATS_CACHE_KV` (statistics cache)
  - Free tier: 100K reads/day, 1K writes/day

**Infrastructure Dependencies:**
- **Cloudflare Workers:** Runtime environment (Epic 1)
- **Cloudflare Pages:** Frontend hosting (Epic 1)
- **GitHub Actions:** CI/CD pipeline (Epic 1, Story 1.3)

**Version Constraints:**
- TypeScript: Latest with strict mode
- Node.js: >= 18.0.0 (for crypto.randomUUID())
- Wrangler: >= 4.0.0 (for D1 and KV support)
- Vitest: >= 3.2.0 (for Workers pool compatibility, ADR-009)

**Integration Points:**
- **Frontend → Workers:** `fetch('/api/predict')` (Story 2.7, 2.8)
- **Workers → D1:** `c.env.DB.prepare(sql).bind(params).all()` (Story 2.7-2.10)
- **Workers → KV:** `c.env.RATE_LIMIT_KV.get(key)` (Story 2.6, 2.10)
- **Workers → Google reCAPTCHA:** `fetch('https://www.google.com/recaptcha/api/siteverify')` (Story 2.5)
- **Frontend → reCAPTCHA:** `grecaptcha.execute()` (Story 2.5)

## Acceptance Criteria (Authoritative)

**AC1: Secure Cookie ID Generation** (Story 2.1)
- Cookie ID generated using crypto.randomUUID() (UUID v4 format)
- Cookie stored with name "gta6_user_id", 2-year expiry
- Security flags: `secure: true, sameSite: 'Strict', httpOnly: false`
- Existing cookie not regenerated on subsequent visits
- Cookie ID validated as valid UUID format on every request

**AC2: IP Address Hashing** (Story 2.2)
- IP addresses hashed with BLAKE2b before database storage
- Salt from environment variable `SALT_V1`
- Hash output: 64-character hex string
- Original IP NEVER stored in database
- Hash is deterministic (same IP = same hash with same salt)
- Cloudflare Workers helper function `hashIP(ip, salt)` exists

**AC3: Date Picker with Validation** (Story 2.3)
- Native HTML5 date input with `min="2025-01-01" max="2125-12-31"`
- Client-side validation prevents invalid dates
- Mobile-friendly (native OS date pickers)
- Keyboard accessible with ARIA labels
- Leap years validated correctly
- Date converted to UTC (ISO 8601) before submission

**AC4: Input Validation and XSS Prevention** (Story 2.4)
- All inputs validated server-side (never trust client)
- Date format: ISO 8601 `YYYY-MM-DD`
- Date range: 2025-01-01 to 2125-12-31
- Cookie ID: Valid UUID v4 format (regex validation)
- User agent: Sanitized (HTML-encoded, max 256 chars)
- Invalid inputs return 400 Bad Request with clear error message
- Validation functions centralized in shared module

**AC5: reCAPTCHA v3 Integration** (Story 2.5)
- Google reCAPTCHA v3 integrated (invisible, no user interaction)
- Frontend executes `grecaptcha.execute()` on form submit
- Backend verifies token with Google API
- Score evaluation: >= 0.5 passes, < 0.5 rejects
- Network errors fail open (allow submission, don't block users)
- reCAPTCHA badge visible in footer

**AC6: Rate Limiting Per IP Address** (Story 2.6)
- Submission endpoint: 10 requests/min per IP
- Update endpoint: 30 requests/min per IP
- Stats endpoint: 60 requests/min per IP
- Sliding window algorithm (not fixed intervals)
- Rate limit exceeded returns 429 with headers: `X-RateLimit-*`, `Retry-After`
- Storage: Cloudflare KV with 60-second TTL
- Error message: "You're submitting too quickly. Please wait X seconds and try again."

**AC7: Prediction Submission API Endpoint** (Story 2.7)
- POST /api/predict endpoint exists
- Request accepts: `predicted_date` (ISO 8601), `recaptcha_token`
- Server validates inputs, verifies reCAPTCHA, checks rate limit
- IP hashed and checked against UNIQUE constraint
- Weight calculated based on date reasonableness
- Database transaction ensures atomicity
- Success returns 201 Created with prediction_id
- IP duplicate returns 409 Conflict
- Rate limit exceeded returns 429

**AC8: Prediction Update API Endpoint** (Story 2.8)
- PUT /api/predict endpoint exists
- Updates existing prediction via cookie_id lookup
- Validates new date, verifies reCAPTCHA, checks rate limit (30/min)
- Updates `predicted_date`, `weight`, `updated_at` fields
- Success returns 200 OK with `previous_date`
- Cookie not found returns 404
- IP conflict resolved: cookie_id takes precedence, updates ip_hash

**AC9: Weighted Median Algorithm** (Story 2.9)
- Weight calculation function exists:
  - Years diff <= 5: weight = 1.0
  - Years diff <= 50: weight = 0.3
  - Years diff > 50: weight = 0.1
- Weighted median calculation:
  - Fetch all predictions with weights
  - Sort by date ascending
  - Find 50th percentile by cumulative weight
- Edge cases handled: no predictions (return null), single prediction, all weights 0 (fallback to simple median)
- Weights pre-calculated and stored during submission/update

**AC10: Statistics Calculation and Caching** (Story 2.10)
- GET /api/stats endpoint returns: median, min, max, count
- Weighted median uses Story 2.9 algorithm
- Min/max/count: Database queries (indexed for performance)
- Caching: Cloudflare KV, 5-minute TTL
- Cache key: `stats:latest`
- Cache invalidated on new submission, update, deletion
- Cache hit response time: < 50ms
- Cache miss response time: < 200ms
- Response includes `cached_at` timestamp

## Traceability Mapping

| AC | Spec Section(s) | Component(s)/API(s) | Test Idea |
|----|----------------|---------------------|-----------|
| AC1 | Cookie Management (System Arch) | `generateCookieID()`, `js-cookie` lib | Verify UUID v4 format, check cookie flags in browser DevTools, test persistence across sessions |
| AC2 | IP Hashing (Security) | `hashIP()` utility, BLAKE2b | Test with known IP+salt combinations, verify hash length (64 chars), attempt rainbow table attack |
| AC3 | Date Handling (Detailed Design) | HTML5 `<input type="date">`, validation | Test date range limits, leap year (Feb 29), keyboard navigation, screen reader labels |
| AC4 | Input Validation (Security) | Zod schemas, `PredictionRequestSchema` | Inject XSS payloads (should be sanitized), SQL injection attempts (should fail), invalid dates (should reject) |
| AC5 | Bot Protection (Detailed Design) | reCAPTCHA v3, `grecaptcha.execute()` | Test with valid/invalid tokens, simulate network failures (should fail open), verify score thresholds |
| AC6 | Rate Limiting (Performance, Security) | Cloudflare KV, rate limiter middleware | Submit 11 requests in 60s (11th should 429), verify headers, test sliding window (wait 30s, retry) |
| AC7 | Prediction Submission API | POST /api/predict, `PredictionService` | End-to-end test: cookie → date → submit → verify DB insert, test IP duplicate (409), rate limit (429) |
| AC8 | Prediction Update API | PUT /api/predict, `UpdateService` | Update with valid cookie (200 OK), update with invalid cookie (404), verify previous_date returned |
| AC9 | Weighted Median Algorithm | `calculateWeightedMedian()`, `calculateWeight()` | Test with all reasonable dates (weight=1.0), test with 2099 (weight=0.1), verify median shifts correctly |
| AC10 | Statistics Calculation & Caching | GET /api/stats, Cloudflare KV cache | Cache miss (slow query), cache hit (fast <50ms), invalidation after new submission |

**Requirements Mapping (PRD → Epic 2):**
- FR1 (Submit prediction) → AC7 (Submission API)
- FR2 (Date range validation) → AC3 (Date picker), AC4 (Server validation)
- FR3 (Unique cookie identifier) → AC1 (Cookie generation)
- FR4 (Unlimited updates via cookie) → AC8 (Update API)
- FR5 (One per IP) → AC2 (IP hashing), AC7 (UNIQUE constraint)
- FR6 (Confirmation message) → AC7 (201 Created response)
- FR7 (Weighted median calculation) → AC9 (Algorithm implementation)
- FR8 (Weight values) → AC9 (1.0, 0.3, 0.1 tiers)
- FR9-FR11 (Min/max/count) → AC10 (Statistics API)
- FR12 (5-min cache) → AC10 (Cloudflare KV TTL)

**NFR Mapping:**
- NFR-P3 (Stats API < 200ms) → AC10 (Caching)
- NFR-P4 (Submission < 500ms) → AC7 (Optimized flow)
- NFR-S2 (IP hashing) → AC2 (BLAKE2b)
- NFR-S3 (Secure cookies) → AC1 (Cookie flags)
- NFR-S4 (XSS prevention) → AC4 (Input sanitization)
- NFR-S5 (SQL injection prevention) → AC4 (Parameterized queries)
- NFR-S6 (Rate limiting) → AC6 (Cloudflare KV limiter)

## Risks, Assumptions, Open Questions

**Risk: reCAPTCHA v3 False Positives**
- **Description:** Legitimate users may be flagged as bots (score < 0.5)
- **Probability:** Medium (especially for VPN users, aggressive browsers)
- **Impact:** High (user frustration, lost predictions)
- **Mitigation:** Fail open on network errors (Story 2.5), provide retry option, monitor score distribution via logging, consider tuning threshold (0.4 instead of 0.5)
- **Owner:** Story 2.5 (reCAPTCHA integration)

**Risk: Cloudflare KV Free Tier Limits**
- **Description:** 100K reads/day, 1K writes/day may be exceeded during viral spike
- **Probability:** Medium (depends on launch success)
- **Impact:** High (rate limiting breaks, stats caching breaks)
- **Mitigation:** Monitor KV usage via Cloudflare dashboard, document upgrade path to paid tier ($5/mo for 10M reads), fallback to in-memory rate limiting (less accurate but functional)
- **Owner:** Story 2.6 (rate limiting), Story 2.10 (caching)

**Risk: Weighted Median Algorithm Edge Cases**
- **Description:** Algorithm may behave unexpectedly with extreme data distributions (all dates in 2099, single prediction, etc.)
- **Probability:** Low (mitigated by comprehensive testing)
- **Impact:** Medium (incorrect community median displayed)
- **Mitigation:** Extensive unit tests covering edge cases (Story 2.9), fallback to simple median if weighted fails (FR63), monitor median value over time for anomalies
- **Owner:** Story 2.9 (algorithm implementation)

**Risk: IP Hashing Salt Rotation Complexity**
- **Description:** Future salt rotation (FR79) may break existing IP-based duplicate detection
- **Probability:** Low (not needed for MVP)
- **Impact:** Medium (users may submit duplicate predictions after rotation)
- **Mitigation:** Defer to post-MVP, design migration strategy when needed (dual-hash period), document versioning approach (`SALT_V1`, `SALT_V2`)
- **Owner:** Story 2.2 (IP hashing)

**Assumption: Cloudflare D1 Performance Adequate**
- **Description:** Assuming D1 can handle median calculation queries efficiently (<200ms with 10K+ predictions)
- **Validation:** Load test with 10K predictions during Story 2.9
- **Fallback:** Pre-calculate median via cron job if real-time too slow, cache aggressively (1-hour TTL)

**Assumption: Google reCAPTCHA Free Tier Sufficient**
- **Description:** Assuming unlimited requests without Google throttling
- **Validation:** Monitor reCAPTCHA API response times and error rates
- **Fallback:** Upgrade to reCAPTCHA Enterprise ($1 per 1K assessments)

**Assumption: Browser Cookie Support**
- **Description:** Assuming users have cookies enabled (required for updates)
- **Validation:** Test with cookies disabled (should still allow submissions, but no updates)
- **Fallback:** Display message: "Enable cookies to update your prediction later"

**Open Question: Should we add CAPTCHA challenge for low scores?**
- **Options:** (1) Fail open (current), (2) Fallback to reCAPTCHA v2 checkbox for scores 0.3-0.5
- **Decision:** Defer to post-MVP based on bot attack data
- **Rationale:** Maintaining frictionless UX is priority; add challenges only if necessary

**Open Question: Should we support cookie-less prediction mode?**
- **Options:** (1) Cookies required (current), (2) Allow one-time submissions without cookie (no updates)
- **Decision:** Cookies required for MVP
- **Rationale:** Simplifies implementation, most users accept functional cookies

## Test Strategy Summary

**Unit Tests (Vitest, ADR-009 mandate):**
- **Cookie Service (Story 2.1):**
  - Test UUID v4 generation (crypto.randomUUID())
  - Test cookie validation (valid/invalid UUIDs)
  - Coverage: 100%

- **IP Hashing (Story 2.2):**
  - Test BLAKE2b hash output (deterministic, 64-char hex)
  - Test with known IP+salt combinations
  - Test hash collision probability (negligible)
  - Coverage: 100%

- **Validation Service (Story 2.4):**
  - Test Zod schemas (date format, range, UUID format)
  - Test XSS payload sanitization
  - Test SQL injection pattern detection
  - Coverage: 100%

- **Weight Calculation (Story 2.9):**
  - Test weight tiers (1.0, 0.3, 0.1)
  - Test boundary conditions (exactly 5 years, exactly 50 years)
  - Test official date reference (2026-11-19)
  - Coverage: 100%

- **Weighted Median Algorithm (Story 2.9):**
  - Test with all reasonable dates (weight=1.0)
  - Test with mix of reasonable + outliers (2099)
  - Test edge cases: empty array, single prediction, all weights 0
  - Test even vs odd number of predictions
  - Coverage: 90%+

**Integration Tests (Vitest + @cloudflare/vitest-pool-workers):**
- **Submission Flow (Story 2.7):**
  - End-to-end: Generate cookie → Submit prediction → Verify DB insert
  - Test UNIQUE ip_hash constraint (409 Conflict)
  - Test rate limiting (11th request → 429)
  - Test reCAPTCHA verification (mock Google API)

- **Update Flow (Story 2.8):**
  - Update with valid cookie → 200 OK
  - Update with invalid cookie → 404 Not Found
  - Verify previous_date returned

- **Statistics Caching (Story 2.10):**
  - Cache miss → Query DB → Store in KV → Return JSON
  - Cache hit → Return cached JSON (<50ms)
  - Cache invalidation after new submission

**Manual Tests:**
- **Cross-Browser (Story 2.3):**
  - Date picker on Chrome, Firefox, Safari, Edge
  - Mobile date picker on iOS Safari, Android Chrome
  - Keyboard navigation (tab order, Enter to submit)

- **Security Validation (Story 2.4, 2.5):**
  - Inject XSS payloads (should be sanitized in DB)
  - SQL injection attempts (should fail with 400)
  - reCAPTCHA badge visible in footer
  - Cookie flags verified in DevTools

- **Rate Limiting (Story 2.6):**
  - Submit 11 requests in 60 seconds → 11th gets 429
  - Wait 30 seconds → Submit again → Success

**Acceptance Tests:**
- All 10 ACs validated before epic marked "contexted"
- Each story's ACs verified before story marked "done"
- Test data: 100 predictions with mix of reasonable (80%) and outliers (20%)

**Test Tools:**
- Vitest for unit tests (per ADR-009)
- @cloudflare/vitest-pool-workers for Workers integration tests
- Wrangler local dev for manual testing
- Cloudflare Analytics for performance validation
- Browser DevTools for security validation

**Coverage Target:**
- Critical paths: 100% (cookie generation, IP hashing, validation, weighted median)
- API endpoints: 90%+ (submission, update, stats)
- Overall epic: 85%+

**Edge Cases:**
- Leap year dates (Feb 29, 2028)
- Extreme dates (2025-01-01, 2125-12-31)
- Concurrent submissions (same IP, race condition)
- Network failures (reCAPTCHA API down, D1 timeout)
- Cache expiration edge case (TTL=0)
- Cookie expiration (2-year TTL boundary)
- Unicode characters in user agent
- Very large prediction counts (100K+)
