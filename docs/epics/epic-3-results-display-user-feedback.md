# Epic 3: Results Display & User Feedback

**Epic Goal:** Show community sentiment and provide instant gratification through social validation.

**Epic Value:** Transforms raw data into engaging, shareable insights. The "Am I crazy?" moment drives viral sharing.

## Story 3.1: Landing Page with Stats Display

As a user,
I want to see the community prediction data immediately upon landing,
So that I understand what others think before I submit.

**Acceptance Criteria:**

**Given** a user visits the homepage
**When** the page loads
**Then** the following elements are displayed prominently:

**1. Headline (above-the-fold):**
- H1: "When Will GTA 6 Actually Launch?"
- Subhead: "Rockstar says November 19, 2026. What does the community think?"

**2. Community Statistics (large, bold):**
- Median prediction: "Feb 14, 2027" (formatted for locale, FR75)
- Total predictions: "10,234 predictions" (formatted with commas)
- Min/max range: "Earliest: Jun 2025 | Latest: Dec 2099"

**3. Prediction Form (primary CTA):**
- Date picker (Story 2.3)
- Submit button: "Add My Prediction"
- Visible immediately (no scrolling required)

**4. Visual Hierarchy:**
- Community median is LARGEST element (2-3x normal text)
- Form is second-most prominent
- Min/max are tertiary information

**And** data loads asynchronously:
- Show skeleton/loading state while fetching stats
- Stats API call: GET /api/stats (Story 2.10)
- Update DOM when data arrives
- Handle loading errors gracefully (FR59)

**And** minimum prediction threshold is enforced (FR99):
- If count < 50: Show placeholder "Need 50 predictions to show community median. Be one of the first!"
- Show current count: "12 / 50 predictions submitted"
- Still allow submissions (building toward threshold)

**Prerequisites:** Story 2.10 (stats API)

**Technical Notes:**
- Implements FR13-16 (display median, min, max, count)
- Implements FR99 (50 prediction minimum)
- Implements FR59 (user-friendly error messages)
- Use semantic HTML for accessibility (FR71)
- Mobile-first layout (FR39, FR93)
- Optimistic UI: Show submitted prediction immediately before API confirms

---

## Story 3.2: Social Comparison Messaging

As a user,
I want to know how my prediction compares to the community,
So that I feel validated or intrigued by the difference.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** the confirmation screen loads
**Then** social comparison messaging is displayed:

