# Epic Technical Specification: Results Display & User Feedback

Date: 2025-11-24
Author: yojahny
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 implements the **Results Display & User Feedback** layer - the visual and interactive experience that transforms raw prediction data into engaging, shareable insights. This epic builds directly on Epic 2's Core Prediction Engine to display community sentiment and provide instant gratification through social validation.

**Strategic Importance:** This epic is the "Am I crazy?" moment that drives viral sharing. Without compelling visualization of community data, users have no reason to share or return. Every element - from the landing page stats to the comparison messaging - is designed to trigger emotional engagement that converts passive visitors into active sharers.

The epic implements 7 stories covering: landing page with statistics display, social comparison messaging, submission confirmation with visual feedback, optional chart visualization, comprehensive error handling, race condition prevention, and graceful degradation under load.

## Objectives and Scope

**In Scope:**
- Landing page with prominent statistics display (median, min, max, count)
- Social comparison messaging ("You're X days more optimistic/pessimistic")
- Submission confirmation with visual feedback and ranking
- Optional histogram chart visualization (lazy-loaded)
- Comprehensive error handling with retry mechanisms
- Race condition prevention for concurrent submissions
- Graceful degradation under Cloudflare free tier limits

**Out of Scope:**
- Social sharing buttons and pre-filled text (Epic 5)
- SEO meta tags and Open Graph (Epic 5)
- Embeddable widget (Epic 6)
- Accessibility enhancements beyond basic (Epic 7)
- Analytics and tracking (Epic 8)

**Success Metrics:**
- Landing page loads in < 2 seconds (desktop 3G)
- Statistics display updates within 5 minutes of new submission
- User engagement: 70%+ of visitors scroll past stats to prediction form
- Error recovery: 95%+ of network errors recovered via retry
- Chart visualization loads in < 1 second (lazy-loaded)
- Zero data corruption from race conditions

## System Architecture Alignment

**Architecture Components Referenced:**

1. **Frontend (Vanilla JS + Tailwind CSS)** (ADR-002, ADR-003)
   - Vanilla JavaScript for DOM manipulation
   - Tailwind CSS v4.0 for responsive styling
   - No framework overhead - fastest possible load

2. **Statistics API** (Architecture Section: API Contracts)
   - GET /api/stats endpoint from Story 2.10
   - Response: `{ median, min, max, count, cached_at }`
   - 5-minute cache via Cloudflare KV

3. **Prediction API** (Architecture Section: API Contracts)
   - POST /api/predict (new submission)
   - PUT /api/predict (update existing)
   - Response includes delta_days for comparison

4. **Error Response Format** (Architecture Section: Consistency Rules)
   ```typescript
   {
     success: false,
     error: {
       code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR',
       message: 'User-friendly message',
       details?: {}
     }
   }
   ```

5. **Performance Requirements** (Architecture Section: Performance Considerations)
   - Desktop load time: < 2 seconds (3G)
   - Mobile load time: < 3 seconds (3G)
   - Total JS: ~20-30KB (app.js + dependencies)
   - Total CSS: ~5-10KB (Tailwind tree-shaken)

6. **Database Transactions** (Epic 1, Story 1.4)
   - D1 IMMEDIATE transactions for race condition prevention
   - UNIQUE constraints as last line of defense

**Architectural Constraints:**
- Must work on Cloudflare free tier (100K req/day, 5M D1 reads/day)
- Vanilla JS only - no React/Vue/Svelte
- Statistics from Story 2.10 API - no direct DB access from frontend
- All user feedback must be accessible (ARIA labels, keyboard navigation)
- Progressive enhancement - core functionality works without JS

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Stats Display Component** | Render community statistics | Stats JSON from API | Formatted HTML display | Story 3.1 |
| **Comparison Calculator** | Calculate days delta from median | User date, median date | Days diff + message | Story 3.2 |
| **Confirmation UI Component** | Show submission success feedback | API response | Animated confirmation | Story 3.3 |
| **Chart Component** | Render histogram visualization | Stats + predictions | Chart.js visualization | Story 3.4 |
| **Error Handler** | Centralized error handling | Error type, context | User-friendly message | Story 3.5 |
| **Retry Manager** | Automatic retry with backoff | Failed request | Retry or fail | Story 3.5 |
| **Transaction Manager** | Prevent race conditions | Concurrent requests | Serialized execution | Story 3.6 |
| **Capacity Monitor** | Track Cloudflare limits | Request count | Degradation level | Story 3.7 |

