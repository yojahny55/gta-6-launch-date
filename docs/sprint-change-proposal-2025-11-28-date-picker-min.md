# Sprint Change Proposal - Date Picker Minimum Date Validation

**Date:** 2025-11-28
**Project:** GTA 6 Launch Date Prediction Tracker
**Author:** yojahny
**Status:** Approved for Implementation
**Change Scope:** Minor - Validation Rule Adjustment

---

## Section 1: Issue Summary

### Problem Statement

The date picker currently allows users to select prediction dates **before** the official GTA 6 launch date (November 19, 2026). This violates the business logic, as predictions before the official launch date are nonsensical—users should only be able to predict when the game will **actually** launch (on or after the official date).

### Context

- **Discovery**: User requirement clarification (not tied to specific story)
- **Affected Component**: Story 2.3 (Date Picker with Validation) from Epic 2
- **Current Behavior**: HTML5 date input has `min="2025-01-01"`, allowing dates from January 1, 2025
- **Expected Behavior**: Date input should have `min="2026-11-19"`, enforcing official launch date as minimum

### Evidence

**Current Implementation** (`public/index.html:70`):
```html
<input type="date" id="predicted-date" name="predicted-date"
       min="2025-01-01" max="2029-12-31" required>
```

**Backend Validation** (`src/utils/validation.ts:18`):
```typescript
export const MIN_DATE = '2025-01-01';
```

**Issue**: Both frontend and backend allow predictions 689 days before the official launch date, which doesn't align with the product's purpose.

---

## Section 2: Impact Analysis

### Epic Impact

**Epic 2: Core Prediction Engine** (Status: DONE)
- **Affected Story**: Story 2.3 (Date Picker with Validation)
- **Impact Level**: ✅ **Minor** - Epic remains complete; this is a validation boundary adjustment
- **Required Changes**: Documentation update only (acceptance criteria text)

**Other Epics**:
- **Epic 3-10**: ❌ **No Impact** - Future stories don't depend on the minimum date value

### Story Impact

**Current Stories**:
- **Story 2.3**: Validation logic requires update (min date boundary)
- **Story 2.4**: Input validation constants require update
- **No other stories affected** - This is isolated to date validation

**Future Stories**:
- ✅ **No impact** on stories in Epic 4-10

### Artifact Conflicts

#### PRD (Product Requirements Document)
**Conflict**: ⚠️ **YES**
- **Current**: FR2 states "Users can predict any date from 2025 to 2125"
- **Required Update**: FR2 should state "Users can predict any date from **November 19, 2026** (official launch date) to 2125"
- **Impact**: Clarification only, doesn't change MVP scope

#### Architecture
**Conflict**: ❌ **NO**
- No architectural changes needed
- Validation logic already exists; only constants change

#### UI/UX Specifications
**Conflict**: ❌ **MINOR**
- Date picker behavior remains identical
- May need to update validation message text if documented

#### Other Artifacts
**Conflict**: ✅ **Tests Only**
- **5 test files** require updates (20+ assertions)
- No impact on CI/CD, deployment, or monitoring

### Technical Impact

**Code Changes**:
- Frontend: 1 HTML attribute change
- Backend: 2 validation files (constants + docs)
- Tests: 5 test files (boundary assertions)
- Documentation: 1 epic file

**Database**:
- ❌ **No migration needed**
- Existing predictions before 2026-11-19 (if any) remain in database
- New submissions will be validated against new minimum

**API**:
- ✅ **Backward compatible** - Tightening validation doesn't break existing clients
- Error messages updated for clarity

**Risk Assessment**: 🟢 **LOW**
- Simple validation boundary change
- No breaking changes to completed functionality
- Comprehensive test coverage ensures correctness

---

## Section 3: Recommended Approach

### Selected Path: **Option 1 - Direct Adjustment**

**Decision**: Modify existing validation constants and HTML attributes to enforce the official launch date as the minimum selectable date.

### Rationale

