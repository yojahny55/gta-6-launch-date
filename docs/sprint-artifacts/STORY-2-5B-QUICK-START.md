# Story 2.5B Quick Start Guide

**Story:** Cloudflare Turnstile Integration for Bot Protection
**Status:** drafted → Ready to begin implementation
**Effort:** 10-13 hours (1.5-2 days)
**Priority:** High (blocks MVP launch)

---

## What Happened?

**Original Plan:** Story 2.5 implemented Google reCAPTCHA v3 for bot protection (completed, 25 tests passing)

**Change:** Google now requires reCAPTCHA instances to migrate to Google Cloud Platform (paid), which violates our zero-cost architecture constraint.

**Solution:** Replace with Cloudflare Turnstile (free, better stack consolidation)

**Reference:** See `docs/sprint-change-proposal-2025-11-21.md` for complete analysis

---

## Quick Implementation Checklist

### Phase 1: Setup (30 minutes)
```bash
# 1. Get Turnstile Keys
# Visit: https://dash.cloudflare.com/?to=/:account/turnstile
# - Create new site
# - Configure domains: localhost, gta6-tracker.pages.dev
# - Copy Site Key (public) and Secret Key (private)

# 2. Update environment variables
# Edit .dev.vars:
TURNSTILE_SECRET_KEY=your-secret-key-here
TURNSTILE_SITE_KEY=your-site-key-here
```

### Phase 2: Backend (2-3 hours)
```bash
# 1. Create verification module
touch src/utils/turnstile.ts
touch src/utils/turnstile.test.ts

# 2. Implement verifyTurnstileToken() function
# See: docs/sprint-artifacts/stories/2-5b-cloudflare-turnstile-integration.md
# Dev Notes section has complete implementation pattern

# 3. Update TypeScript interfaces
# Edit src/types/index.ts:
# - Add TurnstileVerificationResult interface
# - Update Env interface with TURNSTILE_SECRET_KEY
```

### Phase 3: Frontend (1 hour)
```bash
# 1. Update public/index.html
# Replace reCAPTCHA script:
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

# 2. Update public/app.js
# Replace grecaptcha.execute() with turnstile.render()
# See story Dev Notes for code examples

# 3. Update footer badge
# Change from Google to Cloudflare attribution
```

### Phase 4: Testing (2-3 hours)
```bash
# 1. Write 25 tests in src/utils/turnstile.test.ts
# Target: 90%+ coverage (ADR-011 requirement)

# 2. Run tests
npm test src/utils/turnstile.test.ts

# 3. Check coverage
npm run test:coverage
```

### Phase 5: Configuration (30 minutes)
```bash
# 1. Update GitHub Actions secrets
# Rename: RECAPTCHA_SECRET_KEY → TURNSTILE_SECRET_KEY

# 2. Update Cloudflare Workers secrets
wrangler secret put TURNSTILE_SECRET_KEY  # Dev
wrangler secret put TURNSTILE_SECRET_KEY --env production  # Prod
```

### Phase 6: Cleanup (15 minutes)
```bash
# Delete deprecated reCAPTCHA files
rm src/utils/recaptcha.ts
rm src/utils/recaptcha.test.ts
rm docs/RECAPTCHA_SETUP.md

# Verify no remaining references
grep -r "recaptcha" src/
grep -r "grecaptcha" public/
```

### Phase 7: Validation (1-2 hours)
```bash
# 1. Test locally
npm run dev
# Submit a test prediction, verify bot protection working

# 2. Test in dev environment
git push origin dev
# Test on deployed dev site

# 3. Run full test suite
npm test
# Verify all tests pass
```

---

## Key Resources

**Story File:** `docs/sprint-artifacts/stories/2-5b-cloudflare-turnstile-integration.md`
- Complete acceptance criteria
- All 10 tasks with subtasks
- Comprehensive dev notes
- Implementation patterns

**Sprint Change Proposal:** `docs/sprint-change-proposal-2025-11-21.md`
- Complete impact analysis
- All approved change proposals
- Rationale and alternatives considered

**Cloudflare Docs:** https://developers.cloudflare.com/turnstile/
- Get started guide
- Client-side rendering
- Server-side validation

**Dashboard:** https://dash.cloudflare.com/?to=/:account/turnstile
- Create Turnstile site
- Get keys
- View analytics

---

## Success Criteria

✅ **Done When:**
1. All 25 tests passing (90%+ coverage)
2. Bot protection working in dev
3. Bot protection working in production
4. All reCAPTCHA files deleted
5. Documentation updated
6. Code review approved

---

## Need Help?

**Story has everything you need:**
- Dev Notes: Complete implementation patterns
- Tasks: Step-by-step breakdown
- Testing: Comprehensive test strategy
- References: Links to all documentation

**Questions?**
- Check Sprint Change Proposal for detailed analysis
- See ADR-013 in architecture.md for decision rationale
- Reference original Story 2.5 for testing patterns (same approach)

---

**Next Step:** Start with Phase 1 (Setup) to get Turnstile keys! 🚀
