# Story 5.1: Twitter/X Share Button with Pre-filled Text

Status: ready-for-dev

## Story

As a user,
I want to easily share my prediction to Twitter/X,
so that I can show my friends and start conversations.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for tweet text generation
- [ ] Test tweet personalization logic (optimistic/pessimistic/aligned)
- [ ] Test URL parameter encoding
- [ ] Test share button click tracking
- [ ] Test button visibility and placement
- [ ] Test Twitter Web Intent API integration

## Tasks / Subtasks

- [ ] Task 1: Implement tweet text generation (AC: Tweet template)
  - [ ] Create `generateTweetText(userDate, medianDate)` function
  - [ ] Implement date formatting (user-friendly format)
  - [ ] Add personalization logic (optimistic/pessimistic/aligned)
  - [ ] Calculate delta days between user date and median
  - [ ] Include URL with tracking parameters

- [ ] Task 2: Create Twitter share button UI (AC: Button placement)
  - [ ] Add button to submission confirmation section
  - [ ] Position above-the-fold (prominent placement)
  - [ ] Style with Twitter blue color (#1DA1F2)
  - [ ] Add Twitter/X logo icon (SVG or icon font)
  - [ ] Ensure button is responsive on mobile

- [ ] Task 3: Implement Twitter Web Intent integration (AC: Tweet template)
  - [ ] Use Twitter Web Intent API: `https://twitter.com/intent/tweet?text={encoded_text}`
  - [ ] URL-encode tweet text properly
  - [ ] Open in new window/tab with `window.open()`
  - [ ] Set window dimensions (550x420 recommended)

- [ ] Task 4: Add URL tracking parameters (AC: URL parameters)
  - [ ] Append `?ref=twitter` to shared URL
  - [ ] Generate optional `u={hash}` for unique user tracking
  - [ ] Use cookie_id hash for u parameter (privacy-preserving)
  - [ ] Validate URL encoding

- [ ] Task 5: Implement share button click tracking (AC: Share analytics)
  - [ ] Track button clicks via onclick event
  - [ ] Log share event before opening Twitter window
  - [ ] Store share click count (client-side or API)
  - [ ] Track clicks from Twitter referrer (`ref=twitter` parameter)

- [ ] Task 6: Calculate share CTR (AC: Share analytics)
  - [ ] Count total share button clicks
  - [ ] Count total predictions submitted
  - [ ] Calculate: Share CTR = (shares / submissions) * 100
  - [ ] Display in analytics (optional admin view)

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/unit/twitter-share.test.ts`
  - [ ] Test tweet text generation with various dates
  - [ ] Test personalization logic (all 3 cases)
  - [ ] Test URL encoding correctness
  - [ ] Test tracking parameter generation
  - [ ] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.1 (Twitter/X Share Button):**
- Share button with pre-filled text (FR20)
- Above-the-fold prominent placement (FR100)
- Track share CTR (FR45)
- URL tracking with `ref=twitter` parameter (FR42)
- Tweet personalization based on user vs median

[Source: docs/epics/epic-5-social-sharing-virality.md:7-58]

**From PRD - FR20 (Twitter/X Share):**
- Users can share their prediction to Twitter/X with pre-filled text
- Social sharing buttons are core to viral growth strategy

[Source: docs/PRD.md:267]

**From PRD - FR42 (Traffic Source Tracking):**
- System tracks traffic sources (Reddit, Google, Direct, etc.)
- `ref` parameter enables source attribution

[Source: docs/PRD.md:301]

**From PRD - FR45 (Social Share CTR Tracking):**
- System tracks social share click-through rate
- Metric: shares / submissions

[Source: docs/PRD.md:304]

### Architecture Patterns

**From Architecture - Frontend Vanilla JS:**
```javascript
// Share button implementation pattern
function shareToTwitter() {
  const tweetText = generateTweetText(userDate, medianDate);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  // Track click before opening
  trackShareClick('twitter');

  // Open Twitter compose window
  window.open(url, 'twitter-share', 'width=550,height=420');
}
```

[Source: docs/architecture.md:996-1010 - Vanilla JS Frontend]

**Twitter Web Intent API:**
- Base URL: `https://twitter.com/intent/tweet`
- Parameters: `text`, `url`, `hashtags`, `via`
- Window dimensions: 550x420 (recommended)

### Project Structure Notes

**File Structure:**
```
public/
├── js/
│   ├── app.js                     (MODIFY - add share button logic)
│   ├── twitter-share.js           (NEW - Twitter share functionality)
│   └── analytics.js               (MODIFY - track share clicks)
├── index.html                     (MODIFY - add share button UI)
├── styles.css                     (MODIFY - Twitter button styles)
tests/
├── unit/
│   └── twitter-share.test.ts      (NEW - share functionality tests)
```

**Deployment Notes:**
- Client-side only implementation (no API endpoint needed)
- Analytics tracking via Cloudflare Web Analytics
- URL tracking via query parameters

### Learnings from Previous Story

**From Story 4.5 (Cookie Management and Expiration):**
- ✅ **Cookie ID available:** Use cookie_id for u={hash} parameter
- ✅ **Privacy-preserving:** Hash cookie_id for anonymous tracking
- **Recommendation:** Use existing cookie_id infrastructure

**From Story 3.3 (Submission Confirmation with Visual Feedback):**
- ✅ **Confirmation section exists:** Add share button here
- ✅ **User date available:** Access via `submittedDate` variable
- **Recommendation:** Display share button in confirmation section

**From Story 2.10 (Statistics Calculation and Caching):**
- ✅ **Median data available:** Access via stats API `/api/stats`
- ✅ **Stats cached 5 minutes:** Use current median for tweet text
- **Recommendation:** Fetch median before generating tweet text

**From Story 3.2 (Social Comparison Messaging):**
- ✅ **Comparison logic exists:** Reuse optimistic/pessimistic/aligned logic
- ✅ **Delta calculation exists:** Use existing delta_days calculation
- **Recommendation:** Reuse social comparison messaging patterns

**New Patterns Created:**
- Tweet text generation with personalization
- Twitter Web Intent integration
- Share button click tracking

**Files to Modify:**
- `public/index.html` - Add share button UI
- `public/js/app.js` - Add share button logic
- `public/styles.css` - Style share button

**Technical Debt to Address:**
- None from previous stories

### References

**Epic Breakdown:**
- [Epic 5 Story 5.1 Definition](docs/epics/epic-5-social-sharing-virality.md:7-58)

**PRD:**
- [PRD - FR20: Twitter/X Share with Pre-filled Text](docs/PRD.md:267)
- [PRD - FR42: Traffic Source Tracking](docs/PRD.md:301)
- [PRD - FR45: Social Share CTR Tracking](docs/PRD.md:304)
- [PRD - FR100: Prominent Above-the-Fold Placement](docs/epics/epic-5-social-sharing-virality.md:38-41)

**Architecture:**
- [Architecture - Vanilla JS Frontend](docs/architecture.md:996-1010)
- [Architecture - Analytics Tracking](docs/architecture.md:74-75)

**Dependencies:**
- Story 3.3 (Submission confirmation - share button placement)
- Story 2.10 (Stats API - median data for tweet text)
- Story 3.2 (Social comparison - reuse messaging logic)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-1-twitter-x-share-button-with-pre-filled-text.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
