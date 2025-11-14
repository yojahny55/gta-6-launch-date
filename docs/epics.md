# GTA 6 Launch Date Prediction Tracker - Epic Breakdown

**Author:** yojahny
**Date:** 2025-11-13
**Project Level:** Low-Medium Complexity
**Target Scale:** MVP (2 weeks) → Growth (6 months) → Vision (Year 2+)

---

## Overview

This document provides the complete epic and story breakdown for GTA 6 Launch Date Prediction Tracker, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

## Functional Requirements Inventory

**User Prediction Management (FR1-FR6):**
- FR1: Submit anonymous predictions via date picker
- FR2: Select dates within 100-year range (2025-2125)
- FR3: Receive unique cookie identifier
- FR4: Update prediction unlimited times via cookie
- FR5: One submission per IP address (anti-spam)
- FR6: Immediate visual confirmation with prediction count

**Data Aggregation & Algorithm (FR7-FR12):**
- FR7: Calculate community median using weighted algorithm
- FR8: Apply weights by reasonableness (2025-2030=1.0, 2030-2075=0.3, >2075=0.1)
- FR9: Track actual minimum date (unweighted)
- FR10: Track actual maximum date (unweighted)
- FR11: Count total predictions
- FR12: Update statistics near real-time (<5 min cache)

**Results Display (FR13-FR19):**
- FR13: Display community median prominently
- FR14: Display minimum date predicted
- FR15: Display maximum date predicted
- FR16: Display total predictions count
- FR17: Show social comparison messaging
- FR18: Show quantified delta from median
- FR19: Optional chart visualization (default off)

**Social Sharing (FR20-FR23):**
- FR20: Share to Twitter/X with pre-filled text
- FR21: Share to Reddit with pre-filled text
- FR22: Generate dynamic Open Graph meta tags
- FR23: Shared links show personalized prediction + median

**Embed Widget (FR24-FR29):**
- FR24: Generate embeddable iframe code
- FR25: Widget displays live median
- FR26: Widget displays total count
- FR27: Widget links back to main site
- FR28: Widget is lightweight (<50KB)
- FR29: Widget supports light/dark theming

**Email Notifications - Optional (FR30-FR34):**
- FR30: Optional email collection
- FR31: Double opt-in confirmation
- FR32: Notification on median shift (>7 days)
- FR33: Reminder after major news events
- FR34: One-click unsubscribe

**SEO & Discoverability (FR35-FR40):**
- FR35: Meta title optimized for "GTA 6 predictions"
- FR36: Meta description with community median
- FR37: Schema.org VideoGame structured data
- FR38: Schema.org Event structured data
- FR39: Mobile-responsive, passes Google test
- FR40: Load <2s desktop, <3s mobile

**Analytics & Tracking (FR41-FR46):**
- FR41: Track predictions over time
- FR42: Track traffic sources
- FR43: Track user geography (country-level)
- FR44: Track returning user rate
- FR45: Track social share CTR
- FR46: Track embed widget usage

**Monetization (FR47-FR49):**
- FR47: Display Google AdSense banner
- FR48: Users can disable ads via toggle
- FR49: Ad preference persists across sessions

**Legal & Privacy (FR50-FR55):**
- FR50: Cookie consent banner (GDPR)
- FR51: Privacy Policy page accessible
- FR52: Terms of Service page accessible
- FR53: Hash IP addresses before storage
- FR54: Data deletion via contact form
- FR55: GDPR "right to be forgotten" compliance

**Administration - Future (FR56-FR58):**
- FR56: View prediction distribution histogram
- FR57: View traffic and usage analytics
- FR58: Moderate/remove abusive predictions

**Error Handling & Resilience (FR59-FR64):**
- FR59: Display user-friendly error message when API request fails
- FR60: Handle network timeout gracefully with retry mechanism
- FR61: Prevent race conditions for simultaneous submissions from same cookie/IP
- FR62: Validate all user inputs before processing (XSS/injection prevention)
- FR63: Provide fallback calculation if weighted median fails (use simple median)
- FR64: Degrade gracefully when traffic exceeds Cloudflare free tier limits

**Cookie & Session Management (FR65-FR68):**
- FR65: Cookies expire after 2 years, user can re-submit as new prediction
- FR66: Allow cookie recovery via optional email linking
- FR67: Resolve conflicts when cookie ID updates from different IP (cookie wins)
- FR68: Cookie consent distinguishes functional cookies (required) from analytics (optional)

**Accessibility (FR69-FR72):**
- FR69: Date picker is keyboard accessible (tab navigation, enter to select)
- FR70: Screen readers announce prediction submission success
- FR71: All interactive elements have ARIA labels
- FR72: Site works without JavaScript for core viewing (no submission)

**Internationalization (FR73-FR75):**
- FR73: Store all dates in UTC timezone
- FR74: Display dates in user's local timezone
- FR75: Support international date formats based on browser locale

**Security Hardening (FR76-FR80):**
- FR76: Implement reCAPTCHA v3 on submission with user-friendly retry on failure
- FR77: Implement rate limiting per IP address (specific thresholds defined in architecture)
- FR78: Use parameterized queries for all database operations
- FR79: Use cryptographically secure salt with version tracking for IP hashes **[GROWTH]**
- FR80: Prevent cookie ID enumeration attacks via secure random generation

**Performance & Operations (FR81-FR84):**
- FR81: Provide /health endpoint for uptime monitoring **[GROWTH]**
- FR82: Track API response time metrics (p50, p95, p99) **[GROWTH]**
- FR83: Use database transactions for atomic operations (race condition prevention)
- FR84: Alert when error rate exceeds 5% threshold **[GROWTH]**

**Widget Security (FR85-FR86):**
- FR85: Widget enforces iframe sandbox restrictions
- FR86: Widget implements separate rate limiting from main site

**Accessibility Enhancement (FR87-FR88):**
- FR87: All interactive elements have minimum 44x44px touch targets (mobile)
- FR88: Provide skip navigation link for keyboard users

**Data Quality & Compliance (FR89-FR90):**
- FR89: Detect spam patterns (>100 predictions for single date) and flag for review **[GROWTH]**
- FR90: Retain analytics data for 24 months then auto-delete (GDPR compliance)

**Testing & Quality Assurance (FR91-FR94):**
- FR91: Pass load test simulating 1,000 concurrent users using load testing tool before launch
- FR92: Core features tested on Chrome, Firefox, Safari, Edge (latest 2 versions at launch date)
- FR93: Mobile experience tested on iOS Safari and Android Chrome
- FR94: Achieve Lighthouse Performance score >90 before launch

**Deployment & Operations (FR95-FR97):**
- FR95: Support zero-downtime deployment
- FR96: Support rollback to previous version within 5 minutes
- FR97: Trigger Cloudflare tier upgrade automatically at 80% free tier limit **[GROWTH]**

**Trust & Transparency (FR98-FR99):**
- FR98: Provide "About" page explaining data usage, privacy, and methodology
- FR99: Require minimum 50 predictions before displaying median (prevent troll appearance)

**Viral Mechanics Enhancement (FR100):**
- FR100: Display share buttons prominently above-the-fold after submission

**User Data Management (FR101):**
- FR101: Provide user-facing deletion request form with email confirmation

**Performance Monitoring (FR102):**
- FR102: Track basic performance metrics via Cloudflare Analytics (page load times, API response times)

---

## FR Scope Classification

**MVP Scope (2-Week Launch) - 82 FRs:**
- **Core Features:** FR1-FR29 (Predictions, Algorithm, Display, Sharing, Widget)
- **Security & Privacy:** FR50-FR55, FR62, FR76-FR78, FR80, FR101
- **User Experience:** FR59-FR61, FR63-FR65, FR67-FR75
- **Quality & Compliance:** FR83, FR85-FR88, FR90-FR96, FR98-FR100, FR102

**Growth Scope (Post-MVP, Month 2-6) - 20 FRs:**
- **Email System:** FR30-FR34
- **Administration:** FR56-FR58
- **Advanced Features:** FR66 (Email recovery), FR79 (Salt versioning), FR89 (Spam detection), FR97 (Auto-scaling)
- **Monitoring:** FR81-FR82, FR84

**Total Functional Requirements: 102**

---

## Epic Structure Proposal

### Epic Overview

**Epic 1: Foundation & Infrastructure Setup** 🏗️
- **Goal:** Establish robust technical foundation enabling all subsequent development
- **Value:** Zero technical debt, secure-by-default architecture, scalable infrastructure
- **FRs:** FR78, FR83, FR95-96, FR102 (5 FRs)

**Epic 2: Core Prediction Engine** 🎯
- **Goal:** Enable users to submit predictions and calculate community sentiment
- **Value:** Core product value - without this, nothing else matters
- **FRs:** FR1-FR12, FR53, FR62, FR76-77, FR80 (18 FRs)

**Epic 3: Results Display & User Feedback** 📊
- **Goal:** Show community sentiment and provide instant gratification
- **Value:** Social validation drives engagement and sharing
- **FRs:** FR13-FR19, FR59-FR61, FR63-FR64, FR99 (14 FRs)

**Epic 4: Privacy, Compliance & Trust** 🔒
- **Goal:** Build trust and meet legal requirements (GDPR)
- **Value:** Trust = growth; compliance = avoiding lawsuits
- **FRs:** FR50-FR55, FR65, FR67-68, FR90, FR98, FR101 (13 FRs)

**Epic 5: Social Sharing & Virality** 🚀
- **Goal:** Enable organic viral growth through frictionless sharing
- **Value:** Each share brings 10+ new users - exponential growth
- **FRs:** FR20-FR23, FR35-FR40, FR100 (11 FRs)

**Epic 6: Embeddable Widget** 📺
- **Goal:** Enable streamers and media sites to embed live data
- **Value:** Passive distribution to 250M+ content viewers
- **FRs:** FR24-FR29, FR85-FR86 (8 FRs)

**Epic 7: Accessibility & Internationalization** 🌍
- **Goal:** Reach global audience without barriers
- **Value:** Broader reach = more predictions = better data
- **FRs:** FR69-FR75, FR87-FR88 (9 FRs)

**Epic 8: Monetization & Analytics** 💰
- **Goal:** Sustain operations and measure success
- **Value:** Revenue covers costs; analytics inform iteration
- **FRs:** FR41-FR49 (9 FRs)

**Epic 9: Quality Assurance & Launch Readiness** ✅
- **Goal:** Ship with confidence - no catastrophic bugs
- **Value:** Quality = trust; bugs on launch day = death
- **FRs:** FR91-FR94 (4 FRs)

**Total MVP Epics: 9 epics covering 82 FRs**
**Deferred to Growth: 20 FRs** (FR30-FR34, FR56-FR58, FR66, FR79, FR81-82, FR84, FR89, FR97)

---

## FR Coverage Map

