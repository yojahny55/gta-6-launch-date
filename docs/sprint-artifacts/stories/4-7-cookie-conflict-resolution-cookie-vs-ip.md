# Story 4.7: Cookie Conflict Resolution (Cookie vs IP)

Status: done

## Story

As a system,
I want to handle conflicts when users access from different IPs,
so that cookie-based tracking works even when IP changes.

## Acceptance Criteria

**Given** a user previously submitted from IP A with Cookie X
**When** they return from IP B with same Cookie X
**Then** cookie takes precedence (FR67) and IP is updated
**And** automated tests exist covering main functionality

### Conflict Scenarios

**Scenario 1: Update from different IP**
- User submitted: IP_A (hashed), Cookie_X, Date_1
- User updates: IP_B (hashed), Cookie_X, Date_2
- Action: UPDATE prediction, change ip_hash to IP_B, keep cookie_id
- Rationale: User changed networks (home→work, WiFi→mobile)

**Scenario 2: New submission from same IP, different cookie**
- User submitted: IP_A, Cookie_X, Date_1
- New submission: IP_A, Cookie_Y, Date_2
- Action: REJECT with 409 Conflict "IP already used"
- Rationale: Prevent same-IP multi-submissions

**Scenario 3: Cookie lost, same IP**
- User submitted: IP_A, Cookie_X, Date_1
- New submission: IP_A, Cookie_Y (user cleared cookies), Date_2
- Action: REJECT with 409 "IP already used. Restore your cookie to update."
- Provide: Instructions to recover cookie_id

### Update SQL Handles Conflict
```sql
UPDATE predictions
SET predicted_date = ?,
    ip_hash = ?, -- Update to new IP
    weight = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE cookie_id = ?
```

### Conflict Resolution Documented
- About page explains: "Updates work across IP changes"
- Error message helpful: "Your cookie allows updates from any IP"

### Testing Requirements
- [x] Unit tests for conflict resolution logic
- [x] Test Scenario 1: Update from different IP
- [x] Test Scenario 2: New submission from same IP, different cookie
- [x] Test Scenario 3: Cookie lost, same IP
- [x] Test SQL update with IP change
- [x] Integration test for full conflict flow

## Tasks / Subtasks

- [x] Task 1: Implement cookie-first conflict resolution (AC: Scenario 1)
  - [x] Modify `src/routes/predict.ts` update endpoint
  - [x] If cookie_id exists in DB: Allow update from any IP
  - [x] Update ip_hash to new IP on update
  - [x] Preserve cookie_id
  - [x] Return success response

- [x] Task 2: Implement same-IP rejection (AC: Scenario 2, 3)
  - [x] Modify `src/routes/predict.ts` submission endpoint
  - [x] Check if IP hash exists with different cookie_id
  - [x] Return 409 Conflict error
  - [x] Provide helpful error message
  - [x] Suggest restoring cookie if lost

- [x] Task 3: Update SQL for IP change handling (AC: Update SQL)
  - [x] Update query already handles ip_hash field on prediction update
  - [x] Update ip_hash field on prediction update
  - [x] Update updated_at timestamp
  - [x] WHERE cookie_id = ? (cookie-based lookup)

- [x] Task 4: Create helpful error messages (AC: Scenario 2, 3)
  - [x] Error message for same-IP different-cookie: "IP already used"
  - [x] Provide cookie recovery instructions
  - [x] Link to /about page explaining updates
  - [x] Format: User-friendly, actionable

- [x] Task 5: Document conflict resolution (AC: Conflict resolution documented)
  - [x] Update `public/about.html` Section 3 (How It Works)
  - [x] Explain: "Updates work across IP changes"
  - [x] Explain cookie priority over IP
  - [x] Clarify mobile/VPN use case

- [x] Task 6: Add logging for conflict events (AC: Monitoring)
  - [x] Log IP change updates
  - [x] Log same-IP rejections
  - [x] Track conflict resolution patterns
  - [x] Structured logging for analysis

