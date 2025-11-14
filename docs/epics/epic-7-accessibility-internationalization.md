# Epic 7: Accessibility & Internationalization

**Epic Goal:** Reach global audience without barriers - broader reach = more predictions = better data.

**Epic Value:** Accessibility = legal compliance + moral imperative. i18n = global reach (GTA 6 is worldwide).

## Story 7.1: Keyboard Navigation Throughout Site

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

## Story 7.2: Screen Reader Support with ARIA Labels

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

## Story 7.3: UTC Storage with Local Timezone Display

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

## Story 7.4: International Date Format Support

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

## Story 7.5: Skip Navigation Link for Keyboard Users

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
