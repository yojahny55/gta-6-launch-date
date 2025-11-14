# Epic 8: Monetization & Analytics

**Epic Goal:** Sustain operations and measure success - revenue covers costs, analytics inform iteration.

**Epic Value:** Can't iterate without knowing what's working. Can't sustain without revenue.

## Story 8.1: Google AdSense Integration

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

## Story 8.2: User Ad Opt-Out Toggle

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

## Story 8.3: Traffic Source Tracking

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

## Story 8.4: User Geography Tracking

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

## Story 8.5: Analytics for Predictions and Engagement

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
