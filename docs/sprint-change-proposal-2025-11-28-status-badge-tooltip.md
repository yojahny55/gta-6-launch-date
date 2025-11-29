# Sprint Change Proposal: Status Badge Tooltip Fix

**Date:** 2025-11-28
**Change Scope:** Minor - Direct Implementation
**Trigger:** Story 10.4 (Dynamic Status Badge) - Tooltip not functioning
**Reporter:** yojahny

---

## 1. Issue Summary

### Problem Statement
The status badge tooltip and info icon added in Story 10.4 are not functioning correctly. When users hover over the info icon, the tooltip does not appear as designed.

### Discovery Context
- **When discovered:** During UI testing after Story 10.4 implementation
- **Current behavior:** Tooltip remains invisible when hovering over the info icon
- **Expected behavior:** Tooltip should appear when hovering over the icon to explain the status calculation logic

### Evidence
- HTML structure at `public/index.html:43-92` contains tooltip markup
- Tooltip uses Tailwind's `group-hover:opacity-100` and `group-hover:visible` classes
- The `group` class is applied to `#status-badge` span element
- Info icon button is nested inside the span, creating a hover targeting issue

---

## 2. Impact Analysis

### Epic Impact
- **Epic 10: Dashboard Enhancements** - Story 10.4 is marked as completed but has a UX bug
- Epic goal remains achievable; this is a fix within the existing story scope
- No other stories in Epic 10 are affected

### Story Impact
- **Story 10.4: Dynamic Status Badge** - Needs minor HTML/CSS adjustment
- Acceptance criteria includes user understanding of status logic; tooltip is critical for this
- Story can be considered fully complete once tooltip is functional

### Artifact Conflicts

**PRD:** ✅ No conflicts
- Status badge requirement remains unchanged
- Tooltip is an implementation detail, not a PRD-level requirement

**Architecture:** ✅ No conflicts
- Frontend implementation detail only
- No changes to API endpoints or backend logic

**UI/UX:** ⚠️ Minor alignment needed
- UX design specification mentions "status badge with explanation"
- Current implementation intent matches UX spec
- Only the hover interaction is broken (CSS issue)

### Technical Impact
- **Files affected:** `public/index.html` (status badge HTML structure)
- **Code changes:** HTML structure modification to fix Tailwind group-hover targeting
- **Testing needed:** Manual browser testing of tooltip hover interaction
- **Deployment:** Frontend-only change, no backend deployment needed

---

## 3. Recommended Approach

### Selected Path: **Direct Adjustment** ✅

**Rationale:**
- This is a simple CSS/HTML targeting issue with a straightforward fix
- No architectural changes required
- No impact on other stories, epics, or requirements
- Can be fixed in under 30 minutes
- Low risk, high confidence solution

**Alternative Approaches Considered:**
1. ❌ **JavaScript tooltip solution** - Overengineered for this simple use case
2. ❌ **Third-party tooltip library** - Adds unnecessary dependency
3. ✅ **Restructure HTML for proper Tailwind group-hover** - Simple, clean, no dependencies

**Effort Estimate:** 15-30 minutes
**Risk Level:** Low (isolated CSS/HTML change)
**Timeline Impact:** None (can be fixed immediately)

---

## 4. Detailed Change Proposals

### Change #1: Fix Status Badge Tooltip HTML Structure

**File:** `public/index.html`
**Section:** Status badge (lines 43-92)
**Type:** HTML structure modification

**OLD:**
```html
<span id="status-badge"
  class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-gray-400">
  Status: Delay Likely
  <button type="button"
    class="inline-flex items-center justify-center w-3 h-3 text-white/40 hover:text-white/80 transition-colors"
    aria-label="Status explanation">
    <svg ...>...</svg>
  </button>
</span>

<!-- Tooltip (positioned below) -->
<div
  class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 p-4 bg-gta-card/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
  ...
</div>
```

**NEW:**
```html
<span id="status-badge"
  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-gray-400">
  Status: Delay Likely
  <span class="group relative inline-flex">
    <button type="button"
      class="inline-flex items-center justify-center w-3 h-3 text-white/40 hover:text-white/80 transition-colors"
      aria-label="Status explanation">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    </button>

    <!-- Tooltip (positioned below) -->
    <div
      class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 p-4 bg-gta-card/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
      <div
        class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gta-card border-t border-l border-white/20 rotate-45">
      </div>
      <h3 class="text-white font-bold text-sm mb-2">Status Explained</h3>
      <p class="text-gray-300 text-xs mb-3">
        The status compares the community median prediction with Rockstar's official date (Nov 19, 2026).
      </p>
      <div class="space-y-2 text-xs">
        <div class="flex items-start gap-2">
          <span class="text-green-400 font-bold mt-0.5">✓</span>
          <div>
            <strong class="text-white">On Track:</strong>
            <span class="text-gray-400">Community predicts within 3 months of official date</span>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-yellow-400 font-bold mt-0.5">⚠</span>
          <div>
            <strong class="text-white">Delay Likely:</strong>
            <span class="text-gray-400">Community predicts 3-12 months after official date</span>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-red-400 font-bold mt-0.5">✕</span>
          <div>
            <strong class="text-white">Major Delay:</strong>
            <span class="text-gray-400">Community predicts 12+ months after official date</span>
          </div>
        </div>
      </div>
    </div>
  </span>
</span>
```

**Rationale:**
- Moves the `group` class from the outer `#status-badge` span to a new wrapper around the icon button
- Tooltip is now a direct sibling of the button, inside the same `group` container
- When hovering over the button area, the `group-hover` state activates correctly
- Maintains all existing styling and functionality
- The outer `#status-badge` span retains its ID for JavaScript targeting in `status-badge.js`

**Testing:**
- Manual browser test: Hover over info icon → tooltip should appear
- Verify tooltip positioning (centered below icon)
- Verify tooltip content is readable and styled correctly
- Test on mobile (tooltip should still be accessible)

---

## 5. Implementation Handoff

### Change Scope Classification: **Minor**

This is a minor frontend fix that can be implemented directly by the development team without requiring backlog reorganization or strategic planning.

### Handoff: Development Team (Direct Implementation)

**Responsibilities:**
1. Apply the HTML structure change to `public/index.html`
2. Test tooltip hover interaction in browser
3. Verify visual alignment and positioning
4. Deploy to development environment for validation
5. Deploy to production once validated

**Success Criteria:**
- ✅ Tooltip appears when hovering over the info icon
- ✅ Tooltip is positioned correctly (centered below icon)
- ✅ Tooltip content is fully readable
- ✅ No visual regression in status badge appearance
- ✅ Dynamic status updates from `/api/status` still work correctly

**Timeline:**
- Implementation: 15-30 minutes
- Testing: 5-10 minutes
- Deployment: Immediate (frontend-only change)

**No blockers or dependencies identified.**

---

## 6. Workflow Summary

**Issue Addressed:** Status badge tooltip not appearing on hover
**Change Scope:** Minor (Direct Implementation)
**Artifacts Modified:** `public/index.html`
**Routed To:** Development team (yojahny)

**Deliverables:**
- ✅ Sprint Change Proposal document (this file)
- ✅ Specific HTML change with before/after code
- ✅ Implementation handoff plan with success criteria

---

**Proposal Status:** Ready for Implementation
**Next Steps:** Apply HTML fix → Test → Deploy
