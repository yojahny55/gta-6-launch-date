# Story 2.9: Weighted Median Algorithm Implementation

Status: ready-for-dev

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
- [ ] Unit tests for weight calculation (all three tiers: 1.0, 0.3, 0.1)
- [ ] Unit tests for weighted median algorithm
- [ ] Test edge cases: empty array, single prediction, all weights 0
- [ ] Test boundary conditions: exactly 5 years, exactly 50 years
- [ ] Test with mix of reasonable + outlier predictions
- [ ] Test median shifts correctly with weight changes
- [ ] Achieve 90%+ coverage for algorithm

## Tasks / Subtasks

- [ ] Task 1: Create weighted median utility module (AC: 1)
  - [ ] Create `src/utils/weighted-median.ts`
  - [ ] Implement `calculateWeight()` function
  - [ ] Implement `calculateWeightedMedian()` function
  - [ ] Export both functions and types

- [ ] Task 2: Implement weight calculation logic (AC: 1)
  - [ ] Official date reference: 2026-11-19
  - [ ] Calculate years difference using day.js
  - [ ] Apply weight tiers: 1.0 (0-5 years), 0.3 (5-50 years), 0.1 (50+ years)
  - [ ] Return weight value

- [ ] Task 3: Implement weighted median algorithm (AC: 2)
  - [ ] Query all predictions with weights (ordered by date ASC)
  - [ ] Calculate total weight sum
  - [ ] Find 50th percentile (targetWeight = totalWeight / 2)
  - [ ] Iterate predictions, accumulate weight, return median
  - [ ] Algorithm is O(n) time complexity

- [ ] Task 4: Handle edge cases (AC: 3)
  - [ ] Empty predictions: Return null
  - [ ] Single prediction: Return that date
  - [ ] All weights 0: Fallback to simple median
  - [ ] Even number: Return lower of two middle values

- [ ] Task 5: Integrate with submission/update endpoints (AC: 4)
  - [ ] Import calculateWeight() in Story 2.7 (submission)
  - [ ] Import calculateWeight() in Story 2.8 (update)
  - [ ] Store weight in predictions.weight field
  - [ ] Recalculate weight on update

- [ ] Task 6: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `src/utils/weighted-median.test.ts`
  - [ ] Test weight calculation: all three tiers
  - [ ] Test boundary conditions: 5 years, 50 years
  - [ ] Test weighted median: all reasonable dates (weight=1.0)
  - [ ] Test weighted median: mix of reasonable + outliers
  - [ ] Test edge cases: empty, single, all weights 0
  - [ ] Test official date reference (2026-11-19)
  - [ ] Verify test coverage: 90%+

- [ ] Task 7: Optimize for performance (AC: Supporting)
  - [ ] Pre-calculate weights during submission (avoid recalculation)
  - [ ] Index predictions table on predicted_date for sorting
  - [ ] Consider caching median result (Story 2.10)

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

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