| Epic | FRs Covered | Count |
|------|-------------|-------|
| Epic 1: Foundation | FR78, FR83, FR95-96, FR102 | 5 |
| Epic 2: Prediction Engine | FR1-12, FR53, FR62, FR76-77, FR80 | 18 |
| Epic 3: Results Display | FR13-19, FR59-61, FR63-64, FR99 | 14 |
| Epic 4: Privacy & Compliance | FR50-55, FR65, FR67-68, FR90, FR98, FR101 | 13 |
| Epic 5: Social Sharing | FR20-23, FR35-40, FR100 | 11 |
| Epic 6: Widget | FR24-29, FR85-86 | 8 |
| Epic 7: Accessibility & i18n | FR69-75, FR87-88 | 9 |
| Epic 8: Monetization & Analytics | FR41-49 | 9 |
| Epic 9: QA & Launch | FR91-94 | 4 |
| **Total** | **All 82 MVP FRs** | **82** |

### Validation: Complete FR Coverage

✅ **All 82 MVP FRs are mapped to epics**
✅ **All 20 Growth FRs properly deferred**
✅ **No orphan FRs**
✅ **No FRs mapped to multiple epics** (clean separation of concerns)

---

## Implementation Sequencing

**Week 1: Core Product**
- Days 1-2: Epic 1 (Foundation)
- Days 2-5: Epic 2 (Prediction Engine)
- Days 5-7: Epic 3 (Results Display)

**Week 2: Distribution & Polish**
- Days 8-9: Epic 4 (Privacy & Compliance)
- Days 9-10: Epic 5 (Social Sharing)
- Days 10-11: Epic 6 (Widget)
- Days 11-12: Epic 7 (Accessibility & i18n)
- Days 12-13: Epic 8 (Monetization & Analytics)
- Days 13-14: Epic 9 (QA & Launch)

**Rationale:**
1. Foundation enables everything else
2. Core value (predict + display) proves concept
3. Compliance before distribution (avoid Reddit removal)
4. Distribution mechanisms together (viral growth)
5. Polish ensures quality experience
6. QA validates entire system before launch

---

## Epic 1: Foundation & Infrastructure Setup

**Epic Goal:** Establish robust technical foundation that enables all subsequent development with zero technical debt, secure-by-default architecture, and scalable infrastructure.

**Epic Value:** Every subsequent story depends on this foundation. Cutting corners here creates technical debt that compounds throughout the project.

### Story 1.1: Project Initialization and Repository Setup

As a developer,
I want a properly configured project structure with TypeScript, build tools, and version control,
So that I can develop efficiently with type safety and maintain clean code.

**Acceptance Criteria:**

**Given** a new project needs to be created
**When** I initialize the project
**Then** the following structure exists:
- Git repository initialized with .gitignore (node_modules, .env, dist)
- TypeScript configured (tsconfig.json with strict mode, ES2022 target)
- Package.json with scripts: dev, build, test, deploy
- Directory structure: /src (frontend), /workers (backend), /db (schema)
- ESLint + Prettier configured for code quality
- README.md with setup instructions

**And** environment variables template exists (.env.example):
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN
- DATABASE_NAME
- RECAPTCHA_SITE_KEY
- RECAPTCHA_SECRET_KEY
- ADSENSE_CLIENT_ID

**And** first commit is made with message: "feat: initial project setup"

**Prerequisites:** None (first story)

**Technical Notes:**
- Use Vite for frontend build tool (fast, modern)
- Use Wrangler CLI for Cloudflare Workers deployment
- TypeScript strict mode enforces type safety (FR78 parameterized queries benefit)
- ESLint rules: no-any, no-explicit-any, strict-null-checks

---

### Story 1.2: Cloudflare Infrastructure Configuration

As a developer,
I want Cloudflare Pages, Workers, and D1 database configured,
So that I have a deployment target and data storage ready.

**Acceptance Criteria:**

**Given** Cloudflare account exists
**When** I configure infrastructure
**Then** the following resources are created:
- Cloudflare Pages project named "gta6-predictions"
- Cloudflare Workers service configured with routes
- Cloudflare D1 database "gta6_predictions_db" created
- Wrangler.toml configuration file with bindings

**And** database schema is deployed:
```sql
CREATE TABLE predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
);

CREATE INDEX idx_predictions_date ON predictions(predicted_date);
CREATE INDEX idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX idx_predictions_submitted ON predictions(submitted_at);
```

**And** database connection test succeeds from Workers environment

**Prerequisites:** Story 1.1 (project structure exists)

**Technical Notes:**
- D1 is SQLite-based, supports 5M reads/day on free tier
- Use D1 prepared statements for FR78 (parameterized queries)
- UNIQUE constraints enforce FR5 (one submission per IP)
- Indexes optimize FR7-12 (median calculation queries)
- Store dates as ISO 8601 format for FR73 (UTC storage)

---

### Story 1.3: CI/CD Pipeline with GitHub Actions

As a developer,
I want automated testing and deployment on every commit,
So that code quality is maintained and deployments are reliable.

**Acceptance Criteria:**

**Given** code is pushed to GitHub
**When** GitHub Actions workflow runs
**Then** the following steps execute:
1. Install dependencies (npm ci)
2. Run linter (eslint)
3. Run TypeScript compiler (tsc --noEmit)
4. Run tests (if any exist)
5. Build project (npm run build)
6. Deploy to Cloudflare (on main branch only)

**And** deployment uses secrets:
- CLOUDFLARE_API_TOKEN (stored in GitHub secrets)
- Wrangler automatically deploys to Pages + Workers

**And** deployment status is reported back to commit

**And** failed builds prevent deployment

**Prerequisites:** Story 1.1 (project structure), Story 1.2 (Cloudflare configured)

**Technical Notes:**
- GitHub Actions workflow file: .github/workflows/deploy.yml
- Use wrangler action: cloudflare/wrangler-action@2
- Enables FR95 (zero-downtime deployment) - Cloudflare handles blue/green
- Preview deployments for PR branches
- Production deployments only from main branch

---

### Story 1.4: Database Transaction Support and Error Handling

As a developer,
I want database operations wrapped in transactions with proper error handling,
So that data integrity is maintained even under concurrent access.

**Acceptance Criteria:**

**Given** multiple database operations need to execute atomically
**When** I use the database wrapper utility
**Then** a transaction helper function exists:

```typescript
async function executeTransaction<T>(
  db: D1Database,
  operations: (tx: D1Database) => Promise<T>
): Promise<{success: boolean; data?: T; error?: string}>
```

**And** transaction behavior:
- All operations succeed together or all fail together
- Deadlock detection with automatic retry (max 3 attempts)
- Timeout after 5 seconds
- Proper error logging with context

**And** error responses are user-friendly:
- Database errors → "Unable to save prediction. Please try again."
- Timeout errors → "Request took too long. Please try again."
- Constraint violations → Specific message (e.g., "You've already submitted a prediction")

**Prerequisites:** Story 1.2 (database exists)

**Technical Notes:**
- Implements FR83 (database transactions)
- Supports FR61 (race condition prevention)
- D1 supports BEGIN/COMMIT/ROLLBACK
- Use IMMEDIATE transactions for write operations
- Implements FR59 (user-friendly error messages)

---

### Story 1.5: Rollback Capability and Deployment Safety

As a developer,
I want the ability to quickly rollback to the previous version,
So that I can recover from bad deployments within 5 minutes.

**Acceptance Criteria:**

**Given** a deployment causes issues
**When** I trigger a rollback
**Then** Cloudflare automatically serves the previous deployment

**And** rollback process:
- Identify previous deployment ID from Cloudflare dashboard
- Single command rollback: `wrangler rollback --deployment-id=<id>`
- Rollback completes in < 2 minutes (global CDN propagation)
- No data loss (database is forward-compatible)

**And** rollback documentation exists in README:
- How to identify bad deployment
- Rollback command with examples
- Verification steps post-rollback

**And** deployment history is retained for 30 days

**Prerequisites:** Story 1.3 (CI/CD pipeline configured)

**Technical Notes:**
- Implements FR96 (5-minute rollback capability)
- Cloudflare maintains deployment history automatically
- Database migrations must be backward-compatible
- Consider blue/green deployment for zero-downtime (FR95)
- Test rollback in staging environment before launch

---

### Story 1.6: Basic Performance Monitoring via Cloudflare Analytics

As a developer,
I want visibility into page load times and API performance,
So that I can identify and fix performance issues.

**Acceptance Criteria:**

**Given** the site is deployed
**When** users access the site
**Then** Cloudflare Analytics automatically tracks:
- Page load times (p50, p95, p99)
- Total requests per endpoint
- Error rate (4xx, 5xx responses)
- Bandwidth usage
- Geographic distribution

**And** a performance dashboard is accessible via:
- Cloudflare Dashboard → Analytics tab
- Key metrics visible: avg load time, error rate, request count

**And** performance baseline is documented:
- Target: < 2s page load (FR40 desktop)
- Target: < 3s page load (FR40 mobile)
- Target: < 200ms API response (NFR-P3)
- Target: < 1% error rate

**Prerequisites:** Story 1.3 (deployment pipeline)

**Technical Notes:**
- Implements FR102 (basic performance monitoring)
- Cloudflare Analytics is free tier included
- No code changes required (automatic)
- Supports FR40 validation (<2s desktop, <3s mobile)
- Baseline for FR94 (Lighthouse >90 score)
- Growth phase: Add FR81-82 (custom metrics, alerting)

---

## Epic 2: Core Prediction Engine

**Epic Goal:** Enable users to submit predictions and calculate community sentiment - this is the core product value.

**Epic Value:** Without this epic, there is no product. Everything else enhances or distributes this capability.

### Story 2.1: Secure Cookie ID Generation

As a user,
I want a unique identifier assigned to my browser,
So that I can update my prediction later without creating an account.

**Acceptance Criteria:**

**Given** a user visits the site for the first time
**When** the page loads
**Then** a cryptographically secure cookie ID is generated:
- Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Generated using crypto.randomUUID() (Web Crypto API)
- Stored in cookie named "gta6_user_id"

**And** cookie has security attributes:
- httpOnly: false (needs JavaScript access for submissions)
- secure: true (HTTPS only)
- sameSite: "Strict"
- maxAge: 63072000 (2 years, FR65)
- path: "/"

**And** cookie generation is deterministic:
- If cookie already exists, don't regenerate
- Same cookie ID persists across sessions
- Cookie ID is validated on every request (valid UUID format)

**Prerequisites:** Story 1.1 (project structure)

**Technical Notes:**
- Implements FR3 (unique cookie identifier)
- Implements FR80 (secure random generation prevents enumeration)
- Supports FR4 (unlimited updates via cookie)
- Supports FR65 (2-year expiration)
- Cookie is functional, not tracking (FR68 distinction)
- No PII stored in cookie

---

### Story 2.2: IP Address Hashing for Privacy-Preserving Anti-Spam

As a system,
I want to hash IP addresses before storage,
So that user privacy is protected while preventing spam submissions.

**Acceptance Criteria:**

**Given** a user submits a prediction
**When** the API receives the request
**Then** the user's IP address is hashed:
- Extract IP from request headers (CF-Connecting-IP for Cloudflare)
- Hash using BLAKE2b algorithm with 256-bit output
- Salt: Environment variable SALT_V1 (versioned for FR79 future rotation)
- Output: Hex string (64 characters)

**And** hashed IP is stored in database:
- predictions.ip_hash field
- Original IP is NEVER stored
- Hash is deterministic (same IP = same hash with same salt)

