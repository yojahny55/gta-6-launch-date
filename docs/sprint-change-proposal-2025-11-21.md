# Sprint Change Proposal: Replace Google reCAPTCHA with Cloudflare Turnstile

**Date:** 2025-11-21
**Project:** GTA 6 Launch Date Prediction Tracker
**Affected Story:** Story 2.5 - Bot Protection Integration
**Epic:** Epic 2 - Core Prediction Engine
**Author:** BMad Correct Course Workflow
**Status:** Pending Approval

---

## Executive Summary

**Change Type:** Technology Replacement (Google reCAPTCHA v3 → Cloudflare Turnstile)
**Scope:** Minor-to-Moderate (Single story, multiple artifacts)
**Timeline Impact:** +1.5-2 days to MVP
**Effort:** 10-13 hours implementation
**Risk Level:** LOW

**Recommendation:** ✅ **APPROVE** - Direct adjustment maintains zero-cost architecture while fulfilling all bot protection requirements.

---

## Section 1: Issue Summary

### Problem Statement

After completing implementation of **Story 2.5 (reCAPTCHA v3 Integration for Bot Protection)**, the team discovered that Google now requires all reCAPTCHA instances—both existing and new—to **migrate to Google Cloud Platform**, which is **not free**. This requirement directly violates the project's foundational architectural constraint of operating on a **zero-cost infrastructure stack** (Cloudflare free tier).

### Discovery Context

- **When Discovered:** During review of completed Story 2.5 implementation
- **Story Status:** Review (implementation complete, 25 tests passing, 90%+ coverage)
- **Timeline:** ASAP implementation required to maintain MVP schedule
- **Impact:** Cannot deploy reCAPTCHA-based bot protection without incurring Google Cloud costs

### Evidence

1. **Architecture Constraint Violation:**
   - PRD explicitly requires: "Zero cost infrastructure (Cloudflare free tier)"
   - Google Cloud Platform migration introduces mandatory monthly costs
   - Violates core MVP validation approach (zero operating costs)

2. **Significant Work Already Complete:**
   - Story 2.5 fully implemented and tested
   - Files created: `src/utils/recaptcha.ts`, `src/utils/recaptcha.test.ts`, `docs/RECAPTCHA_SETUP.md`
   - Frontend integration: `public/index.html`, `public/app.js`
   - 25 passing tests, comprehensive documentation
   - Ready for code review

3. **Strategic Decision:**
   - Team determined **not to use Google reCAPTCHA at all**
   - **Cloudflare Turnstile** identified as ideal replacement
   - Perfect fit: Already using Cloudflare Workers + Pages + D1 + KV
   - Zero cost on all Cloudflare plans
   - Better stack consolidation

### Proposed Solution

