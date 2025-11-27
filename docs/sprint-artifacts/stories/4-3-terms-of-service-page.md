# Story 4.3: Terms of Service Page

Status: ready-for-dev

## Story

As a site owner,
I want clear terms of service,
so that user expectations and liabilities are defined.

## Acceptance Criteria

**Given** the site needs terms of service (legal protection)
**When** a user navigates to /terms or clicks Terms of Service link
**Then** a comprehensive ToS page is displayed with all required sections
**And** automated tests exist covering main functionality

### Required Sections

1. **Acceptance of Terms**
   - By using site, you agree to terms
   - If you don't agree, don't use the site

2. **Service Description**
   - Community prediction tracking for GTA 6 launch date
   - No guarantees about accuracy or outcomes
   - Service is "as-is" without warranties

3. **User Conduct**
   - No spamming or bot submissions
   - No attempting to manipulate results
   - No harassment or abusive content
   - We reserve right to remove predictions

4. **Intellectual Property**
   - Site content © 2025 GTA6Predictions
   - User predictions remain user's IP
   - GTA 6 trademarks owned by Rockstar Games (fair use)

5. **Liability Limitations**
   - Service provided for entertainment purposes
   - No liability for predictions being inaccurate
   - No liability for data loss or service interruptions
   - Maximum liability: $0 (free service)

6. **Dispute Resolution**
   - Governing law: [Your jurisdiction]
   - Informal resolution first, then arbitration
   - Class action waiver

7. **Modifications**
   - We may update terms with notice
   - Continued use = acceptance of new terms

8. **Termination**
   - We may terminate service at any time
   - Users may request deletion of data

### Page Formatting
- Numbered sections for easy reference
- Last updated date displayed
- Link from footer on every page
- Not required to accept before use (browse freely)
- Mobile-responsive design

### Testing Requirements
- [ ] Unit tests for terms page route
- [ ] Test page accessibility (WCAG AA compliance)
- [ ] Test numbered section structure
- [ ] Test mobile responsiveness
- [ ] Test footer link presence on all pages
- [ ] Test last updated date display

## Tasks / Subtasks

- [ ] Task 1: Create terms of service HTML structure (AC: All required sections)
  - [ ] Create `public/terms.html` file
  - [ ] Add page header with title "Terms of Service"
  - [ ] Add last updated date display
  - [ ] Structure 8 required sections with numbered headers

