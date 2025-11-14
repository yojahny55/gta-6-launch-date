# Epic 2: Core Prediction Engine

**Epic Goal:** Enable users to submit predictions and calculate community sentiment - this is the core product value.

**Epic Value:** Without this epic, there is no product. Everything else enhances or distributes this capability.

## Story 2.1: Secure Cookie ID Generation

As a user,
I want a unique identifier assigned to my browser,
So that I can update my prediction later without creating an account.

**Acceptance Criteria:**

**Given** a user visits the site for the first time
**When** the page loads
**Then** a cryptographically secure cookie ID is generated:
- Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Generated using crypto.randomUUID() (Web Crypto API)
- Stored in cookie named "gta6_user_id"

**And** cookie has security attributes:
- httpOnly: false (needs JavaScript access for submissions)
- secure: true (HTTPS only)
- sameSite: "Strict"
- maxAge: 63072000 (2 years, FR65)
- path: "/"

**And** cookie generation is deterministic:
- If cookie already exists, don't regenerate
- Same cookie ID persists across sessions
- Cookie ID is validated on every request (valid UUID format)

**Prerequisites:** Story 1.1 (project structure)

**Technical Notes:**
- Implements FR3 (unique cookie identifier)
- Implements FR80 (secure random generation prevents enumeration)
- Supports FR4 (unlimited updates via cookie)
- Supports FR65 (2-year expiration)
- Cookie is functional, not tracking (FR68 distinction)
- No PII stored in cookie

---

## Story 2.2: IP Address Hashing for Privacy-Preserving Anti-Spam

As a system,
I want to hash IP addresses before storage,
So that user privacy is protected while preventing spam submissions.

**Acceptance Criteria:**

**Given** a user submits a prediction
**When** the API receives the request
**Then** the user's IP address is hashed:
- Extract IP from request headers (CF-Connecting-IP for Cloudflare)
- Hash using BLAKE2b algorithm with 256-bit output
- Salt: Environment variable SALT_V1 (versioned for FR79 future rotation)
- Output: Hex string (64 characters)

**And** hashed IP is stored in database:
- predictions.ip_hash field
- Original IP is NEVER stored
- Hash is deterministic (same IP = same hash with same salt)

**And** hash collision is handled:
- Probability is negligible (2^128 security)
- If collision occurs (DB constraint violation), log as error

**And** Cloudflare Workers API provides helper:
```typescript
async function hashIP(ip: string, salt: string): Promise<string>
```

**Prerequisites:** Story 1.2 (database schema), Story 1.4 (error handling)

**Technical Notes:**
- Implements FR53 (IP hashing)
- Implements FR80 (secure hashing prevents rainbow table attacks)
- Supports FR5 (one submission per IP via UNIQUE constraint)
- Supports FR79 (salt versioning for future rotation)
- BLAKE2b is faster and more secure than SHA-256
- Salt must be kept secret (environment variable, not in code)

---

## Story 2.3: Date Picker with Validation

As a user,
I want to select a date for when I think GTA 6 will launch,
So that I can submit my prediction.

**Acceptance Criteria:**

**Given** a user wants to submit a prediction
**When** they interact with the date picker
**Then** a native HTML5 date input is presented:
- `<input type="date" min="2025-01-01" max="2125-12-31">`
- Default value: Empty (forces user to choose)
- Mobile-friendly (native date pickers on iOS/Android)
- Keyboard accessible (FR69 requirement)

**And** date validation occurs on client-side:
- Minimum date: January 1, 2025 (past dates rejected)
- Maximum date: December 31, 2125 (100-year range, FR2)
- Invalid format rejected (only YYYY-MM-DD accepted)
- Empty submission prevented (required field)

**And** validation messages are clear:
- "Please select a date between Jan 1, 2025 and Dec 31, 2125"
- "GTA 6 can't launch in the past!"
- "Please enter a valid date"

**And** edge cases are handled:
- Leap years validated correctly (Feb 29, 2028 is valid)
- Timezone-independent (date only, no time component)
- Date is converted to UTC before submission (FR73)

**Prerequisites:** Story 1.1 (project structure)

