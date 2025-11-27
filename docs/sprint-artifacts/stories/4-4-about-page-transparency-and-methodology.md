# Story 4.4: About Page (Transparency & Methodology)

Status: ready-for-dev

## Story

As a user,
I want to understand what this site is, who runs it, and how it works,
so that I can trust the data and feel comfortable participating.

## Acceptance Criteria

**Given** users need transparency about the site (FR98)
**When** a user navigates to /about or clicks About link
**Then** an informative About page is displayed with all required content sections
**And** automated tests exist covering main functionality

### Content Sections

1. **What Is This?**
   - "A community-driven tracker for GTA 6 launch date predictions"
   - "See what the gaming community REALLY thinks (not just official dates)"
   - "Your anonymous prediction helps paint the collective sentiment"

2. **Why This Exists**
   - Rockstar delayed GTA 6 → community is skeptical
   - No tool exists to capture community sentiment
   - Gap between official dates and what fans believe

3. **How It Works**
   - Submit your prediction anonymously (no account required)
   - We calculate weighted median to reduce troll influence
   - See community consensus + how you compare
   - Share results to start conversations

4. **The Algorithm (Transparency)**
   - "We use a weighted median algorithm"
   - Reasonable predictions (within 5 years): Full weight (1.0)
   - Far predictions (5-50 years): Reduced weight (0.3)
   - Extreme predictions (50+ years): Minimal weight (0.1)
   - "This means trolls submitting '2099' have less influence than reasonable predictions"

5. **Privacy & Data**
   - "We take privacy seriously"
   - IP addresses hashed (never stored in plain text)
   - Cookies used only for tracking your prediction (no tracking)
   - No personal data collected
   - Link to Privacy Policy

6. **Who Made This**
   - Creator name/pseudonym
   - "Built by a GTA fan for GTA fans"
   - Open about being solo project or small team
   - Contact email

7. **Open Source / Transparency**
   - Consider open-sourcing algorithm code
   - Link to GitHub if available
   - "Nothing to hide, everything transparent"

### Tone and Formatting
- Conversational, friendly, not corporate
- Honest about limitations
- Builds trust through transparency
- Mobile-responsive design
- Links from main navigation and footer

### Testing Requirements
- [ ] Unit tests for about page route
- [ ] Test page accessibility (WCAG AA compliance)
- [ ] Test all 7 sections present
- [ ] Test links to Privacy Policy work
- [ ] Test mobile responsiveness
- [ ] Test navigation and footer links

## Tasks / Subtasks

- [ ] Task 1: Create about page HTML structure (AC: All content sections)
  - [ ] Create `public/about.html` file
  - [ ] Add page header with title "About"
  - [ ] Structure 7 required sections with headers
  - [ ] Apply conversational tone

- [ ] Task 2: Write "What Is This?" section (AC: Section 1)
  - [ ] Describe community-driven prediction tracker
  - [ ] Emphasize real community sentiment
  - [ ] Highlight anonymous participation

- [ ] Task 3: Write "Why This Exists" section (AC: Section 2)
  - [ ] Explain Rockstar delay and community skepticism
  - [ ] Identify gap in existing tools
  - [ ] Justify need for sentiment tracker

- [ ] Task 4: Write "How It Works" section (AC: Section 3)
  - [ ] Explain anonymous submission process
  - [ ] Describe weighted median calculation
  - [ ] Explain community consensus display
  - [ ] Promote sharing functionality

- [ ] Task 5: Write "The Algorithm" section (AC: Section 4)
  - [ ] Explain weighted median concept
  - [ ] List weight tiers (1.0, 0.3, 0.1)
  - [ ] Justify troll mitigation
  - [ ] Use plain language for technical concept

- [ ] Task 6: Write "Privacy & Data" section (AC: Section 5)
  - [ ] Emphasize privacy commitment
  - [ ] Explain IP hashing
  - [ ] Clarify cookie usage
  - [ ] Link to Privacy Policy

- [ ] Task 7: Write "Who Made This" section (AC: Section 6)
  - [ ] Introduce creator (name/pseudonym)
  - [ ] Emphasize fan-made nature
  - [ ] Provide contact email

- [ ] Task 8: Write "Open Source / Transparency" section (AC: Section 7)
  - [ ] Mention open-source consideration
  - [ ] Link to GitHub if available
  - [ ] Emphasize transparency

- [ ] Task 9: Style about page (AC: Tone and formatting)
  - [ ] Apply Tailwind CSS styling
  - [ ] Ensure mobile responsiveness
  - [ ] Use friendly, conversational formatting
  - [ ] Add spacing for readability