### Data Models and Contracts

**Statistics Display Data:**

```typescript
// Stats response from Story 2.10
interface StatsResponse {
  median: string;      // ISO 8601 date: "2027-02-14"
  min: string;         // Earliest prediction
  max: string;         // Latest prediction
  count: number;       // Total predictions
  cached_at: string;   // Cache timestamp
}

// Display state
interface StatsDisplayState {
  isLoading: boolean;
  hasError: boolean;
  stats: StatsResponse | null;
  belowThreshold: boolean; // count < 50
}
```

**Social Comparison Data:**

```typescript
// Comparison result
interface ComparisonResult {
  daysDiff: number;           // Positive = more pessimistic
  direction: 'optimistic' | 'pessimistic' | 'aligned';
  message: string;            // Human-readable comparison
  personality: string;        // Personality message (e.g., "Bold prediction!")
}

// Comparison thresholds
const COMPARISON_THRESHOLDS = {
  ALIGNED: 0,
  CLOSE: 30,
  DIFFERENT: 90,
  BOLD: 180,
  EXTREME: Infinity
};
```

**Confirmation UI Data:**

```typescript
// Submission confirmation
interface ConfirmationData {
  success: boolean;
  predictedDate: string;      // User's prediction
  ranking: number;            // "You're prediction #10,235!"
  comparison: ComparisonResult;
  showAnimation: boolean;
}
```

**Chart Visualization Data:**

```typescript
// Histogram bucket
interface HistogramBucket {
  startDate: string;
  endDate: string;
  count: number;
}

// Chart configuration
interface ChartConfig {
  buckets: HistogramBucket[];
  medianDate: string;
  userPrediction?: string;
  theme: 'light' | 'dark';
}
```

**Error Handling Data:**

```typescript
// Error types
type ErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'RECAPTCHA_FAILED';

// Error state
interface ErrorState {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2
};
```

**Graceful Degradation Data:**

```typescript
// Capacity levels
type CapacityLevel = 'normal' | 'elevated' | 'high' | 'critical' | 'exceeded';

// Degradation state
interface DegradationState {
  level: CapacityLevel;
  requestsToday: number;
  limitToday: number;
  features: {
    statsEnabled: boolean;
    submissionsEnabled: boolean;
    chartEnabled: boolean;
    cacheExtended: boolean;
  };
}

// Capacity thresholds (% of 100K daily limit)
const CAPACITY_THRESHOLDS = {
  ELEVATED: 0.80,    // 80K requests
  HIGH: 0.90,        // 90K requests
  CRITICAL: 0.95,    // 95K requests
  EXCEEDED: 1.00     // 100K requests
};
```

### APIs and Interfaces

**GET /api/stats** (Story 2.10 - consumed by Story 3.1)

```typescript
Request:
GET /api/stats

Success Response (200 OK):
{
  "success": true,
  "data": {
    "median": "2027-02-14",
    "min": "2025-06-15",
    "max": "2099-12-31",
    "count": 10234,
    "cached_at": "2025-11-24T14:30:00Z"
  }
}

Headers:
  Cache-Control: public, max-age=300
  X-Cache: HIT | MISS
```

**POST /api/predict** (Story 2.7 - enhanced response for Story 3.2/3.3)

```typescript
Request:
POST /api/predict
Headers:
  Cookie: gta6_user_id=<uuid>
  Content-Type: application/json
Body:
{
  "predicted_date": "2027-03-15",
  "turnstile_token": "0.xxx..."
}

Success Response (201 Created):
{
  "success": true,
  "data": {
    "prediction_id": 10235,
    "predicted_date": "2027-03-15",
    "submitted_at": "2025-11-24T14:35:00Z",
    "stats": {
      "median": "2027-02-14",
      "min": "2025-06-15",
      "max": "2099-12-31",
      "count": 10235
    },
    "delta_days": 29,
    "comparison": "pessimistic"
  }
}
```

