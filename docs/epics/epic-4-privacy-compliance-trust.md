# Epic 4: Privacy, Compliance & Trust

**Epic Goal:** Build trust and meet legal requirements (GDPR) - essential for Reddit approval and user confidence.

**Epic Value:** Trust = growth. Compliance = avoiding lawsuits. Transparency = Reddit mods approve launch.

## Story 4.1: GDPR Cookie Consent Banner

As a user,
I want to understand what cookies are used and consent to their use,
So that my privacy rights are respected (GDPR requirement).

**Acceptance Criteria:**

**Given** a user visits the site for the first time
**When** the page loads
**Then** a cookie consent banner is displayed:

**Banner Content:**
- Headline: "We use cookies"
- Description: "We use functional cookies to save your prediction and analytics cookies to understand usage. You can opt out of analytics."
- Two buttons: "Accept All" | "Functional Only"
- Link: "Learn more" → Privacy Policy

**And** banner behavior:
- Appears at bottom of screen (non-intrusive)
- Does not block content access
- Dismisses on button click
- Stores consent choice in cookie (ironic but necessary)
- Cookie name: "cookie_consent", value: "all" or "functional"

**And** granular consent (FR68):
- **Functional cookies:** Always enabled (required for core features)
  - gta6_user_id (prediction tracking)
- **Analytics cookies:** Optional (user can decline)
  - Google Analytics or Cloudflare Analytics
  - Ad tracking cookies (if present)

**And** consent affects behavior:
- "Accept All": Set both functional and analytics cookies
- "Functional Only": Only set gta6_user_id, disable analytics
- No choice yet: Only functional cookies (default)

**And** compliance requirements:
- Consent before non-essential cookies set
- Clear explanation of cookie purposes
- Easy opt-out mechanism
- Consent recorded with timestamp

**Prerequisites:** Story 2.1 (cookie generation)

**Technical Notes:**
- Implements FR50 (cookie consent banner)
- Implements FR68 (functional vs analytics distinction)
- GDPR requires opt-in for non-essential cookies
- Use cookieconsent.js or similar library
- Banner must be dismissible but not auto-dismiss
- Store consent for 12 months, then re-ask

---

## Story 4.2: Privacy Policy Page

As a user,
I want to read the privacy policy,
So that I understand how my data is collected, used, and protected.

**Acceptance Criteria:**

**Given** the site has a privacy policy requirement (GDPR)
**When** a user navigates to /privacy or clicks Privacy Policy link
**Then** a comprehensive privacy policy page is displayed:

**Required Sections:**

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

**And** page formatting:
- Plain language (no legalese where possible)
- Table of contents with jump links
- Last updated date displayed
- Link from footer on every page

**Prerequisites:** None (static content page)

**Technical Notes:**
- Implements FR51 (Privacy Policy accessible)
- Implements FR90 (24-month analytics retention stated)
- GDPR requires clear, accessible privacy policy
- Consider using privacy policy generator (e.g., termly.io)
- Review by legal professional recommended
- Update date whenever policy changes

---

## Story 4.3: Terms of Service Page

As a site owner,
I want clear terms of service,
So that user expectations and liabilities are defined.

**Acceptance Criteria:**

**Given** the site needs terms of service (legal protection)
**When** a user navigates to /terms or clicks Terms of Service link
**Then** a comprehensive ToS page is displayed:

**Required Sections:**

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

**And** page formatting:
- Numbered sections for easy reference
- Last updated date displayed
- Link from footer on every page
- Not required to accept before use (browse freely)

**Prerequisites:** None (static content page)

**Technical Notes:**
- Implements FR52 (Terms of Service accessible)
- Consider using ToS generator (e.g., termly.io, termsfeed.com)
- Review by legal professional strongly recommended
- Update date whenever terms change
- Keep language clear and enforceable

---

## Story 4.4: About Page (Transparency & Methodology)

As a user,
I want to understand what this site is, who runs it, and how it works,
So that I can trust the data and feel comfortable participating.

