# Story 2.8: Prediction Update API Endpoint

Status: ready-for-dev

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
- [ ] Integration tests for update workflow
- [ ] Test cookie not found (404)
- [ ] Test same date (idempotent update)
- [ ] Test IP conflict resolution
- [ ] Test rate limit (30/min)
- [ ] Test previous_date in response

## Tasks / Subtasks

- [ ] Task 1: Create prediction update route (AC: 1)
  - [ ] Add PUT endpoint to `src/routes/predict.ts`
  - [ ] Set up Hono route: `app.put('/api/predict', ...)`

- [ ] Task 2: Implement request processing (AC: 2)
  - [ ] Extract cookie_id from Cookie header
  - [ ] Extract IP from CF-Connecting-IP header (for IP update)
  - [ ] Verify reCAPTCHA (Story 2.5)
  - [ ] Validate new predicted_date (Story 2.4)
  - [ ] Check rate limit: 30/min (Story 2.6)
  - [ ] Calculate new weight (Story 2.9)

- [ ] Task 3: Implement database update (AC: 2)
  - [ ] Query existing prediction by cookie_id
  - [ ] Return 404 if not found
  - [ ] Check if date is same (skip update, return 200)
  - [ ] Prepare UPDATE statement with parameterized query
  - [ ] Update predicted_date, weight, updated_at, ip_hash (if changed)
  - [ ] Commit update

- [ ] Task 4: Implement IP conflict resolution (AC: 3)
  - [ ] Detect IP change (current IP != stored ip_hash)
  - [ ] Cookie_id takes precedence over IP (FR67)
  - [ ] Update ip_hash to new IP in database
  - [ ] Log IP change for monitoring

- [ ] Task 5: Implement response formatting (AC: 3)
  - [ ] Return 200 OK with updated predicted_date
  - [ ] Include previous_date for user feedback
  - [ ] Include success message

- [ ] Task 6: Implement error handling (AC: 4)
  - [ ] 404 Not Found: Cookie not found
  - [ ] 400 Bad Request: Validation errors
  - [ ] 429 Too Many Requests: Rate limit (30/min)
  - [ ] 503 Service Unavailable: reCAPTCHA failed
  - [ ] 500 Server Error: Database errors

- [ ] Task 7: Write automated tests (ADR-011)
  - [ ] Add tests to `src/routes/predict.test.ts`
  - [ ] Test update with valid cookie (200 OK)
  - [ ] Test update with invalid cookie (404)
  - [ ] Test same date (idempotent)
  - [ ] Test IP conflict resolution
  - [ ] Test rate limit (30/min)
  - [ ] Verify previous_date returned

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

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