| Factor | Analysis |
|--------|----------|
| **Implementation Effort** | **LOW** - 9 files, ~25 changes, < 1 hour |
| **Technical Risk** | **LOW** - Validation tightening (safer than loosening) |
| **Timeline Impact** | **NONE** - Can be implemented immediately |
| **Team Morale** | **POSITIVE** - Quick fix, improves product correctness |
| **Business Value** | **HIGH** - Prevents illogical user inputs |
| **Maintainability** | **IMPROVED** - Validation aligns with business logic |

### Alternatives Considered

**Option 2: Rollback Recently Completed Stories**
- **Status**: ❌ **Rejected**
- **Reason**: No stories need rollback; this is a simple validation fix

**Option 3: PRD MVP Review (Scope Reduction)**
- **Status**: ❌ **Not Needed**
- **Reason**: MVP scope unaffected; this is a clarification, not a reduction

### Effort Estimate

- **Implementation**: 30-45 minutes (file changes)
- **Testing**: 15 minutes (run test suites)
- **Documentation**: Already included in this proposal
- **Total**: **< 1 hour**

### Risk Assessment

**Potential Risks**:
1. **Existing predictions before 2026-11-19** - LOW impact, these remain valid in DB
2. **Test failures** - MITIGATED by comprehensive test updates in this proposal
3. **User confusion** - MITIGATED by updated error messages

**Mitigation**:
- All test changes documented in Section 4
- Error messages clarify the official launch date
- Frontend validation prevents invalid submissions

---

## Section 4: Detailed Change Proposals

### Frontend Changes

#### **CHANGE 1: HTML Date Picker**

**File**: `public/index.html`
**Line**: 70
**Type**: HTML Attribute Update

**OLD:**
```html
<input type="date" id="predicted-date" name="predicted-date" min="2025-01-01" max="2029-12-31" required
```

**NEW:**
```html
<input type="date" id="predicted-date" name="predicted-date" min="2026-11-19" max="2029-12-31" required
```

**Impact**: Users cannot select dates before Nov 19, 2026 in the date picker UI

---

### Backend Changes

#### **CHANGE 2: Validation Constants (Primary)**

**File**: `src/utils/validation.ts`

**Change 2.1** - MIN_DATE Constant (Line 18):
```typescript
// OLD
export const MIN_DATE = '2025-01-01';

// NEW
export const MIN_DATE = '2026-11-19'; // Official GTA 6 launch date
```

**Change 2.2** - DateSchema Documentation (Line 47):
```typescript
// OLD
 * - Range: 2025-01-01 to 2125-12-31

// NEW
 * - Range: 2026-11-19 to 2125-12-31
```

**Change 2.3** - Error Message (Line 57):
```typescript
// OLD
.regex(DATE_REGEX, 'Invalid date format. Expected YYYY-MM-DD between 2025-01-01 and 2125-12-31')

// NEW
.regex(DATE_REGEX, 'Invalid date format. Expected YYYY-MM-DD between 2026-11-19 and 2125-12-31')
```

**Impact**: Server-side validation enforces official launch date minimum

---

#### **CHANGE 3: Date Validation Utilities**

**File**: `src/utils/date-validation.ts`

**Change 3.1** - MIN_DATE Constant (Line 24):
```typescript
// OLD
export const MIN_DATE = '2025-01-01';

// NEW
export const MIN_DATE = '2026-11-19'; // Official GTA 6 launch date
```

**Change 3.2** - Module Documentation (Line 10):
```typescript
// OLD
 * Date Range: 2025-01-01 to 2125-12-31 (100-year window per PRD FR2)

// NEW
 * Date Range: 2026-11-19 to 2125-12-31 (starting from official GTA 6 launch date per PRD FR2)
```

**Change 3.3** - Function Documentation (Lines 116, 127):
```typescript
// OLD
 * Validate if a date is within the allowed range (2025-01-01 to 2125-12-31)
 * validateDateRange('2025-01-01') // true (min boundary)

// NEW
 * Validate if a date is within the allowed range (2026-11-19 to 2125-12-31)
 * validateDateRange('2026-11-19') // true (min boundary)
```

**Impact**: Utility functions consistent with primary validation