**Frontend Utility Functions:**

```typescript
// Story 3.1: Format statistics for display
function formatStats(stats: StatsResponse): FormattedStats {
  return {
    median: formatDateForLocale(stats.median),
    min: formatDateForLocale(stats.min),
    max: formatDateForLocale(stats.max),
    count: stats.count.toLocaleString()
  };
}

// Story 3.2: Calculate comparison
function getComparisonMessage(userDate: Date, medianDate: Date): ComparisonResult {
  const daysDiff = Math.round(
    (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  let direction: 'optimistic' | 'pessimistic' | 'aligned';
  if (daysDiff === 0) direction = 'aligned';
  else if (daysDiff > 0) direction = 'pessimistic';
  else direction = 'optimistic';

  const absDays = Math.abs(daysDiff);
  let personality: string;
  if (absDays === 0) personality = "Great minds think alike!";
  else if (absDays <= 30) personality = "Pretty close to the crowd";
  else if (absDays <= 90) personality = "You have a different perspective";
  else if (absDays <= 180) personality = "Bold prediction!";
  else personality = "Wow, you're way outside the consensus!";

  return { daysDiff, direction, message, personality };
}

// Story 3.5: Retry with exponential backoff
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new ApiError(response);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;

      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
```

### Workflows and Sequencing

**Landing Page Load Workflow** (Story 3.1):

```
1. User navigates to homepage
2. HTML loads with skeleton/loading state
3. DOMContentLoaded fires
4. Frontend checks cookie existence
   → If exists: Pre-populate date picker with last submission (if any)
5. Fetch stats: GET /api/stats
   → Show loading spinner on stats area
6. Handle stats response:
   → If success: Render stats (median, min, max, count)
   → If count < 50: Show threshold message instead of median
   → If error: Show error state with retry button
7. Initialize date picker (Story 2.3)
8. Page interactive
```

**Prediction Submission Workflow** (Story 3.3):

```
1. User selects date in date picker
2. User clicks "Add My Prediction"
3. Frontend validates date (client-side)
4. Execute Turnstile challenge (Story 2.5b)
5. Show optimistic UI:
   → Increment count display (+1)
   → Show "Submitting..." state
   → Disable submit button
6. POST /api/predict with date + token
7. Handle response:
   → Success (201):
     * Show confirmation animation
     * Display "Your prediction has been recorded!"
     * Show ranking: "You're prediction #10,235!"
     * Show comparison message (Story 3.2)
     * Announce to screen reader (ARIA live region)
   → Error:
     * Roll back optimistic UI
     * Show error message (Story 3.5)
     * Enable retry if retryable
```

**Social Comparison Flow** (Story 3.2):

```
1. Receive successful submission response
2. Extract user's predicted_date and median from response
3. Calculate days difference
4. Determine direction (optimistic/pessimistic/aligned)
5. Select personality message based on magnitude
6. Display comparison:
   → Direction emoji (🤞 optimistic, 😬 pessimistic, 🎯 aligned)
   → Days difference: "You're 29 days more pessimistic"
   → Personality: "Pretty close to the crowd"
7. Position above share buttons (sets up sharing motivation)
```

**Error Handling Flow** (Story 3.5):

```
1. Error detected (network, API, validation)
2. Classify error type:
   → Network: Retryable, auto-retry enabled
   → 400 Validation: Not retryable, show field error
   → 409 Conflict: Not retryable, show "already submitted"
   → 429 Rate Limit: Retryable after wait, show countdown
   → 500 Server: Retryable, auto-retry with backoff
3. If retryable and attempts < 3:
   → Wait with exponential backoff
   → Retry request
   → Show "Retrying..." state
4. If not retryable or max attempts reached:
   → Show user-friendly error message
   → Preserve user's input (don't clear date)
   → Offer manual retry button
5. Log error for monitoring
```

**Race Condition Prevention Flow** (Story 3.6):

