# Sprint Change Proposal: VS Community Percentile Calculation

**Date:** 2025-11-28
**Author:** Correct Course Workflow
**Status:** ✅ Approved
**Scope Classification:** Minor (Direct Development Implementation)

---

## 1. Issue Summary

### Problem Statement
The "VS Community" card in the My Prediction section displays a **hardcoded progress bar (50% width)** and **placeholder "--" percentile value**, making it unclear what the bar represents or where the user stands in the community prediction distribution.

### Context
- **Discovery:** Identified during UI review of deployed Story 10.3 (My Prediction Card Enhancement)
- **Evidence:** Screenshot shows progress bar with ambiguous meaning; HTML source reveals hardcoded `style="width: 50%"` and `--` placeholder
- **User Impact:** Users see "4 months earlier vs median" text but lack visual clarity on their percentile position in the community

### Triggering Story
**Story 10.3:** My Prediction Card Enhancement (Epic 10: Dashboard Enhancements)

---

## 2. Impact Analysis

### Epic Impact
**Epic 10 (Dashboard Enhancements):**
- **Story 10.3** requires enhancement to add percentile calculation logic
- No impact on Stories 10.1, 10.2, or 10.4
- Epic 10 can be completed with this modification

**Other Epics:**
- No impact on other epics

### Artifact Conflicts

**PRD:**
- ✅ No conflict - Enhancement to user feedback display
- ✅ MVP not affected

**Architecture:**
- ⚠️ Minor impact - Requires `/api/predictions` endpoint (already implemented in Story 3.4b)
- Frontend needs percentile calculation logic in `public/js/my-prediction.js`

**UX Design Specification:**
- ⚠️ Minor impact - Progress bar needs clear label/tooltip
- Recommendation: "Your position: 65th percentile (more pessimistic than 65% of community)"

**Testing:**
- New tests needed for percentile calculation logic

---

## 3. Recommended Approach

### Selected Path: **Option 1 - Direct Adjustment**

**Approach:** Enhance Story 10.3 to include percentile calculation and dynamic progress bar population.

**Rationale:**
- ✅ **Low Effort:** 3.5 hours total development time
- ✅ **High Value:** Significantly improves user understanding of their prediction position
- ✅ **Low Risk:** Isolated change, no dependencies or breaking changes
- ✅ **Completes Feature:** Fulfills original Story 10.3 intent to show user's prediction with comparison

**Trade-offs Considered:**
- **Alternative 1:** Remove progress bar entirely → Rejected (loses visual engagement)
- **Alternative 2:** Defer to post-MVP → Rejected (hardcoded values damage trust)
- **Alternative 3:** Show confidence score instead → Rejected (not aligned with user comparison goal)

---

## 4. Detailed Change Proposals

### Change 1: Percentile Calculation Logic

**File:** `public/js/my-prediction.js`

**OLD:** No percentile calculation function exists

**NEW:** Add percentile calculation function

```javascript
/**
 * Calculate user's percentile position in prediction distribution
 * AC: Percentile represents how pessimistic user is vs community
 *
 * @param {string} userDate - User's predicted date (ISO 8601)
 * @param {Array} allPredictions - Array of {predicted_date, count} from /api/predictions
 * @returns {number} Percentile (0-100), rounded to nearest integer
 */
function calculatePercentile(userDate, allPredictions) {
  if (!allPredictions || allPredictions.length === 0) {
    return 50; // Default to middle if no data
  }

  // Count predictions earlier than user's date
  let earlierCount = 0;
  let totalCount = 0;

  allPredictions.forEach(pred => {
    const count = pred.count || 1;
    totalCount += count;

    if (pred.predicted_date < userDate) {
      earlierCount += count;
    }
  });

  if (totalCount === 0) return 50;

  // Percentile = (predictions before user / total) × 100
  const percentile = (earlierCount / totalCount) * 100;
  return Math.round(percentile);
}
```

