# Story 3.6: Race Condition Prevention for Concurrent Submissions

Status: drafted

## Story

As a system,
I want to prevent race conditions when multiple submissions arrive simultaneously,
so that database integrity is maintained.

## Acceptance Criteria

**Given** two submissions arrive for the same IP address within milliseconds
**When** both attempt to insert into the database
**Then** transaction isolation prevents conflicts:

**Database Transaction Settings:**
- Isolation level: SERIALIZABLE or IMMEDIATE for D1
- Transaction scope: From IP check to INSERT
- Lock timeout: 5 seconds

**Race Condition Scenarios:**

**Scenario 1: Same IP, different cookies (network switching)**
- First transaction wins (inserts record)
- Second transaction fails on UNIQUE(ip_hash) constraint
- Second transaction returns 409 Conflict

**Scenario 2: Same cookie, duplicate submit (double-click)**
- Check if cookie_id already exists
- If exists: Treat as UPDATE instead of INSERT
- Return success with "updated" message

**Scenario 3: Database deadlock**
- Detect deadlock error
- Automatic retry (max 3 attempts, Story 1.4)
- Exponential backoff: 100ms, 200ms, 400ms
- If all retries fail: Return 503 Service Unavailable

**And** transaction logging:
- Log all constraint violations (IP or cookie)
- Monitor deadlock frequency
- Alert if deadlock rate > 1%

**And** frontend double-click prevention:
- Disable submit button immediately on click
- Re-enable only after response or timeout

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for transaction retry logic
- [ ] Integration tests for concurrent submission scenarios
- [ ] Test UNIQUE constraint enforcement
- [ ] Test double-click prevention
- [ ] Test deadlock detection and retry
- [ ] Test constraint violation logging

## Tasks / Subtasks

- [ ] Task 1: Implement frontend double-click prevention (AC: Double-click)
  - [ ] Disable submit button on click
  - [ ] Add loading state to button ("Submitting...")
  - [ ] Re-enable after response or 10s timeout
  - [ ] Prevent form re-submission while pending

- [ ] Task 2: Verify D1 transaction configuration (AC: Transaction Settings)
  - [ ] Confirm IMMEDIATE transaction mode in predict.ts
  - [ ] Verify transaction scope covers IP check → INSERT
  - [ ] Test lock behavior with concurrent requests
  - [ ] Document transaction boundaries

- [ ] Task 3: Implement cookie-first logic (AC: Scenario 2)
  - [ ] Check if cookie_id exists before INSERT
  - [ ] If exists: Route to UPDATE path instead of INSERT
  - [ ] Return appropriate success message ("updated")
  - [ ] Log the redirect for monitoring

- [ ] Task 4: Enhance constraint violation handling (AC: Scenario 1)
  - [ ] Catch UNIQUE constraint errors
  - [ ] Parse error to identify which constraint (ip_hash or cookie_id)
  - [ ] Return 409 Conflict with appropriate message
  - [ ] Log constraint violation details

- [ ] Task 5: Implement deadlock retry logic (AC: Scenario 3)
  - [ ] Detect SQLite BUSY or deadlock errors
  - [ ] Implement retry with exponential backoff
  - [ ] Max 3 attempts: 100ms, 200ms, 400ms
  - [ ] Return 503 if all retries fail

- [ ] Task 6: Add transaction monitoring (AC: Logging)
  - [ ] Log all constraint violations with details
  - [ ] Log deadlock occurrences
  - [ ] Calculate and log deadlock rate
  - [ ] Alert if rate exceeds 1%

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create tests in `src/routes/predict.test.ts`
  - [ ] Test UNIQUE ip_hash constraint enforcement
  - [ ] Test cookie_id exists → UPDATE path
  - [ ] Test deadlock retry behavior (mock)
  - [ ] Test double-click prevention (frontend)
  - [ ] Test 409 response for constraint violations
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.6 (Race Condition Prevention):**
- Transaction isolation: SERIALIZABLE or IMMEDIATE
- Transaction scope: IP check to INSERT
- Lock timeout: 5 seconds
- Same IP race: First wins, second gets 409
- Double-click: Treat as UPDATE
- Deadlock: Retry 3 times with backoff
- Log all constraint violations
- Alert if deadlock rate > 1%

[Source: docs/epics/epic-3-results-display-user-feedback.md:265-314]

**From Tech Spec Epic 3 - AC6 (Race Condition Prevention):**
- Database transactions with SERIALIZABLE isolation
- Lock timeout: 5 seconds
- Same IP simultaneous: First wins, second gets 409
- Double-click prevention: Button disabled on click
- Same cookie: Treated as UPDATE
- Deadlock retry (max 3 attempts, exponential backoff)
- All constraint violations logged

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC6]

### Architecture Patterns

**From Architecture - Database Transactions (Epic 1, Story 1.4):**
- D1/SQLite supports IMMEDIATE transactions
- UNIQUE constraints as last line of defense
- Retry logic for transient failures

[Source: docs/architecture.md:223-268]

**From Tech Spec - Race Condition Prevention Flow:**
```
SCENARIO: Same IP, two tabs submit simultaneously

Tab 1:
1. POST /api/predict
2. BEGIN IMMEDIATE transaction
3. Check ip_hash exists → No
4. INSERT prediction
5. COMMIT

Tab 2 (milliseconds later):
1. POST /api/predict
2. BEGIN IMMEDIATE transaction
3. WAIT (Tab 1 holds lock)
4. Tab 1 commits, Tab 2 proceeds
5. Check ip_hash exists → Yes (UNIQUE constraint)
6. ROLLBACK
7. Return 409 Conflict
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Workflows]

**D1 Transaction Pattern:**
```typescript
const result = await c.env.DB.batch([
  c.env.DB.prepare('...').bind(...),
  c.env.DB.prepare('INSERT...').bind(...)
]);
```

### Project Structure Notes

**File Structure:**
```
src/
├── routes/
│   ├── predict.ts          (MODIFY - enhance transaction handling)
│   └── predict.test.ts     (MODIFY - add race condition tests)
├── utils/
│   └── transaction.ts      (NEW - optional transaction helper)
public/
├── js/
│   └── submission.js       (MODIFY - add double-click prevention)
```

### Learnings from Previous Story

**From Story 1.4 (Database Transaction Support):**
- D1 supports batched transactions
- IMMEDIATE mode locks on BEGIN
- Transaction utilities already established

**From Story 2.7 (Prediction Submission API):**
- predict.ts handles POST /api/predict
- IP hash and cookie_id constraints in place
- 409 Conflict response already implemented

**Use Existing:**
- Transaction patterns from Story 1.4
- Constraint handling from Story 2.7
- Error response format established

[Source: Previous story implementations]

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC6: Race Condition Prevention](docs/sprint-artifacts/tech-spec-epic-3.md:AC6)
- [Epic 3 Tech Spec - Race Condition Flow](docs/sprint-artifacts/tech-spec-epic-3.md:Workflows)

**Epic Breakdown:**
- [Epic 3 Story 3.6 Definition](docs/epics/epic-3-results-display-user-feedback.md:265-314)

**Architecture:**
- [Architecture - Database Schema (UNIQUE constraints)](docs/architecture.md:223-268)
- [Architecture - Error Response Format](docs/architecture.md:605-618)

**Dependencies:**
- Story 1.4 (Database transaction support)
- Story 2.7 (Prediction submission API - base implementation)
- Story 3.5 (Error handling - 409/503 responses)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Change Log

| Date | Version | Author | Description |
|------|---------|--------|-------------|
| 2025-11-24 | 1.0 | SM Agent | Initial story draft |