- [ ] Task 10: Add navigation links (AC: Links from navigation and footer)
  - [ ] Update `public/index.html` with About link in navigation
  - [ ] Update footer on all pages with About link
  - [ ] Ensure link points to /about.html

- [ ] Task 11: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/about-page.test.ts`
  - [ ] Test /about route accessibility
  - [ ] Test all 7 sections present
  - [ ] Test Privacy Policy link works
  - [ ] Test mobile responsive breakpoints
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.4 (About Page - Transparency & Methodology):**
- 7 content sections explaining site purpose, methodology, privacy
- Conversational tone, not corporate
- Algorithm transparency to prevent "rigged" accusations
- Privacy commitment emphasis
- Creator transparency
- Links from navigation and footer

[Source: docs/epics/epic-4-privacy-compliance-trust.md:201-275]

**From PRD - FR98 (About Page Explaining Data Usage, Privacy, Methodology):**
- Transparency builds trust with skeptical gaming community
- Reddit mods more likely to approve if transparent about methods
- Honesty about weighted algorithm prevents "rigged" accusations

[Source: Derived from Epic 4 Story 4.4]

### Architecture Patterns

**From Architecture - Weighted Median Algorithm:**
```typescript
export function calculateWeight(predictedDate: string): number {
  const officialDate = dayjs('2026-11-19');
  const predicted = dayjs(predictedDate);
  const yearsDiff = Math.abs(predicted.diff(officialDate, 'year', true));

  if (yearsDiff <= 5) return 1.0;    // 2025-2030: full weight
  if (yearsDiff <= 50) return 0.3;   // 2030-2075: reduced weight
  return 0.1;                        // Beyond 50 years: minimal weight
}
```

[Source: docs/architecture.md:445-467]

**About Page Template Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>About - GTA 6 Launch Date Predictions</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>About GTA 6 Predictions</h1>
  </header>

  <main>
    <section id="what-is-this">
      <h2>What Is This?</h2>
      <p>A community-driven tracker...</p>
    </section>

    <!-- 7 sections total -->
  </main>

  <footer>
    <a href="/">Home</a> |
    <a href="/privacy.html">Privacy Policy</a> |
    <a href="/terms.html">Terms of Service</a>
  </footer>
</body>
</html>
```

### Project Structure Notes

**File Structure:**
```
public/
├── about.html                   (NEW - about page)
├── index.html                   (MODIFY - add about link in navigation)
├── privacy.html                 (MODIFY - add about link in footer)
├── terms.html                   (MODIFY - add about link in footer)
├── styles.css                   (MAY MODIFY - about page styling)
tests/
├── unit/
│   └── about-page.test.ts       (NEW - page tests)
```

**Static Page Pattern:**
- Follows same pattern as Privacy Policy and Terms of Service
- No backend API required
- Pure HTML/CSS with Tailwind styling
- Footer and navigation component reused

### Learnings from Previous Story

**From Story 4.3 (Terms of Service Page):**
- ✅ **Static legal page template:** HTML structure established
- ✅ **Footer link pattern:** Consistent across pages
- **Recommendation:** Reuse same footer structure for About page

**From Story 4.2 (Privacy Policy Page):**
- ✅ **Table of contents pattern:** Can adapt for About page sections
- ✅ **Mobile-responsive design:** Tailwind CSS applied
- **Recommendation:** Similar section structure for consistency

**From Story 2.9 (Weighted Median Algorithm):**
- ✅ **Algorithm implementation:** Weight calculation logic established
- **Recommendation:** Explain algorithm transparently on About page using plain language

**New Patterns Created:**
- Conversational tone for community-facing content
- Algorithm transparency template

**Files to Reuse:**
- `public/privacy.html` - Footer link pattern
- `public/terms.html` - Footer link pattern
- `public/index.html` - Navigation link pattern
- Tailwind CSS - Apply consistent styling

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.4 Definition](docs/epics/epic-4-privacy-compliance-trust.md:201-275)

**PRD:**
- [PRD - FR98: About Page Explaining Data Usage, Privacy, Methodology](docs/epics/epic-4-privacy-compliance-trust.md:210-220)

**Architecture:**
- [Architecture - Weighted Median Algorithm](docs/architecture.md:445-467)

**Dependencies:**
- Story 4.2 (Privacy Policy page - link target)
- Story 2.9 (Weighted median algorithm - explain methodology)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-4-about-page-transparency-and-methodology.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