---

### Documentation Changes

#### **CHANGE 4: Epic 2 Story Documentation**

**File**: `docs/epics/epic-2-core-prediction-engine.md`

**Change 4.1** - Acceptance Criteria (Line 99):
```markdown
<!-- OLD -->
- `<input type="date" min="2025-01-01" max="2125-12-31">`
- Minimum date: January 1, 2025 (past dates rejected)

<!-- NEW -->
- `<input type="date" min="2026-11-19" max="2125-12-31">`
- Minimum date: November 19, 2026 (official launch date - earlier dates rejected)
```

**Change 4.2** - Validation Messages (Line 111):
```markdown
<!-- OLD -->
- "Please select a date between Jan 1, 2025 and Dec 31, 2125"

<!-- NEW -->
- "Please select a date between Nov 19, 2026 (official launch date) and Dec 31, 2125"
```

**Impact**: Documentation reflects actual implementation

---

### Test Changes

#### **CHANGE 5: Validation Unit Tests**

**File**: `src/utils/validation.test.ts`

**Changes Required**:
- **Line 30**: `expect(MIN_DATE).toBe('2026-11-19');`
- **Line 52**: `expect(() => DateSchema.parse('2026-11-19')).not.toThrow();`
- **Line 67-68**: Update min boundary test to use `'2026-11-19'`
- **Line 133**: Update "before minimum" test to use `'2026-11-18'` (one day before)
- **Line 347-349**: Update min date request test

**Impact**: Validates new minimum date boundary

---

#### **CHANGE 6: Date Validation Utility Tests**

**File**: `src/utils/date-validation.test.ts`

**Changes Required**:
- **Line 25-26**: `expect(MIN_DATE).toBe('2026-11-19');`
- **Line 44-45**: Update min boundary format test to `'2026-11-19'`
- **Line 241-242**: Update validateDateRange min boundary test
- **Line 258**: Update "before min" test to `'2026-11-18'`
- **Line 293-294**: Update UTC conversion min boundary test
- **Line 317-318**: Update validateDate min boundary test

**Impact**: Ensures date utilities work with new minimum

---

#### **CHANGE 7: Date Picker Integration Tests**

**File**: `tests/date-picker-integration.test.ts`

**Changes Required**:
- **Line 74**: `min: '2026-11-19',`
- **Line 158-196**: Update "reject before minimum" test to use `'2026-11-18'`
- **Line 392**: `expect(dateInput.min).toBe('2026-11-19');`

**Impact**: Frontend integration tests validate new HTML attribute

---

#### **CHANGE 8: API Prediction Route Tests**

**File**: `src/routes/predict.test.ts`

**Changes Required**:
- **Line 358**: Update valid request to use `'2026-11-19'`
- **Line 430**: Update "before MIN_DATE" test to use `'2026-11-18'`
- **Line 1804**: Update update request to use `'2026-11-19'`

**Impact**: API endpoint tests validate server-side enforcement

---

#### **CHANGE 9: Statistics Route Tests**

**File**: `src/routes/stats.test.ts`

**Changes Required**:
- **Line 113**: Update mock min date to `'2026-11-19'`

**Impact**: Stats API tests reflect realistic date range

---

### Summary of Changes by Category

| Category | Files | Lines Changed | Complexity |
|----------|-------|---------------|------------|
| **Frontend** | 1 | 1 | Trivial |
| **Backend Validation** | 2 | 8 | Simple |
| **Documentation** | 1 | 4 | Simple |
| **Unit Tests** | 2 | 12 | Simple |
| **Integration Tests** | 3 | 8 | Simple |
| **TOTAL** | **9 files** | **~33 lines** | **LOW** |

---

## Section 5: Implementation Handoff

### Change Scope Classification

**Scope**: ✅ **Minor** - Direct implementation by development team

### Deliverables

1. ✅ **Code Changes**: 9 files updated per Section 4 specifications
2. ✅ **Test Updates**: All 5 test files updated with new boundary values
3. ✅ **Documentation**: Epic 2 Story 2.3 updated to reflect new minimum
4. ✅ **This Sprint Change Proposal**: Complete analysis and change specifications

