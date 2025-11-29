# Sprint Change Proposal: Vitest Test Resource Optimization

**Date:** 2025-11-26
**Author:** yojahny (via BMad Correct Course Workflow)
**Affected Stories:** 3.4 (Chart Visualization), 3.5 (Error Handling)
**Priority:** HIGH
**Scope:** Minor (Development Infrastructure)

---

## Section 1: Issue Summary

### Problem Statement

The Vitest test suites implemented in Stories 3.4 (Optional Chart Visualization Toggle) and 3.5 (Error Handling with Retry Mechanisms) are consuming excessive system resources, making local development testing impossible and potentially causing CI/CD failures.

### Discovery Context

**When:** Post-implementation of Stories 3.4 and 3.5
**How:** User report during local test execution
**Impact:** Tests cannot be executed without crashing the development environment

### Evidence

- **Resource Consumption:** 32GB RAM + 100% CPU utilization
- **Root Cause:** Uncontrolled parallel test execution via Vitest
- **Specific Issues:**
  1. `errors.test.js` (32 tests): Heavy use of fake timers with `vi.advanceTimersByTimeAsync()` causing memory leaks
  2. `chart.test.js` (16 tests): DOM manipulation tests running in parallel
  3. No `maxConcurrency` or thread limits in Vitest configs
  4. Fake timers not properly cleaned up in `afterEach()` hooks

### Affected Test Files

```
public/js/errors.test.js       - 32 tests (Story 3.5)
public/js/chart.test.js        - 16 tests (Story 3.4)
public/js/comparison.test.js   - Tests (Story 3.2)
public/js/submission.test.js   - Tests (Story 3.3)
```

---

## Section 2: Impact Analysis

### Epic Impact

**Epic 3: Results Display & User Feedback**
- ✅ **Functional Implementation:** Complete and production-ready
- ⚠️ **Test Execution:** Requires optimization
- **Status:** No story re-work needed, only test infrastructure changes

**Future Epics (4-9):**
- May encounter similar issues if following same test patterns
- Preventive guidelines established via ADR-011 update

### Story Impact

| Story | Status | Functional Impact | Test Impact |
|-------|--------|-------------------|-------------|
| 3.4 - Chart Visualization | DONE | None (feature works) | Tests need sequential execution |
| 3.5 - Error Handling | REVIEW | None (feature works) | Fake timer cleanup needed |
| 3.6 - Race Conditions | DRAFTED | None | Will follow new guidelines |
| 3.7 - Graceful Degradation | DRAFTED | None | Will follow new guidelines |

**Conclusion:** NO functional rework required. Features are production-ready.

### Artifact Conflicts

**Architecture Document (docs/architecture.md):**
- ⚠️ **ADR-011 (Mandatory Testing)** - Needs "Test Resource Constraints" subsection
- ⚠️ **ADR-009 (Vitest)** - Should reference resource optimization

**Test Configuration Files:**
- `vitest.config.unit.ts` - Missing parallelism limits
- `vitest.config.ts` - Missing Workers pool resource limits

**CI/CD Pipeline:**
- `.github/workflows/ci.yml` - May need memory limits and timeouts

**PRD:** ✅ No conflicts
**UX Design:** ✅ No conflicts

### Technical Impact

**Database:** ✅ No impact
**APIs:** ✅ No impact
**Frontend:** ✅ No impact (only test execution)
**Infrastructure:** ⚠️ Test infrastructure only
**Deployment:** ✅ No impact (production code unchanged)

---

## Section 3: Recommended Approach

### Selected Path: **Option 1 - Direct Adjustment**

Configure Vitest to limit parallelism and optimize test execution without changing implemented features.

### Why This Approach?

| Criterion | Assessment |
|-----------|------------|
| **Implementation Effort** | Low (< 1 day, config changes only) |
| **Technical Risk** | Low (well-documented Vitest features) |
| **Timeline Impact** | Minimal (does not block other work) |
| **Feature Loss** | None (production code unchanged) |
| **Long-term Value** | High (establishes best practices) |
| **Team Morale** | Positive (fixes immediate pain, no rework) |

### Alternatives Considered

**Option 2: Rollback Stories 3.4 & 3.5**
- ❌ Rejected: Would lose valuable features (error handling, chart viz)
- High effort, high risk, no benefit

**Option 3: MVP Scope Reduction**
- ❌ Rejected: MVP unaffected, features work correctly
- Not applicable to this issue

### Trade-offs

**Pros:**
- ✅ Fast implementation (hours, not days)
- ✅ No feature loss or code rework
- ✅ Establishes preventive guidelines
- ✅ Low risk, high confidence

**Cons:**
- ⚠️ Test execution time may increase slightly (sequential > parallel)
- ⚠️ Requires configuration tuning per environment
- ⚠️ Developers must follow new timer cleanup patterns

