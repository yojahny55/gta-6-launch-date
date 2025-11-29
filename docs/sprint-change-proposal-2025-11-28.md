# Sprint Change Proposal: Dynamic Status Badge

**Date:** 2025-11-28
**Author:** BMad Method - Correct Course Workflow
**User:** yojahny
**Change Scope:** Minor (Direct Implementation)
**Epic Affected:** Epic 10 (Dashboard Enhancements)

---

## 1. Issue Summary

### Problem Statement

The header status badge displaying "Status: Delay Likely" is currently hardcoded in `public/index.html` at line 46. There is no mechanism to:
- Dynamically calculate the status based on user prediction submissions
- Update the status value via an API endpoint
- Display different status values based on community sentiment

### Context

This issue was identified as a user enhancement request rather than a bug or implementation failure. The user requested the ability to have the status badge automatically reflect community sentiment by analyzing the median prediction date compared to the official release date.

### Evidence

- **Current Implementation:** `public/index.html:46` contains hardcoded HTML: `<span>Status: Delay Likely</span>`
- **Missing Backend:** No API endpoint exists to calculate or serve status values
- **Missing Logic:** No algorithm to determine status based on prediction data
- **Pattern Exists:** Similar functionality already implemented in Story 10.1 (Optimism Score with `/api/sentiment`)

---

## 2. Impact Analysis

### Epic Impact

**Epic 10: Dashboard Enhancements**
- ✅ **Direct fit** - This feature aligns with Epic 10's goal of providing engaging dashboard metrics
- ✅ **Similar pattern** - Story 10.1 (Optimism Score) already implements API endpoint + frontend display pattern
- ✅ **No blocking issues** - Can be added as new Story 10.4 without disrupting existing stories

**Other Epics:**
- **Epic 1-9:** No impact
- **Epic 6 (Embeddable Widget):** Potential future enhancement - widget may want to display status badge

### Story Impact

**New Story Required:**
- **Story 10.4: Dynamic Status Badge** (6-8 hours effort)

**Existing Stories:**
- No modifications needed to existing stories
- No dependencies broken

### Artifact Conflicts

**Architecture Document (`docs/architecture.md`):**
- ✅ **Add:** New API endpoint `/api/status` to API Contracts section
- ✅ **Add:** Status calculation implementation pattern
- ✅ **No breaking changes** - Purely additive

**Frontend (`public/index.html`):**
- ✅ **Modify:** Header badge from hardcoded to dynamic (line 43-48)
- ✅ **Add:** New JavaScript module `public/js/status-badge.js`
- ✅ **No breaking changes** - Progressive enhancement

**Database Schema:**
- ✅ **No changes needed** - Reuses existing predictions table and median calculation

**UX Design:**
- ✅ **No wireframe changes** - Badge already exists in header
- ✅ **Enhancement:** Add color coding (green/blue/amber/red) for different statuses

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment (Option 1)

**Rationale:**
- **Low Complexity:** Follows existing pattern from Story 10.1 (Optimism Score)
- **Low Risk:** No breaking changes, purely additive feature
- **High Value:** Removes hardcoded text, improves user experience with real-time sentiment
- **Reuses Infrastructure:** Caching, API patterns, median calculation already established
- **Good Timing:** Epic 10 is current focus area, natural fit

**Why Not Other Options:**
- **Option 2 (Rollback):** Not applicable - no completed work to roll back
- **Option 3 (PRD MVP Review):** Not applicable - this is an enhancement, not an MVP blocker

### Effort Estimate

**Total Time:** 6-8 hours (Medium)

**Breakdown:**
- Backend development: 3-4 hours
- Frontend development: 2-3 hours
- Documentation: 1 hour
- Testing & validation: 1 hour

**Risk Level:** Low
- Reuses proven patterns
- No database migrations
- Isolated changes (minimal blast radius)
- Comprehensive test coverage required

### Timeline Impact

**None** - This work can be done in parallel with other Epic 10 stories without blocking progress.

---

## 4. Detailed Change Proposals

