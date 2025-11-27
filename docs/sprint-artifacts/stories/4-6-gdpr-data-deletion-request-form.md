# Story 4.6: GDPR Data Deletion Request Form

Status: ready-for-dev

## Story

As a user,
I want to request deletion of my data,
so that I can exercise my "right to be forgotten" (GDPR).

## Acceptance Criteria

**Given** GDPR requires data deletion capability (FR54-55)
**When** a user navigates to /delete or Privacy Policy deletion section
**Then** a data deletion request form is displayed with proper validation and confirmation flow
**And** automated tests exist covering main functionality

### Form Fields

1. **Cookie ID** (auto-populated if cookie exists, else manual input)
   - Label: "Your Cookie ID"
   - Help text: "Found in browser cookies as 'gta6_user_id'"
   - Validation: UUID v4 format

2. **Email** (optional but recommended)
   - Label: "Email address (for confirmation)"
   - Help text: "We'll confirm deletion at this address"
   - Validation: Valid email format

3. **Reason** (optional, for analytics)
   - Label: "Why are you deleting? (optional)"
   - Options: Privacy concerns, No longer interested, Other
   - Helps improve service

4. **Confirm** (required)
   - Checkbox: "I understand this action is permanent"

### Submission Process

1. User submits form
2. Backend validates cookie_id exists in database
3. Send confirmation email (if provided):
   ```
   Subject: Confirm Data Deletion Request

   Click this link to confirm deletion:
   https://gta6predictions.com/delete/confirm?token=...

   This link expires in 24 hours.
   ```
4. User clicks confirmation link
5. Backend deletes prediction record:
   ```sql
   DELETE FROM predictions WHERE cookie_id = ?
   ```
6. Display: "Your data has been deleted."

### Edge Cases
- Cookie ID not found: "No prediction found for this ID"
- No email provided: Immediate deletion (less secure but allowed)
- Email provided but not confirmed: Delete after 30 days (GDPR grace period)

### Deletion Scope
- Prediction record deleted
- Cookie ID removed from database
- IP hash removed
- Analytics data removed (if tied to cookie)
- User must manually delete browser cookie

### Testing Requirements
- [ ] Unit tests for deletion request endpoint
- [ ] Test cookie ID validation (UUID v4)
- [ ] Test email validation
- [ ] Test confirmation email sending
- [ ] Test deletion execution
- [ ] Test edge cases (not found, no email)
- [ ] Integration test for full deletion flow

## Tasks / Subtasks

- [ ] Task 1: Create deletion request form HTML (AC: Form fields)
  - [ ] Create `public/delete.html` page
  - [ ] Add form with 4 fields: cookie_id, email, reason, confirm
  - [ ] Auto-populate cookie_id if exists
  - [ ] Style form with Tailwind CSS
  - [ ] Add client-side validation

- [ ] Task 2: Implement form validation (AC: Form fields)
  - [ ] Validate cookie_id is UUID v4 format
  - [ ] Validate email format (if provided)
  - [ ] Require confirm checkbox checked
  - [ ] Show validation errors inline

- [ ] Task 3: Create deletion request API endpoint (AC: Submission process)
  - [ ] Create `src/routes/delete.ts`
  - [ ] POST /api/delete endpoint
  - [ ] Validate cookie_id exists in database
  - [ ] If email provided: Generate confirmation token
  - [ ] If no email: Immediate deletion
  - [ ] Return success/error response

- [ ] Task 4: Implement confirmation email flow (AC: Submission process)
  - [ ] Generate unique confirmation token (UUID v4)
  - [ ] Store token in KV with 24-hour TTL
  - [ ] Send confirmation email (if email provided)
  - [ ] Email template with confirmation link
  - [ ] Link format: /delete/confirm?token=...

- [ ] Task 5: Create confirmation endpoint (AC: Submission process)
  - [ ] GET /delete/confirm endpoint
  - [ ] Validate token exists in KV
  - [ ] Retrieve cookie_id from token
  - [ ] Execute deletion
  - [ ] Display confirmation page

- [ ] Task 6: Implement deletion logic (AC: Deletion scope)
  - [ ] Create `deletePrediction(cookieId)` function
  - [ ] Delete from predictions table
  - [ ] Delete from analytics (if tied to cookie)
  - [ ] Log deletion for compliance audit
  - [ ] Return success confirmation

- [ ] Task 7: Handle edge cases (AC: Edge cases)
  - [ ] Cookie ID not found: Return 404 with helpful message
  - [ ] No email provided: Immediate deletion
  - [ ] Email not confirmed after 30 days: Auto-delete
  - [ ] Token expired: Show error, offer re-request

- [ ] Task 8: Link to deletion form from Privacy Policy (AC: Navigation)
  - [ ] Update `public/privacy.html` Section 5 (Your Rights)
  - [ ] Add link to /delete.html
  - [ ] Explain deletion process

- [ ] Task 9: Add deletion info to About page (AC: Transparency)
  - [ ] Update `public/about.html` Section 5 (Privacy & Data)
  - [ ] Link to deletion form
  - [ ] Emphasize user control