### Handoff Plan

**Route to**: 🔧 **Development Team** (direct implementation)

**Responsibilities**:
1. Apply all 9 file changes as specified in Section 4
2. Run full test suite to verify all tests pass
3. Manual verification:
   - Frontend: Confirm date picker blocks dates before 2026-11-19
   - Backend: Submit API request with `2026-11-18` → verify 400 error
   - Backend: Submit API request with `2026-11-19` → verify 200/201 success
4. Commit changes with message:
   ```
   fix: Update date picker minimum to official launch date (2026-11-19)

   - Users can now only select dates on or after the official GTA 6 launch date
   - Updated frontend HTML min attribute
   - Updated backend MIN_DATE constants in validation files
   - Updated 5 test files with new boundary assertions
   - Updated Epic 2 Story 2.3 documentation

   Rationale: Predictions before the official launch date are illogical

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

### Success Criteria

**Implementation Complete When**:
- ✅ All 9 files updated as specified
- ✅ All test suites pass (unit + integration)
- ✅ Manual verification completed (frontend + backend)
- ✅ Changes committed to repository
- ✅ (Optional) Deployed to dev environment for smoke testing

**Validation Checklist**:
- [ ] Frontend date picker blocks selection of 2026-11-18
- [ ] Frontend date picker allows selection of 2026-11-19
- [ ] Backend API rejects `predicted_date: "2026-11-18"` with 400 error
- [ ] Backend API accepts `predicted_date: "2026-11-19"` with 200/201
- [ ] Error message mentions "2026-11-19" as minimum date
- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test`)
- [ ] Epic 2 documentation reflects new minimum date

### Timeline

- **Implementation**: 30-45 minutes
- **Testing**: 15 minutes
- **Total**: **< 1 hour**
- **Recommended Completion**: Immediate (no blockers)

### Next Steps After Implementation

1. ✅ **No additional stories needed** - This is a complete fix
2. ✅ **No PRD changes required** - FR2 clarification documented here
3. ✅ **No architecture updates needed** - Logic already existed
4. ⚠️ **Optional**: Deploy to production to prevent future invalid predictions

---

## Section 6: Appendix

### Affected Requirements

**FR2 (Date Range Validation)**:
- **Current**: "Users can predict any date from 2025 to 2125"
- **Clarified**: "Users can predict any date from **November 19, 2026** (official launch date) to 2125"

### Related Stories

- **Story 2.3**: Date Picker with Validation (PRIMARY)
- **Story 2.4**: Input Validation and XSS Prevention (SECONDARY)
- **Story 2.7**: Prediction Submission API Endpoint (validates via Story 2.4)
- **Story 2.8**: Prediction Update API Endpoint (validates via Story 2.4)

### Architecture References

- **Architecture Section**: Date Handling (ADR-010: day.js)
- **Architecture Section**: Input Validation (NFR-S4, NFR-S5)
- **Database Schema**: No changes required

### Testing Strategy

**Test Coverage**:
- ✅ Unit tests: Boundary validation (new min date)
- ✅ Integration tests: HTML attribute, API endpoints
- ✅ Manual tests: Frontend date picker, backend API

**Test Data**:
- **Valid min boundary**: 2026-11-19 ✅
- **Invalid (before min)**: 2026-11-18 ❌
- **Valid (after min)**: 2027-01-01 ✅
- **Valid max boundary**: 2125-12-31 ✅

### References

- **PRD**: FR2 (Date Range Validation)
- **Architecture**: ADR-010 (day.js), Validation Section
- **Epic 2**: Story 2.3 (Date Picker with Validation)
- **Tech Spec**: Epic 2 Technical Specification

---

**🎯 Implementation Status**: ✅ **APPROVED - Ready for Immediate Implementation**

**Approval**: yojahny (2025-11-28)

---

*Generated by BMad Correct Course Workflow*
*Date: 2025-11-28*
*Project: GTA 6 Launch Date Prediction Tracker*
