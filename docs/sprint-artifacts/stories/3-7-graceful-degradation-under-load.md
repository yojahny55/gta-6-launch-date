# Story 3.7: Graceful Degradation Under Load

Status: drafted

## Story

As a system,
I want the site to remain functional when traffic exceeds capacity,
so that users have a degraded but working experience.

## Acceptance Criteria

**Given** traffic approaches Cloudflare free tier limits (100K req/day)
**When** limits are reached
**Then** degradation strategy activates:

**At 80% capacity (80K requests):**
- Log warning to monitoring
- Consider upgrade to paid tier (FR97 Growth feature)
- No user-facing changes yet

**At 90% capacity (90K requests):**
- Increase cache TTL from 5 min to 15 min (reduce DB reads)
- Disable optional features (chart visualization)
- Show notice: "High traffic! Some features temporarily limited."

**At 95% capacity (95K requests):**
- Serve cached stats only (no live updates)
- Queue submissions (process when capacity available)
- Show: "We're experiencing high traffic. Your submission will be processed shortly."

**At 100% capacity (limit reached):**
- Read-only mode: Show stats but disable submissions
- Display: "We've reached capacity for today. Try again in {hours} hours."
- Countdown to daily limit reset (midnight UTC)

**And** queue management:
- Store queued submissions in Cloudflare KV
- TTL: 24 hours
- Process FIFO when capacity available
- Notify user when processed (if email provided, Growth feature)

**And** monitoring:
- Track capacity usage in Cloudflare Analytics
- Alert at 80% threshold
- Daily capacity report

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for capacity calculation
- [ ] Unit tests for degradation level determination
- [ ] Test feature flag toggling
- [ ] Test queue management (KV storage)
- [ ] Test countdown display
- [ ] Test cache TTL adjustment

## Tasks / Subtasks

- [ ] Task 1: Implement capacity monitoring (AC: All thresholds)
  - [ ] Create `src/services/capacity.service.ts`
  - [ ] Track daily request count in Cloudflare KV
  - [ ] Implement `getCapacityLevel()` function
  - [ ] Calculate percentage of 100K limit
  - [ ] Return capacity level: normal/elevated/high/critical/exceeded

- [ ] Task 2: Implement degradation feature flags (AC: 90%, 95%, 100%)
  - [ ] Create `src/utils/degradation.ts` module
  - [ ] Implement feature flags: statsEnabled, submissionsEnabled, chartEnabled, cacheExtended
  - [ ] Update flags based on capacity level
  - [ ] Expose via API endpoint for frontend

- [ ] Task 3: Implement cache TTL adjustment (AC: 90%)
  - [ ] Modify statistics caching to check capacity level
  - [ ] If elevated/high: Extend TTL to 15 minutes
  - [ ] If critical/exceeded: Serve cached only
  - [ ] Log TTL adjustments

- [ ] Task 4: Implement submission queue (AC: 95%)
  - [ ] Create queue storage in Cloudflare KV
  - [ ] Queue key format: `queue:{timestamp}:{uuid}`
  - [ ] TTL: 24 hours
  - [ ] Implement `queueSubmission(data)` function
  - [ ] Return queue position to user

- [ ] Task 5: Implement queue processing (AC: Queue management)
  - [ ] Create scheduled worker or on-demand processor
  - [ ] Process FIFO (oldest first)
  - [ ] Batch process when capacity available
  - [ ] Delete from queue after successful processing

- [ ] Task 6: Implement frontend degradation notices (AC: User notices)
  - [ ] Add notice container to HTML
  - [ ] Fetch degradation state from API
  - [ ] Display appropriate message for each level
  - [ ] Implement countdown to reset for exceeded level

- [ ] Task 7: Disable chart at elevated capacity (AC: 90%)
  - [ ] Check capacity level before showing chart toggle
  - [ ] If elevated+: Hide toggle or show "Temporarily unavailable"
  - [ ] Gracefully handle in-progress chart loads

- [ ] Task 8: Implement read-only mode (AC: 100%)
  - [ ] Disable form submission in frontend
  - [ ] Show "Capacity reached" message
  - [ ] Display countdown to midnight UTC
  - [ ] Keep stats display functional (cached)

- [ ] Task 9: Add monitoring and alerting (AC: Monitoring)
  - [ ] Log capacity level changes
  - [ ] Alert at 80% threshold
  - [ ] Generate daily capacity report
  - [ ] Track queue size and processing rate