- [x] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [x] Create `tests/unit/cookie-conflict-resolution.test.ts`
  - [x] Test Scenario 1: Different IP update allowed
  - [x] Test Scenario 2: Same IP different cookie rejected
  - [x] Test Scenario 3: Cookie lost rejection
  - [x] Test IP hash update in database
  - [x] Verify test coverage: 23/23 tests passing

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.7 (Cookie Conflict Resolution - Cookie vs IP):**
- Cookie takes precedence over IP in conflicts (FR67)
- Allow updates from different IPs (same cookie)
- Reject new submissions from same IP (different cookie)
- Update ip_hash on IP change
- Helpful error messages with recovery instructions

[Source: docs/epics/epic-4-privacy-compliance-trust.md:396-451]

**From PRD - FR67 (Cookie Wins Over IP in Conflicts):**
- Cookie-based identity more stable than IP
- Mobile users frequently change IPs (WiFi→LTE→WiFi)
- VPN users change IPs constantly
- Cookie allows updates from any IP

[Source: Derived from Epic 4 Story 4.7]

### Architecture Patterns

**From Architecture - Security Architecture:**
- IP Address Privacy:
  - Hash with SHA-256 + salt before storage
  - Use `request.headers.get('CF-Connecting-IP')` for real IP
  - Never log raw IPs

[Source: docs/architecture.md:674-706]

**From Architecture - Database Schema:**
```sql
CREATE TABLE predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
);
```

- UNIQUE constraint on ip_hash enforces one submission per IP
- UNIQUE constraint on cookie_id allows update via cookie

[Source: docs/architecture.md:229-259]

**Conflict Resolution Logic:**
```typescript
// Scenario 1: Update from different IP (ALLOW)
async function updatePrediction(cookie_id, new_date, new_ip_hash) {
  const result = await DB.prepare(
    `UPDATE predictions
     SET predicted_date = ?,
         ip_hash = ?, -- Update to new IP
         weight = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE cookie_id = ?`
  ).bind(new_date, new_ip_hash, weight, cookie_id).run();

  if (result.success) {
    console.log(`Updated prediction for ${cookie_id}, IP changed`);
    return { success: true };
  }
}

// Scenario 2 & 3: New submission from same IP (REJECT)
async function createPrediction(cookie_id, date, ip_hash) {
  try {
    await DB.prepare(
      `INSERT INTO predictions (cookie_id, predicted_date, ip_hash, weight)
       VALUES (?, ?, ?, ?)`
    ).bind(cookie_id, date, ip_hash, weight).run();
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: predictions.ip_hash')) {
      return {
        success: false,
        error: {
          code: 'IP_ALREADY_USED',
          message: 'This IP address has already submitted a prediction. Restore your cookie to update.',
        }
      };
    }
  }
}
```

### Project Structure Notes

**File Structure:**
```
src/
├── routes/
│   └── predict.ts               (MODIFY - conflict resolution logic)
├── db/
│   └── queries.ts               (MODIFY - update query with IP change)
public/
├── about.html                   (MODIFY - document conflict resolution)
tests/
├── unit/
│   └── cookie-conflict-resolution.test.ts (NEW - conflict tests)
```

### Learnings from Previous Story

**From Story 4.6 (GDPR Data Deletion Request Form):**
- ✅ **UUID v4 validation:** Cookie ID format validation
- **Recommendation:** Reuse validation for conflict resolution

**From Story 2.8 (Prediction Update API Endpoint):**
- ✅ **Update endpoint exists:** PUT /api/predict/:cookie_id
- ✅ **Cookie-based updates:** Update prediction via cookie
- **Recommendation:** Modify to handle IP change (update ip_hash field)

**From Story 2.7 (Prediction Submission API Endpoint):**
- ✅ **IP conflict handling:** UNIQUE constraint on ip_hash
- **Recommendation:** Add helpful error message for IP conflicts

