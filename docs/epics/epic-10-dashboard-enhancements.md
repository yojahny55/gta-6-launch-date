# Epic 10: Dashboard Enhancements

**Epic Goal:** Provide engaging dashboard metrics that transform raw prediction data into shareable insights.

**Epic Value:** The dashboard gives users instant context about community sentiment through visual metrics beyond just the median. The "Optimism Score" creates a shareable statistic ("Only 42% believe it'll hit 2026!") that drives conversation and social sharing.

---

## Story 10.1: Optimism Score Calculation & API

As a user,
I want to see what percentage of the community believes GTA 6 will launch before the official date,
So that I understand how optimistic or skeptical the community is.

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** the dashboard loads
**Then** the Optimism Score is calculated and displayed:

**Backend Implementation:**

1. **API Endpoint:**
   ```typescript
   GET /api/sentiment
   Response (200 OK):
   {
     "success": true,
     "data": {
       "optimism_score": 42.5,
       "optimistic_count": 4234,
       "pessimistic_count": 5766,
       "total_count": 10000,
       "official_date": "2026-11-19",
       "cached_at": "2025-11-27T14:30:00Z"
     }
   }
   ```

2. **Calculation Logic:**
   - Official date: November 19, 2026 (Rockstar's announced date)
   - Optimistic: Predictions < official date
   - Pessimistic: Predictions >= official date
   - Formula: `(optimistic_count / total_count) * 100`
   - Round to 1 decimal place

3. **Caching Strategy:**
   - Cache key: `sentiment:score`
   - TTL: 5 minutes (300 seconds)
   - Invalidate on new submission/update
   - Same pattern as `/api/stats`

4. **Database Query:**
   ```sql
   SELECT
     COUNT(CASE WHEN predicted_date < '2026-11-19' THEN 1 END) as optimistic_count,
     COUNT(CASE WHEN predicted_date >= '2026-11-19' THEN 1 END) as pessimistic_count,
     COUNT(*) as total_count
   FROM predictions;
   ```

**Frontend Implementation:**

5. **Dashboard Card:**
   - Location: 4th card in dashboard grid (top-right or bottom-right)
   - Heading: "Optimism Score"
   - Display: `{optimism_score}%` (large, color-coded)
   - Subtext: "Believe it hits before '27"

6. **Color Coding:**
   - > 50%: Green (text-green-500) - "Community is optimistic"
   - 40-50%: Yellow (text-amber-400) - "Community is neutral"
   - < 40%: Red (text-red-500) - "Community is skeptical"

7. **DOM Integration:**
   - DOM ID: `#optimism-score-value`
   - Fetch: `GET /api/sentiment` on page load
   - Update: Same timing as stats (parallel fetch)

**And** respects 50-prediction minimum (FR99):
- If total_count < 50: Show placeholder "Need 50 predictions"
- Return null for optimism_score

**And** error handling:
- If API fails: Show "--" or cached value
- Retry with same strategy as stats endpoint

**Prerequisites:** Story 2.10 (caching pattern), Database schema (predictions table)

**Technical Notes:**
- Implements new PRD feature (line 95: Dashboard grid layout)
- Removes hardcoded "42%" placeholder from current UI
- Provides shareable metric for social posts
- Simple aggregation query (performant on D1)

**Effort:** 4-6 hours (backend endpoint + frontend integration + tests)
**Priority:** 🔴 **CRITICAL** (removes hardcoded placeholder, trust issue)

---

## Story 10.2: Dashboard Grid Layout Finalization

As a user,
I want to see all key metrics in a clean dashboard grid,
So that I can quickly understand community sentiment at a glance.

**Acceptance Criteria:**

**Given** the new dashboard UI
**When** the page loads
**Then** the 4-card grid layout is displayed:

**Dashboard Structure:**

1. **Grid Layout:**
   - Desktop: 4 cards in 2x2 grid or 1x4 row
   - Tablet: 4 cards in 2x2 grid
   - Mobile: 4 cards stacked vertically
   - Responsive breakpoints: Tailwind `md:grid-cols-2 lg:grid-cols-4`

2. **Card 1: Total Predictions**
   - Heading: "Total Predictions"
   - Value: `stats.total` (e.g., "10,234")
   - Icon: Users icon (gta-blue)
   - Subtext: "Verified gamers"

3. **Card 2: Community Median** (Highlighted)
   - Heading: "Community Median"
   - Value: `stats.median` (e.g., "Mar 15, 2027")
   - Icon: Target icon (gta-pink)
   - Subtext: "The 'Wisdom of Crowds'"
   - Border: `border-gta-pink/50` (pink highlight)

3. **Card 3: Official Target**
   - Heading: "Official Target"
   - Value: "Late 2026" (static reference)
   - Icon: Warning icon (yellow)
   - Subtext: "Subject to delays"
   - Opacity: 70% (de-emphasized, reference only)

4. **Card 4: Optimism Score**
   - Heading: "Optimism Score"
   - Value: From `/api/sentiment` (Story 10.1)
   - Icon: Chart icon (color based on score)
   - Subtext: "Believe it hits before '27"

**And** styling consistency:
- All cards: `bg-gta-card border border-gray-700 p-6 rounded-xl`
- Hover: `hover:opacity-100 transition-opacity` (if de-emphasized)
- Icons: 20x20px, themed colors

**And** loading states:
- Show skeleton for all 4 cards while fetching
- Cards populate as data arrives (async)

**Implementation Tasks:**
1. Verify HTML structure matches spec (already in new UI)
2. Ensure responsive grid works on all breakpoints
3. Test icon placement and sizing
4. Verify color scheme consistency
5. Accessibility: ARIA labels for each card

**Effort:** 2-3 hours (mostly verification, minor adjustments)
**Priority:** 🟡 **MEDIUM** (already implemented in UI, needs verification)

---

## Story 10.3: "My Prediction" Card Enhancement (Optional)

As a returning user,
I want to see my prediction prominently in the dashboard,
So that I can quickly review what I predicted.

**Acceptance Criteria:**

**Given** a user has previously submitted a prediction
**When** they return to the site
**Then** "My Prediction" card is displayed:

**Card Details:**

1. **Location:**
   - Option A: 5th card in dashboard grid (extends to 5 cards)
   - Option B: Separate section below main grid
   - **Recommended:** Option B (don't clutter main stats)

2. **Content:**
   - Heading: "My Prediction"
   - Value: User's predicted date (e.g., "Jun 10, 2027")
   - Delta: "+3 months from median" (comparison)
   - Button: "Update Prediction" (links to form)

3. **Data Source:**
   - Cookie: `gta6_user_id`
   - API: `GET /api/predict/:cookie_id` (if needed)
   - Or: Store in localStorage for performance

**And** if no prediction:
- Hide card entirely (don't show empty state in dashboard)

**Implementation Tasks:**
1. Add "My Prediction" section HTML
2. Cookie/localStorage detection logic
3. Fetch prediction data (or use cached from submission)
4. Wire "Update Prediction" button
5. Test show/hide logic

**Effort:** 2-3 hours
**Priority:** 🟢 **LOW** (nice-to-have, may consolidate with Story 3.3b)

**Note:** This story overlaps with Story 3.3b ("My Prediction" Card Display). Recommend consolidating or marking one as duplicate.

---

## Story 10.4: Dynamic Status Badge

As a user,
I want to see a dynamic status badge in the header that reflects current community sentiment,
So that I can quickly understand if the community expects a delay or not.

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** the page loads
**Then** the status badge is displayed dynamically in the header:

**Backend Implementation:**

1. **API Endpoint:**
   ```typescript
   GET /api/status
   Response (200 OK):
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

2. **Status Calculation Logic:**
   ```typescript
   function calculateStatus(medianDate: string): StatusResult {
     const official = new Date('2026-11-19');
     const median = new Date(medianDate);
     const daysDiff = Math.round((median - official) / (24 * 60 * 60 * 1000));

     if (daysDiff < -60) {
       return { status: "Early Release Possible", color: "green" };
     } else if (daysDiff >= -60 && daysDiff <= 60) {
       return { status: "On Track", color: "blue" };
     } else if (daysDiff > 60 && daysDiff <= 180) {
       return { status: "Delay Likely", color: "amber" };
     } else {
       return { status: "Major Delay Expected", color: "red" };
     }
   }
   ```

3. **Thresholds:**
   - **Early Release Possible:** median < official - 60 days (Green)
   - **On Track:** median within ±60 days of official (Blue)
   - **Delay Likely:** median between +60 and +180 days of official (Amber)
   - **Major Delay Expected:** median > official + 180 days (Red)

4. **Caching Strategy:**
   - Cache key: `status:current`
   - TTL: 5 minutes (300 seconds)
   - Invalidate on new submission/update
   - Same pattern as `/api/stats` and `/api/sentiment`

**Frontend Implementation:**

5. **Header Badge Update:**
   - Location: Header at `public/index.html:46`
   - Current: Hardcoded `Status: Delay Likely`
   - New: Dynamic content from `/api/status`

6. **DOM Integration:**
   - DOM ID: `#status-badge`
   - Fetch: `GET /api/status` on page load (parallel with stats)
   - Update: Badge text and color based on response

7. **Color Coding:**
   - Green: `text-green-500 border-green-500/30 bg-green-500/10`
   - Blue: `text-gta-blue border-gta-blue/30 bg-gta-blue/10` (current)
   - Amber: `text-amber-500 border-amber-500/30 bg-amber-500/10`
   - Red: `text-red-500 border-red-500/30 bg-red-500/10`

**And** respects 50-prediction minimum (FR99):
- If total_count < 50: Show "Status: Gathering Data"
- Return null for status, use default blue color

**And** error handling:
- If API fails: Show last cached value or "Status: Unknown"
- Retry with same strategy as stats endpoint
- Don't block page load if status fetch fails

**And** automated tests exist covering main functionality:

**Testing Requirements:**
- [x] Unit tests for `calculateStatus()` function (all 4 thresholds)
- [x] Unit tests for edge cases (exactly at boundaries, null median)
- [x] Integration tests for `/api/status` endpoint
- [x] API caching tests (verify 5-min TTL)
- [x] Frontend tests for badge color switching

**Prerequisites:**
- Story 2.10 (caching pattern)
- Story 2.9 (median calculation)
- Database schema (predictions table)

**Technical Notes:**
- Implements automated status calculation based on prediction data
- Removes hardcoded "Status: Delay Likely" from header
- Provides real-time community sentiment indicator
- Simple aggregation (reuses median from /api/stats)
- File locations:
  - `src/routes/status.ts` (API endpoint)
  - `src/utils/status-calculator.ts` (calculation logic)
  - `src/utils/status-calculator.test.ts` (tests)
  - `public/js/status-badge.js` (frontend integration)

**Effort:** 6-8 hours (backend + frontend + tests)
**Priority:** 🟡 **MEDIUM** (UX enhancement, not MVP-blocking)

**Implementation Status:** ✅ **COMPLETED** (2025-11-28)

---

## Epic 10 Summary

**Total Stories:** 4 (1 critical, 2 medium, 1 optional)

**Total Effort:** 14-20 hours (2-2.5 developer days)

**Key Deliverables:**
- `/api/sentiment` endpoint (Optimism Score calculation)
- `/api/status` endpoint (Dynamic Status Badge) ✅ COMPLETED
- Dashboard grid finalized and verified
- Hardcoded "42%" removed and replaced with real data
- Dynamic status badge in header

**Success Metrics:**
- Optimism Score updates in real-time (5-min cache)
- Status badge reflects community sentiment (4-level system)
- Dashboard loads all 4 metrics in < 500ms
- Users can see and share metrics

**Dependencies:**
- Database: predictions table (already exists)
- Caching: Pattern from Story 2.10 (already implemented)
- Frontend: Dashboard grid HTML (already exists in new UI)
- Weighted median calculation (Story 2.9)

---

**Epic Created:** 2025-11-27
**Epic Updated:** 2025-11-28 (Added Story 10.4)
**Sprint Change Proposals:**
- UI Redesign & Backend Integration (2025-11-27)
- Dynamic Status Badge (2025-11-28) ✅ COMPLETED
**Status:** In Progress (Story 10.4 completed, Stories 10.1-10.3 pending)
