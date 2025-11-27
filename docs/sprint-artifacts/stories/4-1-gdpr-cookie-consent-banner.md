# Story 4.1: GDPR Cookie Consent Banner

Status: ready-for-dev

## Story

As a user,
I want to understand what cookies are used and consent to their use,
so that my privacy rights are respected (GDPR requirement).

## Acceptance Criteria

**Given** a user visits the site for the first time
**When** the page loads
**Then** a cookie consent banner is displayed with proper GDPR-compliant options
**And** automated tests exist covering main functionality

### Banner Content and Behavior

1. **Banner Display:**
   - Headline: "We use cookies"
   - Description: "We use functional cookies to save your prediction and analytics cookies to understand usage. You can opt out of analytics."
   - Two buttons: "Accept All" | "Functional Only"
   - Link: "Learn more" → Privacy Policy
   - Appears at bottom of screen (non-intrusive)
   - Does not block content access
   - Dismisses on button click
   - Stores consent choice in cookie: `cookie_consent` with value "all" or "functional"

2. **Granular Consent (FR68):**
   - **Functional cookies:** Always enabled (required for core features)
     - `gta6_user_id` (prediction tracking)
   - **Analytics cookies:** Optional (user can decline)
     - Cloudflare Analytics
     - Ad tracking cookies (if present)

3. **Consent Behavior:**
   - "Accept All": Set both functional and analytics cookies
   - "Functional Only": Only set gta6_user_id, disable analytics
   - No choice yet: Only functional cookies (default)
   - Consent before non-essential cookies set
   - Clear explanation of cookie purposes
   - Easy opt-out mechanism
   - Consent recorded with timestamp

### Testing Requirements
- [ ] Unit tests for consent banner display logic
- [ ] Test consent choice storage (cookie creation)
- [ ] Test "Accept All" button behavior
- [ ] Test "Functional Only" button behavior
- [ ] Test banner dismissal on click
- [ ] Test analytics script loading based on consent
- [ ] Test banner reappearance after cookie expiration
- [ ] Integration test for cookie consent flow

## Tasks / Subtasks

- [ ] Task 1: Design cookie consent banner UI (AC: Banner display)
  - [ ] Create banner HTML structure in index.html
  - [ ] Style banner with Tailwind CSS (bottom fixed position)
  - [ ] Add "We use cookies" headline
  - [ ] Add description text explaining functional vs analytics
  - [ ] Create "Accept All" and "Functional Only" buttons
  - [ ] Add "Learn more" link to Privacy Policy

- [ ] Task 2: Implement consent logic (AC: Consent behavior)
  - [ ] Create `public/js/cookie-consent.js` module
  - [ ] Implement `checkConsentStatus()` function
  - [ ] Implement `showConsentBanner()` function
  - [ ] Implement `hideConsentBanner()` function
  - [ ] Add event listeners for button clicks
  - [ ] Store consent in `cookie_consent` cookie (12-month expiration)

- [ ] Task 3: Implement granular consent handling (AC: Granular consent)
  - [ ] Create `setAnalyticsEnabled(enabled)` function
  - [ ] If "Accept All": Enable analytics, set cookie_consent=all
  - [ ] If "Functional Only": Disable analytics, set cookie_consent=functional
  - [ ] Ensure functional cookies always work (gta6_user_id)

- [ ] Task 4: Integrate with existing analytics (AC: Analytics script loading)
  - [ ] Modify Cloudflare Analytics script loading based on consent
  - [ ] Load analytics only if cookie_consent=all
  - [ ] Skip analytics if cookie_consent=functional
  - [ ] Default to functional only until consent given

- [ ] Task 5: Add banner visibility logic (AC: Banner display)
  - [ ] Show banner on first visit (no cookie_consent cookie)
  - [ ] Hide banner if cookie_consent exists and valid
  - [ ] Re-show banner after 12 months (cookie expiration)
  - [ ] Add aria-live for accessibility

- [ ] Task 6: Link to Privacy Policy (prerequisite: Story 4.2)
  - [ ] Update "Learn more" link href to /privacy
  - [ ] Ensure Privacy Policy page exists (created in Story 4.2)

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `src/cookie-consent.test.ts` or similar
  - [ ] Test banner display on first visit
  - [ ] Test consent storage in cookie
  - [ ] Test analytics enabling/disabling
  - [ ] Test banner dismissal
  - [ ] Test consent persistence across page loads
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.1 (GDPR Cookie Consent Banner):**
- Banner at bottom, non-intrusive, does not block content
- Two buttons: "Accept All" | "Functional Only"
- Functional cookies always enabled (gta6_user_id)
- Analytics cookies optional (user can decline)
- Consent stored in cookie_consent cookie (all or functional)
- Consent before non-essential cookies set
- 12-month consent storage, re-ask after expiration

