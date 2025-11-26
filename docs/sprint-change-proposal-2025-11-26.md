# Sprint Change Proposal - Missing Prediction Data API

**Date:** 2025-11-26
**Author:** Correct Course Workflow (Claude Sonnet 4.5)
**Workflow:** `/bmad:bmm:workflows:correct-course`
**Sprint:** Epic 3 - Results Display & User Feedback

---

## 1. Issue Summary

### Problem Statement

Story 3.4 (Optional Chart Visualization Toggle) was implemented and approved, but the chart displays **empty histogram buckets** because there is no API endpoint to fetch individual prediction data for distribution visualization.

### Discovery Context

- **When Discovered:** During Story 3.4 code review (2025-11-25)
- **Identified By:** Senior Developer Review (AI) - MEDIUM severity finding
- **Evidence:** Code comment in `public/js/chart.js:492-495`:
  ```javascript
  // NOTE: /api/predictions endpoint does not exist yet (future enhancement)
  // For now, using stats data to create bucket structure
  // Chart will show empty buckets until prediction data endpoint is available
  const buckets = prepareHistogramData(stats, []);
  ```

### Root Cause

Epic 3 planning assumed that existing API endpoints would provide sufficient data for chart visualization. However:

- ✅ `GET /api/stats` (Story 2.10) - Returns aggregated statistics (min, max, median, count)
- ✅ `POST /api/predict` (Story 2.7) - Submit a prediction
- ✅ `PUT /api/predict` (Story 2.8) - Update a prediction
- ❌ **Missing:** `GET /api/predictions` - Fetch all predictions for histogram distribution

The chart needs individual prediction records (aggregated by date) to create the histogram, not just aggregate statistics.

---

## 2. Impact Analysis

### Epic Impact

**Epic 3: Results Display & User Feedback**
- Story 3.1 (Landing Page) - ✅ No impact (displays stats correctly)
- Story 3.2 (Social Comparison) - ✅ No impact (uses median from stats)
- Story 3.3 (Submission Confirmation) - ✅ No impact (displays ranking correctly)
- **Story 3.4 (Chart Visualization)** - ⚠️ **IMPACTED** - Chart exists but shows empty buckets
- Story 3.5-3.7 - ✅ No impact (unrelated functionality)

### Story Impact

**Current Stories Affected:**
- Story 3.4: Chart toggle works, lazy loading works, but histogram is empty (no data)

**Future Stories Potentially Affected:**
- Story 6.2 (Widget Endpoint): May need prediction distribution data
- Future analytics stories: Would benefit from this endpoint

### Artifact Conflicts

**Documents Requiring Updates:**
1. ✅ Epic 3 definition (`docs/epics/epic-3-results-display-user-feedback.md`)
   - Added Story 3.4b definition
   - Updated Story 3.4 prerequisites to include 3.4b

2. ✅ Sprint status (`docs/sprint-artifacts/sprint-status.yaml`)
   - Added Story 3.4b with "drafted" status
   - Inserted between Story 3.4 and 3.5

3. ✅ Story 3.4b file (`docs/sprint-artifacts/stories/3-4b-prediction-data-api-endpoint.md`)
   - Created complete story file with AC, tasks, technical details

**No Conflicts With:**
- PRD (no changes needed)
- Architecture (follows existing API patterns)
- UI/UX (no visual changes)
- Tech specs (enhancement, not contradiction)

### Technical Impact

**Backend:**
- New service: `predictions-aggregation.service.ts`
- New route: `src/routes/predictions.ts` for `GET /api/predictions`
- Modified routes: `predict.ts`, `predict-update.ts` (cache invalidation)

**Frontend:**
- Modified: `public/js/chart.js` (lines ~492-495)
- Change: Replace empty array with fetch from `/api/predictions`

**Database:**
- No schema changes required
- Existing `predictions` table and indexes support aggregation query

**Caching:**
- New cache key: `predictions:aggregated`
- Shares invalidation with `stats:latest` cache
- Same TTL: 5 minutes (300 seconds)

**Performance:**
- Expected response: <50ms (cache hit), <300ms (cache miss)
- Expected size: 3-150KB (typical: 100-500 unique dates)
- No performance degradation expected

### Risk Assessment

**Low Risk:**
- Additive change (no breaking changes)
- Follows established patterns (Story 2.10)
- Privacy-preserving (aggregated data only)
- Cached to minimize database load
- Graceful degradation (chart shows empty if endpoint fails)

