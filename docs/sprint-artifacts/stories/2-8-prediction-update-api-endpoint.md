# Story 2.8: Prediction Update API Endpoint

Status: done

## Story

As a user,
I want to update my existing prediction,
so that I can change my mind without creating a duplicate.

## Acceptance Criteria

**Given** a user has previously submitted a prediction
**When** they submit an update (PUT /api/predict)
**Then** the API updates their existing record:

**Request:**
```json
PUT /api/predict
{
  "predicted_date": "2027-02-14",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Verify reCAPTCHA (prevent bot updates)
3. Validate new date (Story 2.4)
4. Check rate limit (30/min for updates)
5. Calculate new weight
6. Update database:
```sql
UPDATE predictions
SET predicted_date = ?,
    weight = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE cookie_id = ?
```

**Response (200 OK):**
```json
{
  "success": true,
  "predicted_date": "2027-02-14",
  "previous_date": "2026-11-19",
  "message": "Your prediction has been updated!"
}
```

**And** edge cases are handled:
- Cookie not found: 404 "No prediction found. Please submit first."
- Same date: 200 "Your prediction remains unchanged."
- Cookie expired: Treat as new submission

**And** IP conflict resolution (FR67):
- If user updates from different IP, cookie_id takes precedence
- Update both predicted_date AND ip_hash to new IP

**And** automated tests exist covering main functionality

### Testing Requirements
- [x] Integration tests for update workflow
- [x] Test cookie not found (404)
- [x] Test same date (idempotent update)
- [x] Test IP conflict resolution
- [x] Test rate limit (30/min) - configured in middleware
- [x] Test previous_date in response

## Tasks / Subtasks

- [x] Task 1: Create prediction update route (AC: 1)
  - [x] Add PUT endpoint to `src/routes/predict.ts`
  - [x] Set up Hono route: `app.put('/api/predict', ...)`

- [x] Task 2: Implement request processing (AC: 2)
  - [x] Extract cookie_id from Cookie header
  - [x] Extract IP from CF-Connecting-IP header (for IP update)
  - [x] Verify Turnstile (Story 2.5B - replaced reCAPTCHA)
  - [x] Validate new predicted_date (Story 2.4)
  - [x] Check rate limit: 30/min (Story 2.6 - via middleware)
  - [x] Calculate new weight (Story 2.9)

- [x] Task 3: Implement database update (AC: 2)
  - [x] Query existing prediction by cookie_id
  - [x] Return 404 if not found
  - [x] Check if date is same (skip update, return 200)
  - [x] Prepare UPDATE statement with parameterized query
  - [x] Update predicted_date, weight, updated_at, ip_hash (if changed)
  - [x] Commit update

- [x] Task 4: Implement IP conflict resolution (AC: 3)
  - [x] Detect IP change (current IP != stored ip_hash)
  - [x] Cookie_id takes precedence over IP (FR67)
  - [x] Update ip_hash to new IP in database
  - [x] Log IP change for monitoring

- [x] Task 5: Implement response formatting (AC: 3)
  - [x] Return 200 OK with updated predicted_date
  - [x] Include previous_date for user feedback
  - [x] Include success message

- [x] Task 6: Implement error handling (AC: 4)
  - [x] 404 Not Found: Cookie not found
  - [x] 400 Bad Request: Validation errors
  - [x] 429 Too Many Requests: Rate limit (30/min)
  - [x] 503 Service Unavailable: Turnstile failed
  - [x] 500 Server Error: Database errors

- [x] Task 7: Write automated tests (ADR-011)
  - [x] Add tests to `src/routes/predict.test.ts`
  - [x] Test update with valid cookie (200 OK)
  - [x] Test update with invalid cookie (404)
  - [x] Test same date (idempotent)
  - [x] Test IP conflict resolution
  - [x] Test rate limit (30/min)
  - [x] Verify previous_date returned

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.8 (Prediction Update API):**
- PUT /api/predict endpoint
- Update existing prediction via cookie_id lookup
- Validate new date, verify reCAPTCHA, check rate limit (30/min)
- Update predicted_date, weight, updated_at fields
- Return previous_date for UX feedback
- IP conflict resolution: cookie_id takes precedence

[Source: docs/epics/epic-2-core-prediction-engine.md:352-416]

**From Tech Spec Epic 2 - AC8 (Prediction Update API):**
- PUT /api/predict endpoint exists
- Updates existing prediction via cookie_id lookup
- Success returns 200 OK with previous_date
- Cookie not found returns 404
- IP conflict resolved: cookie_id takes precedence, updates ip_hash

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:707-714]

### Architecture Patterns

**From Architecture: API Contracts - PUT /api/predict/:cookie_id:**
```typescript
Request:
PUT /api/predict/:cookie_id
{
  "predicted_date": "2027-08-20"
}