**Technical Notes:**
- Implements FR2 (date range validation)
- Supports FR69 (keyboard accessible)
- Supports FR73 (UTC storage via Date.toISOString())
- Native date picker provides best UX and accessibility
- Validation must occur both client and server-side
- Use ARIA labels for FR71 (screen reader support)

---

## Story 2.4: Input Validation and XSS Prevention

As a system,
I want all user inputs validated and sanitized,
So that the application is protected from injection attacks.

**Acceptance Criteria:**

**Given** a user submits data to any API endpoint
**When** the server receives the request
**Then** validation rules are applied:

**For date input:**
- Must match ISO 8601 format: YYYY-MM-DD
- Must be within range: 2025-01-01 to 2125-12-31
- Must be valid calendar date (no Feb 30, no month 13)
- Regex: `^202[5-9]|20[3-9]\d|21[0-2]\d)-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`

**For cookie_id input:**
- Must be valid UUID v4 format
- Regex: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
- Max length: 36 characters

**For user_agent (if stored):**
- Max length: 256 characters
- Sanitized to remove SQL injection patterns
- HTML-encoded to prevent XSS

**And** invalid inputs return 400 Bad Request:
```json
{
  "error": "Invalid date format. Expected YYYY-MM-DD between 2025-01-01 and 2125-12-31",
  "field": "predicted_date"
}
```

**And** validation is centralized:
- Validation functions in shared module
- Reused across all API endpoints
- TypeScript types enforce structure

**Prerequisites:** Story 1.4 (error handling)

**Technical Notes:**
- Implements FR62 (input validation prevents XSS/injection)
- Supports FR78 (parameterized queries - validation is first line of defense)
- Supports FR59 (user-friendly error messages)
- Use Zod or similar for TypeScript-first validation
- Never trust client-side validation alone
- Sanitization prevents stored XSS attacks

---

## Story 2.5: reCAPTCHA v3 Integration for Bot Protection

As a system,
I want to verify users are human using reCAPTCHA v3,
So that bots cannot spam fake predictions.

**Acceptance Criteria:**

**Given** Google reCAPTCHA v3 is configured
**When** a user attempts to submit a prediction
**Then** reCAPTCHA workflow executes:

1. **Frontend:** Execute reCAPTCHA on form submit
```javascript
const token = await grecaptcha.execute(SITE_KEY, {action: 'submit_prediction'})
```

2. **Backend:** Verify token with Google API
```typescript
const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  method: 'POST',
  body: `secret=${SECRET_KEY}&response=${token}`
})
```

3. **Score Evaluation:** Accept scores > 0.5 (FR76)
- Score 0.0-0.5: Reject as likely bot
- Score 0.5-1.0: Accept as likely human

