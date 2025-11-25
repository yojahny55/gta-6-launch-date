# Story 3.5: Error Handling with Retry Mechanisms

Status: drafted

## Story

As a user,
I want helpful error messages when something goes wrong,
so that I know what happened and can try again.

## Acceptance Criteria

**Given** an error occurs during submission or data loading
**When** the error is detected
**Then** user-friendly messages are displayed:

**Network Errors (FR60):**
- Message: "Unable to connect. Please check your internet and try again."
- Show retry button
- Auto-retry after 3 seconds (max 3 attempts)
- Timeout after 10 seconds total

**API Errors:**
- 400 Bad Request: Show specific validation error from API
- 409 Conflict (already submitted): "You've already submitted. Update your prediction instead."
- 429 Rate Limit: "Slow down! Please wait {seconds} seconds."
- 500 Server Error: "Something went wrong on our end. Please try again in a moment."

**Database Errors (FR59):**
- Generic message: "Unable to save your prediction. Please try again."
- Log detailed error server-side for debugging
- Don't expose internal error details to user

**Turnstile Errors:**
- Score too low: "Verification failed. Please try again." with retry button
- Network error: "Verification service unavailable. Please try again later."

**And** error UI design:
- Red/orange color scheme (attention)
- Clear actionable next step (retry button, wait time, etc.)
- Dismiss button to close error message
- Error doesn't lose user's input (date remains selected)

**And** fallback behaviors (FR60):
- If stats API fails: Show cached data or placeholder
- If submission fails: Save to localStorage for retry
- If Turnstile unavailable: Allow submission (fail-open)

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for error classification
- [ ] Unit tests for retry logic with exponential backoff
- [ ] Test all error code mappings (400, 409, 429, 500)
- [ ] Test auto-retry behavior
- [ ] Test input preservation on error
- [ ] Test fallback behaviors

## Tasks / Subtasks

- [ ] Task 1: Create error handling module (AC: All error types)
  - [ ] Create `public/js/errors.js` module
  - [ ] Implement `classifyError(error)` function
  - [ ] Map error types to user-friendly messages
  - [ ] Determine if error is retryable

- [ ] Task 2: Implement retry logic with backoff (AC: Network Errors)
  - [ ] Implement `fetchWithRetry(url, options, config)` function
  - [ ] Configure max attempts (3)
  - [ ] Implement exponential backoff (1s, 2s, 4s)
  - [ ] Add timeout handling (10 seconds total)
  - [ ] Return last error if all attempts fail

- [ ] Task 3: Create error UI component (AC: Error UI design)
  - [ ] Add error container to `public/index.html`
  - [ ] Style with red/orange colors (Tailwind)
  - [ ] Add dismiss button (X icon)
  - [ ] Add retry button for retryable errors
  - [ ] Ensure error overlay doesn't block form

- [ ] Task 4: Implement error display functions (AC: All)
  - [ ] Implement `showError(errorType, details)` function
  - [ ] Implement `hideError()` function
  - [ ] Show countdown for rate limit errors
  - [ ] Preserve user's date input on error

- [ ] Task 5: Implement fallback behaviors (AC: FR60)
  - [ ] On stats API fail: Show cached data or "Unable to load stats"
  - [ ] On submission fail: Save to localStorage for manual retry
  - [ ] On Turnstile fail: Allow submission (fail-open pattern)
  - [ ] Log fallback activations

- [ ] Task 6: Integrate with submission and stats flows (AC: All)
  - [ ] Wrap stats fetch with error handling
  - [ ] Wrap submission with error handling
  - [ ] Handle all API response codes
  - [ ] Trigger appropriate error UI

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `public/js/errors.test.js`
  - [ ] Test `classifyError()` with all error types
  - [ ] Test `fetchWithRetry()` retry behavior
  - [ ] Test exponential backoff timing
  - [ ] Test error message mapping
  - [ ] Test input preservation
  - [ ] Test fallback behavior
  - [ ] Verify test coverage: 100%

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.5 (Error Handling with Retry Mechanisms):**
- Network errors: "Unable to connect" with auto-retry (3 attempts, 10s timeout)
- API errors mapped to user-friendly messages
- 400: Show validation error
- 409: "Already submitted. Update instead."
- 429: "Slow down! Wait X seconds."
- 500: "Something went wrong. Try again."
- Turnstile errors handled gracefully
- Error UI: Red/orange, retry button, dismiss button
- User's input preserved on error
- Fallbacks: Cached stats, localStorage for retry, fail-open Turnstile

[Source: docs/epics/epic-3-results-display-user-feedback.md:209-261]

**From Tech Spec Epic 3 - AC5 (Error Handling):**
- Network errors with auto-retry (max 3 attempts)
- Timeout after 10 seconds
- All API error codes mapped to messages
- Error UI with attention colors, retry/dismiss buttons
- Input preserved on error
- Fallback behaviors for graceful degradation

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC5]

### Architecture Patterns

**From Tech Spec - Error Handling Data:**
```typescript
type ErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'TURNSTILE_FAILED';

interface ErrorState {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffMultiplier: 2
};
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models]

**From Tech Spec - Error Handling Flow:**
```
1. Error detected
2. Classify error type
3. If retryable and attempts < 3:
   → Wait with exponential backoff
   → Retry request
4. If not retryable or max attempts:
   → Show error message
   → Preserve input
   → Offer manual retry
5. Log error for monitoring
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Workflows]

**From Architecture - Error Response Format:**
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR',
    message: 'User-friendly message',
    details?: {}
  }
}
```

[Source: docs/architecture.md:605-618]

### Project Structure Notes

**File Structure:**
```
public/
├── index.html              (MODIFY - add error container)
├── js/
│   ├── app.js              (MODIFY - import errors module)
│   ├── errors.js           (NEW - error handling, retry logic)
│   ├── errors.test.js      (NEW - unit tests)
│   └── submission.js       (MODIFY - integrate error handling)
├── styles.css              (MODIFY - add error styles)
```

### Learnings from Previous Story

**From Story 3.3 (Submission Confirmation):**
- Submission flow established
- Optimistic UI pattern implemented
- Rollback function needed for error cases

**Integration Points:**
- Story 3.1: Stats fetch error handling
- Story 3.3: Submission error triggers rollback
- Story 3.7: May queue submissions on capacity errors

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC5: Error Handling](docs/sprint-artifacts/tech-spec-epic-3.md:AC5)
- [Epic 3 Tech Spec - Error Handling Data Models](docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models)
- [Epic 3 Tech Spec - Error Handling Flow](docs/sprint-artifacts/tech-spec-epic-3.md:Workflows)

**Epic Breakdown:**
- [Epic 3 Story 3.5 Definition](docs/epics/epic-3-results-display-user-feedback.md:209-261)

**Architecture:**
- [Architecture - Error Response Format](docs/architecture.md:605-618)
- [Architecture - Error Handling](docs/architecture.md:605-660)

**Dependencies:**
- Story 2.7 (Prediction submission API - error responses)
- Story 2.10 (Statistics API - error responses)
- Story 2.5b (Turnstile - error handling)
- Story 3.3 (Submission confirmation - rollback integration)

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