[Source: docs/epics/epic-4-privacy-compliance-trust.md:7-59]

**From PRD - FR50 (Cookie Consent Banner):**
- System displays cookie consent banner on first visit (GDPR)
- Banner explains cookie usage and offers consent

[Source: docs/PRD.md:314-320]

**From PRD - FR68 (Granular Cookie Consent):**
- Functional cookies vs analytics cookies distinction
- User can opt out of analytics while keeping functional

[Source: Derived from Epic 4 Story 4.1]

### Architecture Patterns

**From Architecture - Security Architecture:**
- Cookie Security:
  - Flags: `httpOnly`, `secure`, `sameSite=strict`
  - js-cookie library handles encoding/decoding safely
- GDPR Compliance:
  - Cookie consent banner (via simple HTML modal)
  - IP hashing (SHA-256 with salt)
  - Right to be forgotten: Delete prediction by cookie_id

[Source: docs/architecture.md:674-706]

**From Architecture - Cookie Management:**
```javascript
import Cookies from 'js-cookie';

// Set user cookie (365 days)
Cookies.set('gta6_user_id', generateCookieId(), {
  expires: 365,
  secure: true,
  sameSite: 'strict'
});

// Get user cookie
const userId = Cookies.get('gta6_user_id');
```

[Source: docs/architecture.md:537-561]

**Cookie Consent Pattern:**
```javascript
// Check consent status
function getConsentStatus() {
  return Cookies.get('cookie_consent'); // 'all' | 'functional' | undefined
}

// Set consent
function setConsent(level) {
  Cookies.set('cookie_consent', level, {
    expires: 365, // 12 months
    secure: true,
    sameSite: 'strict'
  });
}

// Enable/disable analytics based on consent
function initializeAnalytics() {
  const consent = getConsentStatus();
  if (consent === 'all') {
    // Load Cloudflare Analytics
    enableAnalytics();
  }
  // Functional cookies always work
}
```

### Project Structure Notes

**File Structure:**
```
public/
├── js/
│   ├── cookie-consent.js        (NEW - consent banner logic)
│   ├── app.js                   (MODIFY - check consent before analytics)
├── index.html                   (MODIFY - add consent banner HTML)
├── styles.css                   (MODIFY - banner styling if needed)
tests/
├── unit/
│   └── cookie-consent.test.ts   (NEW - unit tests)
```

**Dependencies:**
- js-cookie library (already in use for gta6_user_id)
- Tailwind CSS (already in use for styling)
- Cloudflare Analytics (conditional loading)

### Learnings from Previous Story

**From Story 3.7 (Graceful Degradation Under Load):**
- ✅ **Banner pattern established:** Degradation notices use banner display logic
- ✅ **ARIA live regions:** Accessibility for screen reader announcements
- ✅ **Polling pattern:** Can reuse for checking consent status
- **Recommendation:** Follow similar banner display pattern for consistency

**From Story 2.1 (Secure Cookie ID Generation):**
- ✅ **Cookie generation pattern:** `gta6_user_id` cookie creation established
- ✅ **js-cookie library:** Already in use, can extend for consent cookie
- ✅ **Cookie attributes:** `secure`, `sameSite=strict` established
- **Recommendation:** Use same cookie attributes for cookie_consent

**New Patterns Created:**
- None yet (first story in Epic 4)

**Files to Reuse:**
- `public/js/app.js` - Modify to check consent before loading analytics
- `public/index.html` - Add consent banner HTML

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.1 Definition](docs/epics/epic-4-privacy-compliance-trust.md:7-59)

**PRD:**
- [PRD - FR50: Cookie Consent Banner](docs/PRD.md:314-320)

**Architecture:**
- [Architecture - Security: Cookie Security](docs/architecture.md:674-706)
- [Architecture - Cookie Management Pattern](docs/architecture.md:537-561)

**Dependencies:**
- Story 2.1 (Cookie ID generation - pattern reuse)
- Story 4.2 (Privacy Policy page - link target)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-1-gdpr-cookie-consent-banner.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
