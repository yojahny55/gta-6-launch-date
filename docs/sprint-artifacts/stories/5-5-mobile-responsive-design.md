# Story 5.5: Mobile-Responsive Design

Status: ready-for-dev

## Story

As a user on mobile,
I want the site to work perfectly on my phone,
so that I can participate regardless of device.

## Acceptance Criteria

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

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Visual regression tests for breakpoints
- [ ] Test touch target sizes (44x44px minimum)
- [ ] Test responsive layout at 320px, 768px, 1024px, 1920px
- [ ] Test native mobile date picker
- [ ] Test with Google Mobile-Friendly Test
- [ ] Test on real iOS and Android devices

## Tasks / Subtasks

- [ ] Task 1: Implement mobile layout (<768px) (AC: Mobile layout)
  - [ ] Create single-column flexbox layout
  - [ ] Make date picker full-width
  - [ ] Stack stats vertically (median, then min/max)
  - [ ] Stack share buttons vertically
  - [ ] Collapse footer links to accordion or minimal links
  - [ ] Test on 320px (iPhone SE) to 767px

- [ ] Task 2: Implement tablet layout (768px-1024px) (AC: Tablet layout)
  - [ ] Create two-column grid layout
  - [ ] Position form on left, stats on right
  - [ ] Display share buttons side-by-side
  - [ ] Adjust spacing for medium screens
  - [ ] Test on 768px (iPad) to 1023px

- [ ] Task 3: Implement desktop layout (>1024px) (AC: Desktop layout)
  - [ ] Create three-column grid layout
  - [ ] Position stats, form, visualization
  - [ ] Add hover states to buttons
  - [ ] Expand navigation (if applicable)
  - [ ] Test on 1024px to 1920px

- [ ] Task 4: Optimize touch targets (AC: Touch optimization - FR87)
  - [ ] Ensure all buttons minimum 44x44px
  - [ ] Add padding to clickable elements
  - [ ] Increase spacing between tappable elements (8px minimum)
  - [ ] Test with finger-sized touch (iOS/Android simulators)
  - [ ] Audit with accessibility tools (Lighthouse)

- [ ] Task 5: Implement responsive typography (AC: Touch optimization)
  - [ ] Set base font size to 16px (no zoom on focus)
  - [ ] Use rem units for scalable typography
  - [ ] Increase font sizes on mobile (readability)
  - [ ] Ensure WCAG AA contrast ratios (4.5:1 minimum)

- [ ] Task 6: Optimize responsive images (AC: Responsive images)
  - [ ] Use srcset for hero image (multiple sizes)
  - [ ] Serve WebP with JPEG fallback
  - [ ] Lazy load images below the fold
  - [ ] Use SVG for icons (scalable, small file size)
  - [ ] Optimize OG image for mobile (1200x630px)

- [ ] Task 7: Implement mobile performance optimizations (AC: Performance on mobile - FR40)
  - [ ] Inline critical CSS for above-the-fold content
  - [ ] Defer non-critical CSS (below-the-fold)
  - [ ] Minimize and bundle JavaScript
  - [ ] Lazy load optional features (charts, visualizations)
  - [ ] Test with Chrome DevTools throttling (Slow 3G)

- [ ] Task 8: Add mobile-specific meta tags (AC: Testing requirements)
  - [ ] Ensure viewport meta tag: `width=device-width, initial-scale=1`
  - [ ] Add apple-mobile-web-app-capable meta tag
  - [ ] Add theme-color for browser chrome
  - [ ] Test with Google Mobile-Friendly Test

- [ ] Task 9: Implement native mobile date picker (AC: Mobile layout)
  - [ ] Use HTML5 `<input type="date">` for mobile
  - [ ] Detect mobile device (viewport width or user agent)
  - [ ] Fall back to custom picker on desktop
  - [ ] Test native picker on iOS Safari and Android Chrome

- [ ] Task 10: Write automated tests (ADR-011 Testing Requirements)
  - [ ] Create `tests/integration/responsive-design.test.ts`
  - [ ] Test layout at breakpoints (320px, 768px, 1024px, 1920px)
  - [ ] Test touch target sizes (visual regression)
  - [ ] Test mobile performance (Lighthouse CI)
  - [ ] Verify test coverage: All acceptance criteria covered

## Dev Notes

### Requirements Context

**From Epic 5 Story 5.5 (Mobile-Responsive Design):**
- Mobile-responsive and passes Google mobile-friendly test (FR39)
- Load time < 3s on mobile 3G connection (FR40)
- Touch targets minimum 44x44px (FR87)
- Mobile testing on iOS Safari and Android Chrome (FR93)

[Source: docs/epics/epic-5-social-sharing-virality.md:242-305]

**From PRD - FR39 (Mobile-Responsive):**
- Site is mobile-responsive and passes Google mobile-friendly test
- Mobile experience is critical for viral growth

