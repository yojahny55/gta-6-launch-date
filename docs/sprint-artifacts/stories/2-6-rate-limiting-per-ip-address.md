# Story 2.6: Rate Limiting Per IP Address

Status: ready-for-dev

## Story

As a system,
I want to limit requests per IP address,
so that automated scripts cannot overwhelm the API.

## Acceptance Criteria

**Given** rate limiting is configured
**When** requests arrive from the same IP
**Then** rate limits are enforced:

**Submission endpoint (/api/predict POST):**
- Limit: 10 requests per minute per IP
- Sliding window (not fixed intervals)
- After limit: Return 429 Too Many Requests

**Update endpoint (/api/predict PUT):**
- Limit: 30 requests per minute per IP (more lenient)
- Allows legitimate users to change their minds

**Stats endpoint (/api/stats GET):**
- Limit: 60 requests per minute per IP
- Cached response (FR12), so generous limit

**And** rate limit response includes headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1640000000
Retry-After: 45
```

**And** rate limit storage uses Cloudflare KV:
- Key: `ratelimit:${ipHash}:${endpoint}`
- TTL: 60 seconds (auto-expires)
- Increment counter atomically

**And** error message is user-friendly:
- "You're submitting too quickly. Please wait 45 seconds and try again."

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for rate limiter logic (sliding window algorithm)
- [ ] Integration tests for each API endpoint rate limit
- [ ] Test counter increment and TTL expiration
- [ ] Test rate limit headers in responses
- [ ] Test 429 response after limit exceeded
- [ ] Load tests with concurrent requests

## Tasks / Subtasks

- [ ] Task 1: Create rate limiter utility module (AC: 1)
  - [ ] Create `src/middleware/rate-limiter.ts`
  - [ ] Implement `RateLimiter` class with Cloudflare KV
  - [ ] Implement sliding window algorithm
  - [ ] Support different limits per endpoint
  - [ ] Return limit status: allowed/denied + remaining count

- [ ] Task 2: Integrate with Cloudflare KV (AC: 2)
  - [ ] Configure KV namespace binding in wrangler.toml
  - [ ] Create KV namespace: `gta6-rate-limit`
  - [ ] Implement atomic counter increment
  - [ ] Set TTL to 60 seconds for auto-expiration
  - [ ] Handle KV errors gracefully (fail open if KV unavailable)

- [ ] Task 3: Add rate limiting middleware to Hono (AC: 1)
  - [ ] Create Hono middleware function
  - [ ] Extract IP from CF-Connecting-IP header
  - [ ] Hash IP using existing hashIP utility (Story 2.2)
  - [ ] Check rate limit before endpoint execution
  - [ ] Return 429 if limit exceeded

- [ ] Task 4: Configure endpoint-specific limits (AC: 1)
  - [ ] POST /api/predict: 10/min
  - [ ] PUT /api/predict: 30/min
  - [ ] GET /api/stats: 60/min
  - [ ] Make limits configurable via environment variables

- [ ] Task 5: Add rate limit response headers (AC: 2)
  - [ ] X-RateLimit-Limit: Max requests per window
  - [ ] X-RateLimit-Remaining: Requests left in current window
  - [ ] X-RateLimit-Reset: Unix timestamp when limit resets
  - [ ] Retry-After: Seconds to wait (only on 429)

- [ ] Task 6: Implement user-friendly error messages (AC: 3)
  - [ ] Return 429 with clear message
  - [ ] Include wait time in seconds
  - [ ] Use standard error response format

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `src/middleware/rate-limiter.test.ts`
  - [ ] Test sliding window logic
  - [ ] Test counter increment and TTL
  - [ ] Test 11th request returns 429 (for 10/min limit)
  - [ ] Test headers in responses
  - [ ] Integration tests for each endpoint
  - [ ] Verify test coverage: 90%+ for rate limiter

- [ ] Task 8: Add rate limit monitoring (AC: Supporting)
  - [ ] Log all rate limit violations (IP hash, endpoint)
  - [ ] Track violations per IP for abuse detection
  - [ ] Monitor KV usage (reads/writes per day)

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.6 (Rate Limiting Per IP Address):**
- Limit requests per IP address to prevent automated script abuse
- Submission endpoint: 10 requests/min per IP
- Update endpoint: 30 requests/min per IP (more lenient)
- Stats endpoint: 60 requests/min per IP (generous, cached response)
- Sliding window algorithm (not fixed intervals)
- Cloudflare KV for distributed rate limiting
- Return 429 Too Many Requests with headers
- User-friendly error message with wait time

[Source: docs/epics/epic-2-core-prediction-engine.md:235-286]

**From Tech Spec Epic 2 - AC6 (Rate Limiting Per IP Address):**
- Sliding window algorithm (not fixed intervals)
- Storage: Cloudflare KV with 60-second TTL
- Error message: "You're submitting too quickly. Please wait X seconds and try again."
- Headers: X-RateLimit-*, Retry-After

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:686-693]

**From Tech Spec Epic 2 - Rate Limiter Service:**
- Sliding window rate limiting
- Input: IP hash, endpoint
- Output: Allow/deny + headers
- Implements FR77 (rate limiting)

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:106]

### Architecture Patterns and Constraints

**From Architecture: Performance Considerations - Rate Limiting:**
- IP-based: 1 initial submission per IP
- Cookie-based: Unlimited updates (own cookie only)
- Implemented via UNIQUE constraint on `ip_hash`

[Source: docs/architecture.md:694-698]

**From Architecture: Dependencies - Cloudflare KV:**
- Namespace binding: `c.env.RATE_LIMIT_KV`
- Free tier: 100K reads/day, 1K writes/day
- Atomic operations: GET, PUT with increment

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:620-624]

**Rate Limiting Implementation Pattern:**
```typescript
// Sliding window rate limiter
async function checkRateLimit(
  ipHash: string,
  endpoint: string,
  limit: number,
  kv: KVNamespace
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${ipHash}:${endpoint}`;
  const now = Math.floor(Date.now() / 1000);

  const current = await kv.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0, resetAt: now + 60 };
  }

  await kv.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return { allowed: true, remaining: limit - count - 1, resetAt: now + 60 };
}
```

**From Architecture: Naming Conventions:**
- Functions: camelCase (`checkRateLimit()`, `incrementCounter()`)
- Files: camelCase (`rate-limiter.ts`)
- Tests: `{name}.test.ts` co-located
- Constants: SCREAMING_SNAKE_CASE (`SUBMIT_LIMIT`, `UPDATE_LIMIT`, `STATS_LIMIT`)

[Source: docs/architecture.md:567-586]

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Rate limiter middleware: `src/middleware/rate-limiter.ts` (new file)
- TypeScript types: `src/types/index.ts` (modify - add RateLimitResult interface)
- Tests: `src/middleware/rate-limiter.test.ts` (new file, co-located per ADR-009)
- Hono integration: `src/index.ts` (modify - add rate limit middleware)

[Source: docs/architecture.md:82-123]

**Dependencies:**
- Cloudflare KV: Configure namespace binding in wrangler.toml
- Hono: Already installed (v4.10.0) for middleware integration
- IP hashing: Use existing `hashIP()` from Story 2.2

**Expected File Structure:**
```
src/
├── middleware/
│   ├── rate-limiter.ts (NEW - rate limiting logic)
│   ├── rate-limiter.test.ts (NEW - test suite)
│   └── meta-injection.ts (existing - reference pattern)
├── utils/
│   └── ip-hash.ts (existing - reuse for IP hashing)
├── types/
│   └── index.ts (MODIFY - add RateLimitResult interface)
└── index.ts (MODIFY - add rate limit middleware)
wrangler.toml (MODIFY - add KV namespace binding)
```

### Learnings from Previous Story

**From Story 2.5 (reCAPTCHA v3 Integration) - Status: drafted**

**Key Patterns to Reuse:**
- Graceful error handling with user-friendly messages
- Environment variable usage for configuration
- Fail-open pattern for resilience (KV unavailable)
- Comprehensive logging for monitoring and debugging

**External Service Integration:**
- Story 2.5 integrated with Google reCAPTCHA API (external service)
- Story 2.6 integrates with Cloudflare KV (Cloudflare service)
- Both need error handling for service unavailability
- Both need monitoring for usage/rate tracking

**Testing Patterns:**
- Mock external service calls (KV namespace)
- Test threshold logic comprehensively
- Test graceful degradation (KV failures)
- Test edge cases (concurrent requests, TTL expiration)

**Recommendations for This Story:**
1. Follow recaptcha.ts module structure for rate-limiter.ts
2. Achieve 90%+ test coverage per ADR-011 mandatory testing requirement
3. Mock Cloudflare KV for predictable testing
4. Implement fail-open pattern if KV unavailable (don't block all traffic)
5. Log all rate limit violations for abuse detection
6. Test with concurrent requests (race conditions)

[Source: docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.md]

### Testing Standards Summary

**From Architecture ADR-011 (Mandatory Automated Testing):**
- **MANDATORY** automated tests for all stories
- **Minimum Coverage:** 90%+ for middleware (rate limiter)
- **Test Location:** Co-located with source (`src/middleware/rate-limiter.test.ts`)
- **CI/CD Integration:** Tests run automatically in GitHub Actions pipeline
- **Story Completion:** Tests must pass before story marked "done"

[Source: docs/architecture.md:1171-1243]

**Test Types Required for This Story:**
1. **Unit Tests:**
   - Sliding window logic: counter increment, TTL expiration
   - Different endpoint limits: 10/min, 30/min, 60/min
   - Rate limit headers: X-RateLimit-*, Retry-After
   - Edge cases: concurrent requests, KV failures
   - Coverage target: 90%+ for rate limiter

2. **Integration Tests:**
   - Full workflow: request → rate check → 429 or allow
   - Each endpoint: submit, update, stats
   - Concurrent requests (race conditions)

**From Architecture Testing Strategy:**
- Vitest for unit tests (per ADR-009)
- Mock KV namespace for predictable testing
- @cloudflare/vitest-pool-workers for Workers integration tests

[Source: docs/architecture.md:ADR-009, ADR-011]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC6: Rate Limiting Per IP Address](docs/sprint-artifacts/tech-spec-epic-2.md:686-693)
- [Epic 2 Tech Spec - Rate Limiter Service](docs/sprint-artifacts/tech-spec-epic-2.md:106)
- [Epic 2 Tech Spec - Dependencies: Cloudflare KV](docs/sprint-artifacts/tech-spec-epic-2.md:620-624)

**Epic Breakdown:**
- [Epic 2 Story 2.6 Definition](docs/epics/epic-2-core-prediction-engine.md:235-286)

**Architecture:**
- [Architecture - Performance Considerations: Rate Limiting](docs/architecture.md:694-698)
- [Architecture - ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1243)

**External Documentation:**
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Cloudflare KV Limits](https://developers.cloudflare.com/workers/platform/limits/#kv-limits)

**Previous Stories:**
- [Story 2.2 - IP Address Hashing](docs/sprint-artifacts/stories/2-2-ip-address-hashing-for-privacy-preserving-anti-spam.md)
- [Story 2.5 - reCAPTCHA v3 Integration](docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