### Change #1: New Story 10.4 - Dynamic Status Badge

**Epic:** Epic 10: Dashboard Enhancements
**File:** `docs/epics/epic-10-dashboard-enhancements.md`
**Action:** Add new story after Story 10.3

**Story Content:**

```markdown
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
```

---

### Change #2: Architecture Document Updates

**File:** `docs/architecture.md`
**Action:** Add new sections for API endpoint and implementation pattern

**Location 1:** After line 421 (after `GET /widget` section)

**Add:**

```markdown
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
- `"Early Release Possible"` - Median is 60+ days before official date
- `"On Track"` - Median is within ±60 days of official date
- `"Delay Likely"` - Median is 60-180 days after official date
- `"Major Delay Expected"` - Median is 180+ days after official date

**Caching:** 5 minutes via Cloudflare Workers cache API

**Minimum Threshold (FR99):**
- If total predictions < 50: Returns `"Gathering Data"` status

---
```

**Location 2:** After line 562 (after Cookie Management section)

**Add:**

```markdown
### Status Calculation

**File:** `src/utils/status-calculator.ts`

**Implementation:**

```typescript
export interface StatusResult {
  status: 'Early Release Possible' | 'On Track' | 'Delay Likely' | 'Major Delay Expected';
  color: 'green' | 'blue' | 'amber' | 'red';
  daysDifference: number;
}