- [ ] Task 10: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `src/services/capacity.service.test.ts`
  - [ ] Test capacity level calculation
  - [ ] Test feature flag determination
  - [ ] Test queue operations (add, process, delete)
  - [ ] Test countdown calculation
  - [ ] Test TTL adjustment logic
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.7 (Graceful Degradation Under Load):**
- 80%: Log warning, no user changes
- 90%: Extend cache TTL, disable chart, show notice
- 95%: Cached stats only, queue submissions
- 100%: Read-only mode, countdown to reset
- Queue in Cloudflare KV (24h TTL, FIFO)
- Track usage in Analytics, alert at 80%

[Source: docs/epics/epic-3-results-display-user-feedback.md:317-369]

**From Tech Spec Epic 3 - AC7 (Graceful Degradation):**
- Capacity thresholds: 80%, 90%, 95%, 100%
- Feature flags for degradation levels
- Cache TTL extension at 90%
- Submission queue at 95%
- Read-only mode at 100%
- Queue stored in KV (24h TTL, FIFO)
- Alert at 80%, daily capacity report

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC7]

### Architecture Patterns

**From Tech Spec - Degradation State:**
```typescript
type CapacityLevel = 'normal' | 'elevated' | 'high' | 'critical' | 'exceeded';

interface DegradationState {
  level: CapacityLevel;
  requestsToday: number;
  limitToday: number;
  features: {
    statsEnabled: boolean;
    submissionsEnabled: boolean;
    chartEnabled: boolean;
    cacheExtended: boolean;
  };
}

const CAPACITY_THRESHOLDS = {
  ELEVATED: 0.80,    // 80K requests
  HIGH: 0.90,        // 90K requests
  CRITICAL: 0.95,    // 95K requests
  EXCEEDED: 1.00     // 100K requests
};
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models]

**From Tech Spec - Graceful Degradation Flow:**
```
AT 80% CAPACITY:
1. Log warning
2. No user-facing changes

AT 90% CAPACITY:
1. Extend cache TTL: 5 min → 15 min
2. Disable chart visualization
3. Show banner: "High traffic!"

AT 95% CAPACITY:
1. Serve cached stats only
2. Queue new submissions in KV
3. Show: "High traffic. Submission queued."

AT 100% CAPACITY:
1. Read-only mode
2. Show: "Capacity reached. Try again in X hours."
3. Countdown to midnight UTC
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Workflows]

**From Architecture - Cloudflare Free Tier Limits:**
- Workers: 100,000 requests/day
- D1: 5M reads/day, 100K writes/day
- KV: 100K reads/day, 1K writes/day

[Source: docs/architecture.md:147-164]

### Project Structure Notes

**File Structure:**
```
src/
├── services/
│   ├── capacity.service.ts     (NEW - capacity monitoring)
│   └── capacity.service.test.ts (NEW - unit tests)
├── utils/
│   └── degradation.ts          (NEW - feature flags)
├── routes/
│   ├── predict.ts              (MODIFY - check capacity, queue)
│   └── stats.ts                (MODIFY - TTL adjustment)
├── index.ts                    (MODIFY - add degradation endpoint)
public/
├── js/
│   └── app.js                  (MODIFY - degradation notices)
├── index.html                  (MODIFY - notice container)
wrangler.toml                   (MODIFY - add queue KV namespace)
```

### Learnings from Previous Story

**From Story 2.10 (Statistics Calculation and Caching):**
- KV caching pattern established
- Cache TTL configuration in place
- Can extend pattern for degradation

**From Story 2.6 (Rate Limiting):**
- KV operations pattern established
- Can reuse for queue storage

**From Story 3.4 (Chart Visualization):**
- Chart toggle mechanism in place
- Can disable at elevated capacity

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC7: Graceful Degradation](docs/sprint-artifacts/tech-spec-epic-3.md:AC7)
- [Epic 3 Tech Spec - Degradation State Data Model](docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models)
- [Epic 3 Tech Spec - Graceful Degradation Flow](docs/sprint-artifacts/tech-spec-epic-3.md:Workflows)

**Epic Breakdown:**
- [Epic 3 Story 3.7 Definition](docs/epics/epic-3-results-display-user-feedback.md:317-369)

**Architecture:**
- [Architecture - Cloudflare Free Tier Limits](docs/architecture.md:147-164)
- [Architecture - Performance Considerations](docs/architecture.md:709-747)

**Dependencies:**
- Story 2.6 (Rate limiting - KV patterns)
- Story 2.10 (Statistics caching - TTL configuration)
- Story 3.4 (Chart visualization - disable mechanism)
- Story 3.5 (Error handling - queue messaging)

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