**Mitigations:**
- Comprehensive test coverage (90%+)
- Cache invalidation prevents stale data
- Rate limiting prevents abuse
- Error handling for API failures

---

## 3. Recommended Approach

### Selected Path: **Direct Adjustment** (Add Story Within Existing Plan)

**Rationale:**
- Scope is small and well-defined (single API endpoint)
- Does not require PRD or architecture changes
- Fits naturally into Epic 3 (completes Story 3.4)
- Can be implemented as incremental enhancement
- No rollback of completed work needed

**Alternatives Considered:**

❌ **Potential Rollback:**
- Not needed - Story 3.4 is complete and functional
- Chart shows empty buckets gracefully (not broken)
- Frontend code is ready to consume the endpoint

❌ **MVP Review:**
- Chart visualization is already optional (FR19)
- Empty chart doesn't block core functionality
- Enhancement improves UX but not critical for launch

### Effort Estimate

**Story Points:** 5 (Medium complexity)

**Estimated Time:**
- Backend implementation: 2-3 hours
- Frontend integration: 1 hour
- Testing: 2 hours
- Review and refinement: 1 hour
- **Total: 6-7 hours** (approximately 1 day)

**Complexity Breakdown:**
- Database query: Simple (GROUP BY with index)
- Caching logic: Copy pattern from Story 2.10
- API endpoint: Standard Hono route
- Frontend integration: 5-10 line change
- Testing: Standard test coverage

### Timeline Impact

**No Sprint Delay Expected**

**Insertion Point:** Between Story 3.4 (done) and Story 3.5 (drafted)

**Parallel Work Possible:**
- Story 3.4b can be implemented while other stories are in progress
- Does not block Stories 3.5, 3.6, 3.7
- Can be picked up by dev team immediately

**Priority:** **MEDIUM-HIGH**
- Not blocking MVP launch
- Significantly improves user experience
- Completes partially-delivered feature (Story 3.4)
- Low implementation risk

---

## 4. Detailed Change Proposals

### Change 1: Create Story 3.4b File

**Artifact:** New story file
**Location:** `docs/sprint-artifacts/stories/3-4b-prediction-data-api-endpoint.md`
**Status:** ✅ **COMPLETED**

**Contents:**
- Complete story definition with user story format
- 11 detailed acceptance criteria
- 10 implementation tasks with subtasks
- Technical specifications and architecture notes
- Privacy and security considerations
- Performance requirements
- Testing strategy
- Integration plan with Story 3.4

**Rationale:** Provides complete specification for development team

---

### Change 2: Update Sprint Status

**Artifact:** Sprint tracking file
**Location:** `docs/sprint-artifacts/sprint-status.yaml`
**Status:** ✅ **COMPLETED**

**OLD:**
```yaml
3-4-optional-chart-visualization-toggle: done
3-5-error-handling-with-retry-mechanisms: drafted
```

**NEW:**
```yaml
3-4-optional-chart-visualization-toggle: done
3-4b-prediction-data-api-endpoint: drafted  # Story created 2025-11-26
3-5-error-handling-with-retry-mechanisms: drafted
```

**Rationale:** Tracks new story in sprint backlog, maintains story sequence

---

### Change 3: Update Epic 3 Definition

**Artifact:** Epic breakdown file
**Location:** `docs/epics/epic-3-results-display-user-feedback.md`
**Status:** ✅ **COMPLETED**

**Changes:**
1. Updated Story 3.4 prerequisites:
   - Added: Story 3.4b (predictions data API)
   - Note: "Currently displays empty buckets until Story 3.4b implements endpoint"

2. Added Story 3.4b section (lines 210-269):
   - Full story definition
   - Acceptance criteria
   - API endpoint specification
   - Prerequisites and dependencies
   - Technical notes

**Rationale:** Maintains epic document accuracy, provides context for story sequence

---

### Change 4: Frontend Integration (To Be Implemented)

**Artifact:** Chart module
**Location:** `public/js/chart.js`
**Lines:** 492-495 (approximately)
**Status:** 🔄 **PLANNED** (Story 3.4b Task 9)

**OLD:**
```javascript
// NOTE: /api/predictions endpoint does not exist yet (future enhancement)
// For now, using stats data to create bucket structure
// Chart will show empty buckets until prediction data endpoint is available
const buckets = prepareHistogramData(stats, []);
```