**Mitigation:**
- Sequential execution only for heavy tests (errors, chart)
- Most tests still run in parallel (lightweight unit tests)
- Clear documentation in ADR-011

---

## Section 4: Detailed Change Proposals

### CHANGE 1: vitest.config.unit.ts - Add Resource Limits

**File:** `vitest.config.unit.ts`

**Before:**
```typescript
export default defineConfig({
  test: {
    include: [...],
    exclude: [...],
    globals: true,
    environment: 'happy-dom',
  },
});
```

**After:**
```typescript
export default defineConfig({
  test: {
    include: [...],
    exclude: [...],
    globals: true,
    environment: 'happy-dom',
    maxConcurrency: 3, // Limit concurrent tests
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4, // Prevent RAM exhaustion
        minThreads: 1,
      },
    },
    sequence: {
      concurrent: false, // Sequential for heavy DOM/timer tests
    },
  },
});
```

**Justification:** Limits parallel execution to 4 threads with max 3 concurrent tests. Sequential mode for DOM/timer-heavy tests prevents memory spikes.

---

### CHANGE 2: vitest.config.ts - Workers Pool Limits

**File:** `vitest.config.ts`

**Before:**
```typescript
poolOptions: {
  workers: {
    wrangler: { configPath: './wrangler.toml' },
    miniflare: { ... },
  },
}
```

**After:**
```typescript
maxConcurrency: 2,
poolOptions: {
  workers: {
    wrangler: { configPath: './wrangler.toml' },
    miniflare: { ... },
    maxThreads: 2, // Workers + D1 are resource-intensive
    minThreads: 1,
  },
}
```

**Justification:** Workers pool with D1 database operations needs stricter limits (2 threads max) to prevent CPU exhaustion.

---

### CHANGE 3: errors.test.js - Fake Timer Cleanup

**File:** `public/js/errors.test.js`
**Lines:** 153-256 (fetchWithRetry describe block)

**Before:**
```javascript
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
```

**After:**
```javascript
afterEach(() => {
  vi.clearAllTimers(); // Clear pending timers FIRST
  vi.restoreAllMocks();
  vi.useRealTimers();
  if (global.gc) global.gc(); // Hint for GC
});
```

**Justification:** `vi.clearAllTimers()` prevents memory leaks from dangling async timer operations. Must be called before `useRealTimers()`.

---

### CHANGE 4: package.json - Test Script Optimization

**File:** `package.json`

**Before:**
```json
"test:unit": "vitest --config vitest.config.unit.ts",
"test:workers": "vitest --config vitest.config.ts",
```

**After:**
```json
"test:unit": "vitest run --config vitest.config.unit.ts --no-threads",
"test:workers": "vitest run --config vitest.config.ts",
"test:unit:watch": "vitest --config vitest.config.unit.ts",
"test:workers:watch": "vitest --config vitest.config.ts",
```

**Justification:**
- `vitest run` ensures tests complete and exit
- `--no-threads` forces single-threaded (most conservative for unit tests)
- Separate watch commands for development

---

### CHANGE 5: architecture.md - Update ADR-011

**File:** `docs/architecture.md`
**Section:** ADR-011: Mandatory Automated Testing
**Location:** After existing content (around line 1243)

**Add New Subsection:**

```markdown
**6. Test Resource Constraints:**

**Context:** Story 3.5 revealed uncontrolled parallel test execution with fake timers can consume 32GB+ RAM.

**Requirements:**
- **Parallelism Limits:**
  - Unit tests: Max 4 threads, max 3 concurrent
  - Workers tests: Max 2 threads, max 2 concurrent
- **Fake Timers:** Always use `vi.clearAllTimers()` in `afterEach()`
- **DOM Tests:** Run sequentially if manipulating >100 DOM nodes
- **CI/CD:** Configure 4GB RAM limit per test runner
- **Local Dev:** Use `--no-threads` flag if system has <16GB RAM

**Enforcement:**
- CI pipeline monitors memory usage, fails if exceeding 4GB
- Test configs include resource limits by default
- Code review checklist verifies timer cleanup

**Rationale:** Ensures tests run reliably across all environments without resource exhaustion.
```

**Justification:** Codifies lessons learned to prevent future recurrence. Makes resource constraints mandatory for all new tests.

---

### CHANGE 6: CI/CD Resource Limits (if .github/workflows/ci.yml exists)

**File:** `.github/workflows/ci.yml`

**Add to test job:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096  # 4GB limit
    steps:
      - name: Run Unit Tests
        run: npm run test:unit
        timeout-minutes: 10

      - name: Run Workers Tests
        run: npm run test:workers
        timeout-minutes: 10