**Rationale:**
- Formula: `(predictions_before_user / total_predictions) × 100`
- Example: User predicts "2027-06-10", median is "2027-03-15"
  - If 6,500 out of 10,000 predictions are earlier → User is at 65th percentile
  - Interpretation: User is more pessimistic than 65% of community

---

### Change 2: Progress Bar Dynamic Population

**File:** `public/js/my-prediction.js` (function: `showMyPredictionCard`)

**OLD:**
```html
<!-- Hardcoded in HTML -->
<div id="prediction-position-bar"
  class="h-full bg-gradient-to-r from-gta-purple to-gta-pink rounded-full transition-all duration-500"
  style="width: 50%"></div>
```

**NEW:** JavaScript dynamically updates width
```javascript
/**
 * Update progress bar and percentile display
 * AC: Progress bar width = percentile value
 *
 * @param {number} percentile - Calculated percentile (0-100)
 */
function updateProgressBar(percentile) {
  const progressBar = document.getElementById('prediction-position-bar');
  const percentileDisplay = document.getElementById('prediction-percentile');

  if (progressBar) {
    progressBar.style.width = `${percentile}%`;
  }

  if (percentileDisplay) {
    percentileDisplay.textContent = `${percentile}%`;
  }
}
```

**Integration:** Call `updateProgressBar()` from `showMyPredictionCard()` after fetching predictions data

**Rationale:**
- Removes hardcoded 50% width
- Progress bar represents "How pessimistic you are" (0% = earliest, 100% = latest)
- Visual indicator of position in community

---

### Change 3: Percentile Display Population

**File:** `public/js/my-prediction.js`

**OLD:**
```html
<span id="prediction-percentile" class="text-gray-400 font-bold min-w-[3rem] text-right">--</span>
```

**NEW:** Populate with calculated percentile
```javascript
// In updateProgressBar() function (see Change 2)
percentileDisplay.textContent = `${percentile}%`;
```

**Rationale:** Replaces "--" placeholder with meaningful data

---

### Change 4: Fetch Predictions Data for Percentile

**File:** `public/js/my-prediction.js`

**OLD:** No call to `/api/predictions` endpoint

**NEW:** Fetch predictions data and calculate percentile
```javascript
/**
 * Fetch predictions data and calculate user's percentile
 * AC: Uses /api/predictions endpoint (Story 3.4b)
 *
 * @param {string} userDate - User's predicted date
 * @returns {Promise<number>} Percentile value
 */
async function fetchAndCalculatePercentile(userDate) {
  try {
    const API_URL = window.API_URL || '';
    const response = await fetch(`${API_URL}/api/predictions`);

    if (!response.ok) {
      console.error('Failed to fetch predictions for percentile');
      return 50; // Default to middle on error
    }

    const result = await response.json();
    const predictions = result.data || [];

    return calculatePercentile(userDate, predictions);
  } catch (error) {
    console.error('Error calculating percentile:', error);
    return 50; // Default to middle on error
  }
}
```

**Integration:** Call from `showMyPredictionCard()`:
```javascript
// In showMyPredictionCard() function
const percentile = await fetchAndCalculatePercentile(prediction.predicted_date);
updateProgressBar(percentile);
```

**Rationale:** Leverages existing `/api/predictions` API (Story 3.4b) for data

---

### Change 5: Clear Labeling (UX Enhancement)

**File:** `public/index.html`

**OLD:**
```html
<p class="text-gray-400 text-xs uppercase tracking-widest mb-3">vs Community</p>
```

**NEW:** Add tooltip or subtext
```html
<p class="text-gray-400 text-xs uppercase tracking-widest mb-3">
  vs Community
  <span class="text-gray-500 normal-case" title="Shows your percentile position in all predictions">ⓘ</span>
</p>
```

**Alternative (more explicit):**
Add subtext below progress bar in HTML:
```html
<div class="flex items-center gap-2 text-xs">
  <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
    <div id="prediction-position-bar" ...></div>
  </div>
  <span id="prediction-percentile" ...>--</span>
</div>
<p class="text-gray-500 text-xs mt-1">Your percentile in community predictions</p>
```

