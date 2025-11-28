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

## Epic 10 Summary

**Total Stories:** 3 (1 critical, 1 medium, 1 optional)

**Total Effort:** 8-12 hours (1-1.5 developer days)

**Key Deliverables:**
- `/api/sentiment` endpoint (Optimism Score calculation)
- Dashboard grid finalized and verified
- Hardcoded "42%" removed and replaced with real data

**Success Metrics:**
- Optimism Score updates in real-time (5-min cache)
- Dashboard loads all 4 metrics in < 500ms
- Users can see and share Optimism Score statistic

**Dependencies:**
- Database: predictions table (already exists)
- Caching: Pattern from Story 2.10 (already implemented)
- Frontend: Dashboard grid HTML (already exists in new UI)

---

**Epic Created:** 2025-11-27
**Sprint Change Proposal:** UI Redesign & Backend Integration
**Status:** Ready for implementation
