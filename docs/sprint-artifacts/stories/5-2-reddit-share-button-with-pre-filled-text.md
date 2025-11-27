# Story 5.2: Reddit Share Button with Pre-filled Text

Status: review

## Story

As a user,
I want to easily share my prediction to Reddit,
so that I can engage with the GTA 6 community.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for Reddit post text generation
- [ ] Test post personalization logic (optimistic/pessimistic)
- [ ] Test URL parameter encoding
- [ ] Test share button click tracking
- [ ] Test button visibility and placement
- [ ] Test Reddit submit API integration

## Tasks / Subtasks

- [x] Task 1: Implement Reddit post text generation (AC: Reddit post template)
  - [x] Create `generateRedditPost(userDate, medianDate)` function
  - [x] Generate title: "GTA 6 Launch Date Predictions - What does the community think?"
  - [x] Generate body with user prediction + median + comparison
  - [x] Calculate delta days between user date and median
  - [x] Include URL with tracking parameters

- [x] Task 2: Create Reddit share button UI (AC: Button placement)
  - [x] Add button next to Twitter share button
  - [x] Position in submission confirmation section
  - [x] Style with Reddit orange color (#FF4500)
  - [x] Add Reddit Snoo logo icon (SVG or icon font)
  - [x] Ensure button is responsive on mobile

- [x] Task 3: Implement Reddit submit API integration (AC: Reddit post template)
  - [x] Use Reddit submit URL: `https://reddit.com/submit?url={url}&title={title}`
  - [x] URL-encode title and URL parameters
  - [x] Note: Reddit doesn't support pre-filled body text via API
  - [x] Open in new window/tab with `window.open()`

- [x] Task 4: Add subreddit selection (AC: Subreddit suggestions)
  - [x] Default subreddit: r/GTA6
  - [x] Allow user to change subreddit in Reddit UI (Reddit's native functionality)
  - [x] Document alternative subreddits in UI tooltip/hint

- [x] Task 5: Add URL tracking parameters (AC: URL parameters)
  - [x] Append `?ref=reddit` to shared URL
  - [x] Generate optional `u={hash}` for unique user tracking
  - [x] Use cookie_id hash for u parameter (privacy-preserving)
  - [x] Validate URL encoding

- [x] Task 6: Implement share button click tracking (AC: Share analytics)
  - [x] Track button clicks via onclick event
  - [x] Log share event before opening Reddit window
  - [x] Store share click count (client-side or API)
  - [x] Track clicks from Reddit referrer (`ref=reddit` parameter)

- [x] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [x] Create `tests/unit/reddit-share.test.ts`
  - [x] Test Reddit post text generation with various dates
  - [x] Test personalization logic (optimistic/pessimistic)
  - [x] Test URL encoding correctness
  - [x] Test tracking parameter generation
  - [x] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.2 (Reddit Share Button):**
- Share button with pre-filled text (FR21)
- Next to Twitter button, same prominence (FR100)
- URL tracking with `ref=reddit` parameter (FR42)
- Default subreddit: r/GTA6

[Source: docs/epics/epic-5-social-sharing-virality.md:60-107]

**From PRD - FR21 (Reddit Share):**
- Users can share their prediction to Reddit with pre-filled text
- Reddit is a primary community engagement channel

[Source: docs/PRD.md:268]

**From PRD - FR42 (Traffic Source Tracking):**
- System tracks traffic sources (Reddit, Google, Direct, etc.)
- `ref` parameter enables source attribution

[Source: docs/PRD.md:301]

### Architecture Patterns

**From Architecture - Frontend Vanilla JS:**
```javascript
// Share button implementation pattern
function shareToReddit() {
  const title = "GTA 6 Launch Date Predictions - What does the community think?";
  const url = `https://gta6predictions.com/?ref=reddit&u=${cookieHash}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;

  // Track click before opening
  trackShareClick('reddit');

  // Open Reddit submit page
  window.open(redditUrl, 'reddit-share', 'width=800,height=600');
}
```

[Source: docs/architecture.md:996-1010 - Vanilla JS Frontend]

**Reddit Submit URL API:**
- Base URL: `https://reddit.com/submit`
- Parameters: `url` (required), `title` (optional)
- Note: Body text not supported via URL parameters
- User must copy-paste or type body content manually

### Project Structure Notes

**File Structure:**
```
public/
├── js/
│   ├── app.js                     (MODIFY - add Reddit share logic)
│   ├── reddit-share.js            (NEW - Reddit share functionality)
│   └── analytics.js               (MODIFY - track share clicks)
├── index.html                     (MODIFY - add share button UI)
├── styles.css                     (MODIFY - Reddit button styles)
tests/
├── unit/
│   └── reddit-share.test.ts       (NEW - share functionality tests)
```

**Deployment Notes:**
- Client-side only implementation (no API endpoint needed)
- Analytics tracking via Cloudflare Web Analytics
- URL tracking via query parameters

### Learnings from Previous Story

**From Story 5.1 (Twitter/X Share Button):**
- ✅ **Share button pattern exists:** Reuse tweet text generation logic
- ✅ **Tracking infrastructure:** Reuse share click tracking
- ✅ **URL parameter pattern:** Reuse `ref` and `u` parameter logic
- **Recommendation:** Create shared share utilities module

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
- ✅ **Stats cached 5 minutes:** Use current median for post text
- **Recommendation:** Fetch median before generating post text

**From Story 3.2 (Social Comparison Messaging):**
- ✅ **Comparison logic exists:** Reuse optimistic/pessimistic/aligned logic
- ✅ **Delta calculation exists:** Use existing delta_days calculation
- **Recommendation:** Reuse social comparison messaging patterns

**New Patterns Created:**
- Reddit post text generation with personalization
- Reddit submit URL integration
- Shared utilities for social sharing (if refactored)

**Files to Modify:**
- `public/index.html` - Add Reddit share button UI
- `public/js/app.js` - Add Reddit share button logic
- `public/styles.css` - Style Reddit share button

**Technical Debt to Address:**
- Consider creating shared `share-utils.js` module (DRY principle)

### References

**Epic Breakdown:**
- [Epic 5 Story 5.2 Definition](docs/epics/epic-5-social-sharing-virality.md:60-107)

**PRD:**
- [PRD - FR21: Reddit Share with Pre-filled Text](docs/PRD.md:268)
- [PRD - FR42: Traffic Source Tracking](docs/PRD.md:301)
- [PRD - FR100: Prominent Placement](docs/epics/epic-5-social-sharing-virality.md:95-98)

**Architecture:**
- [Architecture - Vanilla JS Frontend](docs/architecture.md:996-1010)
- [Architecture - Analytics Tracking](docs/architecture.md:74-75)

**Dependencies:**
- Story 5.1 (Twitter share - reuse patterns)
- Story 3.3 (Submission confirmation - share button placement)
- Story 2.10 (Stats API - median data for post text)
- Story 3.2 (Social comparison - reuse messaging logic)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-2-reddit-share-button-with-pre-filled-text.context.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

**Implementation Plan:**
- Reused patterns from Story 5.1 (Twitter share) for consistency
- Created reddit-share.js module following same architecture as twitter-share.js
- Implemented generateRedditPost() with personalized text generation
- Added Reddit Submit API integration (URL + title only, no body support)
- Implemented URL tracking with ref=reddit and u={hash} parameters
- Created comprehensive test suite with 27 tests covering all ACs

**Architecture Decisions:**
- Pure frontend implementation (zero backend changes)
- Shared trackShareClick() function between Twitter and Reddit
- URL encoding via URLSearchParams (uses + for spaces, valid per RFC)
- Window dimensions: 800x600 for Reddit submit page (responsive)

### Completion Notes List

**✅ Implementation Complete (2025-11-27):**
- Created `/public/js/reddit-share.js` module with all functions
- Added Reddit share button to HTML (next to Twitter button)
- Wired up click handler in app.js
- Implemented all 6 functional tasks successfully
- Wrote 27 comprehensive unit tests (all passing)

**Test Coverage:**
- 27/27 tests passing ✓
- Coverage includes: post generation, URL encoding, tracking, error handling
- Edge cases tested: leap years, year boundaries, missing dates
- Integration tests verify full share flow

**Key Features Implemented:**
1. Reddit post text generation with personalization (optimistic/pessimistic/aligned)
2. Reddit share button UI with Reddit orange (#FF4500) and Snoo logo
3. Reddit Submit API integration with proper URL encoding
4. Subreddit suggestions via tooltip (r/GTA6, r/gaming, r/Games, r/rockstar)
5. URL tracking with ref=reddit and privacy-preserving u={hash} parameter
6. Share button click tracking with non-blocking analytics

**Reused from Story 5.1:**
- Share button architecture and patterns
- Date formatting logic (formatDateForReddit)
- Delta calculation (calculateDaysDifference)
- Cookie ID hashing for u parameter
- Error handling patterns

**Zero Breaking Changes:**
- All existing tests still passing (1090+ total tests)
- No API changes required
- Pure frontend feature

### File List

**New Files:**
- `public/js/reddit-share.js` - Reddit share module (210 lines)
- `tests/unit/reddit-share.test.ts` - Comprehensive test suite (27 tests)

**Modified Files:**
- `public/index.html` - Added Reddit share button UI
- `public/app.js` - Added Reddit share handler integration
- `docs/sprint-artifacts/stories/5-2-reddit-share-button-with-pre-filled-text.md` - Story completion tracking

### Change Log

**2025-11-27** - Story 5.2 implementation complete (all 7 tasks done, 27/27 tests passing)
- Created reddit-share.js module with Reddit post generation and Submit API integration
- Added Reddit share button to HTML next to Twitter button (Reddit orange #FF4500)
- Implemented URL tracking with ref=reddit and u={hash} parameters
- Added comprehensive test suite (27 tests, all passing)
- Zero backend changes required (pure frontend feature)
- Reused patterns from Story 5.1 for consistency