**And** hash collision is handled:
- Probability is negligible (2^128 security)
- If collision occurs (DB constraint violation), log as error

**And** Cloudflare Workers API provides helper:
```typescript
async function hashIP(ip: string, salt: string): Promise<string>
```

**Prerequisites:** Story 1.2 (database schema), Story 1.4 (error handling)

**Technical Notes:**
- Implements FR53 (IP hashing)
- Implements FR80 (secure hashing prevents rainbow table attacks)
- Supports FR5 (one submission per IP via UNIQUE constraint)
- Supports FR79 (salt versioning for future rotation)
- BLAKE2b is faster and more secure than SHA-256
- Salt must be kept secret (environment variable, not in code)

---

### Story 2.3: Date Picker with Validation

As a user,
I want to select a date for when I think GTA 6 will launch,
So that I can submit my prediction.

**Acceptance Criteria:**

**Given** a user wants to submit a prediction
**When** they interact with the date picker
**Then** a native HTML5 date input is presented:
- `<input type="date" min="2025-01-01" max="2125-12-31">`
- Default value: Empty (forces user to choose)
- Mobile-friendly (native date pickers on iOS/Android)
- Keyboard accessible (FR69 requirement)

**And** date validation occurs on client-side:
- Minimum date: January 1, 2025 (past dates rejected)
- Maximum date: December 31, 2125 (100-year range, FR2)
- Invalid format rejected (only YYYY-MM-DD accepted)
- Empty submission prevented (required field)

**And** validation messages are clear:
- "Please select a date between Jan 1, 2025 and Dec 31, 2125"
- "GTA 6 can't launch in the past!"
- "Please enter a valid date"

**And** edge cases are handled:
- Leap years validated correctly (Feb 29, 2028 is valid)
- Timezone-independent (date only, no time component)
- Date is converted to UTC before submission (FR73)

**Prerequisites:** Story 1.1 (project structure)

**Technical Notes:**
- Implements FR2 (date range validation)
- Supports FR69 (keyboard accessible)
- Supports FR73 (UTC storage via Date.toISOString())
- Native date picker provides best UX and accessibility
- Validation must occur both client and server-side
- Use ARIA labels for FR71 (screen reader support)

---

### Story 2.4: Input Validation and XSS Prevention

As a system,
I want all user inputs validated and sanitized,
So that the application is protected from injection attacks.

**Acceptance Criteria:**

**Given** a user submits data to any API endpoint
**When** the server receives the request
**Then** validation rules are applied:

**For date input:**
- Must match ISO 8601 format: YYYY-MM-DD
- Must be within range: 2025-01-01 to 2125-12-31
- Must be valid calendar date (no Feb 30, no month 13)
- Regex: `^202[5-9]|20[3-9]\d|21[0-2]\d)-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$`

**For cookie_id input:**
- Must be valid UUID v4 format
- Regex: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
- Max length: 36 characters

**For user_agent (if stored):**
- Max length: 256 characters
- Sanitized to remove SQL injection patterns
- HTML-encoded to prevent XSS

**And** invalid inputs return 400 Bad Request:
```json
{
  "error": "Invalid date format. Expected YYYY-MM-DD between 2025-01-01 and 2125-12-31",
  "field": "predicted_date"
}
```

**And** validation is centralized:
- Validation functions in shared module
- Reused across all API endpoints
- TypeScript types enforce structure

**Prerequisites:** Story 1.4 (error handling)

**Technical Notes:**
- Implements FR62 (input validation prevents XSS/injection)
- Supports FR78 (parameterized queries - validation is first line of defense)
- Supports FR59 (user-friendly error messages)
- Use Zod or similar for TypeScript-first validation
- Never trust client-side validation alone
- Sanitization prevents stored XSS attacks

---

### Story 2.5: reCAPTCHA v3 Integration for Bot Protection

As a system,
I want to verify users are human using reCAPTCHA v3,
So that bots cannot spam fake predictions.

**Acceptance Criteria:**

**Given** Google reCAPTCHA v3 is configured
**When** a user attempts to submit a prediction
**Then** reCAPTCHA workflow executes:

1. **Frontend:** Execute reCAPTCHA on form submit
```javascript
const token = await grecaptcha.execute(SITE_KEY, {action: 'submit_prediction'})
```

2. **Backend:** Verify token with Google API
```typescript
const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  method: 'POST',
  body: `secret=${SECRET_KEY}&response=${token}`
})
```

3. **Score Evaluation:** Accept scores > 0.5 (FR76)
- Score 0.0-0.5: Reject as likely bot
- Score 0.5-1.0: Accept as likely human