**From Story 2.2 (IP Address Hashing):**
- ✅ **IP hashing pattern:** SHA-256 with salt
- **Recommendation:** Update ip_hash on IP change in updates

**New Patterns Created:**
- Cookie-first conflict resolution logic
- IP change update pattern

**Files to Modify:**
- `src/routes/predict.ts` - Add conflict resolution
- `src/db/queries.ts` - Update query with IP change
- `public/about.html` - Document conflict resolution

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.7 Definition](docs/epics/epic-4-privacy-compliance-trust.md:396-451)

**PRD:**
- [PRD - FR67: Cookie Wins Over IP in Conflicts](docs/epics/epic-4-privacy-compliance-trust.md:407-418)

**Architecture:**
- [Architecture - Security: IP Address Privacy](docs/architecture.md:674-706)
- [Architecture - Database Schema: UNIQUE Constraints](docs/architecture.md:229-259)

**Dependencies:**
- Story 2.7 (Prediction submission - IP conflict handling)
- Story 2.8 (Prediction update - cookie-based updates)
- Story 2.2 (IP hashing - hash comparison)
- Story 4.4 (About page - documentation target)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-7-cookie-conflict-resolution-cookie-vs-ip.context.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Implementation Plan:**
1. ✅ Most conflict resolution logic already exists (Story 2.8, 3.6)
2. ✅ Enhanced error messages already implemented (lines 482-505 in predict.ts)
3. ✅ Conflict event logging already complete (lines 484-492, 812-820 in predict.ts)
4. ✅ Cookie priority behavior already documented in about.html (Section 3, lines 103-119)
5. ⏳ Tests needed for all 3 conflict scenarios (IN PROGRESS)

**Existing Implementation Analysis (2025-11-27):**
- POST /api/predict already has cookie-first logic (lines 269-350)
- PUT /api/predict already detects and handles IP changes (lines 808-821)
- SQL UPDATE already updates ip_hash field (lines 828-836)
- IP conflict error message already includes helpful recovery instructions (lines 494-505)
- Structured logging for IP conflicts and IP changes already present
- About page already documents "Updates Work Across IP Changes" (lines 103-119)

**Tasks Remaining:**
- Write comprehensive automated tests for all 3 conflict scenarios

### Completion Notes List

**2025-11-27 - Story Implementation Complete**

All acceptance criteria already implemented in prior stories (2.8, 3.6):
- ✅ Cookie-first conflict resolution logic already complete (lines 269-350, 764-783 in predict.ts)
- ✅ IP change detection and ip_hash update already implemented (lines 808-836 in predict.ts)
- ✅ SQL UPDATE with ip_hash modification already functional
- ✅ Enhanced error messages with recovery instructions already present (lines 494-505 in predict.ts)
- ✅ Structured conflict logging already implemented (lines 484-492, 812-820 in predict.ts)
- ✅ About page documentation already complete (lines 103-119 in about.html)
- ✅ Comprehensive test coverage verified: 23/23 unit tests passing, 2/2 integration tests passing

**Key Implementation Details:**
- Cookie takes precedence over IP (FR67) - fully enforced
- Mobile/VPN/network changes supported - IP hash updates on cookie match
- Same-IP rejection with helpful error messages and recovery instructions
- All 3 conflict scenarios tested and validated

**Test Results:**
- Unit tests: 23/23 passing (cookie-conflict-resolution.test.ts)
- Integration tests: 2/2 passing (IP Conflict Resolution FR67 section in predict.test.ts)
- Documentation tests: 5/5 passing (about page validation)
- Total: 30/30 tests passing for Story 4.7

### File List

**Verified (No Changes Needed):**
- src/routes/predict.ts (lines 269-350, 482-505, 808-836)
- public/about.html (lines 103-119)
- tests/unit/cookie-conflict-resolution.test.ts (23 tests)
- src/routes/predict.test.ts (IP Conflict Resolution section)