```
SCENARIO: Same IP, two tabs submit simultaneously

Tab 1:
1. POST /api/predict
2. BEGIN IMMEDIATE transaction
3. Check ip_hash exists → No
4. INSERT prediction
5. COMMIT

Tab 2 (milliseconds later):
1. POST /api/predict
2. BEGIN IMMEDIATE transaction
3. WAIT (Tab 1 holds lock)
4. Tab 1 commits, Tab 2 proceeds
5. Check ip_hash exists → Yes (UNIQUE constraint)
6. ROLLBACK
7. Return 409 Conflict

SCENARIO: Double-click same button

Click 1:
1. Disable submit button
2. POST /api/predict
3. Success → Show confirmation

Click 2 (ignored):
1. Button already disabled
2. Request not sent
```

**Graceful Degradation Flow** (Story 3.7):

```
AT 80% CAPACITY (80K requests):
1. Log warning to monitoring
2. No user-facing changes
3. Alert sent to admin

AT 90% CAPACITY (90K requests):
1. Extend cache TTL: 5 min → 15 min
2. Disable chart visualization
3. Show banner: "High traffic! Some features limited."

AT 95% CAPACITY (95K requests):
1. Serve cached stats only (no recalculation)
2. Queue new submissions in KV
3. Show: "High traffic. Submission queued."

AT 100% CAPACITY (limit reached):
1. Read-only mode (stats only, no submissions)
2. Show: "Capacity reached. Try again in X hours."
3. Countdown to midnight UTC reset
```

## Non-Functional Requirements

### Performance

**Targets:**
- **Landing Page Load (Desktop 3G):** < 2 seconds (NFR-P1)
  - First Contentful Paint: < 1 second
  - Time to Interactive: < 2 seconds
  - Measurement: Lighthouse audit

- **Stats API Response:** < 200ms cached, < 500ms uncached (NFR-P3)
  - Cache hit: < 50ms
  - Measurement: Cloudflare Analytics

- **Chart Lazy Load:** < 1 second after toggle click
  - Chart.js bundle: < 50KB
  - Data preparation: < 100ms

- **Optimistic UI Update:** < 100ms perceived response
  - Immediate UI feedback before API response