export function calculateStatus(medianDate: string, officialDate: string = '2026-11-19'): StatusResult {
  const official = new Date(officialDate);
  const median = new Date(medianDate);

  const daysDiff = Math.round((median.getTime() - official.getTime()) / (24 * 60 * 60 * 1000));

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
- Early Release Possible: < -60 days from official
- On Track: -60 to +60 days from official
- Delay Likely: +60 to +180 days from official
- Major Delay Expected: > +180 days from official

**Usage:**
```typescript
const median = await getWeightedMedian();
const status = calculateStatus(median);
// Returns: { status: 'Delay Likely', color: 'amber', daysDifference: 116 }
```

**Tests Required:**
- Test case: Median 90 days before official → "Early Release Possible"
- Test case: Median exactly on official date → "On Track"
- Test case: Median 30 days after official → "On Track"
- Test case: Median 90 days after official → "Delay Likely"
- Test case: Median 200 days after official → "Major Delay Expected"
- Test case: Boundary at -60 days (should be "On Track")
- Test case: Boundary at +60 days (should be "Delay Likely")
- Test case: Boundary at +180 days (should be "Major Delay Expected")

---
```

---

### Change #3: Frontend HTML & JavaScript Updates

**File:** `public/index.html`
**Location:** Lines 43-48 (header section)

**OLD:**
```html
<div class="hidden md:block">
  <span
    class="px-3 py-1 rounded-full border border-gta-blue/30 text-gta-blue text-xs font-bold uppercase tracking-wider bg-gta-blue/10">
    Status: Delay Likely
  </span>
</div>
```

**NEW:**
```html
<div class="hidden md:block">
  <span
    id="status-badge"
    class="px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors duration-300"
    data-status-color="blue">
    Status: Loading...
  </span>
</div>
```

**Changes:**
1. Added `id="status-badge"` for JavaScript targeting
2. Removed hardcoded color classes
3. Added `transition-colors duration-300` for smooth color changes
4. Added `data-status-color="blue"` attribute for state management
5. Changed text to "Status: Loading..." (replaced by JavaScript)

---

**New File:** `public/js/status-badge.js`

**Content:**
```javascript
// Status Badge Dynamic Updater
(async function() {
  const badge = document.getElementById('status-badge');
  if (!badge) return;

  // Color map for different statuses
  const colorClasses = {
    green: 'border-green-500/30 text-green-500 bg-green-500/10',
    blue: 'border-gta-blue/30 text-gta-blue bg-gta-blue/10',
    amber: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
    red: 'border-red-500/30 text-red-500 bg-red-500/10'
  };

  try {
    // Fetch status from API
    const response = await fetch(`${window.API_URL || ''}/api/status`);

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    const result = await response.json();

    if (result.success && result.data) {
      const { status, status_color } = result.data;

      // Remove all existing color classes
      Object.values(colorClasses).forEach(classes => {
        badge.classList.remove(...classes.split(' '));
      });

      // Add new color classes
      const newClasses = colorClasses[status_color] || colorClasses.blue;
      badge.classList.add(...newClasses.split(' '));

      // Update text
      badge.textContent = `Status: ${status}`;
      badge.dataset.statusColor = status_color;
    }
  } catch (error) {
    console.error('Failed to load status badge:', error);
    // Fallback: show default state
    badge.classList.add(...colorClasses.blue.split(' '));
    badge.textContent = 'Status: Unknown';
  }
})();
```

---

**File:** `public/index.html`
**Location:** Before closing `</body>` tag (around line 309)

**Add:**
```html
<script src="/js/status-badge.js" defer></script>
```

---

## 5. Implementation Handoff

### Change Scope Classification

**Minor** - Direct implementation by development team, no backlog reorganization needed.

### Handoff Recipients

**Development Team** - Direct implementation

**Responsibilities:**

1. **Developer:**
   - Implement Story 10.4 following acceptance criteria exactly
   - Write and run all automated tests (unit + integration + frontend)
   - Update architecture documentation as specified
   - Deploy to dev environment for testing
   - Create pull request with comprehensive description

2. **Code Reviewer:**
   - Verify all acceptance criteria are met
   - Check test coverage meets requirements (90%+ for utilities)
   - Validate API contract follows existing patterns
   - Confirm architecture documentation updated
   - Test manually in dev environment

3. **Deployment Process:**
   - Deploy to dev environment first
   - Manual QA testing across devices (desktop/mobile)
   - Verify caching behavior (5-minute TTL)
   - Check error handling and fallbacks
   - Deploy to production after approval

### Success Criteria

✅ **Backend:**
- `/api/status` endpoint returns correct status based on median
- Status calculation matches all 4 thresholds correctly
- Caching works (5-minute TTL, invalidates on submission)
- Error handling returns graceful defaults
- All unit tests pass (8+ test cases)

✅ **Frontend:**
- Header badge updates dynamically on page load
- Color coding matches specification (green/blue/amber/red)
- Smooth transitions between color states
- Graceful fallback to "Unknown" on API failure
- Responsive on desktop (hidden on mobile per existing design)

✅ **Documentation:**
- `architecture.md` updated with new API endpoint
- `architecture.md` updated with status calculation pattern
- Epic 10 updated with Story 10.4

✅ **Testing:**
- All automated tests passing
- Manual testing completed across browsers
- Dev environment deployment successful
- No regressions in existing functionality

### Files to Create/Modify

**Create:**
- `src/routes/status.ts` (API endpoint)
- `src/utils/status-calculator.ts` (calculation logic)
- `src/utils/status-calculator.test.ts` (unit tests)
- `public/js/status-badge.js` (frontend script)

**Modify:**
- `docs/architecture.md` (add API contract + implementation pattern)
- `docs/epics/epic-10-dashboard-enhancements.md` (add Story 10.4)
- `public/index.html` (update header badge + add script tag)

---

## 6. Summary

### Issue Addressed

Dynamic status badge calculation and display based on community prediction data.

### Change Scope

**Minor** - Direct implementation, no MVP impact, no backlog reorganization needed.

### Artifacts Modified

- Epic 10: Add Story 10.4
- Architecture: Add API endpoint + implementation pattern
- Frontend: Dynamic badge in header

### Routed To

**Development Team** for direct implementation.

### Next Steps

1. Developer implements Story 10.4
2. Code review validates acceptance criteria
3. Deploy to dev environment
4. Manual QA testing
5. Deploy to production

---

**Workflow Execution Complete**
**Date:** 2025-11-28
**User:** yojahny
**Agent:** BMad Method - Correct Course Workflow

✅ **Sprint Change Proposal Ready for Implementation**