**Acceptance Criteria:**

**Given** users need transparency about the site (FR98)
**When** a user navigates to /about or clicks About link
**Then** an informative About page is displayed:

**Content Sections:**

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

4. **The Algorithm (How We Handle Trolls)** ✅ ENHANCED
   - "We use a weighted median algorithm"
   - Reasonable predictions (within 5 years): Full weight (1.0)
   - Far predictions (5-50 years): Reduced weight (0.3)
   - Extreme predictions (50+ years): Minimal weight (0.1)
   - Visual weight cards showing 1.0x/0.3x/0.1x multipliers
   - Practical example: "10 troll votes = 1 genuine vote"
   - "This means trolls submitting '2099' have less influence than reasonable predictions"
   - **Enhancement (2025-11-28):** Added visual cards and concrete troll-to-genuine ratio example

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

**And** tone is conversational:
- Friendly, not corporate
- Honest about limitations
- Builds trust through transparency

**And** page is linked from:
- Main navigation (About)
- Footer (About Us)
- Cookie consent banner ("Learn more")

**Prerequisites:** None (static content page)

**Technical Notes:**
- Implements FR98 (About page explaining data usage, privacy, methodology)
- Transparency builds trust with skeptical gaming community
- Reddit mods more likely to approve if transparent about methods
- Honesty about weighted algorithm prevents "rigged" accusations
- Personal touch (solo creator) builds connection

---

## Story 4.5: Cookie Management and Expiration

As a system,
I want cookies to expire after 2 years,
So that user data isn't retained indefinitely.

**Acceptance Criteria:**

**Given** cookies are set for user tracking (FR3, FR65)
**When** cookies are created or accessed
**Then** expiration is enforced:

**Cookie Lifecycle:**
- **Creation:** Set maxAge: 63072000 (2 years in seconds)
- **Expiration:** Cookie auto-deleted by browser after 2 years
- **Post-Expiration:** User treated as new visitor

**And** expiration handling:
- If cookie exists and valid: Use existing cookie_id
- If cookie expired: Generate new cookie_id (user can re-submit)
- If cookie deleted by user: Generate new cookie_id

**And** database cleanup (FR90 analytics):
- Analytics data: Delete after 24 months
- Prediction data: Keep indefinitely (core value)
- Orphaned predictions (no recent access): Keep (user may return)

**And** cookie refresh:
- On every visit: Don't regenerate (extends expiration)
- On every submission/update: Don't regenerate
- Cookie expiration is absolute from first creation

**Prerequisites:** Story 2.1 (cookie generation)

**Technical Notes:**
- Implements FR65 (2-year cookie expiration)
- Implements FR90 (24-month analytics retention)
- Browser enforces expiration (not server-side)
- Consider allowing users to manually extend cookie
- No auto-refresh prevents indefinite tracking
- Balance: Long enough for utility, short enough for privacy

---

## Story 4.6: GDPR Data Deletion Request Form

As a user,
I want to request deletion of my data,
So that I can exercise my "right to be forgotten" (GDPR).

**Acceptance Criteria:**

**Given** GDPR requires data deletion capability (FR54-55)
**When** a user navigates to /delete or Privacy Policy deletion section
**Then** a data deletion request form is displayed:

**Form Fields:**
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

**And** submission process:
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

**And** edge cases:
- Cookie ID not found: "No prediction found for this ID"
- No email provided: Immediate deletion (less secure but allowed)
- Email provided but not confirmed: Delete after 30 days (GDPR grace period)

**And** deletion scope:
- Prediction record deleted
- Cookie ID removed from database
- IP hash removed
- Analytics data removed (if tied to cookie)
- User must manually delete browser cookie

**Prerequisites:** Story 2.1 (cookies), Story 1.2 (database)

**Technical Notes:**
- Implements FR54 (data deletion via contact form)
- Implements FR55 (GDPR "right to be forgotten")
- Implements FR101 (user-facing deletion request form)
- Email confirmation prevents malicious deletion of others' predictions
- GDPR requires deletion within 30 days
- Consider rate limiting deletion requests (prevent abuse)
- Log deletion requests for compliance audit trail