**Optimization Strategies:**
- Skeleton loading states (perceived performance)
- Optimistic UI updates (immediate feedback)
- Lazy loading for chart component (reduce initial bundle)
- CSS-in-HTML critical path (no render blocking)
- Async stats fetch (don't block page render)

**Source:** NFR-P1 (< 2s load), NFR-P3 (< 200ms API), Architecture: Performance Considerations

### Security

**Requirements:**
- **XSS Prevention (Story 3.1, 3.3):** All displayed data sanitized (NFR-S4)
  - Stats values: Numeric only (no HTML injection)
  - Date display: Formatted via date library (no raw strings)
  - Error messages: Predefined strings (no user input reflection)

- **CSRF Protection:** Cookie-based with SameSite=Strict (NFR-S3)
  - Submission requires valid cookie
  - No cross-origin requests accepted

- **Input Validation (Story 3.5):** Client-side validation mirrors server-side
  - Date range: 2025-2125
  - Format: ISO 8601
  - Never trust client validation alone

**Source:** NFR-S3 (secure cookies), NFR-S4 (XSS prevention), Architecture: Security Architecture

### Reliability/Availability

**Targets:**
- **Uptime:** > 99.5% (Cloudflare SLA, NFR-R1)
- **Error Recovery:** 95%+ of network errors recovered via retry
- **Data Integrity:** Zero data corruption from race conditions (NFR-R3)

**Mechanisms:**
- Retry with exponential backoff (Story 3.5)
- Database transactions with SERIALIZABLE isolation (Story 3.6)
- Graceful degradation under load (Story 3.7)
- Offline-capable error states (localStorage for retry)

**Source:** NFR-R1 (uptime), NFR-R3 (data integrity), NFR-R4 (graceful errors)

### Observability

**Logging:**
- **Client-side:** Error events sent to server endpoint
- **Structure:** JSON with timestamp, error type, context

**Metrics:**
- Stats API cache hit/miss ratio
- Submission success/failure rate
- Error type distribution
- Retry success rate
- Graceful degradation activations

**What to Log:**
- All client-side errors (with stack traces)
- API response times
- Retry attempts and outcomes
- Capacity threshold crossings

**What NOT to Log:**
- User IP addresses (privacy)
- Cookie values (security)
- Full request bodies (PII risk)

**Source:** Architecture: Logging Strategy, NFR-R5 (monitoring)

## Dependencies and Integrations

**Core Dependencies (existing from Epic 1/2):**

```json
{
  "dependencies": {
    "hono": "^4.10.0",
    "dayjs": "^1.11.19",
    "js-cookie": "^3.0.5",
    "tailwindcss": "^4.0.0"
  }
}
```

**New Dependencies (Epic 3):**

```json
{
  "dependencies": {
    "chart.js": "^4.4.0"   // Story 3.4 (lazy-loaded, optional)
  }
}
```

**Internal Dependencies:**
- **Story 2.10:** GET /api/stats endpoint (Stats Display)
- **Story 2.7:** POST /api/predict endpoint (Submission)
- **Story 2.8:** PUT /api/predict endpoint (Update)
- **Story 2.5b:** Cloudflare Turnstile (Bot protection)
- **Story 1.4:** Database transactions (Race condition prevention)

**External Services:**
- **Cloudflare Workers:** Runtime environment
- **Cloudflare D1:** Database (via Workers)
- **Cloudflare KV:** Cache + queue (Story 3.7)
- **Cloudflare Analytics:** Performance monitoring

**Integration Points:**
- **Frontend → Stats API:** `fetch('/api/stats')` (Story 3.1)
- **Frontend → Predict API:** `fetch('/api/predict')` (Story 3.3)
- **Frontend → Chart.js:** Dynamic import (Story 3.4)
- **Workers → KV:** Cache + queue operations (Story 3.7)

## Acceptance Criteria (Authoritative)

**AC1: Landing Page with Stats Display** (Story 3.1)
- Page displays headline: "When Will GTA 6 Actually Launch?"
- Subhead: "Rockstar says November 19, 2026. What does the community think?"
- Community median displayed as LARGEST element (2-3x normal text)
- Total predictions count formatted with commas (e.g., "10,234 predictions")
- Min/max range displayed as tertiary info
- Prediction form visible without scrolling (above-the-fold)
- Loading skeleton shown while fetching stats
- If count < 50: Show threshold message instead of median (FR99)
- Mobile-responsive layout (FR39, FR93)
- Error state with retry button on API failure

**AC2: Social Comparison Messaging** (Story 3.2)
- Comparison message shown after successful submission
- Days difference calculated correctly (positive = pessimistic)
- Direction indicated: optimistic (🤞), pessimistic (😬), aligned (🎯)
- Personality message based on magnitude:
  - 0 days: "Great minds think alike!"
  - 1-30 days: "Pretty close to the crowd"
  - 31-90 days: "You have a different perspective"
  - 91-180 days: "Bold prediction!"
  - 181+ days: "Wow, you're way outside the consensus!"
- Both user date and median shown for clarity
- Large differences shown in months (> 60 days)
- Positioned above share buttons (Story 5.1/5.2)

**AC3: Submission Confirmation with Visual Feedback** (Story 3.3)
- Success icon (green checkmark) displayed on success
- Primary message: "Your prediction has been recorded!"
- Prediction echo: "You predicted: [date]"
- Ranking displayed: "You're prediction #[count]!"
- Social comparison from AC2 displayed
- Optimistic UI: Count increments immediately before API confirms
- If API fails: Roll back optimistic UI, show error
- Micro-animation on success (subtle confetti or pulse)
- Screen reader announcement via ARIA live region (FR70)

**AC4: Optional Chart Visualization Toggle** (Story 3.4)
- Chart hidden by default (FR19)
- Toggle button visible: "Show Prediction Distribution"
- On click: Chart expands with smooth animation
- Button text changes to "Hide Chart"
- Chart displays histogram with 30-day buckets
- Median marked with vertical line
- User's prediction marked with different color (if submitted)
- Chart.js library lazy-loaded (< 50KB)
- Chart responsive on mobile (touch-friendly)
- Accessible: Alt text describes distribution
- Data table alternative available for screen readers

**AC5: Error Handling with Retry Mechanisms** (Story 3.5)
- Network errors: "Unable to connect. Please check your internet."
- Auto-retry after 3 seconds (max 3 attempts)
- Timeout after 10 seconds total
- 400 Bad Request: Show specific validation error
- 409 Conflict: "You've already submitted. Update instead."
- 429 Rate Limit: "Slow down! Please wait [X] seconds."
- 500 Server Error: "Something went wrong. Please try again."
- Error UI: Red/orange color scheme, clear next step
- Dismiss button to close error
- User's input preserved (date not cleared on error)
- Fallback: If stats API fails, show cached/placeholder

**AC6: Race Condition Prevention** (Story 3.6)
- Database transactions with SERIALIZABLE isolation
- Transaction scope: From IP check to INSERT
- Lock timeout: 5 seconds
- Same IP simultaneous: First wins, second gets 409
- Double-click prevention: Submit button disabled on click
- Same cookie duplicate: Treated as UPDATE
- Deadlock detection with automatic retry (max 3 attempts)
- Exponential backoff: 100ms, 200ms, 400ms
- All constraint violations logged for monitoring

**AC7: Graceful Degradation Under Load** (Story 3.7)
- At 80% capacity: Log warning, no user changes
- At 90% capacity: Extend cache TTL, disable chart, show notice
- At 95% capacity: Serve cached only, queue submissions
- At 100% capacity: Read-only mode, countdown to reset
- Queued submissions stored in Cloudflare KV (24h TTL)
- Queue processed FIFO when capacity available
- Capacity tracked via Cloudflare Analytics
- Alert at 80% threshold
- Daily capacity report

## Traceability Mapping

| AC | Spec Section(s) | Component(s)/API(s) | Test Idea |
|----|----------------|---------------------|-----------|
| AC1 | Stats Display (Detailed Design) | `formatStats()`, Stats API | Test display formatting, loading states, threshold message, responsive layout |
| AC2 | Comparison Calculator | `getComparisonMessage()` | Test all magnitude ranges, edge cases (0 days, exactly 30 days), direction logic |
| AC3 | Confirmation UI | Optimistic UI, ARIA live region | Test success animation, rollback on failure, screen reader announcement |
| AC4 | Chart Component | Chart.js, lazy loading | Test toggle behavior, histogram accuracy, lazy load timing, accessibility |
| AC5 | Error Handler, Retry Manager | `fetchWithRetry()` | Test all error codes, retry logic, backoff timing, input preservation |
| AC6 | Transaction Manager | D1 transactions, UNIQUE constraints | Test concurrent submissions, double-click, deadlock recovery |
| AC7 | Capacity Monitor, Degradation | KV queue, feature flags | Test each threshold, queue processing, countdown display |

**Requirements Mapping (PRD/Epic → Tech Spec):**
- FR13-16 (Display median, min, max, count) → AC1
- FR17 (Social comparison messaging) → AC2
- FR18 (Quantified delta from median) → AC2
- FR6 (Immediate visual confirmation) → AC3
- FR70 (Screen reader announcements) → AC3
- FR19 (Optional chart visualization) → AC4
- FR59 (User-friendly error messages) → AC5
- FR60 (Network timeout handling) → AC5
- FR61 (Race condition prevention) → AC6
- FR83 (Database transactions) → AC6
- FR64 (Graceful degradation) → AC7
- FR63 (Fallback mechanisms) → AC7
- FR99 (50 prediction minimum threshold) → AC1

## Risks, Assumptions, Open Questions

**Risk: Chart.js Bundle Size Impact**
- **Description:** Chart.js may increase bundle size beyond target
- **Probability:** Medium
- **Impact:** Medium (slower load times)
- **Mitigation:** Lazy-load Chart.js only when toggle clicked, use tree-shaking, monitor bundle size
- **Owner:** Story 3.4

**Risk: Optimistic UI Rollback Complexity**
- **Description:** Rolling back optimistic UI on failure may create jarring UX
- **Probability:** Low (most submissions succeed)
- **Impact:** Medium (user confusion)
- **Mitigation:** Smooth transition animation for rollback, clear error messaging
- **Owner:** Story 3.3

**Risk: Cloudflare Free Tier Limits During Viral Spike**
- **Description:** 100K req/day limit may be exceeded during viral moment
- **Probability:** Medium (depends on launch success)
- **Impact:** High (site becomes read-only)
- **Mitigation:** Graceful degradation (Story 3.7), queue submissions, document upgrade path
- **Owner:** Story 3.7

**Risk: Race Condition Edge Cases**
- **Description:** Complex concurrent scenarios may not be fully covered
- **Probability:** Low (D1 transactions are reliable)
- **Impact:** High (data corruption)
- **Mitigation:** Comprehensive testing, UNIQUE constraints as last defense, monitoring
- **Owner:** Story 3.6

**Assumption: Chart.js Adequate for Visualization**
- **Description:** Assuming Chart.js provides sufficient histogram functionality
- **Validation:** Test histogram rendering with 10K+ data points
- **Fallback:** Use simpler native canvas rendering if Chart.js inadequate

**Assumption: Cloudflare KV Reliable for Queue**
- **Description:** Assuming KV can reliably queue submissions during high load
- **Validation:** Load test with queue simulation
- **Fallback:** Direct D1 writes with increased retry attempts

**Open Question: Should chart show real-time updates?**
- **Options:** (1) Static on load, (2) Poll every 5 minutes, (3) WebSocket push
- **Decision:** Static on load (option 1) for MVP
- **Rationale:** Simplicity, cache alignment, minimal resource usage

**Open Question: Queue notification mechanism?**
- **Options:** (1) No notification (check site later), (2) Browser notification, (3) Email
- **Decision:** No notification for MVP (option 1)
- **Rationale:** Simplicity, privacy, Growth feature for post-MVP

## Test Strategy Summary

**Unit Tests (Vitest):**
- **Stats Display (Story 3.1):**
  - Test formatStats() with various inputs
  - Test threshold logic (< 50 predictions)
  - Test loading state management
  - Coverage: 100%

- **Comparison Calculator (Story 3.2):**
  - Test all magnitude ranges (0, 1-30, 31-90, 91-180, 181+)
  - Test direction logic (optimistic/pessimistic/aligned)
  - Test edge cases (exactly at thresholds)
  - Coverage: 100%

- **Error Handler (Story 3.5):**
  - Test all error code mappings
  - Test retry logic and backoff timing
  - Test max attempts handling
  - Coverage: 100%

**Integration Tests (Vitest + DOM):**
- **Landing Page (Story 3.1):**
  - Test stats fetch and display
  - Test error state and retry
  - Test responsive layout

- **Submission Flow (Story 3.3):**
  - Test optimistic UI update
  - Test rollback on failure
  - Test ARIA announcement

- **Race Conditions (Story 3.6):**
  - Test concurrent submissions (mock)
  - Test double-click prevention
  - Test transaction retry

**E2E Tests (Manual + Playwright):**
- **Full Submission Flow:**
  - Visit page → See stats → Submit prediction → See confirmation

- **Error Recovery:**
  - Simulate network failure → Retry → Success

- **Chart Visualization:**
  - Toggle chart → See histogram → Toggle off

**Accessibility Tests:**
- Keyboard navigation through all interactive elements
- Screen reader testing with VoiceOver/NVDA
- Color contrast validation
- ARIA live region announcements

**Performance Tests:**
- Lighthouse audit (target: > 90 performance score)
- Load time measurement on 3G throttling
- Chart lazy-load timing

**Load Tests:**
- Concurrent submission simulation
- Capacity threshold testing
- Queue processing validation

**Coverage Target:**
- Critical paths: 100%
- UI components: 90%+
- Overall epic: 85%+

---

## Post-Review Follow-ups

**From Story 3.5 (Error Handling with Retry Mechanisms) - Review Date: 2025-11-26**

1. **[Low] Rate Limit Countdown Memory Leak**
   - Store countdown interval ID and clear in hideError()
   - File: public/js/errors.js:341-366
   - Added to backlog: 2025-11-26

2. **[Low] Production Error Tracking Integration**
   - Implement Sentry/LogRocket integration for error logging
   - File: public/js/errors.js:433-449
   - Added to backlog: 2025-11-26

3. **[Low] CSP Headers for XSS Protection**
   - Add Content Security Policy headers for additional security hardening
   - Recommended for production deployment
   - Added to backlog: 2025-11-26