- [ ] Task 10: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/delete-request.test.ts`
  - [ ] Test deletion request form validation
  - [ ] Test API endpoint validation
  - [ ] Test confirmation email flow
  - [ ] Test deletion execution
  - [ ] Test edge cases (not found, no email)
  - [ ] Verify test coverage: 90%+

## Dev Notes

### Requirements Context

**From Epic 4 Story 4.6 (GDPR Data Deletion Request Form):**
- User-facing deletion request form
- 4 form fields: cookie_id, email, reason, confirm
- Confirmation email flow (24-hour expiration)
- Immediate deletion if no email provided
- GDPR compliance: 30-day response time
- Deletion scope: prediction record, IP hash, analytics data

[Source: docs/epics/epic-4-privacy-compliance-trust.md:322-394]

**From PRD - FR54 (Data Deletion via Contact Form):**
- System allows users to request data deletion via contact form
- GDPR "right to be forgotten" requirement

[Source: docs/PRD.md:314-320]

**From PRD - FR55 (GDPR "Right to Be Forgotten"):**
- System complies with GDPR "right to be forgotten"
- Users can delete their prediction data

[Source: docs/PRD.md:314-320]

**From PRD - FR101 (User-Facing Deletion Request Form):**
- Dedicated /delete page with form
- User can request deletion without contacting support

[Source: Derived from Epic 4 Story 4.6]

### Architecture Patterns

**From Architecture - Security Architecture:**
- GDPR Compliance:
  - Data deletion: Implement DELETE endpoint (on request)
  - Right to be forgotten: Delete prediction by cookie_id

[Source: docs/architecture.md:674-706]

**Deletion Request Flow:**
```typescript
// 1. User submits deletion request
POST /api/delete
Request: { cookie_id, email?, reason? }

// 2. If email provided: Send confirmation
const token = crypto.randomUUID();
await KV.put(`deletion:${token}`, cookie_id, { expirationTtl: 86400 }); // 24 hours
sendConfirmationEmail(email, token);

// 3. User confirms via email link
GET /delete/confirm?token=abc123
const cookie_id = await KV.get(`deletion:${token}`);
await deletePrediction(cookie_id);

// 4. Deletion execution
DELETE FROM predictions WHERE cookie_id = ?;
DELETE FROM analytics WHERE cookie_id = ?;
```

**Confirmation Email Template:**
```
From: noreply@gta6predictions.com
To: {user_email}
Subject: Confirm Data Deletion Request

Hi there,

We received a request to delete your prediction data.

Click this link to confirm deletion:
https://gta6predictions.com/delete/confirm?token={token}

This link expires in 24 hours.

If you didn't request this, you can safely ignore this email.

Thanks,
GTA 6 Predictions Team
```

### Project Structure Notes

**File Structure:**
```
public/
├── delete.html                  (NEW - deletion request form)
├── privacy.html                 (MODIFY - add deletion link)
├── about.html                   (MODIFY - add deletion info)
src/
├── routes/
│   └── delete.ts                (NEW - deletion endpoints)
├── services/
│   └── email.service.ts         (NEW - confirmation email)
tests/
├── unit/
│   └── delete-request.test.ts   (NEW - deletion tests)
wrangler.toml                    (MODIFY - add deletion_tokens KV namespace)
```

**KV Namespace:**
- Namespace: `deletion_tokens`
- Purpose: Store confirmation tokens (24-hour TTL)
- Key format: `deletion:{token}` → `{cookie_id}`

### Learnings from Previous Story

**From Story 4.5 (Cookie Management and Expiration):**
- ✅ **Cookie ID handling:** UUID v4 format validation
- **Recommendation:** Reuse validation pattern for deletion form

**From Story 4.2 (Privacy Policy Page):**
- ✅ **GDPR rights section:** Section 5 (Your Rights)
- **Recommendation:** Link deletion form from Privacy Policy

**From Story 4.4 (About Page):**
- ✅ **Privacy & Data section:** Section 5
- **Recommendation:** Add deletion info to About page

**From Story 2.1 (Secure Cookie ID Generation):**
- ✅ **Cookie ID format:** UUID v4
- **Recommendation:** Validate cookie_id format in deletion request

**From Story 2.6 (Rate Limiting):**
- ✅ **KV storage pattern:** Rate limit tracking
- **Recommendation:** Reuse KV for confirmation tokens

**New Patterns Created:**
- Confirmation token flow (email-based)
- Deletion request form validation
- GDPR compliance audit logging

**Files to Modify:**
- `public/privacy.html` - Add deletion link
- `public/about.html` - Add deletion info

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 4 Story 4.6 Definition](docs/epics/epic-4-privacy-compliance-trust.md:322-394)

**PRD:**
- [PRD - FR54: Data Deletion via Contact Form](docs/PRD.md:314-320)
- [PRD - FR55: GDPR "Right to Be Forgotten"](docs/PRD.md:314-320)
- [PRD - FR101: User-Facing Deletion Request Form](docs/epics/epic-4-privacy-compliance-trust.md:388-390)

**Architecture:**
- [Architecture - Security: GDPR Compliance](docs/architecture.md:674-706)

**Dependencies:**
- Story 4.2 (Privacy Policy - link target)
- Story 4.4 (About page - deletion info)
- Story 2.1 (Cookie ID generation - format validation)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/4-6-gdpr-data-deletion-request-form.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
