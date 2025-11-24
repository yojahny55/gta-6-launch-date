# Story 2.9: Weighted Median Algorithm Implementation

Status: done

## Story

As a system,
I want to calculate the community median using weighted values,
so that troll predictions (2099, 1999) have reduced influence.

## Acceptance Criteria

**Given** predictions exist in the database
**When** calculating the weighted median
**Then** weights are assigned based on reasonableness:

**Weight calculation function:**
```typescript
function calculateWeight(predictedDate: Date): number {
  const officialDate = new Date('2026-11-19');
  const yearsDiff = Math.abs(
    (predictedDate.getTime() - officialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (yearsDiff <= 5) return 1.0;   // 2021-2031: Full weight
  if (yearsDiff <= 50) return 0.3;  // 2031-2076: Reduced
  return 0.1;                        // Beyond 50 years: Minimal
}
```

**And** weighted median is calculated:
```typescript
async function calculateWeightedMedian(db: D1Database): Promise<Date> {
  // 1. Fetch all predictions with weights
  const predictions = await db.prepare(
    'SELECT predicted_date, weight FROM predictions ORDER BY predicted_date ASC'
  ).all();

  // 2. Calculate total weight
  const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);

  // 3. Find 50th percentile by cumulative weight
  const targetWeight = totalWeight / 2;
  let cumulativeWeight = 0;

  for (const p of predictions) {
    cumulativeWeight += p.weight;
    if (cumulativeWeight >= targetWeight) {
      return new Date(p.predicted_date);
    }
  }
}
```

**And** edge cases are handled:
- No predictions: Return null (FR99 requires 50 minimum anyway)
- Single prediction: Return that date
- All weights 0: Fallback to simple median (FR63)
- Even number: Return lower of two middle values

**And** weights are stored in database:
- Calculated during submission (Story 2.7)
- Recalculated during update (Story 2.8)
- Stored in predictions.weight field

**And** automated tests exist covering main functionality

### Testing Requirements
- [x] Unit tests for weight calculation (all three tiers: 1.0, 0.3, 0.1)
- [x] Unit tests for weighted median algorithm
- [x] Test edge cases: empty array, single prediction, all weights 0
- [x] Test boundary conditions: exactly 5 years, exactly 50 years
- [x] Test with mix of reasonable + outlier predictions
- [x] Test median shifts correctly with weight changes
- [x] Achieve 90%+ coverage for algorithm

## Tasks / Subtasks

- [x] Task 1: Create weighted median utility module (AC: 1)
  - [x] Create `src/utils/weighted-median.ts`
  - [x] Implement `calculateWeight()` function
  - [x] Implement `calculateWeightedMedian()` function
  - [x] Export both functions and types

- [x] Task 2: Implement weight calculation logic (AC: 1)
  - [x] Official date reference: 2026-11-19
  - [x] Calculate years difference using day.js
  - [x] Apply weight tiers: 1.0 (0-5 years), 0.3 (5-50 years), 0.1 (50+ years)
  - [x] Return weight value

- [x] Task 3: Implement weighted median algorithm (AC: 2)
  - [x] Query all predictions with weights (ordered by date ASC)
  - [x] Calculate total weight sum
  - [x] Find 50th percentile (targetWeight = totalWeight / 2)
  - [x] Iterate predictions, accumulate weight, return median
  - [x] Algorithm is O(n) time complexity

- [x] Task 4: Handle edge cases (AC: 3)
  - [x] Empty predictions: Return null
  - [x] Single prediction: Return that date
  - [x] All weights 0: Fallback to simple median
  - [x] Even number: Return lower of two middle values

- [x] Task 5: Integrate with submission/update endpoints (AC: 4)
  - [x] Import calculateWeight() in Story 2.7 (submission)
  - [x] Import calculateWeight() in Story 2.8 (update)
  - [x] Store weight in predictions.weight field
  - [x] Recalculate weight on update

- [x] Task 6: Write automated tests (ADR-011 Testing Requirements)
  - [x] Create `src/utils/weighted-median.test.ts`
  - [x] Test weight calculation: all three tiers
  - [x] Test boundary conditions: 5 years, 50 years
  - [x] Test weighted median: all reasonable dates (weight=1.0)
  - [x] Test weighted median: mix of reasonable + outliers
  - [x] Test edge cases: empty, single, all weights 0
  - [x] Test official date reference (2026-11-19)
  - [x] Verify test coverage: 90%+