[Source: docs/PRD.md:295]

**From PRD - FR40 (Mobile Load Time):**
- Site loads in < 2 seconds on desktop, < 3 seconds on mobile
- Performance on 3G connection is critical

[Source: docs/PRD.md:296]

**From PRD - FR87 (Touch Targets):**
- Touch targets minimum 44x44px for mobile usability
- Accessibility and mobile UX requirement

[Source: docs/epics/epic-5-social-sharing-virality.md:278-280]

**From PRD - FR93 (Mobile Testing Requirement):**
- Test on iOS Safari (latest)
- Test on Android Chrome (latest)
- Test on various screen sizes (320px to 1920px)

[Source: docs/epics/epic-5-social-sharing-virality.md:289-293]

### Architecture Patterns

**From Architecture - Tailwind CSS v4:**
```css
/* Responsive breakpoints */
@media (max-width: 767px) {
  /* Mobile styles */
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

**Tailwind Responsive Utilities:**
```html
<!-- Mobile-first approach -->
<div class="flex flex-col md:flex-row lg:grid lg:grid-cols-3">
  <!-- Single column on mobile, row on tablet, 3 columns on desktop -->
</div>

<button class="w-full md:w-auto px-4 py-2">
  <!-- Full width on mobile, auto width on tablet+ -->
</button>
```

[Source: docs/architecture.md:1012-1024 - ADR-003: Tailwind CSS]

**Touch Target Best Practices:**
- Minimum size: 44x44px (Apple HIG, Material Design)
- Minimum spacing: 8px between targets
- Avoid hover-dependent interactions on mobile

### Project Structure Notes

**File Structure:**
```
public/
├── styles.css                     (MODIFY - add responsive styles)
├── index.html                     (MODIFY - responsive layout)
├── js/
│   └── app.js                     (MODIFY - mobile date picker detection)
tests/
├── integration/
│   └── responsive-design.test.ts  (NEW - responsive tests)
tailwind.config.js                 (MODIFY - custom breakpoints if needed)
```

**Deployment Notes:**
- CSS optimizations via Tailwind tree-shaking
- Image optimizations via Cloudflare Pages
- Performance testing via Lighthouse CI in GitHub Actions

### Learnings from Previous Story

**From Story 5.4 (SEO Meta Tags):**
- ✅ **Viewport meta tag exists:** Ensure `width=device-width, initial-scale=1`
- **Recommendation:** Verify meta tag is present for mobile

**From Story 3.1 (Landing Page with Stats Display):**
- ✅ **Landing page layout exists:** Make responsive for mobile
- ✅ **Stats display section:** Stack vertically on mobile
- **Recommendation:** Refactor layout for mobile-first approach

**From Story 3.3 (Submission Confirmation with Visual Feedback):**
- ✅ **Confirmation section exists:** Ensure responsive on mobile
- **Recommendation:** Stack elements vertically on small screens

**From Story 5.1, 5.2 (Share Buttons):**
- ✅ **Share buttons exist:** Stack vertically on mobile
- **Recommendation:** Ensure 44x44px minimum touch targets

**From Story 2.3 (Date Picker with Validation):**
- ✅ **Date picker exists:** Add native mobile picker detection
- **Recommendation:** Use HTML5 `<input type="date">` on mobile

**New Patterns Created:**
- Mobile-first responsive design
- Breakpoint-based layouts (mobile, tablet, desktop)
- Touch target size enforcement

**Files to Modify:**
- `public/index.html` - Responsive layout structure
- `public/styles.css` - Responsive styles with Tailwind
- `public/js/app.js` - Mobile date picker detection

**Technical Debt to Address:**
- Refactor existing layout to mobile-first (currently desktop-first)

### References

**Epic Breakdown:**
- [Epic 5 Story 5.5 Definition](docs/epics/epic-5-social-sharing-virality.md:242-305)

**PRD:**
- [PRD - FR39: Mobile-Responsive, Passes Google Test](docs/PRD.md:295)
- [PRD - FR40: <3s Mobile Load Time](docs/PRD.md:296)
- [PRD - FR87: 44x44px Touch Targets](docs/epics/epic-5-social-sharing-virality.md:278-280)
- [PRD - FR93: Mobile Testing Requirement](docs/epics/epic-5-social-sharing-virality.md:289-293)

**Architecture:**
- [Architecture - ADR-003: Tailwind CSS v4](docs/architecture.md:1012-1024)
- [Architecture - Performance Considerations](docs/architecture.md:709-747)

**Dependencies:**
- Story 3.1 (Landing page - make responsive)
- Story 5.1, 5.2 (Share buttons - ensure touch targets)
- Story 2.3 (Date picker - add mobile detection)

**Testing:**
- [ADR-011: Mandatory Automated Testing](docs/architecture.md:1171-1303)

**External Resources:**
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/stories/5-5-mobile-responsive-design.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
