# Story 4.2: Privacy Policy Page

Status: ready-for-dev

## Story

As a user,
I want to read the privacy policy,
so that I understand how my data is collected, used, and protected.

## Acceptance Criteria

**Given** the site has a privacy policy requirement (GDPR)
**When** a user navigates to /privacy or clicks Privacy Policy link
**Then** a comprehensive privacy policy page is displayed with all required GDPR sections
**And** automated tests exist covering main functionality

### Required Sections

1. **Data Collection**
   - What we collect: Prediction date, cookie ID, hashed IP, user agent, timestamps
   - How we collect: Direct submission, browser cookies, server logs
   - Why we collect: Provide core service, prevent spam, analytics

2. **Data Usage**
   - Calculate community median
   - Track user predictions for updates
   - Prevent spam/abuse via IP hashing
   - Understand traffic patterns (if analytics enabled)

3. **Data Storage**
   - Where: Cloudflare D1 database (EU/US regions)
   - How long: Indefinitely for predictions, 24 months for analytics (FR90)
   - Security: Encrypted in transit (HTTPS), IP hashing (no plaintext IPs)

4. **Data Sharing**
   - We do NOT sell data
   - We do NOT share with third parties except:
     - Cloudflare (hosting provider)
     - Google (reCAPTCHA, optional analytics)
     - Legal requirements (if compelled)

5. **Your Rights (GDPR)**
   - Right to access: View your prediction
   - Right to rectification: Update your prediction
   - Right to erasure: Delete your prediction (FR54-55)
   - Right to object: Opt out of analytics

6. **Cookies**
   - Types: Functional (required), Analytics (optional)
   - Purpose: Track predictions, prevent spam, measure usage
   - Duration: 2 years for functional, 12 months for analytics

7. **Contact**
   - Email: privacy@gta6predictions.com (or equivalent)
   - Response time: 30 days maximum

### Page Formatting
- Plain language (no legalese where possible)
- Table of contents with jump links
- Last updated date displayed
- Link from footer on every page
- Mobile-responsive design

### Testing Requirements
- [ ] Unit tests for privacy page route
- [ ] Test page accessibility (WCAG AA compliance)
- [ ] Test table of contents navigation
- [ ] Test mobile responsiveness
- [ ] Test footer link presence on all pages
- [ ] Test last updated date display

## Tasks / Subtasks

- [ ] Task 1: Create privacy policy HTML structure (AC: All required sections)
  - [ ] Create `public/privacy.html` file
  - [ ] Add page header with title "Privacy Policy"
  - [ ] Add last updated date display
  - [ ] Create table of contents with anchor links
  - [ ] Structure 7 required sections with headers

- [ ] Task 2: Write Data Collection section (AC: Section 1)
  - [ ] List what data is collected
  - [ ] Explain how data is collected
  - [ ] Explain why data is collected
  - [ ] Use plain language, avoid jargon

- [ ] Task 3: Write Data Usage section (AC: Section 2)
  - [ ] Explain median calculation usage
  - [ ] Explain prediction tracking usage
  - [ ] Explain spam prevention usage
  - [ ] Explain optional analytics usage

- [ ] Task 4: Write Data Storage section (AC: Section 3)
  - [ ] Specify Cloudflare D1 storage location
  - [ ] State retention periods (indefinite for predictions, 24 months for analytics)
  - [ ] Describe security measures (HTTPS, IP hashing)

- [ ] Task 5: Write Data Sharing section (AC: Section 4)
  - [ ] State "We do NOT sell data"
  - [ ] List third-party services (Cloudflare, Google)
  - [ ] Explain legal compliance sharing

- [ ] Task 6: Write Your Rights (GDPR) section (AC: Section 5)
  - [ ] Right to access: Link to /delete page
  - [ ] Right to rectification: Explain update capability
  - [ ] Right to erasure: Link to deletion form (Story 4.6)
  - [ ] Right to object: Explain analytics opt-out

- [ ] Task 7: Write Cookies section (AC: Section 6)
  - [ ] Explain functional cookies (gta6_user_id)
  - [ ] Explain analytics cookies (optional)
  - [ ] State durations (2 years functional, 12 months analytics)

- [ ] Task 8: Write Contact section (AC: Section 7)
  - [ ] Provide privacy contact email
  - [ ] State 30-day response time commitment

- [ ] Task 9: Style privacy policy page (AC: Page formatting)
  - [ ] Apply Tailwind CSS styling
  - [ ] Ensure mobile responsiveness
  - [ ] Style table of contents
  - [ ] Add jump link smooth scrolling

- [ ] Task 10: Add footer link to all pages (AC: Footer link)
  - [ ] Update `public/index.html` footer with Privacy Policy link
  - [ ] Ensure link points to /privacy.html
  - [ ] Test link on all pages

