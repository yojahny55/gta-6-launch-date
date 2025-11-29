# Story 10.3: My Prediction Card Enhancement

Status: review

## Story

As a returning user,
I want to see my prediction prominently in the dashboard,
so that I can quickly review what I predicted and see how it compares to the community.

## Acceptance Criteria

**Given** a user has previously submitted a prediction
**When** they return to the site
**Then** "My Prediction" card is displayed with the following features:

### Card Display Requirements

1. **Location:**
   - Display as separate section below main dashboard grid (4-card layout)
   - Do NOT add as 5th card to avoid cluttering main stats
   - Visually distinct from main stats (secondary styling)

2. **Content Display:**
   - Heading: "My Prediction"
   - Value: User's predicted date (e.g., "Jun 10, 2027")
   - Delta: Comparison to median (e.g., "+3 months from median")
   - Button: "Update Prediction" (links to form/allows inline edit)

3. **Data Source:**
   - Read from cookie: `gta6_user_id` (primary)
   - Fallback: localStorage for performance
   - API call: `GET /api/predict/:cookie_id` if needed for verification

4. **Percentile Calculation:** ✨ **Sprint Change Proposal: 2025-11-28**
   - Calculate user's position in prediction distribution
   - Formula: `(predictions_before_user / total_predictions) × 100`
   - Display percentile value (e.g., "65%") replacing "--" placeholder
   - Update progress bar width dynamically to match percentile
   - Progress bar meaning: 0% = earliest prediction, 100% = latest prediction

5. **Progress Bar Display:** ✨ **Sprint Change Proposal: 2025-11-28**
   - Width dynamically set to percentile value (remove hardcoded 50%)
   - Visual indicator of user's position in community
   - Tooltip explaining: "Shows your percentile position in all predictions"