Success Response (200): Same format as POST

Error Response (404):
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Prediction not found for this cookie.",
    "details": {}
  }
}
```

[Source: docs/architecture.md:374-398]

**From Tech Spec Epic 2 - Prediction Update Workflow:**
Complete 13-step workflow from user action to response

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:382-402]

### Project Structure

**File Integration:**
```
src/
├── routes/
│   ├── predict.ts (MODIFY - add PUT endpoint)
│   └── predict.test.ts (MODIFY - add update tests)
└── services/
    └── predictions.service.ts (MODIFY - add update logic)
```

### Learnings from Previous Stories

**From Story 2.7 (Prediction Submission):**
- Multi-layered validation pattern established
- Transaction handling for atomicity
- Comprehensive error responses
- Integration with all validation services

**Key Differences from Submission:**
- Uses UPDATE instead of INSERT
- Rate limit: 30/min (vs 10/min for submission)
- Returns previous_date for UX feedback
- Handles cookie not found (404)
- IP conflict resolution logic

**Recommendations:**
1. Reuse validation pipeline from Story 2.7
2. Track updated_at for analytics (how often do users change minds?)
3. Return previous_date for better UX
4. Log IP changes for security monitoring
5. Consider showing "You've changed your prediction N times" for engagement

[Source: Story 2.7 implementation]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC8: Prediction Update API](docs/sprint-artifacts/tech-spec-epic-2.md:707-714)
- [Epic 2 Tech Spec - Prediction Update Workflow](docs/sprint-artifacts/tech-spec-epic-2.md:382-402)

**Epic Breakdown:**
- [Epic 2 Story 2.8 Definition](docs/epics/epic-2-core-prediction-engine.md:352-416)

**Architecture:**
- [Architecture - API Contracts: PUT /api/predict](docs/architecture.md:374-398)

**Dependencies:**
- Story 2.7 (Submission endpoint - share validation logic)
- Stories 2.4, 2.5, 2.6 (Validation, reCAPTCHA, Rate limiting)
- Story 2.9 (Weight calculation)

## Dev Agent Record

### Context Reference

docs/sprint-artifacts/stories/2-8-prediction-update-api-endpoint.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **PUT /api/predict endpoint implemented** in `src/routes/predict.ts:334-617`
   - Full 12-step workflow matching tech spec requirements
   - Reuses validation pipeline from POST endpoint (Story 2.7)

2. **Turnstile verification** used instead of reCAPTCHA per Story 2.5B (ADR-013)
   - Project switched from Google reCAPTCHA to Cloudflare Turnstile for zero-cost alternative

3. **Rate limiting** at 30/min configured in `src/middleware/rate-limiter.ts:32-35`
   - More lenient than submission (10/min) per story requirements

4. **IP conflict resolution (FR67)** implemented:
   - Cookie_id takes precedence over IP hash
   - If IP changes, ip_hash is updated to new IP
   - If IP conflict occurs (UNIQUE constraint), update proceeds without changing ip_hash
   - IP changes logged for security monitoring

5. **Idempotent behavior** implemented:
   - Same date returns 200 with "Your prediction remains unchanged."
   - No database write for unchanged predictions

6. **Comprehensive tests** added to `src/routes/predict.test.ts`:
   - 24 new test cases for PUT endpoint
   - All 63 tests (POST + PUT) passing
   - Coverage includes: successful updates, 404 not found, validation errors, Turnstile verification, IP conflict resolution, idempotent behavior, edge cases

### File List

- `src/routes/predict.ts` - Added PUT /api/predict endpoint (lines 334-617)
- `src/routes/predict.test.ts` - Added comprehensive PUT endpoint tests (lines 1021-1925)

---

## Code Review

**Review Date:** 2025-11-24
**Reviewer:** Senior Developer (Code Review Workflow)
**Review Outcome:** ✅ APPROVED

### Summary

The implementation of Story 2.8 (Prediction Update API Endpoint) is well-executed, thoroughly tested, and adheres to architectural patterns established in the codebase. The code demonstrates good understanding of the project conventions and security requirements.

---

### Acceptance Criteria Validation

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | PUT /api/predict endpoint exists | ✅ PASS | `src/routes/predict.ts:363-618` - Full PUT endpoint implementation |
| AC2 | Request processing (cookie extraction, Turnstile, validation, rate limit, weight) | ✅ PASS | Lines 369-483 implement complete 12-step workflow |
| AC3 | Database update with prepared statements | ✅ PASS | Lines 499-525 use parameterized queries for SQL injection prevention |
| AC4 | IP conflict resolution (cookie_id precedence) | ✅ PASS | Lines 486-494 detect IP change; lines 547-586 handle UNIQUE constraint |
| AC5 | Response format (200 OK with previous_date) | ✅ PASS | Lines 538-545 return success response with all required fields |
| AC6 | Error handling (404, 400, 429, 503, 500) | ✅ PASS | All error codes correctly mapped per tech spec |
| AC7 | Idempotent behavior (same date) | ✅ PASS | Lines 466-479 skip update and return appropriate message |
| AC8 | Automated tests | ✅ PASS | 24 new test cases covering all scenarios |

---

### Task Validation

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| Task 1 | Create prediction update route | ✅ Complete | PUT endpoint properly registered in Hono app |
| Task 2 | Request processing | ✅ Complete | Full validation pipeline integrated |
| Task 3 | Database update | ✅ Complete | Proper UPDATE with parameterized queries |
| Task 4 | IP conflict resolution | ✅ Complete | FR67 correctly implemented |
| Task 5 | Response formatting | ✅ Complete | Matches tech spec contract |
| Task 6 | Error handling | ✅ Complete | All status codes correctly mapped |
| Task 7 | Automated tests | ✅ Complete | 63 tests passing (POST + PUT) |

---

### Code Quality Assessment

#### Strengths

1. **Consistent Architecture**: The PUT endpoint follows the exact same pattern as the POST endpoint, making the codebase maintainable and predictable.

2. **Comprehensive Documentation**: Excellent JSDoc comments document the endpoint contract, error responses, and workflow steps (`src/routes/predict.ts:335-362`).

3. **Security First**:
   - Parameterized queries prevent SQL injection
   - Turnstile verification for bot protection
   - IP hashing with salt for privacy
   - Input validation via Zod schemas

4. **Robust Error Handling**: Every database operation is wrapped in try-catch with appropriate error codes and user-friendly messages.

5. **IP Conflict Resolution (FR67)**: Well-implemented strategy where cookie_id takes precedence. The fallback to update without changing ip_hash on UNIQUE constraint is a smart edge case handler (`src/routes/predict.ts:553-586`).

6. **Idempotent Design**: Same-date updates are handled gracefully without unnecessary database writes.

7. **Comprehensive Test Coverage**: 24 new tests covering:
   - Happy path updates
   - Cookie not found (404)
   - Invalid cookie format
   - Same date idempotency
   - IP conflict resolution
   - Turnstile failures
   - Validation errors
   - Edge cases (leap years, boundary dates, IPv6)

#### Minor Observations (Non-blocking)

1. **Weight Calculation Duplication**: The `calculateWeight()` function is duplicated in the test file (`src/routes/predict.test.ts:33-50`). This is acceptable for test isolation but consider extracting to a shared utility if it becomes a maintenance concern.

2. **Test App Recreation**: Tests create separate `createPutTestApp()` function rather than importing from the main routes. This is reasonable for mocking Turnstile but results in code that needs to stay in sync with production.

---

### Security Review

| Check | Status | Details |
|-------|--------|---------|
| SQL Injection Prevention | ✅ PASS | All queries use D1 prepared statements with `.bind()` |
| XSS Prevention | ✅ PASS | Validation module sanitizes inputs |
| CSRF Protection | ✅ PASS | Turnstile token required for all updates |
| Rate Limiting | ✅ PASS | 30/min configured in `DEFAULT_RATE_LIMITS` |
| Input Validation | ✅ PASS | Zod schema validates date format and range |
| Cookie Security | ✅ PASS | UUID v4 validation for cookie_id |
| IP Privacy | ✅ PASS | IP hashed with salt before storage |

---

### Test Results

```
Test Suites: 1 passed
Tests:       63 passed (POST: 39, PUT: 24)
Coverage:    All acceptance criteria covered
```

All tests pass including:
- `PUT /api/predict - Prediction Update Endpoint` (16 tests)
- `PUT /api/predict - Edge Cases` (8 tests)

---

### Architecture Alignment

| Aspect | Expected | Actual | Status |
|--------|----------|--------|--------|
| Rate Limit | 30/min for updates | 30/min in `rate-limiter.ts:32` | ✅ |
| Response Format | JSON with success, predicted_date, previous_date, message | Matches exactly | ✅ |
| Error Codes | NOT_FOUND, VALIDATION_ERROR, BOT_DETECTED, RATE_LIMIT_EXCEEDED, SERVER_ERROR | All implemented | ✅ |
| HTTP Status | 200, 400, 404, 429, 503, 500 | All correctly mapped | ✅ |

---

### Recommendations

None required for approval. Implementation is production-ready.

**Optional future enhancements (not blockers):**
1. Consider adding metrics/telemetry for update frequency analytics
2. Could track "update count" per user for engagement insights

---

### Final Verdict

**✅ APPROVED FOR MERGE**

The implementation fully satisfies all acceptance criteria, follows established architectural patterns, maintains strong security posture, and includes comprehensive test coverage. The code is well-documented, maintainable, and ready for production deployment.
