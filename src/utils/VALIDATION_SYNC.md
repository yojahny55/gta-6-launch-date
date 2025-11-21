# Date Validation Logic Synchronization

## Overview

Date validation logic is implemented in **two locations** for defense-in-depth security:

1. **Frontend:** `public/app.js` (client-side validation)
2. **Backend:** `src/utils/date-validation.ts` (server-side validation)

**CRITICAL:** These two implementations must remain synchronized to ensure consistent user experience and security.

## Why Duplicate Validation?

- **Client-side (Frontend):** Provides immediate user feedback without server round-trip
- **Server-side (Backend):** Prevents malicious clients from bypassing validation (security requirement)

**Never trust client-side validation alone** - attackers can bypass it with browser dev tools or API calls.

## Validation Constants

These constants must have **identical values** in both files:

| Constant | Value | File Locations |
|----------|-------|----------------|
| `MIN_DATE` | `'2025-01-01'` | `public/app.js:161`<br>`src/utils/date-validation.ts:24` |
| `MAX_DATE` | `'2125-12-31'` | `public/app.js:162`<br>`src/utils/date-validation.ts:30` |
| `DATE_REGEX` | `/^(\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/` | `public/app.js:163-164`<br>`src/utils/date-validation.ts:37-38` |

## Validation Functions

The following functions must maintain **identical logic** (though syntax may differ due to TypeScript vs JavaScript):

### 1. `isValidDateFormat(date: string): boolean`

**Purpose:** Validate ISO 8601 format (YYYY-MM-DD)

**Frontend:** `public/app.js:167-173`
**Backend:** `src/utils/date-validation.ts:58-63`

**Logic:**
- Check if input is a non-empty string
- Match against `DATE_REGEX` pattern
- Return `true` if valid, `false` otherwise

---

### 2. `validateDateRange(dateString: string): boolean`

**Purpose:** Check if date is within allowed range (2025-01-01 to 2125-12-31)

**Frontend:** `public/app.js:179-184`
**Backend:** `src/utils/date-validation.ts:133-139`

**Logic:**
- Parse date string to `Date` object
- Compare against `MIN_DATE` and `MAX_DATE` boundaries
- Return `true` if within range, `false` otherwise

---

### 3. `validateDate(dateString: string): { valid: boolean; error?: string }`

**Purpose:** Comprehensive validation combining all checks with user-friendly error messages

**Frontend:** `public/app.js:191-214`
**Backend:** `src/utils/date-validation.ts:183-213`

**Logic Sequence:**
1. **Format Check:** Call `isValidDateFormat()`
   - If invalid: Return `{ valid: false, error: 'Please enter a valid date' }`

2. **Range Check:** Compare against `MIN_DATE` and `MAX_DATE`
   - If before min: Return `{ valid: false, error: "GTA 6 can't launch in the past!" }`
   - If after max: Return `{ valid: false, error: 'Please select a date between Jan 1, 2025 and Dec 31, 2125' }`

3. **Success:** Return `{ valid: true }`

**CRITICAL:** Error messages must be **identical** between frontend and backend for consistent UX.

---

## Error Messages

These user-facing error messages must be **exactly the same** in both files:

| Scenario | Error Message |
|----------|--------------|
| Invalid format | `"Please enter a valid date"` |
| Before minimum (past) | `"GTA 6 can't launch in the past!"` |
| After maximum | `"Please select a date between Jan 1, 2025 and Dec 31, 2125"` |

## Maintenance Checklist

When updating date validation logic, **always** update both files:

- [ ] Update constants (`MIN_DATE`, `MAX_DATE`, `DATE_REGEX`) in both files
- [ ] Update validation function logic in both files
- [ ] Update error messages to match exactly
- [ ] Run tests: `npm run test:unit` (frontend validation)
- [ ] Run tests: `npm run test:workers` (backend validation)
- [ ] Verify integration tests pass: `npm run test`
- [ ] Update this documentation if logic changes

## Testing Requirements

### Backend Tests

**File:** `src/utils/date-validation.test.ts`

**Coverage:** 74 comprehensive tests covering:
- Format validation (20 tests)
- Calendar validation (16 tests)
- Leap year logic (8 tests)
- Range validation (8 tests)
- UTC conversion (6 tests)
- Comprehensive validation (16 tests)

**Run:** `npm run test:workers`

### Frontend Integration Tests

**File:** `tests/date-picker-integration.test.ts`

**Coverage:** Integration tests covering:
- Form validation and submission workflow
- Error message display
- Keyboard accessibility
- HTML5 input attributes
- Cookie initialization

**Run:** `npm run test:unit`

## Why Not Share Code?

**Q:** Why not import the backend validation module into the frontend?

**A:** Several reasons:
1. **Different environments:** Backend runs in Cloudflare Workers (TypeScript), frontend runs in browser (JavaScript)
2. **Dependencies:** Backend uses day.js for UTC conversion (not needed in frontend)
3. **Bundle size:** Avoiding unnecessary dependencies in frontend
4. **Clear separation:** Client and server concerns are distinct

**Trade-off:** We accept code duplication in exchange for:
- Simpler build process
- Smaller frontend bundle
- Clear environment separation
- Independent testing

## Future Improvements

Potential approaches to reduce duplication (not currently implemented):

1. **Shared Constants:** Extract constants to a JSON file imported by both
2. **Code Generation:** Generate frontend validation from backend TypeScript
3. **Unified Module:** Create a zero-dependency validation module used by both

**Decision:** Current approach is acceptable for this project's scale. Revisit if validation logic becomes significantly more complex.

## Related Documentation

- **Architecture:** `docs/architecture.md` (ADR-010: Date Handling, ADR-011: Testing)
- **Epic 2 Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-2.md` (AC3: Date Picker Validation)
- **Story 2.3:** `docs/sprint-artifacts/stories/2-3-date-picker-with-validation.md`
- **PRD:** `docs/prd.md` (FR2: Date Range Validation, FR73: UTC Storage)

---

**Last Updated:** 2025-11-20
**Story:** 2.3 - Date Picker with Validation
**Addresses:** Senior Developer Review - LOW Issue #4