- [x] Task 7: Optimize for performance (AC: Supporting)
  - [x] Pre-calculate weights during submission (avoid recalculation)
  - [x] Index predictions table on predicted_date for sorting
  - [x] Consider caching median result (Story 2.10)

## Dev Notes

### Requirements Context

**From Epic 2 Story 2.9 (Weighted Median Algorithm):**
- Weight calculation based on reasonableness (years from official date)
- Years diff <= 5: weight = 1.0 (full weight)
- Years diff <= 50: weight = 0.3 (reduced weight)
- Years diff > 50: weight = 0.1 (minimal weight)
- Weighted median calculation: 50th percentile by cumulative weight
- Edge cases: empty predictions, single prediction, all weights 0
- Weights pre-calculated and stored during submission/update

[Source: docs/epics/epic-2-core-prediction-engine.md:418-489]

**From Tech Spec Epic 2 - AC9 (Weighted Median Algorithm):**
- Weight calculation function exists with three tiers
- Weighted median calculation: fetch all, sort, find 50th percentile
- Edge cases handled: no predictions (return null), single prediction, all weights 0 (fallback to simple median)
- Weights pre-calculated and stored during submission/update

[Source: docs/sprint-artifacts/tech-spec-epic-2.md:715-726]

### Architecture Patterns

**From Architecture: Implementation Patterns - Weighted Median Algorithm:**
```typescript
import dayjs from 'dayjs';

interface WeightedPrediction {
  date: string; // ISO 8601
  weight: number;
}

export function calculateWeight(predictedDate: string): number {
  const officialDate = dayjs('2026-11-19');
  const predicted = dayjs(predictedDate);
  const yearsDiff = Math.abs(predicted.diff(officialDate, 'year', true));

  if (yearsDiff <= 5) return 1.0;    // 2025-2030: full weight
  if (yearsDiff <= 50) return 0.3;   // 2030-2075: reduced weight
  return 0.1;                        // Beyond 50 years: minimal weight
}

export function calculateWeightedMedian(predictions: WeightedPrediction[]): string {
  if (predictions.length === 0) return '2026-11-19'; // Default to official date

  // Sort by date
  const sorted = [...predictions].sort((a, b) =>
    dayjs(a.date).unix() - dayjs(b.date).unix()
  );

  // Calculate total weight
  const totalWeight = sorted.reduce((sum, p) => sum + p.weight, 0);
  const targetWeight = totalWeight / 2;

  // Find weighted median
  let cumulativeWeight = 0;
  for (const item of sorted) {
    cumulativeWeight += item.weight;
    if (cumulativeWeight >= targetWeight) {
      return item.date;
    }
  }

  return sorted[sorted.length - 1].date; // Fallback to latest
}
```

[Source: docs/architecture.md:444-492]

**Test Cases Required (90%+ coverage):**
- Test case: All predictions in reasonable range
- Test case: Mix of reasonable + outlier predictions
- Test case: Extreme outliers (year 2099)
- Test case: Empty predictions array
- Test case: Single prediction
- Test case: Edge case at weight boundaries

[Source: docs/architecture.md:494-501]

### Project Structure

**File Structure:**
```
src/
├── utils/
│   ├── weighted-median.ts (NEW - algorithm implementation)
│   ├── weighted-median.test.ts (NEW - test suite)
│   ├── date-validation.ts (existing - can use for date utilities)
│   └── ip-hash.ts (existing - reference pattern)
└── routes/
    └── predict.ts (MODIFY - integrate calculateWeight)
```

### Learnings from Previous Stories

**From Story 2.3 (Date Picker with Validation):**
- day.js library already installed (v1.11.19) per ADR-010
- Use day.js for date difference calculations
- ISO 8601 format throughout

**From Story 2.7 & 2.8 (Submission & Update):**
- Weight must be calculated during submission
- Weight must be recalculated during update
- Store weight in predictions.weight field
- Pre-calculating weights avoids recalculation during stats query

**Testing Patterns:**
- Achieve 90%+ coverage per ADR-011
- Test all weight tiers comprehensively
- Test boundary conditions (exactly 5 years, exactly 50 years)
- Test edge cases (empty, single, all zeros)
- Test algorithm correctness with known datasets