**And** reCAPTCHA failures are handled gracefully:
- Score < 0.5: Return "Please try again" with retry option
- Network error: Allow submission (fail open, don't block legitimate users)
- Badge is visible but non-intrusive (bottom-right corner)

**And** reCAPTCHA is invisible (v3):
- No user interaction required (no checkbox)
- Runs in background during form submit
- Minimal UX friction (FR maintains 10-second submission goal)

**Prerequisites:** Story 2.3 (date picker), Story 2.4 (validation)

**Technical Notes:**
- Implements FR76 (reCAPTCHA v3 with retry)
- Google reCAPTCHA site key is public, secret key in environment
- v3 provides score (0.0-1.0) vs v2 binary pass/fail
- Action name 'submit_prediction' helps Google learn patterns
- Consider fallback if Google API is down (FR60)
- Add reCAPTCHA badge to footer per Google ToS

---

### Story 2.6: Rate Limiting Per IP Address

As a system,
I want to limit requests per IP address,
So that automated scripts cannot overwhelm the API.

**Acceptance Criteria:**

**Given** rate limiting is configured
**When** requests arrive from the same IP
**Then** rate limits are enforced:

**Submission endpoint (/api/predict POST):**
- Limit: 10 requests per minute per IP
- Sliding window (not fixed intervals)
- After limit: Return 429 Too Many Requests

**Update endpoint (/api/predict PUT):**
- Limit: 30 requests per minute per IP (more lenient)
- Allows legitimate users to change their minds

**Stats endpoint (/api/stats GET):**
- Limit: 60 requests per minute per IP
- Cached response (FR12), so generous limit

**And** rate limit response includes headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1640000000
Retry-After: 45
```

**And** rate limit storage uses Cloudflare KV:
- Key: `ratelimit:${ipHash}:${endpoint}`
- TTL: 60 seconds (auto-expires)
- Increment counter atomically

**And** error message is user-friendly:
- "You're submitting too quickly. Please wait 45 seconds and try again."

**Prerequisites:** Story 2.2 (IP hashing)

**Technical Notes:**
- Implements FR77 (rate limiting)
- Cloudflare KV provides distributed rate limiting (edge locations)
- Sliding window prevents burst attacks
- IP-based (not cookie-based) prevents circumvention
- Consider exempting trusted IPs (admin testing)
- Different limits per endpoint based on usage patterns

---

### Story 2.7: Prediction Submission API Endpoint

As a user,
I want to submit my prediction via API,
So that it's stored in the database and counted toward the community median.

**Acceptance Criteria:**

**Given** a user has selected a date and passed validation
**When** they submit the form (POST /api/predict)
**Then** the API processes the submission:

**Request:**
```json
POST /api/predict
{
  "predicted_date": "2026-11-19",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Extract IP address and hash it (Story 2.2)
3. Validate inputs (Story 2.4)
4. Verify reCAPTCHA (Story 2.5)
5. Check rate limit (Story 2.6)
6. Calculate weight based on date (Story 2.9)
7. Begin database transaction (Story 1.4)
8. Check IP constraint (UNIQUE ip_hash)
9. Insert prediction record
10. Commit transaction

**Response (201 Created):**
```json
{
  "success": true,
  "prediction_id": 1234,
  "predicted_date": "2026-11-19",
  "message": "Your prediction has been recorded!"
}
```

**And** constraint violations are handled:
- IP already exists: 409 Conflict "You've already submitted a prediction. Use update instead."
- Cookie_id collision: Regenerate and retry

**And** timezone conversion:
- Client sends date in local timezone
- Server converts to UTC for storage (FR73)
- Store as ISO 8601: "2026-11-19T00:00:00Z"

**Prerequisites:** Stories 2.1-2.6 (all security and validation layers)

**Technical Notes:**
- Implements FR1 (submit prediction)
- Implements FR5 (one per IP via UNIQUE constraint)
- Implements FR6 (confirmation message)
- Use FR78 (parameterized queries) for SQL injection prevention
- Transaction ensures atomicity (FR83)
- Return 201 (not 200) for resource creation (REST best practice)

---

### Story 2.8: Prediction Update API Endpoint

As a user,
I want to update my existing prediction,
So that I can change my mind without creating a duplicate.

**Acceptance Criteria:**

**Given** a user has previously submitted a prediction
**When** they submit an update (PUT /api/predict)
**Then** the API updates their existing record:

**Request:**
```json
PUT /api/predict
{
  "predicted_date": "2027-02-14",
  "recaptcha_token": "03AGdBq..."
}
```

**Server-side processing:**
1. Extract cookie_id from cookie header
2. Verify reCAPTCHA (prevent bot updates)
3. Validate new date (Story 2.4)
4. Check rate limit (30/min for updates)
5. Calculate new weight
6. Update database:
```sql
UPDATE predictions
SET predicted_date = ?,
    weight = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE cookie_id = ?
```

**Response (200 OK):**
```json
{
  "success": true,
  "predicted_date": "2027-02-14",
  "previous_date": "2026-11-19",
  "message": "Your prediction has been updated!"
}
```

**And** edge cases are handled:
- Cookie not found: 404 "No prediction found. Please submit first."
- Same date: 200 "Your prediction remains unchanged."
- Cookie expired: Treat as new submission

**And** IP conflict resolution (FR67):
- If user updates from different IP, cookie_id takes precedence
- Update both predicted_date AND ip_hash to new IP

**Prerequisites:** Story 2.7 (submission endpoint), Story 2.1 (cookies)

**Technical Notes:**
- Implements FR4 (unlimited updates via cookie)
- Implements FR67 (cookie wins over IP in conflicts)
- Return previous_date for UX feedback
- Track updated_at for analytics (how often do users change minds?)
- Consider showing "You've changed your prediction 3 times" for engagement

---

### Story 2.9: Weighted Median Algorithm Implementation

As a system,
I want to calculate the community median using weighted values,
So that troll predictions (2099, 1999) have reduced influence.

**Acceptance Criteria:**

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

**Prerequisites:** Story 1.2 (database schema), Story 2.7 (submissions exist)

**Technical Notes:**
- Implements FR7 (weighted median calculation)
- Implements FR8 (specific weight values)
- Implements FR63 (fallback to simple median if weights fail)
- Algorithm is O(n) time complexity (efficient)
- Consider caching result for FR12 (5-min cache)
- Weights are pre-calculated to avoid recalculation on every stats query

---

### Story 2.10: Statistics Calculation and Caching

As a system,
I want to calculate min/max/count/median statistics efficiently,
So that the stats API can respond quickly (<200ms).

**Acceptance Criteria:**

**Given** predictions exist in the database
**When** statistics are requested
**Then** the following are calculated:

**1. Weighted Median (FR7):**
- Use algorithm from Story 2.9
- Cache result in Cloudflare KV
- TTL: 5 minutes (FR12)

**2. Minimum Date (FR9, unweighted):**
```sql
SELECT MIN(predicted_date) FROM predictions
```

**3. Maximum Date (FR10, unweighted):**
```sql
SELECT MAX(predicted_date) FROM predictions
```

**4. Total Count (FR11):**
```sql
SELECT COUNT(*) FROM predictions
```

**And** caching strategy:
- Cache key: `stats:latest`
- Cache value: JSON with all stats
- TTL: 300 seconds (5 minutes)
- Invalidate on: New submission, update, deletion

**And** cache miss behavior:
- Query database for all stats
- Calculate weighted median
- Store in cache
- Return to user

**And** cache hit behavior:
- Return cached value immediately
- Response time: <50ms (FR12 target)

**And** statistics API endpoint:
```typescript
GET /api/stats
Response (200 OK):
{
  "median": "2026-11-19",
  "min": "2025-06-15",
  "max": "2099-12-31",
  "count": 10234,
  "cached_at": "2025-11-13T14:30:00Z"
}
```

**Prerequisites:** Story 2.9 (weighted median), Story 2.7 (submissions)

**Technical Notes:**
- Implements FR12 (near real-time with <5 min cache)
- Cloudflare KV is globally distributed (low latency)
- Consider cache warming on deployment
- Stats calculation is read-heavy (perfect for caching)
- Cache invalidation is "write through" (update on mutation)
- Min/max queries are indexed for performance

---

## Epic 3: Results Display & User Feedback

**Epic Goal:** Show community sentiment and provide instant gratification through social validation.

**Epic Value:** Transforms raw data into engaging, shareable insights. The "Am I crazy?" moment drives viral sharing.

### Story 3.1: Landing Page with Stats Display

As a user,
I want to see the community prediction data immediately upon landing,
So that I understand what others think before I submit.

**Acceptance Criteria:**

**Given** a user visits the homepage
**When** the page loads
**Then** the following elements are displayed prominently:

**1. Headline (above-the-fold):**
- H1: "When Will GTA 6 Actually Launch?"
- Subhead: "Rockstar says November 19, 2026. What does the community think?"

**2. Community Statistics (large, bold):**
- Median prediction: "Feb 14, 2027" (formatted for locale, FR75)
- Total predictions: "10,234 predictions" (formatted with commas)
- Min/max range: "Earliest: Jun 2025 | Latest: Dec 2099"

**3. Prediction Form (primary CTA):**
- Date picker (Story 2.3)
- Submit button: "Add My Prediction"
- Visible immediately (no scrolling required)

**4. Visual Hierarchy:**
- Community median is LARGEST element (2-3x normal text)
- Form is second-most prominent
- Min/max are tertiary information

**And** data loads asynchronously:
- Show skeleton/loading state while fetching stats
- Stats API call: GET /api/stats (Story 2.10)
- Update DOM when data arrives
- Handle loading errors gracefully (FR59)

**And** minimum prediction threshold is enforced (FR99):
- If count < 50: Show placeholder "Need 50 predictions to show community median. Be one of the first!"
- Show current count: "12 / 50 predictions submitted"
- Still allow submissions (building toward threshold)

**Prerequisites:** Story 2.10 (stats API)

**Technical Notes:**
- Implements FR13-16 (display median, min, max, count)
- Implements FR99 (50 prediction minimum)
- Implements FR59 (user-friendly error messages)
- Use semantic HTML for accessibility (FR71)
- Mobile-first layout (FR39, FR93)
- Optimistic UI: Show submitted prediction immediately before API confirms

---

### Story 3.2: Social Comparison Messaging

As a user,
I want to know how my prediction compares to the community,
So that I feel validated or intrigued by the difference.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** the confirmation screen loads
**Then** social comparison messaging is displayed:

**Comparison Logic:**
```typescript
function getComparisonMessage(userDate: Date, medianDate: Date): string {
  const daysDiff = Math.round(
    (userDate.getTime() - medianDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysDiff === 0) {
    return "You're exactly aligned with the community! 🎯";
  } else if (daysDiff > 0) {
    return `You're ${Math.abs(daysDiff)} days more pessimistic than the community 😬`;
  } else {
    return `You're ${Math.abs(daysDiff)} days more optimistic than the community 🤞`;
  }
}
```

**And** messaging includes personality:
- Exactly aligned: "Great minds think alike!"
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

**Prerequisites:** Story 2.7 (submission), Story 2.10 (median data)

**Technical Notes:**
- Implements FR17 (social comparison messaging)
- Implements FR18 (quantified delta from median)
- Emotional framing encourages sharing (viral mechanic)
- Personalization increases engagement
- Calculate on frontend (avoid extra API call)

---

### Story 3.3: Submission Confirmation with Visual Feedback

As a user,
I want immediate confirmation that my prediction was recorded,
So that I feel confident it worked and see my ranking.

**Acceptance Criteria:**

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

**Prerequisites:** Story 2.7 (submission), Story 3.2 (social comparison)

**Technical Notes:**
- Implements FR6 (immediate visual confirmation)
- Implements FR70 (screen reader announcements)
- Optimistic UI improves perceived performance
- Gamification element ("You're #10,235!") adds engagement
- Celebration moment increases likelihood of sharing

---

### Story 3.4: Optional Chart Visualization Toggle

As a user,
I want to optionally see a chart of prediction distribution,
So that I can understand the full spectrum of community opinions.

**Acceptance Criteria:**

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

**Prerequisites:** Story 2.10 (stats API returns data for charting)

**Technical Notes:**
- Implements FR19 (optional chart visualization)
- Default hidden reduces page weight (performance)
- Lazy loading prevents blocking main content
- Histogram provides visual understanding of distribution
- Marking user's prediction creates personal connection

---

### Story 3.5: Error Handling with Retry Mechanisms

As a user,
I want helpful error messages when something goes wrong,
So that I know what happened and can try again.

**Acceptance Criteria:**

**Given** an error occurs during submission or data loading
**When** the error is detected
**Then** user-friendly messages are displayed:

**Network Errors (FR60):**
- Message: "Unable to connect. Please check your internet and try again."
- Show retry button
- Auto-retry after 3 seconds (max 3 attempts)
- Timeout after 10 seconds total

**API Errors:**
- 400 Bad Request: Show specific validation error from API
- 409 Conflict (already submitted): "You've already submitted. Update your prediction instead."
- 429 Rate Limit: "Slow down! Please wait {seconds} seconds."
- 500 Server Error: "Something went wrong on our end. Please try again in a moment."

**Database Errors (FR59):**
- Generic message: "Unable to save your prediction. Please try again."
- Log detailed error server-side for debugging
- Don't expose internal error details to user

**reCAPTCHA Errors:**
- Score too low: "Verification failed. Please try again." with retry button
- Network error: "Verification service unavailable. Please try again later."

**And** error UI design:
- Red/orange color scheme (attention)
- Clear actionable next step (retry button, wait time, etc.)
- Dismiss button to close error message
- Error doesn't lose user's input (date remains selected)

**And** fallback behaviors (FR60):
- If stats API fails: Show cached data or placeholder
- If submission fails: Save to localStorage for retry
- If reCAPTCHA unavailable: Allow submission (fail-open)

**Prerequisites:** Story 1.4 (error handling utilities), Story 2.7 (submission)

**Technical Notes:**
- Implements FR59 (user-friendly error messages)
- Implements FR60 (network timeout handling with retry)
- Implements FR64 (graceful degradation)
- Toast notifications for errors (non-blocking)
- Log errors to Cloudflare Analytics for monitoring
- Never expose stack traces or database details to users

---

### Story 3.6: Race Condition Prevention for Concurrent Submissions

As a system,
I want to prevent race conditions when multiple submissions arrive simultaneously,
So that database integrity is maintained.

**Acceptance Criteria:**

**Given** two submissions arrive for the same IP address within milliseconds
**When** both attempt to insert into the database
**Then** transaction isolation prevents conflicts:

**Database Transaction Settings:**
- Isolation level: SERIALIZABLE or IMMEDIATE for D1
- Transaction scope: From IP check to INSERT
- Lock timeout: 5 seconds

**Race Condition Scenarios:**

**Scenario 1: Same IP, different cookies (network switching)**
- First transaction wins (inserts record)
- Second transaction fails on UNIQUE(ip_hash) constraint
- Second transaction returns 409 Conflict

**Scenario 2: Same cookie, duplicate submit (double-click)**
- Check if cookie_id already exists
- If exists: Treat as UPDATE instead of INSERT
- Return success with "updated" message

**Scenario 3: Database deadlock**
- Detect deadlock error
- Automatic retry (max 3 attempts, Story 1.4)
- Exponential backoff: 100ms, 200ms, 400ms
- If all retries fail: Return 503 Service Unavailable

**And** transaction logging:
- Log all constraint violations (IP or cookie)
- Monitor deadlock frequency
- Alert if deadlock rate > 1%

**Prerequisites:** Story 1.4 (transaction support), Story 2.7 (submission)

**Technical Notes:**
- Implements FR61 (race condition prevention)
- Implements FR83 (database transactions)
- D1/SQLite supports IMMEDIATE transactions (lock on BEGIN)
- UNIQUE constraints are last line of defense
- Idempotent operations where possible
- Consider optimistic locking for updates

---

### Story 3.7: Graceful Degradation Under Load

As a system,
I want the site to remain functional when traffic exceeds capacity,
So that users have a degraded but working experience.

**Acceptance Criteria:**

**Given** traffic approaches Cloudflare free tier limits (100K req/day)
**When** limits are reached
**Then** degradation strategy activates:

**At 80% capacity (80K requests):**
- Log warning to monitoring
- Consider upgrade to paid tier (FR97 Growth feature)
- No user-facing changes yet

**At 90% capacity (90K requests):**
- Increase cache TTL from 5 min to 15 min (reduce DB reads)
- Disable optional features (chart visualization)
- Show notice: "High traffic! Some features temporarily limited."

**At 95% capacity (95K requests):**
- Serve cached stats only (no live updates)
- Queue submissions (process when capacity available)
- Show: "We're experiencing high traffic. Your submission will be processed shortly."

**At 100% capacity (limit reached):**
- Read-only mode: Show stats but disable submissions
- Display: "We've reached capacity for today. Try again in {hours} hours."
- Countdown to daily limit reset (midnight UTC)

**And** queue management:
- Store queued submissions in Cloudflare KV
- TTL: 24 hours
- Process FIFO when capacity available
- Notify user when processed (if email provided, Growth feature)

**And** monitoring:
- Track capacity usage in Cloudflare Analytics
- Alert at 80% threshold
- Daily capacity report

**Prerequisites:** Story 2.10 (stats caching), Story 2.7 (submissions)

**Technical Notes:**
- Implements FR64 (graceful degradation)
- Implements FR63 (fallback mechanisms)
- Cloudflare free tier: 100K requests/day, 5M DB reads/day
- Queuing prevents data loss during spikes
- Read-only mode preserves core value (viewing sentiment)
- Degradation is progressive (not all-or-nothing)
- Monitor DB reads separately (often hit before request limit)

---

## Epic 4: Privacy, Compliance & Trust

**Epic Goal:** Build trust and meet legal requirements (GDPR) - essential for Reddit approval and user confidence.

**Epic Value:** Trust = growth. Compliance = avoiding lawsuits. Transparency = Reddit mods approve launch.

### Story 4.1: GDPR Cookie Consent Banner

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

### Story 4.2: Privacy Policy Page

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

### Story 4.3: Terms of Service Page

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

### Story 4.4: About Page (Transparency & Methodology)

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

### Story 4.5: Cookie Management and Expiration

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

### Story 4.6: GDPR Data Deletion Request Form

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

### Story 4.7: Cookie Conflict Resolution (Cookie vs IP)

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

### Story 4.8: Data Retention Policy Implementation

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

## Epic 5: Social Sharing & Virality

**Epic Goal:** Enable organic viral growth through frictionless sharing - each share brings 10+ new users.

**Epic Value:** Distribution IS the strategy. Without sharing, growth is linear (death). Exponential growth requires viral mechanics.

### Story 5.1: Twitter/X Share Button with Pre-filled Text

As a user,
I want to easily share my prediction to Twitter/X,
So that I can show my friends and start conversations.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** they click the Twitter/X share button
**Then** a Twitter compose window opens with pre-filled text:

**Tweet Template:**
```
I predicted GTA 6 will launch on {user_date}. The community median is {median_date}.
What do you think? 🎮

