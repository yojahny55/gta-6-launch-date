# Story 4.8: Data Retention Policy Implementation

Status: ready-for-dev

## Story

As a system,
I want to enforce data retention policies,
so that we comply with privacy regulations and minimize data storage.

## Acceptance Criteria

**Given** data retention policies are defined (FR90)
**When** automated cleanup runs (nightly scheduled task)
**Then** old data is purged according to retention policies
**And** automated tests exist covering main functionality

### Retention Policies

1. **Predictions:**
   - Retention: Indefinite
   - Rationale: Core product value, user expects persistence
   - Exception: User-requested deletion (FR54-55)

2. **Analytics Data (Cloudflare):**
   - Retention: 24 months
   - Auto-deletion: After 24 months
   - Cloudflare handles automatically

3. **Server Logs:**
   - Retention: 90 days
   - Contains: IP addresses, requests, errors
   - Auto-deletion: After 90 days

4. **Rate Limit Data (Cloudflare KV):**
   - Retention: 60 seconds
   - TTL: Automatic expiration
   - No manual cleanup needed

5. **Cache Data (Stats):**
   - Retention: 5 minutes
   - TTL: Automatic expiration
   - No manual cleanup needed

### Cleanup Script Runs
- Schedule: Daily at 2 AM UTC (low traffic)
- Task: Delete analytics logs > 24 months
- Task: Delete server logs > 90 days
- Logging: Record cleanup counts

### Retention is Documented
- Privacy Policy states retention periods
- Users informed during submission
- Compliance audit trail maintained

### Testing Requirements
- [ ] Unit tests for cleanup script logic
- [ ] Test analytics data deletion (24 months)
- [ ] Test server logs deletion (90 days)
- [ ] Test prediction data preservation (indefinite)
- [ ] Test cleanup logging
- [ ] Integration test for scheduled cleanup

## Tasks / Subtasks

- [ ] Task 1: Create cleanup service (AC: Cleanup script runs)
  - [ ] Create `src/services/cleanup.service.ts`
  - [ ] Implement `cleanupAnalyticsData()` function (24 months)
  - [ ] Implement `cleanupServerLogs()` function (90 days)
  - [ ] Implement `generateCleanupReport()` function
  - [ ] Log cleanup operations

- [ ] Task 2: Implement analytics data cleanup (AC: Retention policy 2)
  - [ ] Identify analytics data older than 24 months
  - [ ] Delete old analytics records
  - [ ] Preserve prediction data (separate table)
  - [ ] Log deletion count

- [ ] Task 3: Implement server logs cleanup (AC: Retention policy 3)
  - [ ] Identify server logs older than 90 days
  - [ ] Delete old log entries
  - [ ] Preserve recent logs
  - [ ] Log deletion count

- [ ] Task 4: Schedule cleanup task (AC: Cleanup script runs)
  - [ ] Create GitHub Actions workflow or Cloudflare Cron Trigger
  - [ ] Schedule: Daily at 2 AM UTC
  - [ ] Run cleanup service
  - [ ] Send notification on errors
  - [ ] Generate daily cleanup report

- [ ] Task 5: Implement audit trail logging (AC: Retention is documented)
  - [ ] Log all cleanup operations
  - [ ] Record deletion counts
  - [ ] Timestamp all operations
  - [ ] Structured logging format for compliance

- [ ] Task 6: Document retention policies (AC: Retention is documented)
  - [ ] Update `public/privacy.html` Section 3 (Data Storage)
  - [ ] List retention periods for each data type
  - [ ] Explain auto-deletion process
  - [ ] State exceptions (user-requested deletion)

- [ ] Task 7: Update About page with retention info (AC: Transparency)
  - [ ] Update `public/about.html` Section 5 (Privacy & Data)
  - [ ] Explain retention policies
  - [ ] Emphasize data minimization

- [ ] Task 8: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/data-retention.test.ts`
  - [ ] Test analytics cleanup (24 months threshold)
  - [ ] Test server logs cleanup (90 days threshold)
  - [ ] Test prediction data preservation
  - [ ] Test cleanup logging
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.8 (Data Retention Policy Implementation):**
- 5 retention policies defined (predictions, analytics, logs, rate limit, cache)
- Scheduled cleanup: Daily at 2 AM UTC
- Analytics data: 24 months retention
- Server logs: 90 days retention
- Predictions: Indefinite retention
- Audit trail logging for compliance

[Source: docs/epics/epic-4-privacy-compliance-trust.md:453-515]

**From PRD - FR90 (24-Month Analytics Retention):**
- Analytics data retained for 24 months maximum
- GDPR "storage limitation" principle
- Automated cleanup prevents manual burden

[Source: docs/epics/epic-4-privacy-compliance-trust.md:477-483]

### Architecture Patterns

**From Architecture - Data Retention (GDPR Compliance):**
- GDPR requires "storage limitation" principle
- Automated cleanup prevents manual burden
- Audit logs of deletions for compliance

[Source: docs/architecture.md:674-706]

**Cleanup Service Pattern:**
```typescript
// src/services/cleanup.service.ts
import dayjs from 'dayjs';

