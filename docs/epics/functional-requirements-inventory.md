# Functional Requirements Inventory

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