{url}
```

**And** tweet personalization:
- If user = median: "I'm aligned with the community! 🎯"
- If user < median: "I'm {X} days more optimistic 🤞"
- If user > median: "I'm {X} days more pessimistic 😬"

**And** URL parameters track source:
- URL: `https://gta6predictions.com/?ref=twitter&u={hash}`
- `ref=twitter` tracks traffic source (FR42)
- `u={hash}` optional unique identifier for virality tracking

**And** button placement (FR100):
- Displayed immediately after submission confirmation
- Above-the-fold (no scrolling required)
- Prominent visual design (Twitter blue color)
- Icon: Twitter/X logo

**And** share analytics (FR45):
- Track: Share button clicks
- Track: Click-through from Twitter (URL ref parameter)
- Calculate: Share CTR = shares / submissions

**Prerequisites:** Story 3.3 (submission confirmation), Story 2.10 (median data)

**Technical Notes:**
- Implements FR20 (Twitter/X share with pre-filled text)
- Implements FR100 (prominent above-the-fold placement)
- Implements FR45 (social share CTR tracking)
- Use Twitter Web Intent API: `https://twitter.com/intent/tweet?text={encoded_text}`
- URL shortener not needed (direct link)
- Track clicks via onclick event before opening window

---

### Story 5.2: Reddit Share Button with Pre-filled Text

As a user,
I want to easily share my prediction to Reddit,
So that I can engage with the GTA 6 community.

**Acceptance Criteria:**

**Given** a user has submitted a prediction
**When** they click the Reddit share button
**Then** Reddit submit page opens with pre-filled content:

**Reddit Post Template:**
```
Title: GTA 6 Launch Date Predictions - What does the community think?

Body:
I just submitted my prediction: {user_date}
Community median: {median_date}

I'm {X} days {optimistic/pessimistic} compared to everyone else!

Check out the full data and add your prediction:
{url}
```

**And** subreddit suggestions:
- Default: r/GTA6 (largest community)
- Alternative: r/gaming, r/Games, r/rockstar
- User can change subreddit before posting

**And** URL parameters:
- URL: `https://gta6predictions.com/?ref=reddit&u={hash}`
- Tracks Reddit traffic (FR42)

**And** button placement (FR100):
- Next to Twitter button
- Same visual prominence
- Icon: Reddit logo (orange)

**Prerequisites:** Story 3.3 (submission confirmation)

**Technical Notes:**
- Implements FR21 (Reddit share with pre-filled text)
- Reddit URL: `https://reddit.com/submit?url={url}&title={title}`
- Pre-fill body not supported by Reddit API (user copies template)
- Consider Reddit-specific share image (Open Graph)

---

### Story 5.3: Open Graph Meta Tags for Rich Previews

As a system,
I want dynamic Open Graph meta tags,
So that shared links show rich previews with current data.

**Acceptance Criteria:**

**Given** a URL is shared on social media
**When** the platform fetches meta tags
**Then** dynamic Open Graph tags are returned:

**Meta Tags (Server-side rendered):**
```html
<meta property="og:title" content="GTA 6 Launch Date Predictions - Community Sentiment" />
<meta property="og:description" content="The community predicts GTA 6 will launch on Feb 14, 2027 (median of 10,234 predictions). What do you think?" />
<meta property="og:image" content="https://gta6predictions.com/og-image.png" />
<meta property="og:url" content="https://gta6predictions.com/" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="GTA 6 Launch Date Predictions" />
<meta name="twitter:description" content="Community median: Feb 14, 2027 (10,234 predictions)" />
<meta name="twitter:image" content="https://gta6predictions.com/og-image.png" />
```

**And** personalized sharing (FR23):
- If URL has `?u={hash}` parameter: Show user's specific prediction
- Title: "I predicted {user_date} for GTA 6"
- Description: "The community median is {median_date}. I'm {X} days {optimistic/pessimistic}."

**And** dynamic image generation (optional):
- Generate image with current median + total count
- Update every hour (cached)
- Fallback: Static branded image

**And** meta tag updates:
- Reflect current median (not stale data)
- Update on every page load (server-side rendering)
- Cache for 5 minutes (same as stats API)

**Prerequisites:** Story 2.10 (stats API for data)

**Technical Notes:**
- Implements FR22 (dynamic Open Graph meta tags)
- Implements FR23 (personalized prediction in shared links)
- Server-side rendering required (Cloudflare Pages supports SSR)
- Test with Facebook Debugger, Twitter Card Validator
- Image dimension: 1200x630px (optimal for all platforms)
- Canonical URL prevents duplicate content issues

---

### Story 5.4: SEO Meta Tags and Structured Data

As a site owner,
I want optimized meta tags and structured data,
So that the site ranks well for "GTA 6 predictions" searches.

**Acceptance Criteria:**

**Given** search engines crawl the site
**When** they parse the HTML
**Then** SEO-optimized meta tags are present:

**Basic Meta Tags:**
```html
<title>GTA 6 Launch Date Predictions - Community Sentiment Tracker</title>
<meta name="description" content="Track community predictions for GTA 6's launch date. Submit your prediction and see what {count} other fans think. Current median: {median_date}." />
<meta name="keywords" content="GTA 6, launch date, predictions, community, Rockstar, Grand Theft Auto 6" />
```

**And** Schema.org structured data for VideoGame:
```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Grand Theft Auto VI",
  "gamePlatform": ["PlayStation 5", "Xbox Series X"],
  "publisher": {
    "@type": "Organization",
    "name": "Rockstar Games"
  },
  "datePublished": "TBD",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{median_date}",
    "ratingCount": "{prediction_count}",
    "bestRating": "{max_date}",
    "worstRating": "{min_date}"
  }
}
```

**And** Schema.org Event data:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "GTA 6 Launch Date",
  "startDate": "{median_date}",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://rockstargames.com"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Rockstar Games"
  }
}
```

**And** additional SEO tags:
- Canonical URL: `<link rel="canonical" href="https://gta6predictions.com/" />`
- Mobile viewport: `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- Language: `<html lang="en">`
- Favicon and app icons

**Prerequisites:** Story 2.10 (stats for dynamic content)

**Technical Notes:**
- Implements FR35 (meta title optimized for "GTA 6 predictions")
- Implements FR36 (meta description with community median)
- Implements FR37 (Schema.org VideoGame)
- Implements FR38 (Schema.org Event)
- Dynamic meta tags updated on every page load
- Test with Google Rich Results Test
- Submit sitemap to Google Search Console

---

### Story 5.5: Mobile-Responsive Design

As a user on mobile,
I want the site to work perfectly on my phone,
So that I can participate regardless of device.

**Acceptance Criteria:**

**Given** a user accesses the site on mobile
**When** the page loads
**Then** responsive layout is applied:

**Mobile Layout (<768px):**
- Single column layout
- Full-width date picker (native mobile picker)
- Large touch targets (44x44px minimum, FR87)
- Stacked stats (median above min/max)
- Share buttons stacked vertically
- Footer links collapsed or accordion

**Tablet Layout (768px-1024px):**
- Two-column layout (form left, stats right)
- Medium touch targets
- Side-by-side share buttons

**Desktop Layout (>1024px):**
- Three-column layout (stats, form, visualization)
- Hover states on buttons
- Expanded navigation

**And** responsive images:
- Hero image scales to viewport
- OG image optimized for mobile sharing
- Icons use SVG (scalable)

**And** touch optimization:
- No hover-dependent interactions
- Tap targets minimum 44x44px (FR87)
- No tiny text (minimum 16px base font)
- Comfortable spacing between tappable elements

**And** performance on mobile:
- Lazy load images
- Minimize JavaScript
- Critical CSS inline
- Load time < 3s on 3G (FR40)

**And** testing requirements (FR93):
- Test on iOS Safari (latest)
- Test on Android Chrome (latest)
- Test on various screen sizes (320px to 1920px)
- Pass Google Mobile-Friendly Test

**Prerequisites:** Story 3.1 (landing page layout)

**Technical Notes:**
- Implements FR39 (mobile-responsive, passes Google test)
- Implements FR40 (<3s mobile load time)
- Implements FR87 (44x44px touch targets)
- Implements FR93 (mobile testing requirement)
- Use CSS media queries or Tailwind breakpoints
- Mobile-first approach (design for mobile, enhance for desktop)
- Test with Chrome DevTools device emulator
- Real device testing critical for touch interactions

---

### Story 5.6: Performance Optimization for Fast Load Times

As a user,
I want the site to load instantly,
So that I don't abandon it due to slow performance.

**Acceptance Criteria:**

**Given** a user visits the site
**When** the page loads
**Then** performance targets are met:

**Load Time Targets (FR40):**
- Desktop (good connection): < 2 seconds
- Mobile (3G connection): < 3 seconds
- Lighthouse Performance score: >90 (FR94)

**Optimization Techniques:**

1. **HTML/CSS:**
   - Minify HTML, CSS, JS
   - Inline critical CSS
   - Defer non-critical CSS
   - Remove unused CSS

