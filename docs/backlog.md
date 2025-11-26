# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-11-26 | 3.5 | 3 | TechDebt | Low | TBD | Open | Fix rate limit countdown memory leak - Store countdown interval ID and clear in hideError() [file: public/js/errors.js:341-366] |
| 2025-11-26 | 3.5 | 3 | Enhancement | Low | TBD | Open | Implement production error tracking integration (Sentry/LogRocket) - Currently just TODO comment [file: public/js/errors.js:433-449] |
| 2025-11-26 | 3.5 | 3 | Enhancement | Low | TBD | Open | Add CSP (Content Security Policy) headers for additional XSS protection - Recommended for production security hardening |
