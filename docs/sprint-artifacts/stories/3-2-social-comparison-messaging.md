# Story 3.2: Social Comparison Messaging

Status: drafted

## Story

As a user,
I want to know how my prediction compares to the community,
so that I feel validated or intrigued by the difference.

## Acceptance Criteria

**Given** a user has submitted a prediction
**When** the confirmation screen loads
**Then** social comparison messaging is displayed:

**Comparison Logic:**
```typescript
function getComparisonMessage(userDate: Date, medianDate: Date): ComparisonResult {
  const daysDiff = Math.round(
    (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysDiff === 0) {
    return { direction: 'aligned', message: "You're exactly aligned with the community!" };
  } else if (daysDiff > 0) {
    return { direction: 'pessimistic', message: `You're ${Math.abs(daysDiff)} days more pessimistic than the community` };
  } else {
    return { direction: 'optimistic', message: `You're ${Math.abs(daysDiff)} days more optimistic than the community` };
  }
}
```

**And** messaging includes personality:
- Exactly aligned (0 days): "Great minds think alike!" with emoji
- 1-30 days off: "Pretty close to the crowd"
- 31-90 days off: "You have a different perspective"
- 91-180 days off: "Bold prediction!"
- 181+ days off: "Wow, you're way outside the consensus!"

**And** delta is quantified (FR18):
- Show exact day difference
- Convert to months if > 60 days: "3 months earlier"
- Show both user date and median for clarity

**And** positioning creates curiosity:
- Displayed immediately after successful submission
- Above share buttons (sets up sharing motivation)
- Emotionally engaging (validation or intrigue)

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for `getComparisonMessage()` function
- [ ] Test all magnitude ranges (0, 1-30, 31-90, 91-180, 181+)
- [ ] Test direction logic (optimistic/pessimistic/aligned)
- [ ] Test edge cases (exactly at threshold boundaries)
- [ ] Test month conversion (> 60 days)
- [ ] Test display formatting

## Tasks / Subtasks

- [ ] Task 1: Create comparison calculation module (AC: Comparison Logic)
  - [ ] Create `public/js/comparison.js` module
  - [ ] Implement `getComparisonMessage(userDate, medianDate)` function
  - [ ] Implement days difference calculation
  - [ ] Implement direction determination (optimistic/pessimistic/aligned)
  - [ ] Return structured ComparisonResult object

- [ ] Task 2: Implement personality messaging (AC: Personality)
  - [ ] Add `getPersonalityMessage(daysDiff)` function
  - [ ] Implement threshold ranges (0, 1-30, 31-90, 91-180, 181+)
  - [ ] Return appropriate personality string
  - [ ] Add emoji indicators (optimistic, pessimistic, aligned)

- [ ] Task 3: Implement delta quantification (AC: FR18)
  - [ ] Add `formatDelta(daysDiff)` function
  - [ ] Show exact day difference for < 60 days
  - [ ] Convert to months for >= 60 days
  - [ ] Format: "3 months earlier" or "29 days later"

- [ ] Task 4: Create comparison display UI (AC: Positioning)
  - [ ] Add comparison container to confirmation area in HTML
  - [ ] Style comparison message (prominent, engaging)
  - [ ] Add emoji icons for direction
  - [ ] Position above share buttons area
  - [ ] Show both user date and median date

- [ ] Task 5: Integrate with submission flow (AC: All)
  - [ ] Call `getComparisonMessage()` after successful submission
  - [ ] Extract median from API response (`response.data.stats.median`)
  - [ ] Display comparison in confirmation UI
  - [ ] Trigger display animation

- [ ] Task 6: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `public/js/comparison.test.js`
  - [ ] Test 0 days difference (aligned)
  - [ ] Test 1-30 days (both directions)
  - [ ] Test 31-90 days (both directions)
  - [ ] Test 91-180 days (both directions)
  - [ ] Test 181+ days (both directions)
  - [ ] Test exact threshold boundaries (30, 90, 180)
  - [ ] Test month conversion (60, 90, 120 days)
  - [ ] Verify test coverage: 100%

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.2 (Social Comparison Messaging):**
- Show comparison after successful submission
- Calculate days difference from median
- Direction: optimistic (earlier than median) or pessimistic (later)
- Personality messages based on magnitude
- Quantify delta (FR18) - exact days or months
- Position above share buttons for sharing motivation
- Emotionally engaging messaging

[Source: docs/epics/epic-3-results-display-user-feedback.md:61-115]

**From Tech Spec Epic 3 - AC2 (Social Comparison Messaging):**
- Comparison message shown after successful submission
- Days difference calculated correctly (positive = pessimistic)
- Direction indicated with emojis
- Personality message based on magnitude thresholds
- Large differences shown in months (> 60 days)
- Positioned above share buttons

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC2]

### Architecture Patterns

**From Tech Spec - Comparison Calculator:**
```typescript
interface ComparisonResult {
  daysDiff: number;
  direction: 'optimistic' | 'pessimistic' | 'aligned';
  message: string;
  personality: string;
}

const COMPARISON_THRESHOLDS = {
  ALIGNED: 0,
  CLOSE: 30,
  DIFFERENT: 90,
  BOLD: 180,
  EXTREME: Infinity
};
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models]

**From Architecture: API Response:**
POST /api/predict returns:
```json
{
  "success": true,
  "data": {
    "prediction_id": 10235,
    "predicted_date": "2027-03-15",
    "stats": {
      "median": "2027-02-14",
      ...
    },
    "delta_days": 29,
    "comparison": "pessimistic"
  }
}
```

[Source: docs/architecture.md:320-350]

### Project Structure Notes

**File Structure:**
```
public/
├── js/
│   ├── app.js              (MODIFY - import comparison module)
│   ├── comparison.js       (NEW - comparison calculation)
│   └── comparison.test.js  (NEW - unit tests)
```

### Learnings from Previous Story

**From Story 3.1 (Landing Page with Stats Display):**
- Stats display implemented with median, min, max, count
- API response format established
- Frontend fetching pattern established

**Integration Point:**
- Comparison will be shown in confirmation UI (Story 3.3)
- Receives median from submission response
- No additional API call needed

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC2: Social Comparison Messaging](docs/sprint-artifacts/tech-spec-epic-3.md:AC2)
- [Epic 3 Tech Spec - Comparison Calculator Data Model](docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models)
- [Epic 3 Tech Spec - Social Comparison Flow](docs/sprint-artifacts/tech-spec-epic-3.md:Workflows)

**Epic Breakdown:**
- [Epic 3 Story 3.2 Definition](docs/epics/epic-3-results-display-user-feedback.md:61-115)

**Architecture:**
- [Architecture - API Response Format](docs/architecture.md:320-350)

**Dependencies:**
- Story 2.7 (Prediction submission API - provides median in response)
- Story 2.10 (Statistics calculation - median value)
- Story 3.1 (Landing page - stats display established)

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
