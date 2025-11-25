# Story 3.4: Optional Chart Visualization Toggle

Status: drafted

## Story

As a user,
I want to optionally see a chart of prediction distribution,
so that I can understand the full spectrum of community opinions.

## Acceptance Criteria

**Given** statistics are displayed
**When** the page loads
**Then** chart is hidden by default (FR19):
- Chart container collapsed
- Toggle button visible: "Show Prediction Distribution"

**And** when user clicks toggle:
- Chart expands with smooth animation
- Button text changes to "Hide Chart"
- Chart is rendered client-side (no server rendering)

**And** chart displays:
- **X-axis:** Date range (earliest to latest prediction)
- **Y-axis:** Number of predictions
- **Bars:** Histogram with 30-day buckets
- **Highlight:** Median marked with vertical line
- **User:** User's prediction marked with different color

**And** chart is lightweight:
- Uses Chart.js or similar (<50KB)
- Only loads library when user clicks toggle (lazy loading)
- Responsive on mobile (touch-friendly)

**And** chart is accessible:
- Alt text describes distribution
- Data table alternative available
- Keyboard navigable (tab to toggle button)

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for histogram bucket calculation
- [ ] Test toggle button state changes
- [ ] Test lazy loading behavior
- [ ] Test chart data preparation
- [ ] Test accessibility: alt text, data table
- [ ] Test responsive behavior

## Tasks / Subtasks

- [ ] Task 1: Create chart container and toggle UI (AC: Hidden by default)
  - [ ] Add chart container to `public/index.html` (collapsed)
  - [ ] Add toggle button: "Show Prediction Distribution"
  - [ ] Style toggle button with Tailwind
  - [ ] Position below stats display, above form

- [ ] Task 2: Implement toggle behavior (AC: Toggle)
  - [ ] Create `public/js/chart.js` module
  - [ ] Implement toggle click handler
  - [ ] Add smooth expand/collapse animation (CSS transition)
  - [ ] Toggle button text: "Show" <-> "Hide"
  - [ ] Track toggle state

- [ ] Task 3: Implement lazy loading for Chart.js (AC: Lightweight)
  - [ ] Use dynamic `import()` for Chart.js
  - [ ] Load only when toggle clicked (first time)
  - [ ] Show loading indicator while library loads
  - [ ] Cache loaded module for subsequent toggles

- [ ] Task 4: Implement histogram data preparation (AC: Chart displays)
  - [ ] Create `prepareHistogramData(predictions)` function
  - [ ] Calculate 30-day buckets from min to max date
  - [ ] Count predictions per bucket
  - [ ] Identify median bucket for highlighting
  - [ ] Identify user's prediction bucket (if submitted)

- [ ] Task 5: Render Chart.js histogram (AC: Chart displays)
  - [ ] Create `renderChart(data)` function
  - [ ] Configure Chart.js bar chart
  - [ ] Set X-axis as date range labels
  - [ ] Set Y-axis as prediction counts
  - [ ] Add vertical line for median
  - [ ] Highlight user's prediction bar

- [ ] Task 6: Implement responsive behavior (AC: Lightweight)
  - [ ] Configure Chart.js responsive option
  - [ ] Test on mobile viewports
  - [ ] Handle touch interactions
  - [ ] Adjust font sizes for mobile

- [ ] Task 7: Implement accessibility features (AC: Accessible)
  - [ ] Add alt text describing distribution
  - [ ] Create data table alternative (visually hidden)
  - [ ] Ensure toggle button is keyboard accessible
  - [ ] Add ARIA labels and roles

- [ ] Task 8: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `public/js/chart.test.js`
  - [ ] Test `prepareHistogramData()` with various inputs
  - [ ] Test bucket calculation (30-day intervals)
  - [ ] Test toggle state management
  - [ ] Test lazy loading mock
  - [ ] Test accessibility elements
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 3 Story 3.4 (Optional Chart Visualization Toggle):**
- Chart hidden by default (FR19)
- Toggle button: "Show Prediction Distribution"
- On click: Chart expands with animation
- Button text changes to "Hide Chart"
- Histogram with 30-day buckets
- X-axis: Date range, Y-axis: Prediction count
- Median marked with vertical line
- User's prediction marked differently
- Chart.js or similar (< 50KB)
- Lazy loading - only load when toggle clicked
- Accessible: Alt text, data table, keyboard navigation

[Source: docs/epics/epic-3-results-display-user-feedback.md:162-206]

**From Tech Spec Epic 3 - AC4 (Optional Chart Visualization):**
- Chart hidden by default (FR19)
- Toggle button visible, chart expands on click
- Histogram with 30-day buckets
- Median and user prediction highlighted
- Chart.js lazy-loaded (< 50KB)
- Responsive on mobile
- Accessible: Alt text, data table, keyboard navigable

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:AC4]

### Architecture Patterns

**From Tech Spec - Chart Configuration:**
```typescript
interface HistogramBucket {
  startDate: string;
  endDate: string;
  count: number;
}

interface ChartConfig {
  buckets: HistogramBucket[];
  medianDate: string;
  userPrediction?: string;
  theme: 'light' | 'dark';
}
```

[Source: docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models]

**From Architecture - ADR-005 (Defer Chart):**
- Chart visualization deferred to post-MVP in original architecture
- Implementing as optional feature with lazy loading
- Focus on lightweight implementation

[Source: docs/architecture.md:1049-1065]

**Lazy Loading Pattern:**
```javascript
async function loadChart() {
  const { Chart } = await import('chart.js');
  // Register required components
  // Render chart
}
```

### Project Structure Notes

**File Structure:**
```
public/
├── index.html              (MODIFY - add chart container, toggle button)
├── js/
│   ├── app.js              (MODIFY - import chart module)
│   ├── chart.js            (NEW - chart handling, lazy loading)
│   └── chart.test.js       (NEW - unit tests)
├── styles.css              (MODIFY - add chart container styles)
```

**Dependencies to Add:**
```json
{
  "dependencies": {
    "chart.js": "^4.4.0"  // Lazy-loaded, optional
  }
}
```

### Learnings from Previous Story

**From Story 3.1 (Landing Page with Stats Display):**
- Stats display provides min, max, count for chart
- API response includes all data needed for histogram

**Integration Points:**
- Stats from Story 3.1 provide data range
- User's prediction from Story 3.3 for highlighting
- May be disabled during graceful degradation (Story 3.7)

### References

**Tech Spec:**
- [Epic 3 Tech Spec - AC4: Chart Visualization](docs/sprint-artifacts/tech-spec-epic-3.md:AC4)
- [Epic 3 Tech Spec - Chart Configuration Data Model](docs/sprint-artifacts/tech-spec-epic-3.md:Data-Models)

**Epic Breakdown:**
- [Epic 3 Story 3.4 Definition](docs/epics/epic-3-results-display-user-feedback.md:162-206)

**Architecture:**
- [Architecture - ADR-005: Defer Chart to Post-MVP](docs/architecture.md:1049-1065)

**Dependencies:**
- Story 2.10 (Statistics API - data for chart)
- Story 3.1 (Landing page - stats display integration)
- Story 3.7 (Graceful degradation - may disable chart)

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