Replace Google reCAPTCHA v3 with **Cloudflare Turnstile** (Cloudflare's free bot protection service), which:
- Maintains zero-cost architecture principle
- Consolidates entire stack on Cloudflare (Workers + Pages + D1 + KV + Turnstile)
- Provides equivalent bot protection functionality
- Supports same invisible/managed verification mode
- Requires similar implementation effort (~10-13 hours)

---

## Section 2: Impact Analysis

### 2.1 Epic Impact

**Epic 2: Core Prediction Engine**
- **Status:** Contexted, Story 2.5 in review
- **Can Epic Complete:** ✅ **YES** - Bot protection requirement unchanged, only technology changes
- **Story 2.5 Impact:** Requires modification (reCAPTCHA → Turnstile)
- **Other Stories (2.1-2.4, 2.6-2.10):** ✅ **No impact** - Bot protection is self-contained

**Future Epics (3-9):**
- ✅ **No impact** - Bot protection implementation is encapsulated in Epic 2

### 2.2 Artifact Impact Analysis

#### PRD (`docs/PRD.md`)
- **Conflicts:** ✅ **None** - PRD is technology-agnostic about bot protection
- **Requirements:**
  - FR5: "System enforces one initial submission per IP (anti-spam)" - ✅ Turnstile fulfills
  - FR76: Bot protection with retry - ✅ Turnstile fulfills
  - NFR-S6: Rate limiting - ✅ Turnstile fulfills
- **Alignment:** ✅ **Improved** - Turnstile better maintains "zero cost infrastructure" success criterion
- **Changes Needed:** None

#### Architecture (`docs/architecture.md`)
- **Impact Level:** Medium
- **Sections to Update:**
  - Security Architecture - Bot Protection (lines 673-707): Rewrite for Turnstile
  - External Services: Replace Google reCAPTCHA with Cloudflare Turnstile
  - Dependencies: Update environment variable names
  - **ADD:** ADR-013 documenting switch rationale
- **Pattern Changes:** Score-based (0.0-1.0) → Challenge-based (pass/fail)
- **Benefits:** Better stack consolidation, zero-cost maintained

#### Epic 2 Breakdown (`docs/epics/epic-2-core-prediction-engine.md`)
- **Impact Level:** Low
- **Changes:** Story 2.5 title and description (reCAPTCHA → Turnstile)
- **Functional Requirements:** Unchanged

#### Tech Spec Epic 2 (`docs/sprint-artifacts/tech-spec-epic-2.md`)
- **Impact Level:** Medium
- **Changes:**
  - AC5 (lines 678-685): Update for Turnstile
  - External Services (lines 610-615): Replace reCAPTCHA configuration
  - Services table (line 105): Update bot protection service
  - Dependencies: Update external service documentation

#### Story 2.5 (`docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.md`)
- **Impact Level:** High - Complete story rewrite
- **Status Change:** "review" → "drafted"
- **Changes:**
  - Title: "Cloudflare Turnstile Integration for Bot Protection"
  - Acceptance Criteria: Replace all reCAPTCHA references with Turnstile
  - Tasks: Update all 9 tasks for Turnstile implementation
  - Dev Notes: Update patterns, references, and implementation details

#### UX Design (`docs/ux-design-specification.md`)
- **Impact Level:** Minimal
- **Changes:** Footer badge text only (Google → Cloudflare)
- **User Experience:** ✅ **Unchanged** - Both services use invisible verification

#### Implementation Files
- **Impact Level:** High
- **Files to Create:**
  - `src/utils/turnstile.ts` - Verification logic
  - `src/utils/turnstile.test.ts` - Test suite (25 tests)
  - `docs/TURNSTILE_SETUP.md` - Setup guide
- **Files to Modify:**
  - `public/index.html` - Script tag and footer badge
  - `public/app.js` - Frontend integration
  - `src/types/index.ts` - TypeScript interfaces
  - `.dev.vars` - Environment variables
- **Files to Delete:**
  - `src/utils/recaptcha.ts`
  - `src/utils/recaptcha.test.ts`
  - `docs/RECAPTCHA_SETUP.md`

#### Environment Configuration
- **Impact Level:** Low
- **Changes:**
  - `.dev.vars`: `RECAPTCHA_SECRET_KEY` → `TURNSTILE_SECRET_KEY`
  - GitHub Actions secrets: Rename
  - Cloudflare Workers secrets: Rename and update with Turnstile keys

#### Test Suite
- **Impact Level:** Medium
- **Changes:** Update 25 tests to mock Cloudflare Turnstile API instead of Google API
- **Coverage Target:** Maintain 90%+ per ADR-011

### 2.3 Technical Comparison

| Aspect | Google reCAPTCHA v3 | Cloudflare Turnstile | Impact |
|--------|---------------------|----------------------|--------|
| **Cost** | Requires Google Cloud ($$$) | Free on all Cloudflare plans | ✅ Major benefit |
| **Evaluation** | Score-based (0.0-1.0, threshold: 0.5) | Challenge-based (pass/fail) | ⚠️ Different, simpler |
| **User Experience** | Invisible (v3) | Invisible (managed mode) | ✅ Equivalent |
| **Frontend API** | `grecaptcha.execute()` | `turnstile.render()` | ⚠️ Different pattern |
| **Backend API** | POST to Google API | POST to Cloudflare API | ⚠️ Different endpoint |
| **Fail-Open Support** | ✅ Yes | ✅ Yes | ✅ Equivalent |
| **Stack Integration** | External (Google) | Native (Cloudflare) | ✅ Better |
| **Setup Complexity** | Google account, Cloud setup | Cloudflare dashboard (existing) | ✅ Simpler |

---

## Section 3: Recommended Approach

### Selected Path: **Option 1 - Direct Adjustment**

**Modify Story 2.5 to use Cloudflare Turnstile instead of Google reCAPTCHA**

### Justification

#### Implementation Effort & Timeline
- **Effort:** 10-13 hours (1.5-2 days)
- **Complexity:** Similar to original reCAPTCHA implementation
- **MVP Impact:** Only 1-2 day delay (acceptable)
- **Clear Scope:** Well-defined technology swap

#### Technical Risk Assessment: LOW
- Turnstile well-documented (https://developers.cloudflare.com/turnstile/)
- Similar architecture pattern (frontend token → backend verification)
- Both support invisible verification (no UX friction)
- Proven technology (used by millions of sites)
- Native Cloudflare integration (simpler than Google)

#### Long-term Benefits
✅ **Stack Consolidation:** All infrastructure on Cloudflare
  - Workers + Pages + D1 + KV + Turnstile
  - Single provider = simpler management
  - Better integration potential

✅ **Zero Cost Maintained:** Free on all Cloudflare plans
  - No Google Cloud migration costs
  - No monthly recurring fees
  - Aligns with MVP validation approach

✅ **Simpler Dependencies:** One provider vs two (Cloudflare vs Cloudflare + Google)

✅ **Better Architecture:** Resolves constraint violation, improves consistency

#### Requirements Preservation
- ✅ PRD FR5 (anti-spam): Fulfilled
- ✅ PRD FR76 (bot protection): Fulfilled
- ✅ PRD NFR-S6 (rate limiting): Fulfilled
- ✅ User experience: Still invisible/frictionless
- ✅ Data quality: Protected from bot spam

### Alternative Options Evaluated

#### Option 2: Rollback (Rejected)
- **Effort:** 13-16 hours (MORE than direct adjustment)
- **Process:** Delete reCAPTCHA → Implement Turnstile from scratch
- **Result:** Same end state as Option 1, but more work
- **Reason for Rejection:** No benefit over direct adjustment

#### Option 3: Remove Bot Protection (Rejected)
- **Effort:** 0 hours (remove feature)
- **Risk:** 🔴 **CRITICAL** - Data quality destroyed by bot spam
- **Consequences:**
  - Violates PRD core requirement (FR5)
  - Gaming communities attract trolls - HIGH RISK
  - Community median becomes unreliable
  - MVP likely to fail
- **Reason for Rejection:** Unacceptable risk to product viability

#### Option 4: Pay for Google Cloud (Rejected)
- **Cost:** Monthly recurring fees
- **Impact:** Violates zero-cost architecture principle
- **Reason for Rejection:** Defeats MVP validation approach

### Trade-offs Acknowledged

**Pros:**
- ✅ Maintains zero-cost architecture
- ✅ Better stack consolidation (all Cloudflare)
- ✅ All requirements met
- ✅ Low risk, clear implementation path
- ✅ Better long-term architecture

**Cons:**
- ⚠️ Re-work of Story 2.5 (1.5-2 days delay)
- ⚠️ Need new Turnstile keys (~15 minutes setup)
- ⚠️ API behavior difference (score vs boolean - simpler, but different)
- ⚠️ Learning curve for Turnstile (minimal, well-documented)

---

## Section 4: Detailed Change Proposals

All change proposals have been reviewed and approved in incremental mode:

### ✅ Change #1: Story 2.5 - Title and Description
- Update title: "Cloudflare Turnstile Integration for Bot Protection"
- Reset status: "review" → "drafted"
- Update story description to reference Turnstile

### ✅ Change #2: Story 2.5 - Acceptance Criteria
- Replace `grecaptcha.execute()` with `turnstile.render()`
- Update backend API: Google → Cloudflare endpoint
- Change evaluation: Score-based (>= 0.5) → Challenge-based (success: true/false)
- Preserve fail-open pattern, invisible mode, badge requirement

### ✅ Change #3: Story 2.5 - Tasks/Subtasks
- Reset all tasks to incomplete (implementation needs redone)
- Update Task 1: Google reCAPTCHA registration → Cloudflare Turnstile registration
- Update Tasks 2-9: Replace all reCAPTCHA references with Turnstile
- Maintain same task structure, testing requirements, monitoring approach

### ✅ Change #4: Story 2.5 - Dev Notes (Complete)
- Update requirements context: reCAPTCHA → Turnstile references
- Update architecture patterns: Score-based → Challenge-based
- Update implementation pattern code examples
- Update project structure notes: File names, interfaces
- Update testing standards: Mock Cloudflare API instead of Google
- Update external documentation links

### ✅ Change #5 & #6: Architecture Document
- **Security Architecture:** Rewrite Bot Protection section for Turnstile
- **External Services:** Replace Google reCAPTCHA with Cloudflare Turnstile
- Update API endpoints, environment variables, documentation links

### ✅ Change #7: Architecture Document - Add ADR-013
- **New ADR:** "Cloudflare Turnstile over Google reCAPTCHA"
- Documents cost constraint violation (Google Cloud requirement)
- Explains stack consolidation benefits
- Shows alternatives considered and rejected
- Provides rationale for future AI agents

### ✅ Change #8: Epic 2 & Tech Spec Updates
- **Epic 2:** Update Story 2.5 section with Turnstile
- **Tech Spec:** Update Overview, Services Table, AC5, External Services, Dependencies
- Consistent terminology throughout both documents

### ✅ Change #9: UX Design - Footer Badge
- Update footer badge text: Google → Cloudflare
- Update privacy policy and terms links
- Only user-facing change in entire switch

### ✅ Change #10: Implementation Files Summary
- **Create:** `turnstile.ts`, `turnstile.test.ts`, `TURNSTILE_SETUP.md`
- **Modify:** `index.html`, `app.js`, `index.ts`, `.dev.vars`
- **Delete:** `recaptcha.ts`, `recaptcha.test.ts`, `RECAPTCHA_SETUP.md`
- **Configure:** GitHub Actions secrets, Cloudflare Workers secrets

---

## Section 5: Implementation Handoff

### 5.1 Change Scope Classification

**Classification:** ⚠️ **Minor-to-Moderate**

**Rationale:**
- Contained within single story (Story 2.5)
- Clear technical scope (service replacement)
- No PRD changes required
- No epic restructuring needed
- **BUT:** Multiple artifacts affected (code, tests, docs, architecture)

### 5.2 Handoff Recipients

#### Primary: 🔧 Development Team

**Responsibilities:**
1. Implement backend Turnstile integration (`src/utils/turnstile.ts`)
2. Update frontend script integration (`public/index.html`, `public/app.js`)
3. Create and run all 25 tests (`src/utils/turnstile.test.ts`)
4. Update TypeScript types and interfaces (`src/types/index.ts`)
5. Configure environment variables (`.dev.vars`)

**Deliverables:**
- All tests passing (25 tests, 90%+ coverage per ADR-011)
- Bot protection working in dev environment
- Bot protection working in production environment
- Code ready for review

#### Secondary: 📚 Documentation Owner (yojahny)

**Responsibilities:**
1. Create `docs/TURNSTILE_SETUP.md` (setup guide)
2. Update architecture document (Security Architecture, External Services)
3. Add ADR-013 documenting the switch
4. Update Epic 2 and Tech Spec documents
5. Update Story 2.5 markdown file

**Deliverables:**
- All documentation updated and reviewed
- ADR-013 added to architecture
- Setup guide complete and tested

#### Tertiary: 👷 DevOps/Infrastructure (yojahny)

**Responsibilities:**
1. Obtain Turnstile keys from Cloudflare dashboard
2. Update GitHub Actions secrets (`RECAPTCHA_SECRET_KEY` → `TURNSTILE_SECRET_KEY`)
3. Update Cloudflare Workers secrets (dev & production environments)
4. Verify deployment pipeline unchanged

**Deliverables:**
- Turnstile keys obtained and configured
- All secrets updated in GitHub and Cloudflare
- Deployment pipeline verified

### 5.3 Implementation Checklist

**Phase 1: Preparation** (30 minutes)
- [ ] Access Cloudflare dashboard
- [ ] Create Turnstile site
- [ ] Obtain Site Key (public)
- [ ] Obtain Secret Key (private)
- [ ] Configure for localhost (dev) and gta6-tracker.pages.dev (prod)

**Phase 2: Backend Implementation** (2-3 hours)
- [ ] Create `src/utils/turnstile.ts`
- [ ] Implement `verifyTurnstileToken()` function
- [ ] Implement fail-open pattern for network errors
- [ ] Add structured logging
- [ ] Update `src/types/index.ts` interfaces

**Phase 3: Frontend Implementation** (1 hour)
- [ ] Update `public/index.html` script tag
- [ ] Update `public/app.js` form submission handler
- [ ] Change from `grecaptcha.execute()` to `turnstile.render()`
- [ ] Update footer badge (Google → Cloudflare)

**Phase 4: Testing** (2-3 hours)
- [ ] Create `src/utils/turnstile.test.ts`
- [ ] Write 25 comprehensive tests
- [ ] Mock Cloudflare Turnstile API
- [ ] Test success/failure evaluation
- [ ] Test network error handling (fail-open)
- [ ] Test invalid tokens, edge cases
- [ ] Verify 90%+ coverage (ADR-011)
- [ ] Run full test suite, ensure all pass

**Phase 5: Documentation** (1-2 hours)
- [ ] Create `docs/TURNSTILE_SETUP.md`
- [ ] Delete `docs/RECAPTCHA_SETUP.md`
- [ ] Update `docs/architecture.md` (Security Architecture, External Services)
- [ ] Add ADR-013 to architecture document
- [ ] Update Epic 2 document
- [ ] Update Tech Spec Epic 2 document
- [ ] Update Story 2.5 markdown

**Phase 6: Configuration** (30 minutes)
- [ ] Update `.dev.vars` with Turnstile keys
- [ ] Update GitHub Actions secrets
- [ ] Update Cloudflare Workers secrets (dev)
- [ ] Update Cloudflare Workers secrets (production)

**Phase 7: Testing & Validation** (1-2 hours)
- [ ] Test in local environment (npm run dev)
- [ ] Test in dev environment (push to dev branch)
- [ ] Verify bot protection working
- [ ] Test fail-open pattern (simulate API failure)
- [ ] Verify all user flows (submit, update predictions)
- [ ] Check footer badge displays correctly
- [ ] Verify no console errors

**Phase 8: Cleanup** (15 minutes)
- [ ] Delete `src/utils/recaptcha.ts`
- [ ] Delete `src/utils/recaptcha.test.ts`
- [ ] Delete `docs/RECAPTCHA_SETUP.md`
- [ ] Verify no remaining reCAPTCHA references
- [ ] Update Story 2.5 status to "ready-for-dev" → "in-progress" → "done"

### 5.4 Success Criteria

**Implementation Complete When:**
1. ✅ All 25 tests passing with 90%+ coverage
2. ✅ Bot protection verified working in dev environment
3. ✅ Bot protection verified working in production environment
4. ✅ All documentation updated and reviewed
5. ✅ Architecture document updated with ADR-013
6. ✅ Story 2.5 moved to "done" status in sprint-status.yaml
7. ✅ No reCAPTCHA references remaining in codebase
8. ✅ Code review completed and approved

### 5.5 Timeline

- **Start:** Immediately upon approval of this proposal
- **Duration:** 1.5-2 days (10-13 hours)
- **Target Completion:** Within current sprint
- **MVP Impact:** 1-2 day delay (acceptable)

### 5.6 Resources & References

**Cloudflare Turnstile Documentation:**
- Main docs: https://developers.cloudflare.com/turnstile/
- Get started: https://developers.cloudflare.com/turnstile/get-started/
- Client-side rendering: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- Server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

**Cloudflare Dashboard:**
- Turnstile: https://dash.cloudflare.com/?to=/:account/turnstile
- Workers secrets: https://dash.cloudflare.com/?to=/:account/workers

**Project References:**
- Architecture: `docs/architecture.md`
- Epic 2: `docs/epics/epic-2-core-prediction-engine.md`
- Tech Spec Epic 2: `docs/sprint-artifacts/tech-spec-epic-2.md`
- Story 2.5: `docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.md`

---

## Section 6: Risk Assessment & Mitigation

### Technical Risks

**Risk:** API behavior differences between reCAPTCHA and Turnstile
- **Probability:** Low
- **Impact:** Low
- **Mitigation:** Both services well-documented, similar patterns, comprehensive testing

**Risk:** Turnstile key configuration issues
- **Probability:** Low
- **Impact:** Low
- **Mitigation:** Clear setup guide, existing Cloudflare account, straightforward dashboard

**Risk:** Test coverage drops below 90%
- **Probability:** Low
- **Impact:** Medium (ADR-011 violation)
- **Mitigation:** 25 test target maintained, co-located tests, test-first approach

### Timeline Risks

**Risk:** Implementation takes longer than estimated
- **Probability:** Low
- **Impact:** Low (1-2 day MVP slip already acceptable)
- **Mitigation:** Clear scope, similar complexity to original, phased approach

**Risk:** Integration issues discovered during testing
- **Probability:** Low
- **Impact:** Low
- **Mitigation:** Comprehensive test suite, fail-open pattern for resilience

### Business Risks

**Risk:** Bot protection less effective with Turnstile
- **Probability:** Very Low
- **Impact:** High (data quality)
- **Mitigation:** Turnstile proven technology, used by millions, challenge-based evaluation effective

**Risk:** User experience degradation
- **Probability:** Very Low
- **Impact:** Medium
- **Mitigation:** Both services invisible, same UX patterns, only footer badge changes

---

## Appendix A: File Change Summary

### Files to Create (3)
1. `src/utils/turnstile.ts` - Backend verification logic
2. `src/utils/turnstile.test.ts` - Test suite (25 tests)
3. `docs/TURNSTILE_SETUP.md` - Setup guide

### Files to Modify (8)
1. `public/index.html` - Script tag and footer badge
2. `public/app.js` - Frontend integration
3. `src/types/index.ts` - TypeScript interfaces
4. `.dev.vars` - Environment variables
5. `docs/architecture.md` - Security Architecture, External Services, ADR-013
6. `docs/epics/epic-2-core-prediction-engine.md` - Story 2.5 section
7. `docs/sprint-artifacts/tech-spec-epic-2.md` - Multiple sections
8. `docs/sprint-artifacts/stories/2-5-recaptcha-v3-integration-for-bot-protection.md` - Complete rewrite

### Files to Delete (3)
1. `src/utils/recaptcha.ts`
2. `src/utils/recaptcha.test.ts`
3. `docs/RECAPTCHA_SETUP.md`

### Configuration Changes (3)
1. GitHub Actions secrets: Rename `RECAPTCHA_SECRET_KEY` → `TURNSTILE_SECRET_KEY`
2. Cloudflare Workers secrets (dev): Update with Turnstile keys
3. Cloudflare Workers secrets (production): Update with Turnstile keys

**Total Files Affected:** 14 files (3 create, 8 modify, 3 delete)

---

## Appendix B: Communication Plan

### Stakeholder Notification

**yojahny (Product Owner/Developer):**
- Review and approve this Sprint Change Proposal
- Prioritize Story 2.5 reimplementation
- Allocate 1.5-2 days for completion

### Team Communication

**Development Team:**
- Story 2.5 scope changed: reCAPTCHA → Turnstile
- Reason: Google Cloud cost requirement violates architecture
- Implementation effort: Similar to original (10-13 hours)
- All change proposals approved in incremental review

### Documentation Updates

**README.md:**
- Update bot protection section if mentioned
- Reference Turnstile instead of reCAPTCHA

**CHANGELOG.md:**
- Add entry: "Changed bot protection from Google reCAPTCHA to Cloudflare Turnstile (cost constraint)"

---

## Approval

**Sprint Change Proposal Status:** Pending Approval

**Reviewed By:** yojahny (via incremental mode)
**Date:** 2025-11-21

**All 10 change proposals approved:**
- ✅ Change #1: Story 2.5 - Title and Description
- ✅ Change #2: Story 2.5 - Acceptance Criteria
- ✅ Change #3: Story 2.5 - Tasks/Subtasks
- ✅ Change #4: Story 2.5 - Dev Notes (Bundled)
- ✅ Change #5 & #6: Architecture - Security & External Services
- ✅ Change #7: Architecture - ADR-013
- ✅ Change #8: Epic 2 & Tech Spec (Bundled)
- ✅ Change #9: UX Design - Footer Badge
- ✅ Change #10: Implementation Files Summary

**Next Step:** Finalize and route for implementation

---

**Generated by:** BMad Correct Course Workflow v1.0
**Workflow Path:** `/var/www/html/others/gta-6-launch-date/.bmad/bmm/workflows/4-implementation/correct-course/`
**Date:** 2025-11-21
