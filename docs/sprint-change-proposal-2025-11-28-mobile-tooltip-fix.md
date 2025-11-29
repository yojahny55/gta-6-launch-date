# Sprint Change Proposal: Mobile Tooltip Centering Fix

**Date:** 2025-11-28
**Change Scope:** Minor - Direct Implementation
**Trigger:** Story 10.4 (Dynamic Status Badge) - Mobile tooltip overflow
**Reporter:** yojahny

---

## 1. Issue Summary

### Problem Statement
The status badge tooltip container is cutting off on mobile devices because it's not properly centered. The tooltip uses full viewport width (`w-[calc(100vw-2rem)]`) with a centering transform (`left-1/2 -translate-x-1/2`), causing overflow when the badge button is positioned near the screen edges.

### Discovery Context
- **When discovered:** Mobile testing after Story 10.4 implementation
- **Current behavior:** Tooltip overflows viewport on mobile, gets cut off at edges
- **Expected behavior:** Tooltip should stay within viewport bounds and center properly on all screen sizes

### Evidence
- HTML structure at `public/index.html:60-100` contains tooltip markup
- Tooltip outer div: `left-1/2 -translate-x-1/2` (centers relative to button)
- Tooltip inner div: `w-[calc(100vw-2rem)] max-w-80` (forces full-width on mobile)
- Problem: Width constraint order causes mobile overflow
- Root cause: `w-[calc(100vw-2rem)]` forces nearly full-width, then centering math breaks

**Technical Analysis:**
```
Desktop: Button at center → Tooltip 320px wide → Centering works ✅
Mobile:  Button at center → Tooltip forced to 343px (100vw-2rem) → Centering breaks ❌
Mobile:  Button near edge → Tooltip 343px tries to center → Overflow/cutoff ❌
```

---

## 2. Impact Analysis

### Epic Impact
- **Epic 10: Dashboard Enhancements** - Story 10.4 has mobile UX regression
- Epic goal remains achievable; this is a CSS positioning fix within existing scope
- No other stories in Epic 10 are affected

### Story Impact
- **Story 10.4: Dynamic Status Badge** - Needs CSS width constraint adjustment
- Acceptance criteria includes mobile responsiveness; tooltip must work on all devices
- Story can be considered fully complete once mobile tooltip positioning is fixed

### Artifact Conflicts

**PRD:** ✅ No conflicts
- Status badge requirement remains unchanged
- Mobile responsiveness is expected, not optional

**Architecture:** ✅ No conflicts
- Frontend CSS-only change
- No changes to API endpoints, backend logic, or data models

**UI/UX:** ✅ Alignment maintained
- UX design specification (lines 1-500+) emphasizes mobile-first responsive design
- Current implementation matches intent, only positioning calculation is broken
- Fix improves mobile UX without changing visual design

### Technical Impact
- **Files affected:** `public/index.html` (status badge tooltip structure)
- **Code changes:** CSS class reordering for width constraints
- **Testing needed:** Manual mobile browser testing across viewport sizes (375px, 768px, 1024px)
- **Deployment:** Frontend-only change, no backend deployment needed
- **Risk level:** Very low (isolated CSS change with no side effects)

---

## 3. Recommended Approach

### Selected Path: **Direct Adjustment** ✅

**Rationale:**
- This is a CSS width constraint ordering issue with a simple fix
- Swap `w-[calc(100vw-2rem)] max-w-80` to `w-80 max-w-[calc(100vw-2rem)]`
- No architectural changes, no JavaScript changes, no new dependencies
- Fix takes 5-10 minutes to implement and test
- Zero risk to other features or components

**Alternative Approaches Considered:**
1. ❌ **JavaScript-based positioning** - Overengineered, adds complexity
2. ❌ **Breakpoint-specific classes** - More code, harder to maintain
3. ❌ **Remove mobile tooltip** - Reduces UX quality
4. ✅ **Reorder width constraints** - Simple, clean, no dependencies

**Effort Estimate:** 5-10 minutes (CSS class reorder + testing)
**Risk Level:** Very Low (isolated CSS change, reversible)
**Timeline Impact:** None (can be fixed immediately)

---

## 4. Detailed Change Proposals

### Change #1: Fix Mobile Tooltip Width Constraints

**File:** `public/index.html`
**Section:** Status badge tooltip (lines 60-100)
**Type:** CSS class modification (Tailwind utilities)

**Problem Analysis:**

Current implementation forces full-width on mobile first, then tries to constrain:
```
w-[calc(100vw-2rem)] max-w-80
   ↓
Mobile: Use 100vw-2rem (343px on 375px screen) ← Forces full-width
Desktop: Constrain to max 320px ← Never reaches this on mobile
```

This creates overflow because:
1. Tooltip wrapper uses `left-1/2 -translate-x-1/2` (centers assuming equal space left/right)
2. Inner div forced to 343px width on 375px screen
3. Button near screen edge → centering transform pushes tooltip outside viewport
4. Result: Tooltip cuts off at screen edge

**Solution:** Reverse the constraint priority

```
w-80 max-w-[calc(100vw-2rem)]
   ↓
Desktop: Use 320px (w-80) ← Optimal reading width
Mobile: Constrain to viewport - padding if needed ← Only shrinks when necessary
```