```

**Justification:** Prevents CI from hanging or consuming excessive resources. Sets clear execution boundaries.

---

### CHANGE 7: Story Documentation - Lessons Learned

**Files:**
- `docs/sprint-artifacts/stories/3-4-optional-chart-visualization-toggle.md`
- `docs/sprint-artifacts/stories/3-5-error-handling-with-retry-mechanisms.md`

**Add at end of each file:**

```markdown
## Lessons Learned

**Test Resource Optimization (Post-Implementation):**

**Issue:** Tests consumed 32GB RAM + 100% CPU due to uncontrolled parallelism and fake timer leaks.

**Root Causes:**
1. No `maxConcurrency` limits in Vitest configs
2. Fake timers not cleaned with `vi.clearAllTimers()`
3. Heavy DOM tests running in parallel

**Resolution:**
- Added thread/concurrency limits to configs
- Implemented proper timer cleanup
- Sequential execution for heavy tests
- Updated ADR-011 with resource constraints

**Outcome:** Tests now run reliably in <4GB RAM with controlled CPU usage.
```

**Justification:** Documents issue and solution for future developers and AI agents.

---

## Section 5: Implementation Handoff

### Change Scope Classification

**MINOR** - Development infrastructure optimization

### Handoff Recipients

**Primary:** Development Team
**Secondary:** None (no PO/SM or PM/Architect involvement needed)

### Development Team Responsibilities

**Tasks:**
1. Update `vitest.config.unit.ts` with resource limits
2. Update `vitest.config.ts` with Workers pool limits
3. Refactor `errors.test.js` timer cleanup
4. Update `package.json` test scripts
5. Update ADR-011 in `architecture.md`
6. Add CI/CD resource limits (if workflow exists)
7. Document lessons learned in story files
8. Test all changes locally (verify < 4GB RAM usage)
9. Verify CI/CD tests pass with new config
10. Update sprint status: Mark 3.5 as DONE after verification

**Success Criteria:**
- ✅ Tests execute successfully in < 4GB RAM
- ✅ CPU usage stays below 100% (distributed across cores)
- ✅ CI/CD tests complete within 10-minute timeout
- ✅ No functional test failures
- ✅ Local development tests run without crashes

**Timeline:** 4-6 hours (configuration + testing)

---

## Section 6: Validation and Next Steps

### Validation Checklist

- [ ] Vitest configs updated with resource limits
- [ ] Timer cleanup refactored in `errors.test.js`
- [ ] Test scripts updated in `package.json`
- [ ] ADR-011 updated with resource constraints
- [ ] CI/CD workflow configured (if exists)
- [ ] Story documentation updated
- [ ] Local test execution verified (< 4GB RAM)
- [ ] CI/CD tests pass
- [ ] Sprint status updated

### Risk Mitigation

**Risk:** Tests may still consume excessive resources in certain environments
**Mitigation:** Start with conservative limits (4 threads, 3 concurrent), can tune upward if needed

**Risk:** Sequential execution increases test duration
**Mitigation:** Only heavy tests run sequentially; most tests remain parallel

**Risk:** Developers may not follow new timer cleanup patterns
**Mitigation:** Code review checklist, ADR-011 enforcement, CI monitoring

### Post-Implementation Monitoring

- Monitor CI/CD test execution times (baseline: current duration)
- Track memory usage in CI logs
- Gather developer feedback on local test performance
- Adjust thread limits if needed (can increase if stable)

---

## Approval and Sign-Off

**Prepared by:** yojahny (BMad Correct Course Workflow)
**Date:** 2025-11-26
**Status:** PENDING USER APPROVAL

**User Approval:**
- [x] ✅ **APPROVED FOR IMPLEMENTATION**
- [ ] Revisions requested
- [ ] Rejected

**Approved By:** yojahny
**Approval Date:** 2025-11-26
**Decision:** Proceed with all 7 change proposals

**Notes:** All changes approved for immediate implementation by development team.

---

## Appendix: Resource Usage Comparison

### Before Optimization

```
Test Execution:
- RAM: 32GB+ (exhausted)
- CPU: 100% (all cores maxed)
- Duration: N/A (crashed before completion)
- Parallelism: Unlimited (default Vitest)
```

### After Optimization (Expected)

```
Test Execution:
- RAM: < 4GB (controlled)
- CPU: 50-70% (distributed across 4 threads)
- Duration: +10-20% (acceptable trade-off)
- Parallelism: 4 threads max, 3 concurrent max
```

### Configuration Summary

| Config File | Max Threads | Max Concurrency | Sequential Mode |
|-------------|-------------|-----------------|-----------------|
| `vitest.config.unit.ts` | 4 | 3 | Yes (heavy tests) |
| `vitest.config.ts` | 2 | 2 | No (Workers pool) |

---

**End of Sprint Change Proposal**