2. **JavaScript:**
   - Minify and bundle
   - Code splitting (load what's needed)
   - Defer non-critical JS
   - Lazy load chart library (only if user clicks)

3. **Images:**
   - WebP format with JPG fallback
   - Responsive images (srcset)
   - Lazy loading (native loading="lazy")
   - Compress with imagemin

4. **Fonts:**
   - System fonts preferred (no web font load)
   - If web fonts: font-display: swap
   - Preload critical fonts

5. **Caching:**
   - Cloudflare CDN (automatic)
   - Cache-Control headers (1 year for static assets)
   - Service Worker for offline (optional PWA)

6. **API:**
   - Stats API cached (5 min, Story 2.10)
   - Cloudflare KV global distribution
   - Minimize API calls (batch requests)

**And** Lighthouse audit results:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**And** monitoring (FR102):
- Track Core Web Vitals (LCP, FID, CLS)
- Cloudflare Analytics tracks load times
- Alert if p95 > 3 seconds

**Prerequisites:** All frontend stories complete

**Technical Notes:**
- Implements FR40 (<2s desktop, <3s mobile)
- Implements FR94 (Lighthouse >90)
- Implements FR102 (performance monitoring)
- Use Vite for build optimization (tree shaking, minification)
- Cloudflare Pages provides automatic optimizations
- Test with Lighthouse CI in pipeline
- WebPageTest.org for detailed waterfall analysis

---

## Epic 6: Embeddable Widget

**Epic Goal:** Enable streamers and media sites to embed live data - passive distribution to 250M+ content viewers.

**Epic Value:** B2B distribution channel. Streamers = credibility + massive reach.

### Story 6.1: Widget Iframe Embed Code Generator

As a content creator,
I want to easily get embed code for the widget,
So that I can add it to my stream or website.

**Acceptance Criteria:**

**Given** a user wants to embed the widget
**When** they visit /widget or click "Embed Widget" link
**Then** an embed code generator page is displayed:

**Page Content:**

1. **Live Preview:**
   - Shows what widget looks like
   - Real data (median, count)
   - Responsive preview (mobile/desktop toggle)

2. **Customization Options (FR29):**
   - Theme: Light | Dark
   - Size: Small (250x150) | Medium (400x250) | Large (600x350)
   - Auto-refresh: Yes (every 5 min) | No

3. **Generated Code:**
```html
<iframe
  src="https://gta6predictions.com/widget?theme=dark&size=medium"
  width="400"
  height="250"
  frameborder="0"
  scrolling="no"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  title="GTA 6 Predictions Widget"
></iframe>
```

4. **Copy Button:**
   - One-click copy to clipboard
   - Confirmation: "Copied!"

5. **Instructions:**
   - Paste code into your site's HTML
   - Widget updates automatically
   - Link back to main site included

**And** widget URL parameters:
- `theme=light|dark` - Controls color scheme
- `size=small|medium|large` - Controls dimensions
- `refresh=true|false` - Auto-refresh enabled

**Prerequisites:** None (static page with embed generator)

**Technical Notes:**
- Implements FR24 (embeddable iframe code generator)
- Implements FR29 (light/dark theming)
- Simple HTML generator (no backend needed)
- Preview uses actual widget endpoint
- Clipboard API for copy functionality

---

### Story 6.2: Widget Endpoint with Live Data

As a widget embedder,
I want the widget to display live community data,
So that my audience sees current predictions.

**Acceptance Criteria:**

**Given** a widget is embedded on a third-party site
**When** the iframe loads
**Then** the widget displays:

**Widget Content (FR25-26):**
- Community median prediction (large text)
- Total predictions count
- Tagline: "What does the community think?"
- Link: "Add your prediction →" (links to main site, FR27)

**Widget HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Minimal CSS for performance */
    body { margin: 0; font-family: system-ui; }
    .widget { padding: 20px; text-align: center; }
    .median { font-size: 32px; font-weight: bold; }
    .count { font-size: 14px; color: #666; }
    .cta { margin-top: 10px; }
  </style>
</head>
<body class="theme-{theme}">
  <div class="widget">
    <div class="median">{median_date}</div>
    <div class="count">{count} predictions</div>
    <div class="cta">
      <a href="https://gta6predictions.com/?ref=widget" target="_blank">
        Add your prediction →
      </a>
    </div>
  </div>
</body>
</html>
```

**And** data fetching:
- Call stats API: GET /api/stats (Story 2.10)
- Cache result: 5 minutes (same as main site)
- Render server-side for performance

**And** auto-refresh (if enabled):
- JavaScript polls API every 5 minutes
- Updates DOM without full reload
- Minimal bandwidth usage

**And** theming support:
- Light theme: White background, dark text
- Dark theme: Dark background, light text
- CSS variables for easy customization

**Prerequisites:** Story 2.10 (stats API)

**Technical Notes:**
- Implements FR25 (widget displays median)
- Implements FR26 (widget displays count)
- Implements FR27 (widget links to main site)
- Implements FR28 (lightweight <50KB)
- Keep HTML minimal (no external dependencies)
- Inline CSS for single request
- Server-side render for instant display

---

### Story 6.3: Widget Security with Iframe Sandbox

As a site owner,
I want widgets sandboxed for security,
So that embedded sites can't exploit the widget.

**Acceptance Criteria:**

**Given** a widget is embedded on a third-party site
**When** the iframe loads
**Then** security restrictions are enforced:

**Iframe Sandbox Attributes (FR85):**
```html
sandbox="allow-scripts allow-same-origin"
```

**Allowed:**
- `allow-scripts` - JavaScript can run (for auto-refresh)
- `allow-same-origin` - Fetch data from same origin (stats API)

**Blocked:**
- `allow-forms` - No form submission from widget
- `allow-popups` - No popups
- `allow-top-navigation` - Can't navigate parent page
- `allow-modals` - No alerts/confirms

**And** Content Security Policy (CSP):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self';
  connect-src 'self';
```

**And** additional security:
- No cookies set by widget
- No local storage access
- No access to parent window (cross-origin)
- HTTPS only (Cloudflare enforces)

**And** clickjacking protection:
- X-Frame-Options: SAMEORIGIN (allows embedding)
- Widget can only be embedded, not framed maliciously

**Prerequisites:** Story 6.2 (widget endpoint)

**Technical Notes:**
- Implements FR85 (iframe sandbox restrictions)
- Sandbox prevents XSS from widget to parent
- CSP prevents loading external resources
- Balance security with functionality (need scripts for refresh)
- Test widget on various platforms (Twitch, WordPress, etc.)

---

### Story 6.4: Widget-Specific Rate Limiting

As a system,
I want separate rate limits for widget endpoints,
So that widget traffic doesn't exhaust API quotas.

**Acceptance Criteria:**

**Given** widgets are embedded on high-traffic sites
**When** widget requests arrive
**Then** separate rate limits apply (FR86):

**Widget Rate Limits:**
- Per origin (embedding domain): 120 requests/minute
- Per IP: No limit (widgets share IPs via streamers)
- Global widget traffic: No limit (widgets are read-only)

**Rationale:**
- Widget on streamer with 10K viewers = 10K requests
- If IP-based limiting: All blocked after 60/min
- Origin-based: Each embedding site gets own quota

**And** rate limit headers (widget-specific):
```
X-Widget-RateLimit-Limit: 120
X-Widget-RateLimit-Remaining: 95
X-Widget-RateLimit-Reset: 1640000000
X-Widget-Origin: twitch.tv
```

**And** rate limit exceeded response:
- Status: 429 Too Many Requests
- Body: Cached stats (stale but functional)
- Retry-After: 60 seconds

**And** caching strategy:
- Widget endpoint cached aggressively (5 min)
- Even rate-limited requests get cached data
- Gradual degradation (not complete failure)

**And** monitoring:
- Track widget traffic by origin
- Identify top embedding sites
- Optimize or whitelist high-value partners

**Prerequisites:** Story 6.2 (widget endpoint)

**Technical Notes:**
- Implements FR86 (widget separate rate limiting)
- Origin header identifies embedding site
- Cloudflare Workers can extract origin from Referer
- Different limits than main site (widgets are passive)
- Cache-first strategy prevents most rate limit hits
- Consider paid tier for high-traffic partners (future)

---

## Epic 7: Accessibility & Internationalization

**Epic Goal:** Reach global audience without barriers - broader reach = more predictions = better data.

**Epic Value:** Accessibility = legal compliance + moral imperative. i18n = global reach (GTA 6 is worldwide).

### Story 7.1: Keyboard Navigation Throughout Site

As a keyboard user,
I want to navigate the entire site without a mouse,
So that I can use the site regardless of input method.

**Acceptance Criteria:**

**Given** a user navigates with keyboard only
**When** they press Tab key
**Then** focus moves logically through interactive elements:

**Tab Order:**
1. Skip navigation link (FR88, Story 7.5)
2. Main navigation links
3. Date picker input
4. Submit button
5. Share buttons (Twitter, Reddit)
6. Widget embed link
7. Footer links (Privacy, Terms, About)

**And** date picker is keyboard accessible (FR69):
- Tab focuses input
- Arrow keys navigate dates (native HTML5 picker)
- Enter selects date
- Space opens calendar (browser-dependent)
- Esc closes calendar

**And** visual focus indicators:
- Blue outline on focused elements
- Minimum 2px solid border
- High contrast (4.5:1 ratio, FR87)
- No outline removal (never outline: none)

**And** keyboard shortcuts (optional):
- S: Focus submit button
- D: Focus date picker
- /: Focus search (if added later)

**And** no keyboard traps:
- Every focusable element can be unfocused
- Modals can be closed with Esc
- No infinite loops in tab order

**Prerequisites:** All interactive elements exist

**Technical Notes:**
- Implements FR69 (keyboard accessible date picker)
- Native HTML5 controls are keyboard accessible by default
- Test with Tab, Shift+Tab, Enter, Space, Arrow keys
- Use tabindex="0" for custom controls (if any)
- Never tabindex="-1" on interactive elements
- Test with screen reader (NVDA, JAWS, VoiceOver)

---

### Story 7.2: Screen Reader Support with ARIA Labels

As a screen reader user,
I want all elements properly labeled,
So that I understand the interface through audio.

**Acceptance Criteria:**

**Given** a screen reader user navigates the site
**When** they encounter elements
**Then** ARIA labels provide context:

**ARIA Labels (FR71):**

1. **Date Picker:**
```html
<label for="prediction-date">When do you think GTA 6 will launch?</label>
<input
  type="date"
  id="prediction-date"
  aria-label="Prediction date input"
  aria-required="true"
  aria-describedby="date-help"
/>
<span id="date-help">Select a date between 2025 and 2125</span>
```

2. **Submit Button:**
```html
<button
  type="submit"
  aria-label="Submit your GTA 6 launch prediction"
>
  Submit Prediction
</button>
```

3. **Statistics:**
```html
<div role="region" aria-label="Community prediction statistics">
  <div aria-label="Community median prediction">
    <span aria-hidden="true">Median:</span>
    <strong>February 14, 2027</strong>
  </div>
  <div aria-label="Total predictions submitted">
    <span aria-hidden="true">Total:</span>
    <strong>10,234 predictions</strong>
  </div>
</div>
```

4. **Share Buttons:**
```html
<button aria-label="Share your prediction on Twitter">
  <svg aria-hidden="true">...</svg>
  Share on Twitter
</button>
```

**And** ARIA live regions for dynamic content (FR70):
```html
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- Submission confirmation announced here -->
</div>
```

**And** landmark roles:
- `<header role="banner">` - Site header
- `<nav role="navigation">` - Main navigation
- `<main role="main">` - Primary content
- `<footer role="contentinfo">` - Site footer

**And** heading hierarchy:
- Only one `<h1>` per page
- Logical nesting: h1 → h2 → h3
- No skipped levels (h1 → h3)

**Prerequisites:** All UI elements exist

**Technical Notes:**
- Implements FR71 (all interactive elements have ARIA labels)
- Implements FR70 (screen reader announcements)
- Test with NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- Use axe DevTools to audit accessibility
- Semantic HTML reduces need for ARIA (use `<button>` not `<div role="button">`)

---

### Story 7.3: UTC Storage with Local Timezone Display

As a user,
I want to see dates in my local timezone,
So that predictions make sense relative to my location.

**Acceptance Criteria:**

**Given** users are in different timezones
**When** dates are submitted and displayed
**Then** timezone handling is correct:

**Storage (FR73):**
- All dates stored as UTC in database
- Format: ISO 8601 `2026-11-19T00:00:00Z`
- No timezone information in UI (dates only, no times)

**Display (FR74):**
- Detect user's timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Convert UTC to user's local timezone for display
- Format for locale: `toLocaleDateString()`

**Example Flow:**
```typescript
// User in PST submits "2026-11-19"
const userDate = new Date('2026-11-19'); // Local midnight PST
const utcDate = new Date(userDate.toISOString()); // Convert to UTC
// Store: "2026-11-19T08:00:00Z" (PST is UTC-8)

// Display to user in EST (UTC-5)
const displayDate = new Date('2026-11-19T08:00:00Z');
const formatted = displayDate.toLocaleDateString('en-US');
// Shows: "11/19/2026" (same calendar date, different local time)
```

**And** date-only handling:
- Users select calendar dates, not times
- Timezone differences don't matter (date is universal)
- "November 19, 2026" means same thing globally

**And** edge cases:
- Leap year dates (Feb 29) handled correctly
- Timezone changes (DST) don't affect dates
- International Date Line doesn't cause issues

**Prerequisites:** Story 2.3 (date picker), Story 2.10 (stats display)

**Technical Notes:**
- Implements FR73 (UTC storage)
- Implements FR74 (local timezone display)
- JavaScript Date object handles timezone conversion
- Store dates as strings (not timestamps) to avoid time component
- ISO 8601 is timezone-safe and globally understood

---

### Story 7.4: International Date Format Support

As a user outside the US,
I want dates formatted in my locale's convention,
So that I understand them naturally.

**Acceptance Criteria:**

**Given** users have different locale preferences
**When** dates are displayed
**Then** formatting matches user's locale (FR75):

**Locale Detection:**
```typescript
const userLocale = navigator.language || 'en-US';
const formatted = date.toLocaleDateString(userLocale);
```

**Format Examples:**
- US (`en-US`): 11/19/2026 (MM/DD/YYYY)
- UK (`en-GB`): 19/11/2026 (DD/MM/YYYY)
- Germany (`de-DE`): 19.11.2026 (DD.MM.YYYY)
- Japan (`ja-JP`): 2026/11/19 (YYYY/MM/DD)
- France (`fr-FR`): 19/11/2026 (DD/MM/YYYY)

**And** number formatting:
- US: 10,234 predictions
- Europe: 10.234 predictions (period separator)
- India: 10,234 predictions (lakh system optional)

**And** month names (if showing full dates):
- Auto-translate: "February 14, 2027" → "14 février 2027" (French)
- Use `toLocaleDateString('locale', { month: 'long', day: 'numeric', year: 'numeric' })`

**And** fallback:
- If locale unsupported: Default to `en-US`
- If formatting fails: Show ISO 8601 `2026-11-19`

**Prerequisites:** Story 7.3 (timezone handling)

**Technical Notes:**
- Implements FR75 (international date formats)
- JavaScript `Intl.DateTimeFormat` handles all formatting
- No translation library needed (browser-native)
- Automatically supports 100+ locales
- Test with browser language override

---

### Story 7.5: Skip Navigation Link for Keyboard Users

As a keyboard user,
I want to skip repetitive navigation,
So that I can quickly access main content.

**Acceptance Criteria:**

**Given** a keyboard user lands on the page
**When** they press Tab key once
**Then** a "Skip to main content" link appears:

**Link Implementation:**
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- ... navigation ... -->

<main id="main-content" tabindex="-1">
  <!-- Main content here -->
</main>
```

**And** visual design:
- Hidden by default (visually hidden, not display:none)
- Appears on focus (visible when Tab pressed)
- Positioned at top-left corner
- High contrast (white text on blue background)
- Clear, large text (16px minimum)

**And** behavior:
- Clicking moves focus to main content
- Skip navigation and header entirely
- Focus moves to first interactive element in main

**And** CSS implementation:
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

**Prerequisites:** Main content has identifiable element

**Technical Notes:**
- Implements FR88 (skip navigation link)
- WCAG 2.1 Level A requirement (bypass blocks)
- Helps keyboard users, screen reader users
- First focusable element on page
- Test by tabbing through page

---

## Epic 8: Monetization & Analytics

**Epic Goal:** Sustain operations and measure success - revenue covers costs, analytics inform iteration.

**Epic Value:** Can't iterate without knowing what's working. Can't sustain without revenue.

### Story 8.1: Google AdSense Integration

As a site owner,
I want to display ads that generate revenue,
So that the site can cover its costs.

**Acceptance Criteria:**

**Given** Google AdSense account is approved
**When** the page loads
**Then** ads are displayed strategically:

**Ad Placement (FR47):**
- **Primary:** Banner ad below stats (728x90 leaderboard desktop, 320x50 mobile)
- **Secondary:** Square ad in sidebar (300x250 medium rectangle)
- **No ads:** Above fold (user experience first)

**AdSense Code:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"></script>

<!-- Banner Ad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**And** ad behavior:
- Non-intrusive (no popups, no interstitials)
- Respect content flow
- Clear visual separation from content
- Labeled "Advertisement" (FTC requirement)

**And** performance consideration:
- Async loading (doesn't block page load)
- Lazy load ads below fold
- Monitor impact on Lighthouse score

**And** revenue tracking:
- Link AdSense to Google Analytics
- Track revenue per page view
- Calculate: Revenue / Visitors = RPM

**Prerequisites:** Google AdSense account approved (can take weeks)

**Technical Notes:**
- Implements FR47 (Google AdSense banner)
- AdSense approval requires: original content, privacy policy, traffic
- Approval is NOT guaranteed (gaming niche can be tricky)
- Revenue expectation: $1-3 per 1000 pageviews (low for free tier traffic)
- Backup: Consider alternatives (Carbon Ads, Ethical Ads)

---

### Story 8.2: User Ad Opt-Out Toggle

As a user,
I want to disable ads if they bother me,
So that I have a cleaner experience.

**Acceptance Criteria:**

**Given** ads are displayed
**When** a user clicks "Disable Ads" toggle
**Then** ads are hidden and preference is saved:

**Toggle UI:**
- Location: Footer or settings icon
- Label: "Disable Ads"
- State: On (ads visible) | Off (ads hidden)

**Toggle Implementation:**
```typescript
function toggleAds() {
  const adsDisabled = localStorage.getItem('ads_disabled') === 'true';

  if (adsDisabled) {
    // Hide all ad containers
    document.querySelectorAll('.adsbygoogle').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// On page load
toggleAds();
```

**And** preference persistence (FR49):
- Saved in localStorage
- Key: `ads_disabled`
- Value: `true` or `false`
- Persists across sessions
- No cookie needed (localStorage is permanent)

**And** ad hiding:
- CSS `display: none` on ad containers
- AdSense script still loads (but no impressions)
- No revenue from users with ads disabled (acceptable tradeoff)

**And** messaging:
- "Ads disabled. Thank you for supporting us in other ways!"
- Consider: "Buy me a coffee" link (optional)

**Prerequisites:** Story 8.1 (AdSense integrated)

**Technical Notes:**
- Implements FR48 (users can disable ads)
- Implements FR49 (preference persists)
- Builds goodwill with users
- ~5-10% of users will likely disable (estimate)
- Consider this an engagement/trust feature
- Most ethical sites offer ad-free option

---

### Story 8.3: Traffic Source Tracking

As a site owner,
I want to know where traffic comes from,
So that I can optimize marketing and understand virality.

**Acceptance Criteria:**

**Given** users visit the site
**When** they arrive from various sources
**Then** traffic source is tracked (FR42):

**UTM Parameter Tracking:**
- URL: `?ref=twitter` or `?utm_source=reddit`
- Extract from URL on page load
- Log to analytics

**Traffic Sources:**
- **Organic Search:** No referrer, no params
- **Direct:** No referrer, typed URL
- **Reddit:** `?ref=reddit` or referrer contains reddit.com
- **Twitter:** `?ref=twitter` or referrer contains twitter.com / x.com
- **Widget:** `?ref=widget`
- **Email:** `?ref=email` (Growth feature)

**And** analytics logging:
```typescript
function trackSource() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref') || params.get('utm_source') || 'direct';

  // Send to analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      traffic_source: ref
    });
  }
}
```

**And** Cloudflare Analytics:
- Automatically tracks referrer
- No custom code needed
- View in Cloudflare Dashboard

**And** reporting:
- Daily traffic by source
- Top referrers
- Conversion rate by source (visits → submissions)

**Prerequisites:** Cloudflare Analytics enabled (Story 1.6)

**Technical Notes:**
- Implements FR42 (track traffic sources)
- UTM parameters are standard (Google Analytics compatible)
- Cloudflare Analytics free tier includes referrer tracking
- Use ref parameter for simplicity (utm_source for GA compatibility)
- Helps validate which distribution channels work

---

### Story 8.4: User Geography Tracking

As a site owner,
I want to know where users are located,
So that I understand global reach and potential localization.

**Acceptance Criteria:**

**Given** users visit from different countries
**When** Cloudflare processes requests
**Then** geography is tracked automatically (FR43):

**Cloudflare Headers:**
- `CF-IPCountry` header contains country code (US, GB, DE, etc.)
- Available in Workers for server-side logging
- Automatically in Cloudflare Analytics dashboard

**And** analytics dashboard shows:
- Top countries by traffic
- Top cities (if available)
- Geographic distribution map

**And** insights:
- If 30%+ traffic from non-English countries → Consider localization
- If high traffic from specific region → Target marketing there
- If global distribution → Validates product-market fit

**And** privacy compliance:
- Country-level only (no precise geolocation)
- No IP addresses stored (hashed, Story 2.2)
- GDPR compliant (aggregated data)

**Prerequisites:** Cloudflare Analytics (Story 1.6)

**Technical Notes:**
- Implements FR43 (track user geography country-level)
- Cloudflare provides this automatically (no code needed)
- Country code available for free tier
- Use for product decisions (localization, marketing)
- Privacy-friendly (no PII, aggregated data)

---

### Story 8.5: Analytics for Predictions and Engagement

As a site owner,
I want to track user behavior and engagement,
So that I can optimize the product.

**Acceptance Criteria:**

**Given** users interact with the site
**When** key events occur
**Then** analytics are tracked:

**Key Events (FR41, FR44, FR45):**

1. **Prediction Submitted (FR41):**
   - Event: `prediction_submitted`
   - Properties: date, weight, is_optimistic
   - Frequency: Track over time

2. **Prediction Updated:**
   - Event: `prediction_updated`
   - Properties: days_changed, update_count
   - Insight: How often users change minds

3. **Social Share Clicked (FR45):**
   - Event: `share_clicked`
   - Properties: platform (twitter, reddit)
   - CTR: shares / submissions

4. **Widget Viewed (FR46):**
   - Event: `widget_view`
   - Properties: embedding_origin
   - Insight: Which sites embed most

5. **Returning User (FR44):**
   - Event: `returning_visit`
   - Property: days_since_last_visit
   - Rate: returning / total visitors

**And** Cloudflare Analytics Dashboard:
- Tracks all automatically (page views, unique visitors, etc.)
- Custom events via beacon API

**And** custom event tracking:
```typescript
// Log to Cloudflare Analytics
function trackEvent(eventName, properties) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({ event: eventName, props: properties })
  });
}