**NEW:**
```javascript
// Fetch prediction distribution data from API
const predResponse = await fetch('/api/predictions');
const predResult = await predResponse.json();

// Prepare histogram with real data (fallback to empty array on error)
const buckets = prepareHistogramData(stats, predResult.data || []);
```

**Rationale:** Integrates real data source, maintains graceful degradation

---

### Change 5: Cache Invalidation Updates (To Be Implemented)

**Artifact:** Prediction submission route
**Location:** `src/routes/predict.ts`
**Status:** 🔄 **PLANNED** (Story 3.4b Task 4)

**Change:** Update cache invalidation to delete both caches:
```typescript
// OLD: Only invalidate stats cache
await env.STATS_CACHE.delete('stats:latest');

// NEW: Invalidate both stats and predictions cache
await Promise.all([
  env.STATS_CACHE.delete('stats:latest'),
  env.STATS_CACHE.delete('predictions:aggregated')
]);
```

**Applies To:**
- `src/routes/predict.ts` (POST endpoint)
- `src/routes/predict-update.ts` (PUT endpoint)

**Rationale:** Keeps both caches synchronized, prevents stale data

---

## 5. Implementation Handoff

### Change Scope Classification: **MINOR**

**Definition:** Can be implemented directly by development team without requiring backlog reorganization or fundamental replan.

**Characteristics:**
- Single story addition (not epic restructure)
- Clear acceptance criteria and technical spec
- No dependencies on incomplete work
- Follows established patterns
- Low risk, high value

### Handoff Recipients

**Primary:** Development Team (Dev Agent)
**Supporting:** Product Owner / Scrum Master (for prioritization)

### Implementation Tasks

**Backend Implementation:**
1. Create `src/services/predictions-aggregation.service.ts`
   - Implement SQL aggregation query
   - Handle 50-prediction threshold
   - Return typed interface

2. Create `src/routes/predictions.ts`
   - Set up GET endpoint: `/api/predictions`
   - Integrate caching logic (5-minute TTL)
   - Add error handling and rate limiting

3. Update cache invalidation:
   - Modify `src/routes/predict.ts` (submission)
   - Modify `src/routes/predict-update.ts` (update)
   - Delete both cache keys on invalidation

**Frontend Integration:**
4. Update `public/js/chart.js` (lines ~492-495)
   - Fetch from `/api/predictions` endpoint
   - Pass data to `prepareHistogramData()`
   - Add error handling (fallback to empty array)

**Testing:**
5. Write comprehensive tests (90%+ coverage)
   - Service unit tests
   - Route integration tests
   - Cache behavior tests
   - Privacy validation tests
   - End-to-end chart integration test

### Success Criteria

**Functional:**
- ✅ GET /api/predictions endpoint returns aggregated data
- ✅ Chart displays real prediction distribution
- ✅ Histogram shows populated buckets (not empty)
- ✅ 50-prediction threshold enforced

**Performance:**
- ✅ Cache hit: <50ms response time
- ✅ Cache miss: <300ms response time
- ✅ Response size: <500KB

**Quality:**
- ✅ 90%+ test coverage
- ✅ All automated tests passing
- ✅ No sensitive data in API response
- ✅ Cache invalidation working correctly

**User Experience:**
- ✅ Chart shows meaningful data on first load
- ✅ Chart updates after user submits prediction
- ✅ No performance degradation from Story 3.4

### Priority Recommendation

**Priority:** **MEDIUM-HIGH**

**Reasoning:**
1. Completes partially-delivered feature (Story 3.4)
2. Significantly improves user experience
3. Low implementation risk (well-defined, small scope)
4. Does not block other Epic 3 stories
5. Not critical for MVP, but important for quality

**Suggested Sequence:**
1. Complete current in-progress stories (3.1 review, etc.)
2. **Implement Story 3.4b** ← Next available story
3. Continue with Stories 3.5, 3.6, 3.7

---

## 6. Deliverables Summary

### Documents Created

1. ✅ **Story 3.4b File**
   - Location: `docs/sprint-artifacts/stories/3-4b-prediction-data-api-endpoint.md`
   - Size: ~700 lines
   - Includes: AC, tasks, technical specs, testing strategy

2. ✅ **Sprint Change Proposal** (This Document)
   - Location: `docs/sprint-change-proposal-2025-11-26.md`
   - Purpose: Complete impact analysis and implementation plan

### Documents Updated

3. ✅ **Sprint Status YAML**
   - Location: `docs/sprint-artifacts/sprint-status.yaml`
   - Change: Added Story 3.4b entry with "drafted" status