- [ ] Task 11: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/privacy-page.test.ts`
  - [ ] Test /privacy route accessibility
  - [ ] Test all 7 sections present
  - [ ] Test table of contents links work
  - [ ] Test mobile responsive breakpoints
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.2 (Privacy Policy Page):**
- Comprehensive privacy policy with 7 required sections
- Plain language, accessible to non-technical users
- Table of contents with jump links
- Last updated date
- Link from footer on every page
- Mobile-responsive design
- Indefinite prediction retention, 24-month analytics retention

[Source: docs/epics/epic-4-privacy-compliance-trust.md:61-129]

**From PRD - FR51 (Privacy Policy Accessible):**
- Users can access Privacy Policy via footer link
- GDPR compliance requirement

[Source: docs/PRD.md:314-320]

**From PRD - FR90 (24-Month Analytics Retention):**
- Analytics data retained for 24 months maximum
- Must be stated in Privacy Policy

[Source: Derived from Epic 4 Story 4.2]

### Architecture Patterns

**From Architecture - Security Architecture:**
- GDPR Compliance:
  - Cookie consent banner (via simple HTML modal)
  - Privacy Policy page (`public/privacy.html`)
  - Terms of Service page (`public/terms.html`)
  - IP hashing (SHA-256 with salt)
  - Data deletion: Implement DELETE endpoint (on request)
  - Right to be forgotten: Delete prediction by cookie_id

[Source: docs/architecture.md:674-706]

**From Architecture - Database Schema:**
- Predictions table: id, predicted_date, submitted_at, updated_at, ip_hash, cookie_id, user_agent, weight
- IP addresses hashed with SHA-256 before storage
- UNIQUE constraints on ip_hash and cookie_id

[Source: docs/architecture.md:229-259]

**Privacy Policy Template Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Policy - GTA 6 Launch Date Predictions</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last Updated: {{date}}</p>
  </header>

  <nav class="table-of-contents">
    <ul>
      <li><a href="#data-collection">Data Collection</a></li>
      <li><a href="#data-usage">Data Usage</a></li>
      <!-- ... -->
    </ul>
  </nav>

  <main>
    <section id="data-collection">
      <h2>1. Data Collection</h2>
      <!-- Content -->
    </section>
    <!-- ... -->
  </main>

  <footer>
    <a href="/">Home</a> |
    <a href="/terms.html">Terms of Service</a> |
    <a href="/about.html">About</a>
  </footer>
</body>
</html>
```

### Project Structure Notes

**File Structure:**
```
public/
├── privacy.html                 (NEW - privacy policy page)
├── index.html                   (MODIFY - add footer link)
├── styles.css                   (MAY MODIFY - privacy page styling)
tests/
├── unit/
│   └── privacy-page.test.ts     (NEW - page tests)
```

**Static Page Pattern:**
- Similar to About page (Story 4.4)
- No backend API required
- Pure HTML/CSS with Tailwind styling
- Footer component reused across pages

### Learnings from Previous Story

**From Story 4.1 (GDPR Cookie Consent Banner):**
- ✅ **Cookie types defined:** Functional (gta6_user_id) vs Analytics (optional)
- ✅ **Consent banner pattern:** User consent recorded in cookie_consent cookie
- **Recommendation:** Reference cookie consent in Privacy Policy Section 6 (Cookies)
- **Integration:** Link "Learn more" in consent banner to this privacy page

**From Story 2.2 (IP Address Hashing):**
- ✅ **IP hashing implemented:** SHA-256 with salt before storage
- ✅ **No plaintext IPs stored:** Privacy-preserving anti-spam
- **Recommendation:** Explain IP hashing in Section 3 (Data Storage)

**From Story 2.1 (Secure Cookie ID Generation):**
- ✅ **Cookie ID generation:** UUID v4 format, 365-day expiration
- ✅ **Cookie attributes:** `secure`, `sameSite=strict`
- **Recommendation:** Explain cookie purpose in Section 6 (Cookies)

**New Patterns Created:**
- Static legal page template (reuse for Terms of Service)

**Files to Reuse:**
- `public/index.html` - Add footer link pattern
- Tailwind CSS - Apply consistent styling

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.2 Definition](docs/epics/epic-4-privacy-compliance-trust.md:61-129)

**PRD:**
- [PRD - FR51: Privacy Policy Accessible](docs/PRD.md:314-320)
- [PRD - FR90: 24-Month Analytics Retention](docs/epics/epic-4-privacy-compliance-trust.md:88)

**Architecture:**
- [Architecture - Security: GDPR Compliance](docs/architecture.md:674-706)
- [Architecture - Database Schema](docs/architecture.md:229-259)

**Dependencies:**
- Story 4.1 (Cookie consent banner - referenced in cookies section)
- Story 4.6 (Data deletion form - link for "right to erasure")
- Story 2.2 (IP hashing - explain security measure)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-2-privacy-policy-page.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