**Recommendations:**
1. Follow date-validation.ts module structure
2. Use day.js for date calculations (already installed)
3. Pre-calculate weights during submission/update (performance)
4. Test with realistic data distributions
5. Document algorithm complexity (O(n) is efficient)

[Source: Previous story implementations]

### References

**Tech Spec:**
- [Epic 2 Tech Spec - AC9: Weighted Median Algorithm](docs/sprint-artifacts/tech-spec-epic-2.md:715-726)
- [Epic 2 Tech Spec - Weight Calculation](docs/sprint-artifacts/tech-spec-epic-2.md:305-316)
- [Epic 2 Tech Spec - Weighted Median Calculation](docs/sprint-artifacts/tech-spec-epic-2.md:317-336)

**Epic Breakdown:**
- [Epic 2 Story 2.9 Definition](docs/epics/epic-2-core-prediction-engine.md:418-489)

**Architecture:**
- [Architecture - Implementation Patterns: Weighted Median Algorithm](docs/architecture.md:444-492)
- [Architecture - ADR-010: day.js for Date Handling](docs/architecture.md:1154-1169)

**Dependencies:**
- day.js v1.11.19 (already installed per ADR-010)
- Stories 2.7, 2.8 (integrate weight calculation)
- Story 2.10 (use algorithm for stats calculation)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented weighted median algorithm with three-tier weight calculation based on years difference from official date (2026-11-19)
- Weight tiers: 1.0 (within 5 years), 0.3 (5-50 years), 0.1 (beyond 50 years)
- Algorithm uses day.js for precise date difference calculations
- Replaced placeholder calculateWeight() in predict.ts with proper implementation from weighted-median.ts
- Database index on predicted_date already exists (idx_predictions_date) for efficient sorting
- All 54 unit tests passing with comprehensive coverage

### Completion Notes List

- ✅ Created src/utils/weighted-median.ts with complete weighted median algorithm implementation
- ✅ Implemented calculateWeight() with three-tier weight system (1.0, 0.3, 0.1 based on years from official date)
- ✅ Implemented calculateWeightedMedian() with O(n) algorithm (after sorting)
- ✅ Added calculateWeightedMedianFromRows() convenience function for database integration
- ✅ Added calculateSimpleMedian() fallback for when all weights are 0 (FR63)
- ✅ Edge cases handled: empty array (return null), single prediction, all weights 0, even number (lower middle)
- ✅ Integrated with predict.ts - replaced placeholder with proper import
- ✅ Created comprehensive test suite (54 tests) covering all weight tiers, boundary conditions, and edge cases
- ✅ Performance: Weights pre-calculated during submission/update, index exists for predicted_date sorting

### File List

**New Files:**
- src/utils/weighted-median.ts (algorithm implementation)
- src/utils/weighted-median.test.ts (test suite - 54 tests)

**Modified Files:**
- src/routes/predict.ts (replaced placeholder calculateWeight with import from weighted-median.ts)
- docs/sprint-artifacts/sprint-status.yaml (status: in-progress → review)

### Change Log

- 2025-11-24: Story 2.9 implementation complete - weighted median algorithm with comprehensive test coverage
- 2025-11-24: Senior Developer Review (AI) completed - APPROVED

---

## Senior Developer Review (AI)

### Reviewer
yojahny

### Date
2025-11-24

### Outcome
**✅ APPROVED**

The implementation is complete, well-structured, and meets all acceptance criteria. The weighted median algorithm is correctly implemented with proper edge case handling, comprehensive test coverage (54 tests), and seamless integration with the prediction submission and update endpoints.

### Summary
Story 2.9 implements a weighted median algorithm to reduce troll prediction influence (e.g., 2099 dates). The implementation includes:
- Three-tier weight calculation based on years from official date (1.0/0.3/0.1)
- Weighted median algorithm with O(n log n) complexity
- Complete edge case handling (empty, single, all-zero weights, even count)
- Integration with prediction submission (POST) and update (PUT) endpoints
- Comprehensive test suite with 54 passing tests

### Key Findings

**✅ No HIGH severity issues found**