**OLD:**
```html
<!-- Tooltip (positioned below) -->
<div
  class="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
  <div
    class="w-[calc(100vw-2rem)] max-w-80 p-4 bg-gta-card/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
    <div
      class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gta-card border-t border-l border-white/20 rotate-45">
    </div>
    <!-- Tooltip content -->
  </div>
</div>
```

**NEW:**
```html
<!-- Tooltip (positioned below) -->
<div
  class="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
  <div
    class="w-80 max-w-[calc(100vw-2rem)] p-4 bg-gta-card/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto">
    <div
      class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gta-card border-t border-l border-white/20 rotate-45">
    </div>
    <!-- Tooltip content -->
  </div>
</div>
```

**Key Changes:**
1. **Swapped width constraints:** `w-80 max-w-[calc(100vw-2rem)]` instead of `w-[calc(100vw-2rem)] max-w-80`
   - Sets 320px as base width (desktop default)
   - Only constrains to viewport width when necessary (mobile)
   - Tooltip now shrinks gracefully on narrow screens instead of forcing full-width

2. **Added `pointer-events-none` to wrapper div:**
   - Prevents invisible tooltip from blocking hover events
   - Allows mouse to pass through to elements below when tooltip is hidden

3. **Added `pointer-events-auto` to inner div:**
   - Re-enables pointer events on visible tooltip content
   - Ensures tooltip text remains selectable and interactive

**Rationale:**
- **Desktop (≥1024px):** Tooltip displays at optimal 320px width, centered perfectly
- **Tablet (768-1023px):** Tooltip displays at 320px width, centered perfectly
- **Mobile (375px):** Tooltip shrinks to ~343px (100vw - 2rem = 375px - 32px), stays within viewport
- **Mobile edge case:** Even when button is near left/right edge, tooltip centers correctly because it can shrink

**Visual Outcome:**
```
Desktop (1200px viewport):
  Badge button (centered) → Tooltip 320px wide → Perfect centering ✅

Mobile (375px viewport):
  Badge button (centered) → Tooltip 343px wide → Perfect centering ✅
  Badge button (near left edge) → Tooltip 343px wide → Stays in viewport ✅
  Badge button (near right edge) → Tooltip 343px wide → Stays in viewport ✅
```

**Testing Checklist:**
- [ ] **Desktop (1024px+):** Tooltip appears 320px wide, centered below button
- [ ] **Tablet (768-1023px):** Tooltip appears 320px wide, centered below button
- [ ] **Mobile (414px - iPhone):** Tooltip ~382px wide, centered, no overflow
- [ ] **Mobile (375px - iPhone SE):** Tooltip ~343px wide, centered, no overflow
- [ ] **Mobile (360px - Small Android):** Tooltip ~328px wide, centered, no overflow
- [ ] **Edge case - Button left edge:** Tooltip stays within viewport
- [ ] **Edge case - Button right edge:** Tooltip stays within viewport
- [ ] **Hover interaction:** Tooltip appears/disappears smoothly on all devices
- [ ] **Arrow pointer:** Tooltip arrow still points to button correctly

---

## 5. Implementation Handoff

### Change Scope Classification: **Minor**

This is a minor frontend CSS fix that can be implemented directly by the development team without requiring backlog reorganization or strategic planning.

### Handoff: Development Team (Direct Implementation)

**Responsibilities:**
1. Apply the CSS class changes to `public/index.html` (lines 60-63)
2. Test tooltip positioning across multiple viewport sizes
3. Verify visual alignment, centering, and arrow positioning
4. Deploy to development environment for validation
5. Deploy to production once validated

**Success Criteria:**
- ✅ Tooltip appears correctly on desktop (320px wide, centered)
- ✅ Tooltip appears correctly on tablet (320px wide, centered)
- ✅ Tooltip appears correctly on mobile (shrinks to fit viewport, stays centered)
- ✅ Tooltip never overflows viewport on any screen size
- ✅ Tooltip arrow points to button correctly on all devices
- ✅ No visual regression in status badge appearance
- ✅ Dynamic status updates from `/api/status` still work correctly
- ✅ Hover interaction smooth and responsive

**Timeline:**
- Implementation: 5-10 minutes
- Testing: 10-15 minutes (multiple devices/viewports)
- Deployment: Immediate (frontend-only change)

**Testing Devices/Viewports:**
- Desktop: 1920px, 1280px, 1024px
- Tablet: 768px
- Mobile: 414px (iPhone), 375px (iPhone SE), 360px (Android)

**No blockers or dependencies identified.**

---

## 6. Workflow Summary

**Issue Addressed:** Status badge tooltip cutting off on mobile due to improper width constraint ordering
**Change Scope:** Minor (Direct Implementation - CSS only)
**Artifacts Modified:** `public/index.html` (status badge tooltip)
**Routed To:** Development team (yojahny)

**Deliverables:**
- ✅ Sprint Change Proposal document (this file)
- ✅ Specific CSS change with before/after code
- ✅ Technical analysis of root cause
- ✅ Multi-device testing checklist
- ✅ Implementation handoff plan with success criteria

**Related Proposals:**
- `sprint-change-proposal-2025-11-28-status-badge-tooltip.md` - Fixed tooltip hover interaction
- This proposal addresses a separate mobile positioning issue discovered after initial fix

---

**Proposal Status:** ✅ Ready for Implementation
**Next Steps:** Apply CSS fix → Test on multiple viewports → Deploy

**Estimated Total Time:** 20 minutes (implementation + testing + deployment)
