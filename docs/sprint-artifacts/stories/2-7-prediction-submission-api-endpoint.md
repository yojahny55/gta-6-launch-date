# Story 2.7: Prediction Submission API Endpoint

Status: review

## Story

As a user,
I want to submit my prediction via API,
so that it's stored in the database and counted toward the community median.

## Acceptance Criteria

**Given** a user has selected a date and passed validation
**When** they submit the form (POST /api/predict)
**Then** the API processes the submission:

**Request:**
```json
POST /api/predict
{
  "predicted_date": "2026-11-19",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Extract IP address and hash it (Story 2.2)
3. Validate inputs (Story 2.4)
4. Verify reCAPTCHA (Story 2.5)
5. Check rate limit (Story 2.6)
6. Calculate weight based on date (Story 2.9)
7. Begin database transaction (Story 1.4)
8. Check IP constraint (UNIQUE ip_hash)
9. Insert prediction record
10. Commit transaction

**Response (201 Created):**
```json
{
  "success": true,
  "prediction_id": 1234,
  "predicted_date": "2026-11-19",
  "message": "Your prediction has been recorded!"
}
```

**And** constraint violations are handled:
- IP already exists: 409 Conflict "You've already submitted a prediction. Use update instead."
- Cookie_id collision: Regenerate and retry

**And** timezone conversion:
- Client sends date in local timezone
- Server converts to UTC for storage (FR73)
- Store as ISO 8601: "2026-11-19T00:00:00Z"

**And** automated tests exist covering main functionality

### Testing Requirements
- [x] Integration tests for full submission workflow
- [x] Test IP UNIQUE constraint (409 Conflict)
- [x] Test all validation layers (input, reCAPTCHA, rate limit)
- [x] Test weight calculation integration
- [x] Test database transaction rollback on errors
- [x] Test 201 Created response format

## Tasks / Subtasks

- [x] Task 1: Create prediction submission route (AC: 1)
  - [x] Create `src/routes/predict.ts` for POST endpoint
  - [x] Set up Hono route: `app.post('/api/predict', ...)`
  - [x] Export route for integration in main app

- [x] Task 2: Implement request processing pipeline (AC: 2)
  - [x] Extract cookie_id from Cookie header
  - [x] Extract IP from CF-Connecting-IP header
  - [x] Hash IP using hashIP() from Story 2.2
  - [x] Parse and validate request body
  - [x] Call validation service from Story 2.4
  - [x] Call Turnstile verification from Story 2.5B (replaces reCAPTCHA)
  - [x] Check rate limit using middleware from Story 2.6

- [x] Task 3: Implement weight calculation (AC: 2)
  - [x] Implement calculateWeight() function (Story 2.9 not yet completed, so implemented locally)
  - [x] Calculate weight based on predicted_date
  - [x] Store weight with prediction record

- [x] Task 4: Implement database insertion (AC: 2)
  - [x] Prepare INSERT statement with parameterized query
  - [x] Handle UNIQUE ip_hash constraint violation (409)
  - [x] Handle cookie_id collision (regenerate, retry once)
  - [x] Commit on success

- [x] Task 5: Implement response formatting (AC: 3)
  - [x] Return 201 Created with prediction_id
  - [x] Include predicted_date in response
  - [x] Include success message
  - [x] Use standard response format

- [x] Task 6: Implement error handling (AC: 4)
  - [x] 400 Bad Request: Validation errors
  - [x] 409 Conflict: IP already submitted
  - [x] 429 Too Many Requests: Rate limit exceeded
  - [x] 503 Service Unavailable: Turnstile failed
  - [x] 500 Server Error: Database errors
  - [x] Include user-friendly error messages

- [x] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [x] Create `src/routes/predict.test.ts`
  - [x] Test full submission workflow (happy path)
  - [x] Test IP duplicate (409 Conflict)
  - [x] Test validation failures (400)
  - [x] Test Turnstile failures (503)
  - [x] Test rate limit (429)
  - [x] Test database errors (rollback)
  - [x] Verify test coverage: 36 tests passing

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.7 (Prediction Submission API Endpoint):**
- POST /api/predict endpoint
- Multi-layered validation: inputs, reCAPTCHA, rate limit
- IP hashing and UNIQUE constraint check
- Weight calculation based on date reasonableness
- Database transaction for atomicity
- Return 201 Created with prediction_id
- Handle constraint violations: IP duplicate (409), cookie collision

[Source: docs/epics/epic-2-core-prediction-engine.md:287-350]

**From Tech Spec Epic 2 - AC7 (Prediction Submission API):**
- POST /api/predict endpoint exists
- Server validates inputs, verifies reCAPTCHA, checks rate limit
- IP hashed and checked against UNIQUE constraint
- Weight calculated based on date reasonableness
- Database transaction ensures atomicity
- Success returns 201 Created with prediction_id

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:694-705]

### Architecture Patterns

**From Architecture: API Contracts - POST /api/predict:**
```typescript
Request:
POST /api/predict
{
  "predicted_date": "2027-06-15"
}