4. ✅ **Epic 3 Definition**
   - Location: `docs/epics/epic-3-results-display-user-feedback.md`
   - Changes: Added Story 3.4b section, updated Story 3.4 prerequisites

### Implementation Artifacts (Pending)

5. 🔄 **Backend Services** (To be created during Story 3.4b implementation)
   - `src/services/predictions-aggregation.service.ts`
   - `src/services/predictions-aggregation.service.test.ts`
   - `src/routes/predictions.ts`
   - `src/routes/predictions.test.ts`

6. 🔄 **Frontend Updates** (To be modified during Story 3.4b implementation)
   - `public/js/chart.js` (lines ~492-495)
   - `public/js/chart.test.js` (add endpoint mocking)

---

## 7. Next Steps

### Immediate Actions

1. ✅ **Story Creation** - COMPLETED
   - Story 3.4b file created with complete specifications
   - Sprint status updated with new story

2. ✅ **Documentation Updates** - COMPLETED
   - Epic 3 updated with Story 3.4b
   - Change proposal generated

3. 🔄 **Prioritization** - PENDING USER APPROVAL
   - User reviews this change proposal
   - User approves Story 3.4b for implementation
   - Product Owner confirms priority (recommended: MEDIUM-HIGH)

### Implementation Sequence

4. 🔄 **Story 3.4b Implementation** - PENDING APPROVAL
   - Dev team picks up Story 3.4b
   - Implements backend API endpoint
   - Integrates with frontend chart
   - Writes and passes all tests

5. 🔄 **Code Review** - AFTER IMPLEMENTATION
   - Run `/bmad:bmm:workflows:code-review` on Story 3.4b
   - Verify AC compliance
   - Check test coverage
   - Validate privacy and performance

6. 🔄 **Story 3.4b Completion** - AFTER REVIEW APPROVAL
   - Mark Story 3.4b as "done" in sprint status
   - Verify end-to-end: Submit prediction → API → Chart updates
   - Close Sprint Change Proposal

### Future Considerations

- Story 6.2 (Widget) may leverage `/api/predictions` endpoint
- Future analytics stories can use this endpoint for trends
- Consider pagination if response size approaches 500KB limit

---

## 8. Approval Required

**This Sprint Change Proposal requires user approval before implementation.**

### Review Checklist

- ✅ Issue clearly identified (missing `/api/predictions` endpoint)
- ✅ Impact analysis complete (Epic 3, Story 3.4 affected)
- ✅ Recommended approach justified (Direct Adjustment)
- ✅ Story 3.4b created with complete specifications
- ✅ Sprint status and Epic 3 updated
- ✅ Technical implementation plan detailed
- ✅ Success criteria defined
- ✅ Risk assessment performed (Low risk)

### User Decision Points

**Question 1:** Do you approve Story 3.4b for implementation?
- [x] Yes - Proceed with implementation ✅ **APPROVED 2025-11-26**
- [ ] No - Explain concerns
- [ ] Revise - Request changes to story

**Question 2:** What priority should Story 3.4b have?
- [x] HIGH - Implement immediately (next story) ✅ **APPROVED 2025-11-26**
- [ ] MEDIUM-HIGH - Implement soon (recommended)
- [ ] MEDIUM - Implement when convenient
- [ ] LOW - Defer to future sprint

**Question 3:** Any additional changes needed?
- [ ] Yes - Specify changes
- [x] No - Proposal is complete ✅ **APPROVED 2025-11-26**

---

## ✅ APPROVAL GRANTED

**Approved By:** yojahny
**Date:** 2025-11-26
**Decision:** Proceed with Story 3.4b implementation immediately (HIGH priority)
**Status:** Ready for development team pickup

---

## Workflow Summary

**✅ Correct Course Workflow Complete**

**Issue Addressed:** Missing `/api/predictions` endpoint for chart data
**Change Scope:** Minor (Direct Adjustment)
**Artifacts Modified:**
- Story 3.4b created (drafted status)
- Sprint status updated
- Epic 3 updated
- Sprint Change Proposal generated

**Routed To:** Development Team (pending user approval)
**Next Action:** User approval → Story 3.4b implementation → Code review → Done

---

**Workflow Executed By:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Workflow:** `/bmad:bmm:workflows:correct-course`
**Date:** 2025-11-26
**Status:** ✅ Complete - **APPROVED BY USER**
**Next Action:** Story 3.4b ready for dev team implementation (HIGH priority)
