# Story 2.5: reCAPTCHA v3 Integration for Bot Protection

Status: ready-for-dev

## Story

As a system,
I want to verify users are human using reCAPTCHA v3,
so that bots cannot spam fake predictions.

## Acceptance Criteria

**Given** Google reCAPTCHA v3 is configured
**When** a user attempts to submit a prediction
**Then** reCAPTCHA workflow executes:

1. **Frontend:** Execute reCAPTCHA on form submit
```javascript
const token = await grecaptcha.execute(SITE_KEY, {action: 'submit_prediction'})
```

2. **Backend:** Verify token with Google API
```typescript
const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  method: 'POST',
  body: `secret=${SECRET_KEY}&response=${token}`
})
```

3. **Score Evaluation:** Accept scores > 0.5 (FR76)
- Score 0.0-0.5: Reject as likely bot
- Score 0.5-1.0: Accept as likely human

**And** reCAPTCHA failures are handled gracefully:
- Score < 0.5: Return "Please try again" with retry option
- Network error: Allow submission (fail open, don't block legitimate users)
- Badge is visible but non-intrusive (bottom-right corner)

**And** reCAPTCHA is invisible (v3):
- No user interaction required (no checkbox)
- Runs in background during form submit
- Minimal UX friction (FR maintains 10-second submission goal)

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Integration tests for reCAPTCHA token generation (mock grecaptcha.execute)
- [ ] Unit tests for backend verification logic
- [ ] Test score evaluation thresholds (0.4 reject, 0.6 accept)
- [ ] Test graceful degradation (network failures, API errors)
- [ ] Test badge visibility and positioning
- [ ] Test retry mechanism after score < 0.5 rejection

## Tasks / Subtasks

- [ ] Task 1: Register with Google reCAPTCHA v3 (AC: Prerequisites)
  - [ ] Create Google account (if not exists)
  - [ ] Register site at https://www.google.com/recaptcha/admin
  - [ ] Get Site Key (public)
  - [ ] Get Secret Key (private, store in environment)
  - [ ] Configure domains: localhost (dev), gta6-tracker.pages.dev (prod)

- [ ] Task 2: Add reCAPTCHA script to frontend (AC: 1)
  - [ ] Add reCAPTCHA v3 script tag to `public/index.html` head
  - [ ] Configure with Site Key
  - [ ] Load script asynchronously (don't block page load)
  - [ ] Add reCAPTCHA badge to footer
  - [ ] Test script loads correctly on page load

- [ ] Task 3: Integrate reCAPTCHA execution in form submission (AC: 1, 3)
  - [ ] Modify `public/app.js` form submit handler
  - [ ] Execute `grecaptcha.execute()` before sending prediction
  - [ ] Pass action name: 'submit_prediction'
  - [ ] Include token in API request body
  - [ ] Handle execution errors gracefully

- [ ] Task 4: Implement backend verification (AC: 2)
  - [ ] Create `src/utils/recaptcha.ts` verification module
  - [ ] Implement `verifyRecaptchaToken()` function
  - [ ] POST to https://www.google.com/recaptcha/api/siteverify
  - [ ] Parse response: success, score, action, challenge_ts, hostname
  - [ ] Return verification result with score

- [ ] Task 5: Add score evaluation logic (AC: 3)
  - [ ] Check score >= 0.5 threshold (configurable via environment)
  - [ ] Return 503 Service Unavailable if score < 0.5
  - [ ] Include retry suggestion in error message
  - [ ] Log scores for threshold tuning analysis

- [ ] Task 6: Implement graceful degradation (AC: 2)
  - [ ] Detect network errors during verification
  - [ ] Fail open: Allow submission if Google API unreachable (FR60)
  - [ ] Log degradation events for monitoring
  - [ ] Add circuit breaker pattern (optional, for resilience)

- [ ] Task 7: Configure environment variables (AC: Prerequisites)
  - [ ] Add RECAPTCHA_SECRET_KEY to .dev.vars (local)
  - [ ] Add RECAPTCHA_SECRET_KEY to Cloudflare Workers secrets (production)
  - [ ] Add RECAPTCHA_SITE_KEY to frontend environment (build-time)
  - [ ] Document secret rotation procedure

- [ ] Task 8: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `src/utils/recaptcha.test.ts`
  - [ ] Test token verification with mock Google API responses
  - [ ] Test score threshold logic (0.4, 0.5, 0.6)
  - [ ] Test network failure handling (fail open)
  - [ ] Test invalid token responses
  - [ ] Integration tests for full workflow
  - [ ] Verify test coverage: 90%+ for recaptcha utilities

- [ ] Task 9: Add reCAPTCHA monitoring (AC: Supporting)
  - [ ] Log all reCAPTCHA scores (for threshold tuning)
  - [ ] Track verification success/failure rates
  - [ ] Monitor API response times
  - [ ] Alert on high failure rates (potential bot attack)

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.5 (reCAPTCHA v3 Integration):**
- Verify users are human using reCAPTCHA v3
- Frontend executes `grecaptcha.execute()` on form submit
- Backend verifies token with Google API
- Score >= 0.5 passes, < 0.5 rejects (FR76)
- Network errors fail open (don't block legitimate users)
- Invisible (v3): no user interaction required
- Badge visible in bottom-right corner per Google ToS

[Source: docs/epics/epic-2-core-prediction-engine.md:184-233]

**From Tech Spec Epic 2 - AC5 (reCAPTCHA v3 Integration):**
- Google reCAPTCHA v3 integrated (invisible, no user interaction)
- Frontend executes `grecaptcha.execute()` on form submit
- Backend verifies token with Google API
- Score evaluation: >= 0.5 passes, < 0.5 rejects
- Network errors fail open (allow submission, don't block users)
- reCAPTCHA badge visible in footer

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:679-685]

**From Tech Spec Epic 2 - reCAPTCHA Service:**
- Bot detection and verification
- Input: User action, token
- Output: Score (0.0-1.0)
- Implements FR76 (reCAPTCHA v3 with retry)

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:105]

### Architecture Patterns and Constraints

**From Architecture: Security Architecture - Bot Protection:**
- reCAPTCHA v3 provides score (0.0-1.0) vs v2 binary pass/fail
- Action name 'submit_prediction' helps Google learn patterns
- Consider fallback if Google API is down (FR60)
- Add reCAPTCHA badge to footer per Google ToS

[Source: docs/architecture.md:673-707]

**From Architecture: External Services - Google reCAPTCHA v3:**
- Site Key: Public (embedded in frontend)
- Secret Key: Environment variable `RECAPTCHA_SECRET_KEY`
- API: `https://www.google.com/recaptcha/api/siteverify`
- Free tier: Unlimited requests

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:610-615]

**reCAPTCHA Verification Implementation Pattern:**
```typescript
// Backend verification
async function verifyRecaptchaToken(
  token: string,
  secretKey: string
): Promise<{ success: boolean; score: number }> {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`
  });

  const data = await response.json();

  return {
    success: data.success && data.score >= 0.5,
    score: data.score
  };
}
```

**From Architecture: Naming Conventions:**
- Functions: camelCase (`verifyRecaptchaToken()`, `checkBotScore()`)
- Files: camelCase (`recaptcha.ts`)
- Tests: `{name}.test.ts` co-located
- Constants: SCREAMING_SNAKE_CASE (`MIN_SCORE_THRESHOLD`, `RECAPTCHA_API_URL`)

[Source: docs/architecture.md:567-586]

### Project Structure Notes

**Alignment with Unified Project Structure:**
- reCAPTCHA utility: `src/utils/recaptcha.ts` (new file)
- TypeScript types: `src/types/index.ts` (modify - add RecaptchaVerificationResult interface)
- Tests: `src/utils/recaptcha.test.ts` (new file, co-located per ADR-009)
- Frontend integration: `public/app.js` (modify - add grecaptcha.execute call)
- HTML badge: `public/index.html` (modify - add reCAPTCHA badge to footer)

[Source: docs/architecture.md:82-123]

**Dependencies:**
- Google reCAPTCHA v3: External service (no npm package needed)
- Frontend: Load via CDN script tag
- Backend: Native fetch API (no additional dependencies)

**Expected File Structure:**
```
src/
├── utils/
│   ├── recaptcha.ts (NEW - verification logic)
│   ├── recaptcha.test.ts (NEW - test suite)
│   ├── validation.ts (existing - can import recaptcha verification)
│   └── error-handler.ts (existing - use for recaptcha errors)
├── types/
│   └── index.ts (MODIFY - add RecaptchaVerificationResult interface)
public/
├── index.html (MODIFY - add reCAPTCHA script and badge)
├── app.js (MODIFY - add grecaptcha.execute call)
```

### Learnings from Previous Story

**From Story 2.4 (Input Validation and XSS Prevention) - Status: drafted**

**Key Patterns to Reuse:**
- Centralized utility modules with pure functions
- Co-located test files achieving high coverage per ADR-011
- Graceful error handling with user-friendly messages
- TypeScript strict mode compliance
- Environment variable usage for secrets

**Validation Integration:**
- Story 2.4 created centralized `src/utils/validation.ts` module
- Story 2.5 should integrate recaptcha verification into validation flow
- Import `verifyRecaptchaToken()` in API endpoint validation

**Testing Patterns:**
- Mock external API calls (Google reCAPTCHA API)
- Test threshold logic comprehensively
- Test graceful degradation (network failures)
- Test edge cases (invalid tokens, expired tokens, timeout)

**Recommendations for This Story:**
1. Follow validation.ts module structure for recaptcha.ts
2. Achieve 90%+ test coverage per ADR-011 mandatory testing requirement
3. Mock Google reCAPTCHA API for predictable testing
4. Implement fail-open pattern for resilience (FR60)
5. Log all scores for threshold tuning analysis
6. Test with invalid tokens, network errors, timeouts

[Source: docs/sprint-artifacts/stories/2-4-input-validation-and-xss-prevention.md]

### Testing Standards Summary

**From Architecture ADR-011 (Mandatory Automated Testing):**
- **MANDATORY** automated tests for all stories
- **Minimum Coverage:** 90%+ for utility functions (recaptcha)
- **Test Location:** Co-located with source (`src/utils/recaptcha.test.ts`)
- **CI/CD Integration:** Tests run automatically in GitHub Actions pipeline
- **Story Completion:** Tests must pass before story marked "done"

[Source: docs/architecture.md:1171-1243]

**Test Types Required for This Story:**
1. **Unit Tests:**
   - Token verification with mock Google API responses
   - Score threshold logic (0.4 reject, 0.5 accept, 0.6 accept)
   - Network failure handling (fail open)
   - Invalid token responses
   - Coverage target: 90%+ for recaptcha utilities

2. **Integration Tests:**
   - Full workflow: frontend execute → backend verify → score check
   - Error handling: network errors, low scores, invalid tokens
   - Retry mechanism after rejection

**From Architecture Testing Strategy:**
- Vitest for unit tests (per ADR-009)
- Mock fetch API for Google reCAPTCHA calls
- @cloudflare/vitest-pool-workers for Workers integration tests

[Source: docs/architecture.md:ADR-009, ADR-011]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC5: reCAPTCHA v3 Integration](docs/sprint-artifacts/tech-spec-epic-2.md:679-685)
- [Epic 2 Tech Spec - reCAPTCHA Service](docs/sprint-artifacts/tech-spec-epic-2.md:105)
- [Epic 2 Tech Spec - External Services: Google reCAPTCHA v3](docs/sprint-artifacts/tech-spec-epic-2.md:610-615)

**Epic Breakdown:**
- [Epic 2 Story 2.5 Definition](docs/epics/epic-2-core-prediction-engine.md:184-233)

**Architecture:**
- [Architecture - Security Architecture: Bot Protection](docs/architecture.md:673-707)
- [Architecture - ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1243)

**External Documentation:**
- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

**Previous Stories:**
- [Story 2.4 - Input Validation and XSS Prevention](docs/sprint-artifacts/stories/2-4-input-validation-and-xss-prevention.md)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.context.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
