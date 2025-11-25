# Story 3.3: Submission Confirmation with Visual Feedback

Status: drafted

## Story

As a user,
I want immediate confirmation that my prediction was recorded,
so that I feel confident it worked and see my ranking.

## Acceptance Criteria

**Given** a user successfully submits a prediction
**When** the API returns success (201 Created)
**Then** confirmation UI is displayed:

**Confirmation Elements:**
1. **Success Icon:** Green checkmark or celebration animation
2. **Primary Message:** "Your prediction has been recorded!"
3. **Prediction Echo:** "You predicted: February 14, 2027"
4. **Ranking:** "You're prediction #10,235!"
5. **Social Comparison:** (From Story 3.2)

**And** optimistic UI is used:
- Show confirmation immediately on submit (don't wait for API)
- If API fails, roll back and show error
- Submission count increments instantly (+1 to display)

**And** confirmation is celebratory:
- Micro-animation on success (subtle confetti or pulse)
- Positive language ("recorded", "counted", not just "saved")
- Makes user feel like they contributed

**And** screen reader announcement (FR70):
- Announce via ARIA live region
- Message: "Success. Your prediction for February 14, 2027 has been recorded. You're 90 days more pessimistic than the community median."

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for confirmation rendering
- [ ] Unit tests for optimistic UI state management
- [ ] Test rollback on API failure
- [ ] Test screen reader announcement (ARIA live region)
- [ ] Test animation triggers
- [ ] Test ranking display formatting

## Tasks / Subtasks

- [ ] Task 1: Create confirmation UI component (AC: Confirmation Elements)
  - [ ] Add confirmation container to `public/index.html`
  - [ ] Create success icon element (checkmark SVG or CSS)
  - [ ] Add primary message element
  - [ ] Add prediction echo element
  - [ ] Add ranking display element
  - [ ] Add comparison display area (Story 3.2)
  - [ ] Style with Tailwind (green success colors)

- [ ] Task 2: Implement optimistic UI pattern (AC: Optimistic UI)
  - [ ] Create `public/js/submission.js` module
  - [ ] Implement `showOptimisticConfirmation(date)` function
  - [ ] Increment displayed count immediately (+1)
  - [ ] Show confirmation UI before API response
  - [ ] Store previous state for potential rollback

- [ ] Task 3: Implement rollback on failure (AC: Optimistic UI)
  - [ ] Implement `rollbackOptimisticUI()` function
  - [ ] Restore previous count value
  - [ ] Hide confirmation UI
  - [ ] Show error state (Story 3.5)
  - [ ] Re-enable submit button

- [ ] Task 4: Implement success animation (AC: Celebratory)
  - [ ] Create CSS animation for success icon (pulse/scale)
  - [ ] Optional: Simple confetti effect (CSS or minimal JS)
  - [ ] Trigger animation on confirmation display
  - [ ] Respect prefers-reduced-motion preference

- [ ] Task 5: Implement screen reader support (AC: FR70)
  - [ ] Add ARIA live region to confirmation container
  - [ ] Set `aria-live="polite"` or `aria-live="assertive"`
  - [ ] Construct announcement message with date and comparison
  - [ ] Test with VoiceOver/NVDA

- [ ] Task 6: Integrate with submission flow (AC: All)
  - [ ] Call optimistic UI on form submit
  - [ ] On API success: Update with actual data (ranking, comparison)
  - [ ] On API failure: Trigger rollback
  - [ ] Integrate Story 3.2 comparison display

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `public/js/submission.test.js`
  - [ ] Test optimistic UI display
  - [ ] Test count increment
  - [ ] Test rollback functionality
  - [ ] Test ARIA live region content
  - [ ] Test animation class application
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.3 (Submission Confirmation with Visual Feedback):**
- Show immediate confirmation when API returns 201 Created
- Success icon (green checkmark or celebration animation)
- Primary message: "Your prediction has been recorded!"
- Prediction echo: "You predicted: [date]"
- Ranking: "You're prediction #[count]!"
- Optimistic UI: Show confirmation before API confirms
- Roll back on API failure
- Screen reader announcement via ARIA live region (FR70)

[Source: docs/epics/epic-3-results-display-user-feedback.md:118-158]

**From Tech Spec Epic 3 - AC3 (Submission Confirmation):**
- Success icon displayed on success
- Primary message, prediction echo, ranking displayed
- Social comparison from AC2 displayed
- Optimistic UI: Count increments immediately
- If API fails: Roll back optimistic UI, show error
- Micro-animation on success
- Screen reader announcement via ARIA live region

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC3]

### Architecture Patterns

**From Tech Spec - Confirmation UI Data:**
```typescript
interface ConfirmationData {
  success: boolean;
  predictedDate: string;
  ranking: number;
  comparison: ComparisonResult;
  showAnimation: boolean;
}
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models]

**From Tech Spec - Prediction Submission Workflow:**
```
1. User clicks "Add My Prediction"
2. Frontend validates date
3. Execute Turnstile challenge
4. Show optimistic UI (increment count, show confirmation)
5. POST /api/predict
6. On success: Update with actual data
7. On failure: Roll back optimistic UI
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Workflows]

**Accessibility Pattern:**
```html
<div role="status" aria-live="polite" id="confirmation-announcement">
  <!-- Screen reader announcement injected here -->
</div>
```

### Project Structure Notes

**File Structure:**
```
public/
├── index.html              (MODIFY - add confirmation UI container)
├── js/
│   ├── app.js              (MODIFY - import submission module)
│   ├── submission.js       (NEW - submission handling, optimistic UI)
│   ├── submission.test.js  (NEW - unit tests)
│   └── comparison.js       (FROM Story 3.2 - import for comparison)
├── styles.css              (MODIFY - add confirmation styles, animation)
```

### Learnings from Previous Story

**From Story 3.2 (Social Comparison Messaging):**
- `getComparisonMessage()` function available
- Returns `ComparisonResult` with daysDiff, direction, message, personality
- Import and use in confirmation display

**Integration Points:**
- Story 3.2: Use comparison result in confirmation
- Story 3.5: Use error handling for rollback scenarios
- Story 2.7: API response provides ranking (prediction count)

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC3: Submission Confirmation](docs/sprint-artifacts/tech-spec-epic-3.md:AC3)
- [Epic 3 Tech Spec - Confirmation UI Data Model](docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models)
- [Epic 3 Tech Spec - Submission Workflow](docs/sprint-artifacts/tech-spec-epic-3.md:Workflows)

**Epic Breakdown:**
- [Epic 3 Story 3.3 Definition](docs/epics/epic-3-results-display-user-feedback.md:118-158)

**Architecture:**
- [Architecture - API Response: POST /api/predict](docs/architecture.md:320-365)

**Dependencies:**
- Story 2.7 (Prediction submission API - ranking from response)
- Story 3.2 (Social comparison messaging - comparison display)
- Story 3.5 (Error handling - rollback scenarios)

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