**Rationale:** Makes progress bar meaning explicit for users

---

## 5. Implementation Handoff

### Change Scope Classification: **Minor**

**Handoff To:** Development Team (Direct Implementation)

**Responsibilities:**
1. ✅ Implement percentile calculation function in `my-prediction.js`
2. ✅ Add async data fetching from `/api/predictions`
3. ✅ Update progress bar width dynamically
4. ✅ Populate percentile display (replace "--")
5. ✅ Add clear label/tooltip for UX clarity
6. ✅ Write automated tests for percentile calculation
7. ✅ Manual QA: Test with various prediction positions (early, median, late, outliers)

**Deliverables:**
- [ ] Updated `public/js/my-prediction.js` with percentile logic
- [ ] Dynamic progress bar population
- [ ] Populated `#prediction-percentile` display
- [ ] Unit tests for `calculatePercentile()` function
- [ ] Updated Story 10.3 acceptance criteria
- [ ] QA test results

**Success Criteria:**
- Progress bar width matches calculated percentile
- Percentile display shows correct value (not "--")
- Users understand what the progress bar represents
- Tests pass with 90%+ coverage on percentile logic

**Timeline:**
- **Estimated Effort:** 3.5 hours
- **Target Completion:** Next development session

---

## 6. Testing Requirements

### Unit Tests (Required)

**Test File:** `public/js/my-prediction.test.js` (create new)

**Test Cases:**
1. ✅ Calculate percentile for user at 0th percentile (earliest prediction)
2. ✅ Calculate percentile for user at 50th percentile (median prediction)
3. ✅ Calculate percentile for user at 100th percentile (latest prediction)
4. ✅ Calculate percentile for user between quartiles (e.g., 65th percentile)
5. ✅ Handle empty predictions array (should return 50 as default)
6. ✅ Handle edge case: user prediction equals median
7. ✅ Progress bar width updates correctly
8. ✅ Percentile display updates correctly

### Integration Tests

**Test Scenarios:**
1. ✅ Fetch `/api/predictions` and calculate percentile successfully
2. ✅ Handle API error gracefully (fallback to 50%)
3. ✅ Handle network timeout (fallback to 50%)
4. ✅ Update UI when predictions data changes

### Manual QA

**Test Cases:**
1. ✅ User with very early prediction (< 10th percentile) - Progress bar near 0%
2. ✅ User with median prediction (around 50th percentile) - Progress bar at ~50%
3. ✅ User with late prediction (> 90th percentile) - Progress bar near 100%
4. ✅ Mobile responsive: Progress bar displays correctly on small screens
5. ✅ Accessibility: Screen reader announces percentile value

---

## 7. Workflow Completion Summary

### Issue Addressed
**VS Community card hardcoded progress bar and missing percentile calculation**

### Change Scope
**Minor** - Direct development implementation (3.5 hours)

### Artifacts Modified
- `public/js/my-prediction.js` (enhanced)
- `public/index.html` (optional tooltip/subtext)
- New test file: `public/js/my-prediction.test.js`
- Updated Story 10.3 acceptance criteria

### Routed To
**Development Team** - Direct implementation (no PM/PO/Architect involvement needed)

---

## 8. Next Steps for Development Team

**Immediate Actions:**
1. Read this Sprint Change Proposal thoroughly
2. Review existing code in `public/js/my-prediction.js`
3. Verify `/api/predictions` endpoint availability (Story 3.4b)
4. Implement percentile calculation function
5. Add data fetching and UI updates
6. Write and run automated tests
7. Perform manual QA testing
8. Update Story 10.3 status to "Done"

**Questions/Blockers:**
- Contact workflow initiator if any blockers arise
- Verify `/api/predictions` endpoint returns expected data format

---

**✅ Workflow Complete. Ready for development implementation.**

---

_Generated by BMad Correct Course Workflow v1.0_
_Workflow Path: `.bmad/bmm/workflows/4-implementation/correct-course/workflow.yaml`_
_Executed: 2025-11-28_
_For: yojahny_