export interface CleanupReport {
  analyticsDeleted: number;
  logsDeleted: number;
  timestamp: string;
}

export async function cleanupAnalyticsData(db: D1Database): Promise<number> {
  const cutoffDate = dayjs().subtract(24, 'months').format('YYYY-MM-DD');

  const result = await db.prepare(
    `DELETE FROM analytics_logs WHERE created_at < ?`
  ).bind(cutoffDate).run();

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Analytics cleanup completed',
    context: { deleted: result.meta.changes, cutoffDate }
  }));

  return result.meta.changes;
}

export async function cleanupServerLogs(db: D1Database): Promise<number> {
  const cutoffDate = dayjs().subtract(90, 'days').format('YYYY-MM-DD');

  const result = await db.prepare(
    `DELETE FROM server_logs WHERE created_at < ?`
  ).bind(cutoffDate).run();

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Server logs cleanup completed',
    context: { deleted: result.meta.changes, cutoffDate }
  }));

  return result.meta.changes;
}

export async function runDailyCleanup(db: D1Database): Promise<CleanupReport> {
  const analyticsDeleted = await cleanupAnalyticsData(db);
  const logsDeleted = await cleanupServerLogs(db);

  return {
    analyticsDeleted,
    logsDeleted,
    timestamp: new Date().toISOString()
  };
}
```

**GitHub Actions Scheduled Cleanup:**
```yaml
# .github/workflows/cleanup.yml
name: Daily Data Cleanup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup script
        run: |
          npx wrangler d1 execute gta6-predictions \
            --file=./src/services/cleanup.sql
```

**Cloudflare Cron Trigger (Alternative):**
```toml
# wrangler.toml
[triggers]
crons = ["0 2 * * *"] # Daily at 2 AM UTC
```

```typescript
// src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runDailyCleanup(env.DB));
  }
}
```

### Project Structure Notes

**File Structure:**
```
src/
├── services/
│   ├── cleanup.service.ts       (NEW - cleanup logic)
│   └── cleanup.sql              (NEW - SQL cleanup queries)
├── index.ts                     (MODIFY - add scheduled event handler)
.github/
├── workflows/
│   └── cleanup.yml              (NEW - GitHub Actions cleanup)
wrangler.toml                    (MODIFY - add cron trigger)
public/
├── privacy.html                 (MODIFY - document retention)
├── about.html                   (MODIFY - retention info)
tests/
├── unit/
│   └── data-retention.test.ts   (NEW - retention tests)
```

**Deployment Notes:**
- GitHub Actions or Cloudflare Cron (choose one)
- Cleanup runs daily at 2 AM UTC (low traffic)
- Logs cleanup operations for audit

### Learnings from Previous Story

**From Story 4.7 (Cookie Conflict Resolution):**
- ✅ **Logging pattern:** Structured logging for operations
- **Recommendation:** Apply same logging to cleanup operations

**From Story 4.5 (Cookie Management and Expiration):**
- ✅ **24-month retention policy:** Analytics data retention
- **Recommendation:** Implement cleanup logic for 24-month threshold

**From Story 4.2 (Privacy Policy Page):**
- ✅ **Data Storage section:** Section 3
- **Recommendation:** Update with retention periods

**From Story 4.4 (About Page):**
- ✅ **Privacy & Data section:** Section 5
- **Recommendation:** Add retention info

**From Story 3.7 (Graceful Degradation Under Load):**
- ✅ **KV TTL pattern:** Automatic expiration for cache/rate limit
- **Recommendation:** Leverage TTL for short-term data (cache, rate limit)

**New Patterns Created:**
- Scheduled cleanup service
- Data retention audit logging

**Files to Modify:**
- `public/privacy.html` - Document retention periods
- `public/about.html` - Add retention info
- `src/index.ts` - Add scheduled event handler (if using Cron)

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.8 Definition](docs/epics/epic-4-privacy-compliance-trust.md:453-515)

**PRD:**
- [PRD - FR90: 24-Month Analytics Retention](docs/epics/epic-4-privacy-compliance-trust.md:477-483)

**Architecture:**
- [Architecture - Data Retention (GDPR)](docs/architecture.md:674-706)

**Dependencies:**
- Story 4.2 (Privacy Policy - document retention)
- Story 4.4 (About page - retention info)
- Story 4.5 (Cookie management - 24-month policy)
- Story 1.3 (CI/CD - GitHub Actions scheduling)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**Implementation Options:**
- GitHub Actions scheduled workflow (simpler, no Cloudflare Worker changes)
- Cloudflare Cron Triggers (native, more integrated)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-8-data-retention-policy-implementation.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