- [ ] Task 2: Write Acceptance of Terms section (AC: Section 1)
  - [ ] State agreement by using site
  - [ ] State refusal option (don't use)
  - [ ] Use clear, enforceable language

- [ ] Task 3: Write Service Description section (AC: Section 2)
  - [ ] Describe prediction tracking service
  - [ ] State "as-is" without warranties
  - [ ] Clarify no guarantees about accuracy

- [ ] Task 4: Write User Conduct section (AC: Section 3)
  - [ ] List prohibited activities (spam, bots, manipulation)
  - [ ] State right to remove predictions
  - [ ] Explain consequences of violations

- [ ] Task 5: Write Intellectual Property section (AC: Section 4)
  - [ ] Copyright notice for site content
  - [ ] User predictions ownership
  - [ ] Fair use disclaimer for GTA 6 trademarks

- [ ] Task 6: Write Liability Limitations section (AC: Section 5)
  - [ ] Entertainment purposes disclaimer
  - [ ] No liability for inaccuracy
  - [ ] No liability for data loss
  - [ ] Maximum liability: $0

- [ ] Task 7: Write Dispute Resolution section (AC: Section 6)
  - [ ] Specify governing law/jurisdiction
  - [ ] Informal resolution process
  - [ ] Arbitration clause
  - [ ] Class action waiver

- [ ] Task 8: Write Modifications section (AC: Section 7)
  - [ ] Right to update terms
  - [ ] Notice requirements
  - [ ] Continued use = acceptance

- [ ] Task 9: Write Termination section (AC: Section 8)
  - [ ] Right to terminate service
  - [ ] User data deletion rights

- [ ] Task 10: Style terms of service page (AC: Page formatting)
  - [ ] Apply Tailwind CSS styling
  - [ ] Ensure mobile responsiveness
  - [ ] Style numbered sections clearly
  - [ ] Add spacing for readability

- [ ] Task 11: Add footer link to all pages (AC: Footer link)
  - [ ] Update `public/index.html` footer with Terms of Service link
  - [ ] Update `public/privacy.html` footer with Terms link
  - [ ] Ensure link points to /terms.html

- [ ] Task 12: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/terms-page.test.ts`
  - [ ] Test /terms route accessibility
  - [ ] Test all 8 sections present
  - [ ] Test numbered section structure
  - [ ] Test mobile responsive breakpoints
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.3 (Terms of Service Page):**
- Comprehensive ToS with 8 required sections
- Numbered sections for easy reference
- Last updated date
- Link from footer on every page
- Not required to accept before use (browse freely)
- Mobile-responsive design
- Legal protection for site owner

[Source: docs/epics/epic-4-privacy-compliance-trust.md:131-199]

**From PRD - FR52 (Terms of Service Accessible):**
- Users can access Terms of Service via footer link
- Legal protection requirement

[Source: docs/PRD.md:314-320]

### Architecture Patterns

**From Architecture - Security Architecture:**
- GDPR Compliance:
  - Privacy Policy page (`public/privacy.html`)
  - Terms of Service page (`public/terms.html`)
  - Right to be forgotten: Delete prediction by cookie_id

[Source: docs/architecture.md:674-706]

**Terms of Service Template Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Terms of Service - GTA 6 Launch Date Predictions</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Terms of Service</h1>
    <p class="last-updated">Last Updated: {{date}}</p>
  </header>

  <main>
    <section id="acceptance">
      <h2>1. Acceptance of Terms</h2>
      <p>By using this site, you agree to these terms...</p>
    </section>

    <section id="service-description">
      <h2>2. Service Description</h2>
      <p>GTA6Predictions.com provides...</p>
    </section>

    <!-- 8 sections total -->
  </main>

  <footer>
    <a href="/">Home</a> |
    <a href="/privacy.html">Privacy Policy</a> |
    <a href="/about.html">About</a>
  </footer>
</body>
</html>
```

### Project Structure Notes

**File Structure:**
```
public/
├── terms.html                   (NEW - terms of service page)
├── privacy.html                 (MODIFY - add terms link in footer)
├── index.html                   (MODIFY - add terms link in footer)
├── styles.css                   (MAY MODIFY - terms page styling)
tests/
├── unit/
│   └── terms-page.test.ts       (NEW - page tests)
```

**Static Legal Page Pattern:**
- Follows same pattern as Privacy Policy (Story 4.2)
- No backend API required
- Pure HTML/CSS with Tailwind styling
- Footer component reused across pages

### Learnings from Previous Story

**From Story 4.2 (Privacy Policy Page):**
- ✅ **Static legal page template:** HTML structure established
- ✅ **Footer link pattern:** Consistent across pages
- ✅ **Last updated date display:** Pattern established
- ✅ **Mobile-responsive design:** Tailwind CSS applied
- **Recommendation:** Reuse same page structure and styling for consistency

**From Story 4.1 (GDPR Cookie Consent Banner):**
- ✅ **Legal compliance emphasis:** GDPR requirements
- **Recommendation:** Link Terms from Privacy Policy for cross-reference

**New Patterns Created:**
- Legal disclaimer language pattern (reuse for other legal pages)

**Files to Reuse:**
- `public/privacy.html` - Footer link pattern
- `public/index.html` - Footer link pattern
- Tailwind CSS - Apply consistent styling

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.3 Definition](docs/epics/epic-4-privacy-compliance-trust.md:131-199)

**PRD:**
- [PRD - FR52: Terms of Service Accessible](docs/PRD.md:314-320)

**Architecture:**
- [Architecture - Security: GDPR Compliance](docs/architecture.md:674-706)

**Dependencies:**
- Story 4.2 (Privacy Policy page - cross-link in footer)
- Story 4.4 (About page - cross-link in footer)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**Legal Resources:**
- Consider using ToS generator (e.g., termly.io, termsfeed.com)
- Review by legal professional strongly recommended

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-3-terms-of-service-page.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