---

## Story 4.7: Cookie Conflict Resolution (Cookie vs IP)

As a system,
I want to handle conflicts when users access from different IPs,
So that cookie-based tracking works even when IP changes.

**Acceptance Criteria:**

**Given** a user previously submitted from IP A with Cookie X
**When** they return from IP B with same Cookie X
**Then** cookie takes precedence (FR67):

**Conflict Scenarios:**

**Scenario 1: Update from different IP**
- User submitted: IP_A (hashed), Cookie_X, Date_1
- User updates: IP_B (hashed), Cookie_X, Date_2
- Action: UPDATE prediction, change ip_hash to IP_B, keep cookie_id
- Rationale: User changed networks (home→work, WiFi→mobile)

**Scenario 2: New submission from same IP, different cookie**
- User submitted: IP_A, Cookie_X, Date_1
- New submission: IP_A, Cookie_Y, Date_2
- Action: REJECT with 409 Conflict "IP already used"
- Rationale: Prevent same-IP multi-submissions

**Scenario 3: Cookie lost, same IP**
- User submitted: IP_A, Cookie_X, Date_1
- New submission: IP_A, Cookie_Y (user cleared cookies), Date_2
- Action: REJECT with 409 "IP already used. Restore your cookie to update."
- Provide: Instructions to recover cookie_id

**And** update SQL handles conflict:
```sql
UPDATE predictions
SET predicted_date = ?,
    ip_hash = ?, -- Update to new IP
    weight = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE cookie_id = ?
```

**And** conflict resolution is documented:
- About page explains: "Updates work across IP changes"
- Error message helpful: "Your cookie allows updates from any IP"

**Prerequisites:** Story 2.8 (update endpoint), Story 2.2 (IP hashing)

**Technical Notes:**
- Implements FR67 (cookie wins over IP in conflicts)
- Mobile users frequently change IPs (WiFi→LTE→WiFi)
- VPN users change IPs constantly
- Cookie is more stable than IP for user identity
- Security tradeoff: Cookie stealing allows prediction updates (acceptable risk)

---

## Story 4.8: Data Retention Policy Implementation

As a system,
I want to enforce data retention policies,
So that we comply with privacy regulations and minimize data storage.

**Acceptance Criteria:**

**Given** data retention policies are defined (FR90)
**When** automated cleanup runs (nightly scheduled task)
**Then** old data is purged:

**Retention Policies:**

1. **Predictions:**
   - Retention: Indefinite
   - Rationale: Core product value, user expects persistence
   - Exception: User-requested deletion (FR54-55)

2. **Analytics Data (Cloudflare):**
   - Retention: 24 months
   - Auto-deletion: After 24 months
   - Cloudflare handles automatically

3. **Server Logs:**
   - Retention: 90 days
   - Contains: IP addresses, requests, errors
   - Auto-deletion: After 90 days

4. **Rate Limit Data (Cloudflare KV):**
   - Retention: 60 seconds
   - TTL: Automatic expiration
   - No manual cleanup needed

5. **Cache Data (Stats):**
   - Retention: 5 minutes
   - TTL: Automatic expiration
   - No manual cleanup needed

**And** cleanup script runs:
- Schedule: Daily at 2 AM UTC (low traffic)
- Task: Delete analytics logs > 24 months
- Task: Delete server logs > 90 days
- Logging: Record cleanup counts

**And** retention is documented:
- Privacy Policy states retention periods
- Users informed during submission
- Compliance audit trail maintained

**Prerequisites:** Story 1.3 (scheduled tasks possible via GitHub Actions or Cloudflare Cron)

**Technical Notes:**
- Implements FR90 (24-month analytics retention)
- GDPR requires "storage limitation" principle
- Automated cleanup prevents manual burden
- Audit logs of deletions for compliance
- Consider using Cloudflare Cron Triggers for scheduling
- Analytics retention is separate from prediction data

---
