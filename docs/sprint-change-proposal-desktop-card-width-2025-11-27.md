# Sprint Change Proposal: Desktop Card Width Fix

**Date:** 2025-11-27
**Author:** BMad Method - Correct Course Workflow
**Trigger:** Visual inconsistency discovered in desktop layout
**Scope:** Minor (CSS adjustment)
**Status:** ✅ **APPROVED & IMPLEMENTED**

---

## Executive Summary

**Change Type:** Design Refinement

**Situation:** The dashboard section on desktop used `max-w-6xl` (1152px) while all other content sections (voting, confirmation, my prediction cards) used `max-w-2xl` (672px), creating a jarring visual break and making dashboard cards appear stretched.

**Decision:** Adjust dashboard width to `max-w-4xl` (896px) to create visual harmony while maintaining appropriate width for stats display.

**Impact:**
- ✅ **Improved UX:** Natural visual progression from focused to expansive content
- ✅ **Better visual balance:** Dashboard cards now ~210px wide (optimal for 4-column grid)
- ✅ **Zero risk:** Single-line CSS change with immediate improvement
- ✅ **Documentation updated:** UX spec now documents container width strategy

---

## Issue Analysis

### Trigger

**Discovery:** Visual review of `ui-improvement` branch after Sprint Change Proposal 2025-11-27 approval

**Evidence:**
- Voting section: `max-w-2xl` (672px) - public/index.html:54
- Confirmation display: `max-w-2xl` (672px) - public/index.html:114
- My prediction card: `max-w-2xl` (672px) - public/index.html:136
- Dashboard section: `max-w-6xl` (1152px) - public/index.html:154 ← **INCONSISTENT**

### Problem Statement

The dashboard section's excessive width (1152px) compared to other content sections (672px) created:
1. **Visual fragmentation** - Abrupt width change when scrolling
2. **Card stretching** - 4-column grid at 1152px made each card ~270px wide (too wide)
3. **Inconsistent hierarchy** - Width difference (480px gap) was too extreme

### User Impact

Desktop users experienced:
- Jarring visual transition from compact voting section to stretched dashboard
- Dashboard cards appeared disconnected from page flow
- Poor visual balance on wide screens (1280px+)

---

## Artifact Impact Assessment

### Epic Impact: ✅ None
- No epic-level changes required
- Minor refinement within current `ui-improvement` branch work

### PRD Impact: ✅ None
- No changes to product requirements
- Enhancement to existing UI presentation

### Architecture Impact: ✅ None
- No architectural changes
- Pure presentation layer adjustment

### UX Spec Impact: ✅ Updated
**File:** `docs/ux-design-specification.md`

**Added Section:** Container Width Strategy (after line 451)

Documents the intentional width progression:
- Voting: `max-w-2xl` (672px) - Focused single task
- Confirmation/My Prediction: `max-w-2xl` (672px) - Maintains focus
- Dashboard: `max-w-4xl` (896px) - Broader community view
- Footer: `max-w-6xl` (1152px) - Full-width information

**Rationale:** Creates hierarchy through width variation with natural visual progression

---

## Path Forward Analysis

### Option 1: Adjust to max-w-4xl (896px) ✅ **SELECTED**

**Changes:**
- Dashboard section: `max-w-6xl` → `max-w-4xl`

**Benefits:**
- Natural visual progression: 672px → 896px (224px increase, not jarring)
- Dashboard cards become ~210px wide (optimal for readability)
- Maintains "wider dashboard" concept with better balance
- Single-line fix, zero technical risk

**Trade-offs:**
- ✅ Improved visual consistency
- ✅ More compact, focused dashboard
- ⚠️ Slightly smaller cards (270px → 210px) - still perfectly readable

**Effort:** 5 minutes
**Risk:** None

### Option 2: Match at max-w-2xl (672px) ❌ Rejected

**Changes:**
- Dashboard section: `max-w-6xl` → `max-w-2xl`

**Issues:**
- Cards become too narrow (~150px each on 4-column grid)
- Loses visual hierarchy (dashboard should be wider for community stats)
- Overly cramped on desktop

### Option 3: Keep current width ❌ Rejected

**Issues:**
- Poor UX with jarring visual break
- Cards appear stretched and disconnected
- Inconsistent with established design pattern

---

## Implementation

### Changes Applied

#### 1. HTML Max-Width Fix
**File:** `public/index.html` (Line 154)

**Before:**
```html
<div id="dashboard-section" class="w-full max-w-6xl mx-auto px-4 pb-20 animate-fade-in">
```

**After:**
```html
<div id="dashboard-section" class="w-full max-w-4xl mx-auto px-4 pb-20 animate-fade-in">
```

#### 2. UX Spec Documentation Update
**File:** `docs/ux-design-specification.md` (After line 451)

**Added:**
```markdown
**Container Width Strategy:**
- **Voting Section:** `max-w-2xl` (672px) - Focused single task
- **Confirmation/My Prediction Cards:** `max-w-2xl` (672px) - Maintains focus
- **Dashboard Section:** `max-w-4xl` (896px) - Broader community view
- **Footer:** `max-w-6xl` (1152px) - Full-width information
- **Rationale:** Natural visual progression from focused (voting) to expansive (dashboard), creating hierarchy through width variation
```

### Verification

**Container Widths After Fix:**
```
Voting section:        max-w-2xl (672px)  ✓
Confirmation display:  max-w-2xl (672px)  ✓
My prediction card:    max-w-2xl (672px)  ✓
Dashboard section:     max-w-4xl (896px)  ✓ FIXED
Footer:                max-w-6xl (1152px) ✓
```

**Visual Consistency:** ✅ Achieved
- Natural width progression: 672px → 896px → 1152px
- Dashboard cards: ~210px each (optimal for 4-column grid)
- No jarring transitions between sections

---

## Scope Classification

**Change Scope:** Minor

**Handoff:** Development team (direct implementation)

**Deliverables:**
- ✅ Updated `public/index.html`
- ✅ Updated `docs/ux-design-specification.md`
- ✅ Visual verification completed

---

## Success Metrics

✅ **Visual Harmony:** Dashboard width creates natural progression from voting section
✅ **Card Balance:** Dashboard cards appear compact and focused (~210px each)
✅ **Documentation:** Container width strategy documented in UX spec
✅ **Zero Risk:** Single-line CSS change with no functional impact

---

## Workflow Completion

**Issue Addressed:** Desktop card width inconsistency
**Change Scope:** Minor (CSS adjustment)
**Artifacts Modified:** 2 files (HTML + UX spec)
**Routed to:** Development team (direct implementation)

**Status:** ✅ **COMPLETE**

---

_Generated by BMad Method - Correct Course Workflow v1.0_
_For: yojahny_
_Branch: ui-improvement_
