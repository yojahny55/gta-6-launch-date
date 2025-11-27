# Story 5.2: Reddit Share Button with Pre-filled Text

Status: ready-for-dev

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

- [ ] Task 1: Implement Reddit post text generation (AC: Reddit post template)
  - [ ] Create `generateRedditPost(userDate, medianDate)` function
  - [ ] Generate title: "GTA 6 Launch Date Predictions - What does the community think?"
  - [ ] Generate body with user prediction + median + comparison
  - [ ] Calculate delta days between user date and median
  - [ ] Include URL with tracking parameters

- [ ] Task 2: Create Reddit share button UI (AC: Button placement)
  - [ ] Add button next to Twitter share button
  - [ ] Position in submission confirmation section
  - [ ] Style with Reddit orange color (#FF4500)
  - [ ] Add Reddit Snoo logo icon (SVG or icon font)
  - [ ] Ensure button is responsive on mobile

- [ ] Task 3: Implement Reddit submit API integration (AC: Reddit post template)
  - [ ] Use Reddit submit URL: `https://reddit.com/submit?url={url}&title={title}`
  - [ ] URL-encode title and URL parameters
  - [ ] Note: Reddit doesn't support pre-filled body text via API
  - [ ] Open in new window/tab with `window.open()`

- [ ] Task 4: Add subreddit selection (AC: Subreddit suggestions)
  - [ ] Default subreddit: r/GTA6
  - [ ] Allow user to change subreddit in Reddit UI (Reddit's native functionality)
  - [ ] Document alternative subreddits in UI tooltip/hint

- [ ] Task 5: Add URL tracking parameters (AC: URL parameters)
  - [ ] Append `?ref=reddit` to shared URL
  - [ ] Generate optional `u={hash}` for unique user tracking
  - [ ] Use cookie_id hash for u parameter (privacy-preserving)
  - [ ] Validate URL encoding

- [ ] Task 6: Implement share button click tracking (AC: Share analytics)
  - [ ] Track button clicks via onclick event
  - [ ] Log share event before opening Reddit window
  - [ ] Store share click count (client-side or API)
  - [ ] Track clicks from Reddit referrer (`ref=reddit` parameter)

- [ ] Task 7: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/unit/reddit-share.test.ts`
  - [ ] Test Reddit post text generation with various dates
  - [ ] Test personalization logic (optimistic/pessimistic)
  - [ ] Test URL encoding correctness
  - [ ] Test tracking parameter generation
  - [ ] Verify test coverage: All acceptance criteria covered

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