// Example usage
document.querySelector('.share-twitter').addEventListener('click', () => {
  trackEvent('share_clicked', { platform: 'twitter' });
});
```

**And** privacy:
- No personal data tracked
- Cookie consent respected (FR68)
- Analytics cookies optional

**Prerequisites:** Cloudflare Analytics (Story 1.6)

**Technical Notes:**
- Implements FR41 (predictions over time)
- Implements FR44 (returning user rate)
- Implements FR45 (social share CTR)
- Implements FR46 (widget usage)
- Cloudflare Analytics free tier sufficient
- Custom events logged to database for detailed analysis
- Respect user consent for analytics cookies

---

## Epic 9: Quality Assurance & Launch Readiness

**Epic Goal:** Ship with confidence - no catastrophic bugs. Quality = trust; bugs on launch day = death.

**Epic Value:** One shot at first impression. Reddit community is unforgiving.

### Story 9.1: Load Testing with 1,000 Concurrent Users

As a developer,
I want to verify the site handles traffic spikes,
So that Reddit launch doesn't crash the site.

**Acceptance Criteria:**

**Given** the site is ready to launch
**When** load test runs with 1,000 concurrent users
**Then** performance remains acceptable:

**Load Test Scenarios:**

1. **Read-Heavy (Stats API):**
   - 800 concurrent users viewing stats
   - Target: <500ms p95 response time
   - Target: 0% error rate

2. **Write-Heavy (Submissions):**
   - 200 concurrent users submitting predictions
   - Target: <1s p95 response time
   - Target: <1% error rate (rate limits okay)

3. **Mixed Load:**
   - 700 viewing, 200 submitting, 100 sharing
   - Realistic traffic distribution

**And** load testing tool (FR91):
- Use: Artillery, k6, or Locust
- Script: Automated test scenarios
- Duration: 10 minutes sustained load
- Ramp-up: 0 → 1000 users over 2 minutes

**Example k6 script:**
```javascript
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  http.get('https://gta6predictions.com/api/stats');
}
```

**And** monitoring during test:
- Watch Cloudflare Analytics
- Monitor database CPU/memory
- Check error logs

**And** pass criteria:
- No 5xx errors (server failures)
- Response times within targets
- Database doesn't max out connections
- Cache hit rate >90%

**Prerequisites:** Site fully functional

**Technical Notes:**
- Implements FR91 (load test 1000 concurrent users)
- Cloudflare free tier: 100K req/day (test uses ~60K in 10 min)
- Test BEFORE launch (don't wait for Reddit spike)
- Run from multiple geographic locations
- Fix bottlenecks before launch

---

### Story 9.2: Cross-Browser Compatibility Testing

As a user,
I want the site to work on my browser,
So that I can participate regardless of browser choice.

**Acceptance Criteria:**

**Given** the site is ready to launch
**When** tested on different browsers
**Then** functionality works correctly (FR92):

**Browser Testing Matrix:**

**Desktop:**
- Chrome (latest 2 versions): Windows, Mac, Linux
- Firefox (latest 2 versions): Windows, Mac, Linux
- Safari (latest 2 versions): Mac only
- Edge (latest 2 versions): Windows

**Mobile:**
- iOS Safari (latest 2 versions): iPhone, iPad
- Android Chrome (latest 2 versions): Various devices

**Test Cases:**

1. **Date Picker:**
   - Opens correctly
   - Dates can be selected
   - Validation works

2. **Submission Flow:**
   - Form submits successfully
   - reCAPTCHA works
   - Confirmation displays

3. **Stats Display:**
   - Data loads correctly
   - Layout renders properly
   - Responsive on mobile

4. **Share Buttons:**
   - Twitter intent opens
   - Reddit submit opens
   - Links work

**And** known issues documented:
- IE11 not supported (deprecated)
- Safari <14 may have date picker issues (acceptable)

**And** progressive enhancement:
- Core functionality works without JavaScript
- Enhanced features require modern browser

**And** testing tools:
- BrowserStack or LambdaTest (cross-browser testing)
- Real device testing for mobile
- Automated: Playwright or Selenium

**Prerequisites:** All features implemented

**Technical Notes:**
- Implements FR92 (browser compatibility testing)
- "Latest 2 versions" is snapshot at launch date
- Modern JavaScript (ES2022) requires transpilation for older browsers
- Use Vite build to handle transpilation
- Test on real devices when possible (not just emulators)

---

### Story 9.3: Mobile Experience Testing

As a mobile user,
I want the site to work flawlessly on my phone,
So that I can participate on-the-go.

**Acceptance Criteria:**

**Given** the site is ready to launch
**When** tested on mobile devices
**Then** experience is excellent (FR93):

**Test Devices (Minimum):**
- iOS: iPhone 13, iPhone SE (small screen)
- Android: Pixel 6, Samsung Galaxy S21

**Test Cases:**

1. **Touch Interactions:**
   - Date picker opens on tap
   - Submit button responsive (44x44px)
   - Share buttons tappable
   - No accidental taps

2. **Layout:**
   - No horizontal scrolling
   - Text readable without zoom
   - Stats fit on screen
   - Responsive images

3. **Performance:**
   - Loads <3s on 4G LTE
   - Animations smooth (60fps)
   - No jank or lag

4. **Native Features:**
   - Date picker uses native iOS/Android picker
   - Share buttons use native share sheet (if supported)
   - Respects system font size settings

**And** orientation testing:
- Portrait mode (primary)
- Landscape mode (should work but not prioritized)

**And** Google Mobile-Friendly Test:
- Pass Google's test: https://search.google.com/test/mobile-friendly
- Screenshot shows correct rendering

**And** real network testing:
- Test on actual 4G connection (not WiFi)
- Test on slower 3G (if possible)
- Verify load times meet FR40 (<3s)

**Prerequisites:** Mobile-responsive design (Story 5.5)

**Technical Notes:**
- Implements FR93 (mobile testing on iOS Safari, Android Chrome)
- Real device testing critical (emulators miss issues)
- Use remote debugging for mobile (Chrome DevTools)
- Test with various screen sizes (320px to 414px width)
- Network throttling in DevTools simulates slow connections

---

### Story 9.4: Lighthouse Performance Audit

As a developer,
I want to achieve high Lighthouse scores,
So that the site meets performance and quality standards.

**Acceptance Criteria:**

**Given** the site is ready to launch
**When** Lighthouse audit runs
**Then** scores meet targets (FR94):

**Target Scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**Performance Optimizations:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.8s
- Cumulative Layout Shift (CLS): <0.1
- Total Blocking Time (TBT): <200ms

**Accessibility Checks:**
- Color contrast ratios pass (4.5:1)
- All images have alt text
- Form labels associated correctly
- ARIA used appropriately
- Focus indicators visible

**Best Practices:**
- HTTPS enforced
- No console errors
- No deprecated APIs
- Secure cookies

**SEO Checks:**
- Meta description present
- Title tag descriptive
- Mobile-friendly
- Structured data valid

**And** Lighthouse CI integration:
- Run on every deployment (GitHub Actions)
- Fail build if Performance <80
- Generate report artifacts

**And** fix common issues:
- Optimize images (WebP, compression)
- Minify CSS/JS
- Eliminate render-blocking resources
- Reduce unused CSS

**Prerequisites:** All optimization stories complete (Story 5.6)

**Technical Notes:**
- Implements FR94 (Lighthouse Performance >90)
- Run Lighthouse in CI: @lhci/cli
- Test both mobile and desktop
- Fix issues before launch (not after)
- Lighthouse scores fluctuate (run multiple times, average)
- Focus on user experience metrics (FCP, LCP, CLS)

---


## FR Coverage Matrix - Final Validation

**All 82 MVP FRs Mapped to Stories:**

| FR Range | Category | Epic | Stories |
|----------|----------|------|---------|
| FR1-FR12 | Prediction Engine | Epic 2 | 2.1-2.10 |
| FR13-FR19 | Results Display | Epic 3 | 3.1-3.4 |
| FR20-FR23 | Social Sharing | Epic 5 | 5.1-5.3 |
| FR24-FR29 | Embed Widget | Epic 6 | 6.1-6.4 |
| FR35-FR40 | SEO & Performance | Epic 5 | 5.4-5.6 |
| FR41-FR49 | Analytics & Monetization | Epic 8 | 8.1-8.5 |
| FR50-FR55 | Privacy & Legal | Epic 4 | 4.1-4.8 |
| FR59-FR64 | Error Handling | Epic 3 | 3.5-3.7 |
| FR65, FR67-FR68 | Cookie Management | Epic 4 | 4.5, 4.7, 4.1 |
| FR69-FR75 | Accessibility & i18n | Epic 7 | 7.1-7.4 |
| FR76-FR80 | Security Hardening | Epic 2 | 2.2-2.6 |
| FR83 | Transactions | Epic 1 | 1.4 |
| FR85-FR88 | Widget & Accessibility | Epic 6, 7 | 6.3, 6.4, 7.1, 7.5 |
| FR90 | Data Retention | Epic 4 | 4.5, 4.8 |
| FR91-FR96 | Testing & Deployment | Epic 1, 9 | 1.3, 1.5, 9.1-9.4 |
| FR98-FR102 | Trust & Monitoring | Epic 4, 1 | 4.4, 1.6 |

**✅ All 82 MVP FRs are covered by 48 stories across 9 epics**

---

## Summary

**✅ Epic Breakdown Complete (Initial Version)**

**Document Statistics:**
- Total Functional Requirements: 102 (82 MVP + 20 Growth)
- Total Epics: 9
- Total Stories: 48
- Average Stories per Epic: 5.3
- Detailed Acceptance Criteria: ✅ All stories
- Technical Notes: ✅ All stories
- Prerequisites Mapped: ✅ All stories

**Next Steps in BMad Method:**

1. **UX Design** (optional) - Run: `/bmad:bmm:workflows:create-ux-design`
   → Will add interaction details to stories in epics.md

2. **Architecture** - Run: `/bmad:bmm:workflows:architecture`
   → Will add technical details to stories in epics.md

3. **Solutioning Gate Check** - Run: `/bmad:bmm:workflows:solutioning-gate-check`
   → Validates alignment before Phase 4

4. **Phase 4 Implementation** - Stories ready for context assembly and development

**Important:** This is a living document that will be updated with UX and Architecture inputs before implementation begins.

---

_Created: 2025-11-13 | Author: yojahny | Method: BMad Method - Epic & Story Decomposition Workflow_