**And** if no prediction exists:
- Hide card entirely (don't show empty state in dashboard)
- No placeholder or "Submit your prediction" messaging

**And** error handling:
- If cookie exists but prediction not found in database: Hide card
- If API fails: Show cached data from localStorage or hide card
- If `/api/predictions` fails: Default to 50th percentile (middle)
- No error messages displayed to user (graceful degradation)

**And** automated tests exist covering main functionality:
- Card visibility logic (show/hide based on prediction existence)
- Data fetching and display
- Delta calculation accuracy
- Update button functionality
- ✨ **Percentile calculation accuracy (Sprint Change: 2025-11-28)**
- ✨ **Progress bar width updates correctly (Sprint Change: 2025-11-28)**

### Testing Requirements

- [x] Unit tests for prediction existence detection
- [x] Unit tests for delta calculation from median
- [x] Integration tests for cookie/localStorage data retrieval
- [x] UI tests for card show/hide logic
- [x] Error handling tests (missing cookie, API failure, prediction not found)
- [x] ✨ **Unit tests for percentile calculation (Sprint Change: 2025-11-28)**
- [x] ✨ **Unit tests for progress bar width updates (Sprint Change: 2025-11-28)**
- [x] ✨ **Edge case tests (0%, 50%, 100% percentiles) (Sprint Change: 2025-11-28)**

## Tasks / Subtasks

- [x] Task 1: Frontend - Add "My Prediction" section HTML (AC: #1, #2)
  - [x] Create card HTML structure below main dashboard grid
  - [x] Add semantic HTML with proper ARIA labels
  - [x] Style with `bg-gta-card border border-gray-700 rounded-xl` (consistent with theme)
  - [x] Implement responsive layout (mobile stacking)

- [x] Task 2: Frontend - Cookie/localStorage detection logic (AC: #3)
  - [x] Check for `gta6_user_id` cookie
  - [x] Fallback to localStorage if cookie not found
  - [x] Handle missing data gracefully

- [x] Task 3: Frontend - Fetch prediction data (AC: #3)
  - [x] Option A: Call `GET /api/predict/:cookie_id` to fetch fresh data
  - [x] Option B: Use cached data from submission (localStorage)
  - [x] Decide based on performance trade-offs (**Decision: Option B - localStorage for MVP performance**)

- [x] Task 4: Frontend - Calculate and display delta from median (AC: #2)
  - [x] Fetch current median from `/api/stats`
  - [x] Calculate difference in months/days
  - [x] Format as "+3 months from median" or "-2 weeks from median"

- [x] Task 5: Frontend - Add simple update message (AC: #2)
  - [x] Display "Scroll up to update your prediction" message
  - [x] Remove interactive button (per user feedback)
  - [x] Keep card simple and informative

- [x] Task 6: Frontend - Implement show/hide logic (AC: #4)
  - [x] Show card only if prediction exists
  - [x] Hide card if no prediction found
  - [x] No empty state messaging

- [x] Task 7: Testing - Write automated tests (AC: #7)
  - [x] Test card visibility logic
  - [x] Test delta calculation
  - [x] Test error handling (missing cookie, API failure)
  - [x] Test update message display

- [x] ✨ **Task 8: Percentile Calculation Implementation** (Sprint Change: 2025-11-28)
  - [x] Create `calculatePercentile()` function in my-prediction.js
  - [x] Create `fetchAndCalculatePercentile()` function to call `/api/predictions`
  - [x] Create `updateProgressBar()` function to update DOM elements
  - [x] Integrate percentile calculation into `showMyPredictionCard()`
  - [x] Export new functions for testing

- [x] ✨ **Task 9: UX Enhancement - Tooltip** (Sprint Change: 2025-11-28)
  - [x] Add information icon (ⓘ) next to "vs Community" heading
  - [x] Add title attribute with explanation text
  - [x] Ensure tooltip is accessible (hover + focus states)

- [x] ✨ **Task 10: Automated Tests for Percentile** (Sprint Change: 2025-11-28)
  - [x] Write 12 unit tests for `calculatePercentile()` function
  - [x] Write 8 unit tests for `updateProgressBar()` function
  - [x] Write 3 integration tests for percentile flow
  - [x] Total: 23 new tests in my-prediction.test.js

## Dev Notes

### Architecture Context

**Frontend Components:**
- **File to modify:** `public/index.html` (add new section)
- **File to modify:** `public/app.js` (add card logic)
- **File to modify:** `public/styles.css` (card styling if needed)

**API Endpoints (existing):**
- `GET /api/stats` - Fetch current median for delta calculation
- `GET /api/predict/:cookie_id` - Fetch user's prediction (if needed)

**No backend changes required** - This is a pure frontend enhancement using existing APIs.

### Project Structure Notes

**Existing Components to Reuse:**
- Cookie reading: `js-cookie` library (already used in `public/app.js`)
- Stats fetching: `fetchStats()` function (already exists in `public/app.js`)
- Date formatting: `dayjs` library (already used for date differences)

**Styling Consistency:**
- Use custom GTA theme colors: `gta-card`, `gta-pink`, `gta-purple`
- Follow existing card pattern from 4-card dashboard grid
- Ensure responsive design matches existing breakpoints

### Technical Considerations

**Performance:**
- **Option A (API call):** More accurate but slower (extra network request)
- **Option B (localStorage cache):** Faster but may be stale if prediction updated elsewhere
- **Recommendation:** Use Option B (localStorage) for MVP, add API call for verification post-MVP

**Data Flow:**
1. User lands on page
2. Check for `gta6_user_id` cookie
3. If exists, check localStorage for cached prediction
4. If found, display card with prediction and delta
5. If not found, hide card

**Delta Calculation:**
```javascript
const userDate = dayjs('2027-06-10');
const medianDate = dayjs(stats.median); // From /api/stats
const diffMonths = userDate.diff(medianDate, 'month');
const deltaText = diffMonths > 0 ? `+${diffMonths} months from median` : `${diffMonths} months from median`;
```

### Relationship to Story 3.3b

**Note:** Epic 10 documentation states: *"This story overlaps with Story 3.3b ('My Prediction' Card Display). Recommend consolidating or marking one as duplicate."*

**Resolution:**
- Story 3.3b: Submission confirmation with visual feedback (immediate post-submission display)
- Story 10.3: Dashboard card for returning users (persistent display on page load)
- **Decision:** These are **complementary**, not duplicate:
  - 3.3b shows "You just predicted X" after submission
  - 10.3 shows "Your prediction: X" when returning to site
  - Both use similar logic but serve different UX moments
- **Action:** Proceed with Story 10.3 as distinct feature

### References

- [Source: PRD.md#FR16-FR18] - User can see social comparison and delta from median
- [Source: PRD.md#FR96] - "My Prediction" display card for returning users
- [Source: architecture.md#ADR-015] - Custom GTA Gaming Theme over DaisyUI
- [Source: epics/epic-10-dashboard-enhancements.md#Story-10.3] - Original story specification
- [Source: stories/3-3-submission-confirmation-with-visual-feedback.md] - Related story for post-submission display

### Learnings from Previous Story

**From Story 10.2 (Dashboard Grid Layout Finalization) - Status: backlog**

Story 10.2 has not yet been implemented. No previous story learnings available.

**First story in Epic 10 being drafted** - No predecessor context to inherit.

However, relevant context from Epic 3 (Results Display) stories:
- **From Story 3.2 (Social Comparison Messaging):** Delta calculation logic exists in `public/app.js` using `dayjs` for date differences
- **From Story 3.3 (Submission Confirmation):** Cookie-based user identification pattern established using `js-cookie`
- **From Story 5.5 (Mobile Responsive Design):** Responsive card layouts using Tailwind breakpoints (`md:grid-cols-2`, `lg:grid-cols-4`)

**Architectural patterns to reuse:**
- Cookie reading: `Cookies.get('gta6_user_id')` from `js-cookie`
- Stats fetching: `fetchStats()` function from `public/app.js`
- Delta calculation: `dayjs(userDate).diff(median, 'month')` pattern
- Responsive cards: Tailwind utility classes for mobile stacking

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/10-3-my-prediction-card-enhancement.context.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

- Implementation approach: Created modular my-prediction.js with full separation of concerns
- Delta calculation: Reused existing comparison.js functions (calculateDaysDiff, formatDelta)
- DOM initialization: Integrated with loadStats() lifecycle for proper timing
- Performance decision: localStorage-first approach (no API call) for instant display

### Completion Notes List

✅ **Story 10.3 Implementation Complete** (2025-11-27)

**Implementation Summary:**
- Created new module `public/js/my-prediction.js` (188 lines) with full encapsulation
- Updated HTML in index.html to replace button with simple message
- Integrated module into app.js initialization flow via loadStats() callback
- Wrote comprehensive test suite: **27/27 tests passing** (public/js/my-prediction.test.js)

**Key Technical Decisions:**
1. **Data Source:** localStorage-first (no API call) - aligns with AC and performance goals
2. **Delta Calculation:** Reused comparison.js functions (calculateDaysDiff, formatDelta) for consistency
3. **Update Mechanism:** Simple message "Scroll up to update your prediction" (per user feedback - no interactive button)
4. **Initialization:** Called from loadStats() after first stats fetch (ensures median available)

**Files Modified:**
1. `public/js/my-prediction.js` - New module (188 lines)
2. `public/js/my-prediction.test.js` - Test suite (27 tests, 444 lines)
3. `public/index.html` - Updated card HTML with message instead of button
4. `public/app.js` - Integrated module initialization + delta updates

**Test Coverage:**
- AC1: Card Visibility Logic (5 tests) ✅
- AC2: Delta Calculation Accuracy (6 tests) ✅
- AC3: Data Fetching and Display (4 tests) ✅
- AC4: Update Message Display (2 tests) ✅
- AC5: Error Handling (5 tests) ✅
- AC6: Responsive Layout (2 tests) ✅
- Integration Tests (3 tests) ✅

**Build & Tests:**
- ✅ All new tests passing (27/27)
- ✅ Build successful (no errors)
- ✅ Lint clean
- ✅ No regressions in existing functionality

**Notable Implementation Details:**
- Graceful degradation: Falls back to manual delta calculation if comparison.js not loaded
- Error handling: All localStorage/cookie failures logged to console, card hidden (no user-facing errors)
- Accessibility: Semantic HTML with clear messaging
- Performance: Zero API calls, instant display from cache
- **User Feedback Applied:** Removed interactive button, replaced with simple "Scroll up to update" message

**Ready for Review** - All acceptance criteria met, comprehensive tests passing, user feedback incorporated.

---

### ✨ **Sprint Change Proposal Implementation** (2025-11-28)

**Issue:** VS Community card progress bar hardcoded at 50%, percentile showing "--" placeholder

**Implementation Summary:**
- Added percentile calculation logic to `my-prediction.js`
- Created `calculatePercentile()` function with formula: `(predictions_before_user / total) × 100`
- Created `fetchAndCalculatePercentile()` to fetch data from `/api/predictions` (Story 3.4b)
- Created `updateProgressBar()` to dynamically set progress bar width and percentile text
- Integrated into `showMyPredictionCard()` with async percentile fetch
- Added tooltip (ⓘ) to "vs Community" heading explaining progress bar meaning

**Files Modified:**
1. `public/js/my-prediction.js` - Added 3 new functions (100+ lines)
2. `public/js/my-prediction.test.js` - Added 23 new tests for percentile logic
3. `public/index.html` - Added tooltip to "vs Community" heading
4. `docs/sprint-artifacts/stories/10-3-my-prediction-card-enhancement.md` - Updated acceptance criteria

**Test Coverage Added:**
- 12 unit tests for `calculatePercentile()` (0%, 50%, 100%, edge cases)
- 8 unit tests for `updateProgressBar()` (width updates, text updates, error handling)
- 3 integration tests for percentile calculation flow (optimistic, pessimistic, aligned users)
- **Total:** 23 new tests, all passing ✅

**Acceptance Criteria Updated:**
- AC#4: Percentile Calculation (new)
- AC#5: Progress Bar Display (new)
- Testing Requirements: 3 new test requirements added

**Build & Tests:**
- ✅ All 50 tests passing (27 original + 23 new)
- ✅ Build successful (no errors)
- ✅ Lint clean
- ✅ No regressions in existing functionality

**Ready for QA** - Sprint Change Proposal fully implemented and tested.

### File List

**New Files:**
- public/js/my-prediction.js (implementation - 188 lines)
- public/js/my-prediction.test.js (tests - 27 tests, 444 lines)

**Modified Files:**
- public/index.html (updated My Prediction card HTML: lines 136-151, replaced button with message)
- public/app.js (integrated initialization: lines 812-814, 916-919)
- docs/sprint-artifacts/sprint-status.yaml (status: ready-for-dev → in-progress → review)
- docs/sprint-artifacts/stories/10-3-my-prediction-card-enhancement.md (tasks marked complete, status updated)