**And** reCAPTCHA failures are handled gracefully:
- Score < 0.5: Return "Please try again" with retry option
- Network error: Allow submission (fail open, don't block legitimate users)
- Badge is visible but non-intrusive (bottom-right corner)

**And** reCAPTCHA is invisible (v3):
- No user interaction required (no checkbox)
- Runs in background during form submit
- Minimal UX friction (FR maintains 10-second submission goal)

**Prerequisites:** Story 2.3 (date picker), Story 2.4 (validation)

**Technical Notes:**
- Implements FR76 (reCAPTCHA v3 with retry)
- Google reCAPTCHA site key is public, secret key in environment
- v3 provides score (0.0-1.0) vs v2 binary pass/fail
- Action name 'submit_prediction' helps Google learn patterns
- Consider fallback if Google API is down (FR60)
- Add reCAPTCHA badge to footer per Google ToS

---

## Story 2.6: Rate Limiting Per IP Address

As a system,
I want to limit requests per IP address,
So that automated scripts cannot overwhelm the API.

**Acceptance Criteria:**

**Given** rate limiting is configured
**When** requests arrive from the same IP
**Then** rate limits are enforced:

**Submission endpoint (/api/predict POST):**
- Limit: 10 requests per minute per IP
- Sliding window (not fixed intervals)
- After limit: Return 429 Too Many Requests

**Update endpoint (/api/predict PUT):**
- Limit: 30 requests per minute per IP (more lenient)
- Allows legitimate users to change their minds

**Stats endpoint (/api/stats GET):**
- Limit: 60 requests per minute per IP
- Cached response (FR12), so generous limit

**And** rate limit response includes headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1640000000
Retry-After: 45
```

**And** rate limit storage uses Cloudflare KV:
- Key: `ratelimit:${ipHash}:${endpoint}`
- TTL: 60 seconds (auto-expires)
- Increment counter atomically

**And** error message is user-friendly:
- "You're submitting too quickly. Please wait 45 seconds and try again."

**Prerequisites:** Story 2.2 (IP hashing)

**Technical Notes:**
- Implements FR77 (rate limiting)
- Cloudflare KV provides distributed rate limiting (edge locations)
- Sliding window prevents burst attacks
- IP-based (not cookie-based) prevents circumvention
- Consider exempting trusted IPs (admin testing)
- Different limits per endpoint based on usage patterns

---

## Story 2.7: Prediction Submission API Endpoint

As a user,
I want to submit my prediction via API,
So that it's stored in the database and counted toward the community median.

**Acceptance Criteria:**

**Given** a user has selected a date and passed validation
**When** they submit the form (POST /api/predict)
**Then** the API processes the submission:

**Request:**
```json
POST /api/predict
{
  "predicted_date": "2026-11-19",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Extract IP address and hash it (Story 2.2)
3. Validate inputs (Story 2.4)
4. Verify reCAPTCHA (Story 2.5)
5. Check rate limit (Story 2.6)
6. Calculate weight based on date (Story 2.9)
7. Begin database transaction (Story 1.4)
8. Check IP constraint (UNIQUE ip_hash)
9. Insert prediction record
10. Commit transaction

**Response (201 Created):**
```json
{
  "success": true,
  "prediction_id": 1234,
  "predicted_date": "2026-11-19",
  "message": "Your prediction has been recorded!"
}
```

**And** constraint violations are handled:
- IP already exists: 409 Conflict "You've already submitted a prediction. Use update instead."
- Cookie_id collision: Regenerate and retry

**And** timezone conversion:
- Client sends date in local timezone
- Server converts to UTC for storage (FR73)
- Store as ISO 8601: "2026-11-19T00:00:00Z"

**Prerequisites:** Stories 2.1-2.6 (all security and validation layers)

**Technical Notes:**
- Implements FR1 (submit prediction)
- Implements FR5 (one per IP via UNIQUE constraint)
- Implements FR6 (confirmation message)
- Use FR78 (parameterized queries) for SQL injection prevention
- Transaction ensures atomicity (FR83)
- Return 201 (not 200) for resource creation (REST best practice)

---

## Story 2.8: Prediction Update API Endpoint

As a user,
I want to update my existing prediction,
So that I can change my mind without creating a duplicate.

**Acceptance Criteria:**

**Given** a user has previously submitted a prediction
**When** they submit an update (PUT /api/predict)
**Then** the API updates their existing record:

**Request:**
```json
PUT /api/predict
{
  "predicted_date": "2027-02-14",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Verify reCAPTCHA (prevent bot updates)
3. Validate new date (Story 2.4)
4. Check rate limit (30/min for updates)
5. Calculate new weight
6. Update database:
```sql
UPDATE predictions
SET predicted_date = ?,
    weight = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE cookie_id = ?
```

**Response (200 OK):**
```json
{
  "success": true,
  "predicted_date": "2027-02-14",
  "previous_date": "2026-11-19",
  "message": "Your prediction has been updated!"
}
```

**And** edge cases are handled:
- Cookie not found: 404 "No prediction found. Please submit first."
- Same date: 200 "Your prediction remains unchanged."
- Cookie expired: Treat as new submission

**And** IP conflict resolution (FR67):
- If user updates from different IP, cookie_id takes precedence
- Update both predicted_date AND ip_hash to new IP

**Prerequisites:** Story 2.7 (submission endpoint), Story 2.1 (cookies)

**Technical Notes:**
- Implements FR4 (unlimited updates via cookie)
- Implements FR67 (cookie wins over IP in conflicts)
- Return previous_date for UX feedback
- Track updated_at for analytics (how often do users change minds?)
- Consider showing "You've changed your prediction 3 times" for engagement

---

## Story 2.9: Weighted Median Algorithm Implementation

As a system,
I want to calculate the community median using weighted values,
So that troll predictions (2099, 1999) have reduced influence.

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** calculating the weighted median
**Then** weights are assigned based on reasonableness:

**Weight calculation function:**
```typescript
function calculateWeight(predictedDate: Date): number {
  const officialDate = new Date('2026-11-19');
  const yearsDiff = Math.abs(
    (predictedDate.getTime() - officialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (yearsDiff <= 5) return 1.0;   // 2021-2031: Full weight
  if (yearsDiff <= 50) return 0.3;  // 2031-2076: Reduced
  return 0.1;                        // Beyond 50 years: Minimal
}
```

**And** weighted median is calculated:
```typescript
async function calculateWeightedMedian(db: D1Database): Promise<Date> {
  // 1. Fetch all predictions with weights
  const predictions = await db.prepare(
    'SELECT predicted_date, weight FROM predictions ORDER BY predicted_date ASC'
  ).all();

  // 2. Calculate total weight
  const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);

  // 3. Find 50th percentile by cumulative weight
  const targetWeight = totalWeight / 2;
  let cumulativeWeight = 0;

  for (const p of predictions) {
    cumulativeWeight += p.weight;
    if (cumulativeWeight >= targetWeight) {
      return new Date(p.predicted_date);
    }
  }
}
```

**And** edge cases are handled:
- No predictions: Return null (FR99 requires 50 minimum anyway)
- Single prediction: Return that date
- All weights 0: Fallback to simple median (FR63)
- Even number: Return lower of two middle values

**And** weights are stored in database:
- Calculated during submission (Story 2.7)
- Recalculated during update (Story 2.8)
- Stored in predictions.weight field

**Prerequisites:** Story 1.2 (database schema), Story 2.7 (submissions exist)

**Technical Notes:**
- Implements FR7 (weighted median calculation)
- Implements FR8 (specific weight values)
- Implements FR63 (fallback to simple median if weights fail)
- Algorithm is O(n) time complexity (efficient)
- Consider caching result for FR12 (5-min cache)
- Weights are pre-calculated to avoid recalculation on every stats query

---

## Story 2.10: Statistics Calculation and Caching

As a system,
I want to calculate min/max/count/median statistics efficiently,
So that the stats API can respond quickly (<200ms).

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** statistics are requested
**Then** the following are calculated:

**1. Weighted Median (FR7):**
- Use algorithm from Story 2.9
- Cache result in Cloudflare KV
- TTL: 5 minutes (FR12)

**2. Minimum Date (FR9, unweighted):**
```sql
SELECT MIN(predicted_date) FROM predictions
```

**3. Maximum Date (FR10, unweighted):**
```sql
SELECT MAX(predicted_date) FROM predictions
```

**4. Total Count (FR11):**
```sql
SELECT COUNT(*) FROM predictions
```

**And** caching strategy:
- Cache key: `stats:latest`
- Cache value: JSON with all stats
- TTL: 300 seconds (5 minutes)
- Invalidate on: New submission, update, deletion

**And** cache miss behavior:
- Query database for all stats
- Calculate weighted median
- Store in cache
- Return to user

**And** cache hit behavior:
- Return cached value immediately
- Response time: <50ms (FR12 target)

**And** statistics API endpoint:
```typescript
GET /api/stats
Response (200 OK):
{
  "median": "2026-11-19",
  "min": "2025-06-15",
  "max": "2099-12-31",
  "count": 10234,
  "cached_at": "2025-11-13T14:30:00Z"
}
```

**Prerequisites:** Story 2.9 (weighted median), Story 2.7 (submissions)

**Technical Notes:**
- Implements FR12 (near real-time with <5 min cache)
- Cloudflare KV is globally distributed (low latency)
- Consider cache warming on deployment
- Stats calculation is read-heavy (perfect for caching)
- Cache invalidation is "write through" (update on mutation)
- Min/max queries are indexed for performance

---