**LOW Severity:**
1. Minor documentation note: Algorithm complexity stated as O(n) in story but implementation correctly documents O(n log n) due to sorting in JSDoc comments - the implementation is correct.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1 | Weight calculation with three tiers | ✅ IMPLEMENTED | `weighted-median.ts:62-79` |
| 2 | Official date reference (2026-11-19) | ✅ IMPLEMENTED | `weighted-median.ts:22` |
| 3 | Years diff <= 5: weight = 1.0 | ✅ IMPLEMENTED | `weighted-median.ts:70-71` |
| 4 | Years diff <= 50: weight = 0.3 | ✅ IMPLEMENTED | `weighted-median.ts:73-75` |
| 5 | Years diff > 50: weight = 0.1 | ✅ IMPLEMENTED | `weighted-median.ts:77-78` |
| 6 | Weighted median (50th percentile) | ✅ IMPLEMENTED | `weighted-median.ts:110-148` |
| 7 | Empty predictions returns null | ✅ IMPLEMENTED | `weighted-median.ts:112-114` |
| 8 | Single prediction returns that date | ✅ IMPLEMENTED | `weighted-median.ts:116-119` |
| 9 | All weights 0 fallback (FR63) | ✅ IMPLEMENTED | `weighted-median.ts:129-133` |
| 10 | Even number: lower middle value | ✅ IMPLEMENTED | `weighted-median.ts:131-132` |
| 11 | Weights stored during submission | ✅ IMPLEMENTED | `predict.ts:138,149-153` |
| 12 | Weights recalculated on update | ✅ IMPLEMENTED | `predict.ts:440,466` |
| 13 | Automated tests exist | ✅ IMPLEMENTED | 54 tests in `weighted-median.test.ts` |

**Summary: 13 of 13 acceptance criteria fully implemented**

### Task Completion Validation

| Category | Count |
|----------|-------|
| Tasks Verified Complete | 37 |
| Questionable Tasks | 0 |
| Falsely Marked Complete | 0 |

**Summary: 37 of 37 completed tasks verified, 0 questionable, 0 false completions ✅**

### Test Coverage and Gaps

**Test Suite:** `src/utils/weighted-median.test.ts`
- **Total Tests:** 54 (all passing)
- **Categories Covered:**
  - Constants and configuration (3 tests)
  - Weight calculation - all tiers (29 tests)
  - Weighted median algorithm (12 tests)
  - Database integration helper (3 tests)
  - Simple median fallback (5 tests)
  - day.js integration (2 tests)

**Test Quality Assessment:**
- ✅ All three weight tiers tested (1.0, 0.3, 0.1)
- ✅ Boundary conditions tested (exactly 5 years, exactly 50 years, day before/after)
- ✅ Edge cases tested (empty, single, all weights 0, even count)
- ✅ Realistic distribution tests (80% reasonable + 20% outlier)
- ✅ Type safety and export verification
- ✅ day.js integration and leap year handling

**No test gaps identified for the algorithm module.**

### Architectural Alignment

**Tech Spec Compliance (AC9):**
- ✅ Weight calculation function exists with three tiers
- ✅ Weighted median uses fetch all → sort → cumulative weight approach
- ✅ Edge cases handled per spec
- ✅ Weights pre-calculated during submission/update (not on stats query)

**Architecture Patterns (docs/architecture.md:444-501):**
- ✅ Uses day.js for date calculations (ADR-010)
- ✅ Official date reference is configurable constant
- ✅ TypeScript interfaces for type safety
- ✅ Co-located tests per ADR-011

**Code Quality:**
- ✅ Well-documented with JSDoc comments
- ✅ Exported constants for weight values and tiers
- ✅ Convenience function for database row conversion
- ✅ Clean separation: utility module independent of database layer

### Security Notes

- ✅ No security concerns - pure algorithm module with no external I/O
- ✅ Weight calculation is deterministic and tamper-proof
- ✅ No user input directly processed (validation handled upstream)

### Best-Practices and References

**Implementation Quality:**
- Uses day.js per ADR-010 for date calculations
- Follows TypeScript strict mode
- Co-located tests per ADR-011
- Comprehensive JSDoc documentation

**References:**
- [day.js documentation](https://day.js.org/docs/en/display/difference)
- [Weighted median algorithm](https://en.wikipedia.org/wiki/Weighted_median)
- Architecture: ADR-010, ADR-011

### Action Items

**Code Changes Required:**
- None - implementation is complete and correct

**Advisory Notes:**
- Note: Story 2.10 will use `calculateWeightedMedianFromRows()` helper for database integration
- Note: Consider adding integration tests with actual D1 database in Story 2.10