**Comparison Logic:**
```typescript
function getComparisonMessage(userDate: Date, medianDate: Date): string {
  const daysDiff = Math.round(
    (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysDiff === 0) {
    return "You're exactly aligned with the community! 🎯";
  } else if (daysDiff > 0) {
    return `You're ${Math.abs(daysDiff)} days more pessimistic than the community 😬`;
  } else {
    return `You're ${Math.abs(daysDiff)} days more optimistic than the community 🤞`;
  }
}
```

**And** messaging includes personality:
- Exactly aligned: "Great minds think alike!"
- 1-30 days off: "Pretty close to the crowd"
- 31-90 days off: "You have a different perspective"
- 91-180 days off: "Bold prediction!"
- 181+ days off: "Wow, you're way outside the consensus!"

**And** delta is quantified (FR18):
- Show exact day difference
- Convert to months if > 60 days: "3 months earlier"
- Show both user date and median for clarity

**And** positioning creates curiosity:
- Displayed immediately after successful submission
- Above share buttons (sets up sharing motivation)
- Emotionally engaging (validation or intrigue)

**Prerequisites:** Story 2.7 (submission), Story 2.10 (median data)

**Technical Notes:**
- Implements FR17 (social comparison messaging)
- Implements FR18 (quantified delta from median)
- Emotional framing encourages sharing (viral mechanic)
- Personalization increases engagement
- Calculate on frontend (avoid extra API call)

---

## Story 3.3: Submission Confirmation with Visual Feedback

As a user,
I want immediate confirmation that my prediction was recorded,
So that I feel confident it worked and see my ranking.

**Acceptance Criteria:**

**Given** a user successfully submits a prediction
**When** the API returns success (201 Created)
**Then** confirmation UI is displayed:

**Confirmation Elements:**
1. **Success Icon:** Green checkmark or celebration animation
2. **Primary Message:** "Your prediction has been recorded!"
3. **Prediction Echo:** "You predicted: February 14, 2027"
4. **Ranking:** "You're prediction #10,235!"
5. **Social Comparison:** (From Story 3.2)

**And** optimistic UI is used:
- Show confirmation immediately on submit (don't wait for API)
- If API fails, roll back and show error
- Submission count increments instantly (+1 to display)

**And** confirmation is celebratory:
- Micro-animation on success (subtle confetti or pulse)
- Positive language ("recorded", "counted", not just "saved")
- Makes user feel like they contributed

**And** screen reader announcement (FR70):
- Announce via ARIA live region
- Message: "Success. Your prediction for February 14, 2027 has been recorded. You're 90 days more pessimistic than the community median."

**Prerequisites:** Story 2.7 (submission), Story 3.2 (social comparison)

**Technical Notes:**
- Implements FR6 (immediate visual confirmation)
- Implements FR70 (screen reader announcements)
- Optimistic UI improves perceived performance
- Gamification element ("You're #10,235!") adds engagement
- Celebration moment increases likelihood of sharing

---

## Story 3.4: Optional Chart Visualization Toggle

As a user,
I want to optionally see a chart of prediction distribution,
So that I can understand the full spectrum of community opinions.

**Acceptance Criteria:**

**Given** statistics are displayed
**When** the page loads
**Then** chart is hidden by default (FR19):
- Chart container collapsed
- Toggle button visible: "Show Prediction Distribution"

**And** when user clicks toggle:
- Chart expands with smooth animation
- Button text changes to "Hide Chart"
- Chart is rendered client-side (no server rendering)

**And** chart displays:
- **X-axis:** Date range (earliest to latest prediction)
- **Y-axis:** Number of predictions
- **Bars:** Histogram with 30-day buckets
- **Highlight:** Median marked with vertical line
- **User:** User's prediction marked with different color

**And** chart is lightweight:
- Uses Chart.js or similar (<50KB)
- Only loads library when user clicks toggle (lazy loading)
- Responsive on mobile (touch-friendly)

**And** chart is accessible:
- Alt text describes distribution
- Data table alternative available
- Keyboard navigable (tab to toggle button)

**Prerequisites:** Story 2.10 (stats API returns data for charting), Story 3.4b (predictions data API)

**Technical Notes:**
- Implements FR19 (optional chart visualization)
- Default hidden reduces page weight (performance)
- Lazy loading prevents blocking main content
- Histogram provides visual understanding of distribution
- Marking user's prediction creates personal connection
- **Note:** Currently displays empty buckets until Story 3.4b implements `/api/predictions` endpoint

---

## Story 3.4b: Prediction Data API Endpoint

As a user,
I want the chart to display real prediction distribution data,
So that I can understand the actual spread of community opinions.

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** the chart visualization loads (Story 3.4)
**Then** prediction data is available via API:

**API Endpoint:**
```typescript
GET /api/predictions
Response (200 OK):
{
  "data": [
    { "predicted_date": "2026-11-19", "count": 1247 },
    { "predicted_date": "2027-02-14", "count": 823 }
  ],
  "total_predictions": 10234,
  "cached_at": "2025-11-26T14:30:00Z"
}
```

**And** data is aggregated by date (privacy-preserving):
- Groups predictions by predicted_date
- Returns count per date
- No cookie_id, ip_hash, or weight exposed
- Sorted by date ascending

**And** respects 50-prediction minimum (FR99):
- If total_predictions < 50: Return empty data array
- Include total_predictions in response

**And** caching strategy (matches Story 2.10):
- Cache key: `predictions:aggregated`
- TTL: 5 minutes (300 seconds)
- Invalidate on submission/update
- Cache hit: <50ms, Cache miss: <300ms

**And** integrates with Story 3.4:
- Chart fetches from `/api/predictions` on toggle
- Replaces empty array with real data
- Chart displays populated histogram buckets
- Shows actual community prediction distribution

**Prerequisites:** Story 2.7 (submission), Story 2.8 (update), Story 2.10 (caching pattern), Story 3.4 (chart consumer)

**Technical Notes:**
- Created via correct-course workflow (2025-11-26)
- Addresses gap identified in Story 3.4 code review
- Story 3.4 currently shows empty chart buckets
- This story completes the chart visualization feature
- SQL aggregation: `SELECT predicted_date, COUNT(*) GROUP BY predicted_date`
- Privacy-preserving: only aggregated counts, no individual data
- Follows same caching pattern as `/api/stats` for consistency
- Enables future analytics and widget features (Story 6)

---

## Story 3.5: Error Handling with Retry Mechanisms

As a user,
I want helpful error messages when something goes wrong,
So that I know what happened and can try again.

**Acceptance Criteria:**

**Given** an error occurs during submission or data loading
**When** the error is detected
**Then** user-friendly messages are displayed:

**Network Errors (FR60):**
- Message: "Unable to connect. Please check your internet and try again."
- Show retry button
- Auto-retry after 3 seconds (max 3 attempts)
- Timeout after 10 seconds total

**API Errors:**
- 400 Bad Request: Show specific validation error from API
- 409 Conflict (already submitted): "You've already submitted. Update your prediction instead."
- 429 Rate Limit: "Slow down! Please wait {seconds} seconds."
- 500 Server Error: "Something went wrong on our end. Please try again in a moment."

**Database Errors (FR59):**
- Generic message: "Unable to save your prediction. Please try again."
- Log detailed error server-side for debugging
- Don't expose internal error details to user

**reCAPTCHA Errors:**
- Score too low: "Verification failed. Please try again." with retry button
- Network error: "Verification service unavailable. Please try again later."

**And** error UI design:
- Red/orange color scheme (attention)
- Clear actionable next step (retry button, wait time, etc.)
- Dismiss button to close error message
- Error doesn't lose user's input (date remains selected)

**And** fallback behaviors (FR60):
- If stats API fails: Show cached data or placeholder
- If submission fails: Save to localStorage for retry
- If reCAPTCHA unavailable: Allow submission (fail-open)

**Prerequisites:** Story 1.4 (error handling utilities), Story 2.7 (submission)

**Technical Notes:**
- Implements FR59 (user-friendly error messages)
- Implements FR60 (network timeout handling with retry)
- Implements FR64 (graceful degradation)
- Toast notifications for errors (non-blocking)
- Log errors to Cloudflare Analytics for monitoring
- Never expose stack traces or database details to users

---

## Story 3.6: Race Condition Prevention for Concurrent Submissions

As a system,
I want to prevent race conditions when multiple submissions arrive simultaneously,
So that database integrity is maintained.

**Acceptance Criteria:**

**Given** two submissions arrive for the same IP address within milliseconds
**When** both attempt to insert into the database
**Then** transaction isolation prevents conflicts:

**Database Transaction Settings:**
- Isolation level: SERIALIZABLE or IMMEDIATE for D1
- Transaction scope: From IP check to INSERT
- Lock timeout: 5 seconds

**Race Condition Scenarios:**

**Scenario 1: Same IP, different cookies (network switching)**
- First transaction wins (inserts record)
- Second transaction fails on UNIQUE(ip_hash) constraint
- Second transaction returns 409 Conflict

**Scenario 2: Same cookie, duplicate submit (double-click)**
- Check if cookie_id already exists
- If exists: Treat as UPDATE instead of INSERT
- Return success with "updated" message

**Scenario 3: Database deadlock**
- Detect deadlock error
- Automatic retry (max 3 attempts, Story 1.4)
- Exponential backoff: 100ms, 200ms, 400ms
- If all retries fail: Return 503 Service Unavailable

**And** transaction logging:
- Log all constraint violations (IP or cookie)
- Monitor deadlock frequency
- Alert if deadlock rate > 1%

**Prerequisites:** Story 1.4 (transaction support), Story 2.7 (submission)

**Technical Notes:**
- Implements FR61 (race condition prevention)
- Implements FR83 (database transactions)
- D1/SQLite supports IMMEDIATE transactions (lock on BEGIN)
- UNIQUE constraints are last line of defense
- Idempotent operations where possible
- Consider optimistic locking for updates

---

## Story 3.7: Graceful Degradation Under Load

As a system,
I want the site to remain functional when traffic exceeds capacity,
So that users have a degraded but working experience.

**Acceptance Criteria:**

**Given** traffic approaches Cloudflare free tier limits (100K req/day)
**When** limits are reached
**Then** degradation strategy activates:

**At 80% capacity (80K requests):**
- Log warning to monitoring
- Consider upgrade to paid tier (FR97 Growth feature)
- No user-facing changes yet

**At 90% capacity (90K requests):**
- Increase cache TTL from 5 min to 15 min (reduce DB reads)
- Disable optional features (chart visualization)
- Show notice: "High traffic! Some features temporarily limited."

**At 95% capacity (95K requests):**
- Serve cached stats only (no live updates)
- Queue submissions (process when capacity available)
- Show: "We're experiencing high traffic. Your submission will be processed shortly."

**At 100% capacity (limit reached):**
- Read-only mode: Show stats but disable submissions
- Display: "We've reached capacity for today. Try again in {hours} hours."
- Countdown to daily limit reset (midnight UTC)

**And** queue management:
- Store queued submissions in Cloudflare KV
- TTL: 24 hours
- Process FIFO when capacity available
- Notify user when processed (if email provided, Growth feature)

**And** monitoring:
- Track capacity usage in Cloudflare Analytics
- Alert at 80% threshold
- Daily capacity report

**Prerequisites:** Story 2.10 (stats caching), Story 2.7 (submissions)

**Technical Notes:**
- Implements FR64 (graceful degradation)
- Implements FR63 (fallback mechanisms)
- Cloudflare free tier: 100K requests/day, 5M DB reads/day
- Queuing prevents data loss during spikes
- Read-only mode preserves core value (viewing sentiment)
- Degradation is progressive (not all-or-nothing)
- Monitor DB reads separately (often hit before request limit)

---