Success Response (200):
{
  "success": true,
  "data": {
    "prediction": { "cookie_id": "abc123...", "predicted_date": "2027-06-15", "submitted_at": "2025-11-13T10:30:00Z" },
    "stats": { "median": "2027-03-15", "min": "2025-12-01", "max": "2099-01-01", "total": 10234 },
    "delta_days": 92,
    "comparison": "optimistic"
  }
}
```

[Source: docs/architecture.md:318-372]

**From Tech Spec Epic 2 - Prediction Submission Workflow:**
Complete 19-step workflow from user action to response

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:340-380]

### Project Structure

**File Structure:**
```
src/
├── routes/
│   ├── predict.ts (NEW - POST /api/predict endpoint)
│   ├── predict.test.ts (NEW - test suite)
│   └── stats.ts (future - GET /api/stats)
├── services/
│   └── predictions.service.ts (NEW - business logic)
└── index.ts (MODIFY - register predict route)
```

### Learnings from Previous Stories

**Integration Points:**
- Story 2.1: Cookie ID extraction and validation
- Story 2.2: IP hashing utility
- Story 2.4: Input validation service
- Story 2.5: reCAPTCHA verification
- Story 2.6: Rate limiting middleware
- Story 2.9: Weight calculation function
- Story 1.4: Database transactions

**Recommendations:**
1. Follow RESTful conventions: 201 Created for resource creation
2. Use transactions for atomicity (Story 1.4 pattern)
3. Comprehensive error handling for all failure modes
4. Test all integration points thoroughly
5. Log all submissions for debugging and analytics

[Source: Previous story implementations]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC7: Prediction Submission API](docs/sprint-artifacts/tech-spec-epic-2.md:694-705)
- [Epic 2 Tech Spec - Prediction Submission Workflow](docs/sprint-artifacts/tech-spec-epic-2.md:340-380)

**Epic Breakdown:**
- [Epic 2 Story 2.7 Definition](docs/epics/epic-2-core-prediction-engine.md:287-350)

**Architecture:**
- [Architecture - API Contracts: POST /api/predict](docs/architecture.md:318-372)

**Dependencies:**
- Stories 2.1, 2.2, 2.4, 2.5, 2.6 (all prerequisite functionality)
- Story 1.4 (Database transactions)
- Story 2.9 (Weight calculation)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2025-11-24: Implemented POST /api/predict endpoint with full multi-layered validation pipeline
- Integration with existing utilities: cookie.ts (Story 2.1), ip-hash.ts (Story 2.2), validation.ts (Story 2.4), turnstile.ts (Story 2.5B), rate-limiter.ts (Story 2.6)
- Weight calculation implemented locally as Story 2.9 not yet complete (reasonable window: 2026-2028 = weight 1.0)
- Comprehensive test suite with 36 passing tests covering all acceptance criteria

### Completion Notes List

1. **Implementation Complete**: Full POST /api/predict endpoint with multi-layered validation:
   - Cookie ID extraction/validation with auto-generation for new users
   - IP hashing using SHA-256 with salt for privacy-preserving anti-spam
   - Input validation via Zod schemas (date range: 2025-01-01 to 2125-12-31)
   - Turnstile bot protection (replaced reCAPTCHA per ADR-013)
   - Rate limiting via middleware (10 requests/minute per IP)
   - Weight calculation based on date reasonableness

2. **Error Handling**: All error scenarios covered:
   - 400 Bad Request: Invalid date format, missing fields, out-of-range dates
   - 409 Conflict: Duplicate IP submission (UNIQUE constraint)
   - 429 Too Many Requests: Rate limit exceeded (via middleware)
   - 503 Service Unavailable: Turnstile verification failed
   - 500 Server Error: Database errors, unexpected failures

3. **Database Integration**:
   - Parameterized queries to prevent SQL injection
   - UNIQUE constraint enforcement on ip_hash
   - Cookie collision handling with automatic regeneration and retry

4. **Testing**: 36 comprehensive tests covering:
   - Successful submission (201 Created with prediction_id)
   - Input validation (all edge cases)
   - IP constraint enforcement (409 Conflict)
   - Turnstile verification (503 on failure)
   - Cookie handling (generation, validation)
   - Weight calculation (boundary values)
   - Response format validation

### File List

**Created:**
- src/routes/predict.ts - POST /api/predict endpoint implementation
- src/routes/predict.test.ts - Comprehensive test suite (36 tests)

**Modified:**
- src/index.ts - Registered predict route with main app

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-24 | Initial implementation of prediction submission API | Claude Opus 4.5 |
