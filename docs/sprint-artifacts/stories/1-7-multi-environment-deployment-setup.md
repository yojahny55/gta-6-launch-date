# Story 1.7: Multi-Environment Deployment Setup

Status: review

## Story

As a developer,
I want separate dev and production deployment environments,
So that I can safely test changes in a live environment before deploying to production.

## Acceptance Criteria

**Given** the CI/CD pipeline is configured (Story 1.3)
**When** I push code to different branches
**Then** the following deployment behavior occurs:

1. **Dev branch:** Auto-deploys to dev Worker environment (`gta6-tracker-dev.*.workers.dev`)
2. **Main branch:** Auto-deploys to production Worker environment (`gta6-tracker.*.workers.dev`)
3. **Pull requests:** Creates preview deployments (optional for MVP)

**And** Wrangler environments are configured:
- `[env.production]` with name "gta6-tracker"
- `[env.dev]` with name "gta6-tracker-dev"
- `[env.preview]` with name "gta6-tracker-preview" (optional)

**And** frontend knows which Worker URL to call:
- Cloudflare Pages environment variables configured
- Production Pages → Production Worker URL
- Preview Pages → Dev Worker URL
- Local development → `localhost:8787`

**And** environment variable `ENVIRONMENT` distinguishes environments:
- Production: `ENVIRONMENT = "production"`
- Dev: `ENVIRONMENT = "dev"`
- Preview: `ENVIRONMENT = "preview"`

**And** all environments share the same D1 database (simple strategy for MVP)

**And** automated tests exist covering main functionality

### Testing Requirements
- [ ] Unit tests for environment variable resolution
- [ ] Integration tests verifying dev deployment works
- [ ] Integration tests verifying production deployment works
- [ ] Manual validation: push to dev branch, verify dev Worker URL responds
- [ ] Manual validation: merge to main, verify production Worker URL responds
- [ ] Manual validation: frontend calls correct Worker URL per environment

## Tasks / Subtasks

- [x] Task 1: Update wrangler.toml with environment configurations (AC: 2)
  - [x] Add `[env.production]` section with name "gta6-tracker"
  - [x] Add `[env.dev]` section with name "gta6-tracker-dev"
  - [x] Add `[env.preview]` section with name "gta6-tracker-preview" (optional)
  - [x] Add `vars = { ENVIRONMENT = "..." }` for each environment
  - [x] Verify shared D1 binding works across all environments
  - [x] Test locally: `npx wrangler dev --env dev`
  - [x] Test locally: `npx wrangler dev --env production`

- [x] Task 2: Update GitHub Actions workflow for branch-based deployments (AC: 1)
  - [x] Add deployment step for dev branch with `--env dev` flag
  - [x] Update production deployment step to use `--env production` flag
  - [x] Add optional preview deployment for pull requests with `--env preview`
  - [x] Ensure deployment conditionals are mutually exclusive
  - [x] Verify secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) are passed correctly
  - [x] Update workflow comments to document environment strategy

- [x] Task 3: Create .env.development for local frontend development (AC: 3)
  - [x] Create `.env.development` file with `VITE_API_URL=http://localhost:8787`
  - [x] Add `VITE_ENVIRONMENT=local`
  - [x] Add `.env` and `.env.*.local` to `.gitignore` (if not already)
  - [x] Document local development environment variables in README

- [ ] Task 4: Configure Cloudflare Pages environment variables (AC: 3)
  - [ ] Navigate to Cloudflare Dashboard → Pages → gta6-tracker → Settings → Environment variables
  - [ ] Add Production environment variable: `VITE_API_URL = https://gta6-tracker.yojahnychavez.workers.dev`
  - [ ] Add Production environment variable: `VITE_ENVIRONMENT = production`
  - [ ] Add Preview environment variable: `VITE_API_URL = https://gta6-tracker-dev.yojahnychavez.workers.dev`
  - [ ] Add Preview environment variable: `VITE_ENVIRONMENT = dev`
  - [ ] Document this configuration in README with screenshots/instructions

- [x] Task 5: Update frontend code to use environment-aware API URLs (AC: 3)
  - [x] Create API utility module: `src/utils/api.ts` or update existing
  - [x] Use `import.meta.env.VITE_API_URL` with fallback to localhost
  - [x] Create `callAPI()` helper function for all API calls
  - [x] Update all existing fetch calls to use environment-aware API URL
  - [x] Add TypeScript types for environment variables: `src/vite-env.d.ts`
  - [x] Test locally with `.env.development`

- [x] Task 6: Update Vite configuration for environment variable handling (AC: 3)
  - [x] Update `vite.config.ts` to load environment variables
  - [x] Configure `define` option for build-time variable replacement
  - [x] Ensure environment variables are injected during build
  - [x] Test build with: `npm run build` (should use .env.production)

- [ ] Task 7: Test dev environment deployment (Testing)
  - [ ] Create dev branch: `git checkout -b dev`
  - [ ] Make a small test change (e.g., add console.log to Worker)
  - [ ] Push to dev branch: `git push origin dev`
  - [ ] Verify GitHub Actions deploys to dev environment
  - [ ] Verify dev Worker URL is accessible: `curl https://gta6-tracker-dev.*.workers.dev`
  - [ ] Verify Worker logs show `ENVIRONMENT = "dev"`
  - [ ] Verify Pages preview deployment created
  - [ ] Test frontend → backend communication on dev environment

- [ ] Task 8: Test production environment deployment (Testing)
  - [ ] Ensure main branch has latest changes
  - [ ] Push to main branch: `git push origin main`
  - [ ] Verify GitHub Actions deploys to production environment
  - [ ] Verify production Worker URL is accessible: `curl https://gta6-tracker.*.workers.dev`
  - [ ] Verify Worker logs show `ENVIRONMENT = "production"`
  - [ ] Verify Pages production deployment updated
  - [ ] Test frontend → backend communication on production environment

- [x] Task 9: Update documentation (AC: 3)
  - [x] Update README.md with multi-environment strategy section
  - [x] Document dev branch workflow (push → test → merge)
  - [x] Document local development setup with .env.development
  - [x] Document Cloudflare Pages environment variable configuration
  - [x] Add environment URLs to README (dev vs production)
  - [x] Update deployment commands section

- [x] Task 10: Write automated tests for environment configuration (Testing - ADR-011)
  - [x] Create test file: `tests/environment-config.test.ts`
  - [x] Test environment variable resolution (VITE_API_URL)
  - [x] Test API URL helper functions
  - [x] Test fallback to localhost when VITE_API_URL is undefined
  - [x] Test Vite config loads environment variables correctly
  - [x] Verify wrangler.toml has all required environments

## Dev Notes

### Requirements Context

**From ADR-012 (Architecture):**
- Multi-environment strategy reduces deployment risk
- Three tiers: Local, Dev, Production
- Branch-based deployments: dev → dev env, main → production env
- Frontend-to-backend configuration via Vite environment variables
- Shared D1 database across environments (simple MVP strategy)

[Source: docs/architecture.md#ADR-012]

**From Story 1.3 Review:**
- Current implementation only deploys to production (main branch)
- No way to preview changes in live environment before production
- Risk: bugs can reach production without live testing
- Need: dev environment for safe iteration

[Source: Story 1.3 completion notes and review discussion]

**From Architecture: Deployment Architecture:**
- Cloudflare Workers supports environments via wrangler.toml
- Cloudflare Pages supports environment variables per deployment type
- Vite can inject environment variables at build time
- Best practice: separate environments for dev/staging/production

[Source: docs/architecture.md#Deployment-Architecture]

### Architecture Alignment

**From Architecture Document:**

**Multi-Environment Strategy:**
- Local: `localhost:8787` (wrangler dev)
- Dev: `gta6-tracker-dev.*.workers.dev` (dev branch)
- Production: `gta6-tracker.*.workers.dev` (main branch)

[Source: docs/architecture.md:757-765]

**Wrangler Environments Configuration:**
```toml
[env.production]
name = "gta6-tracker"
vars = { ENVIRONMENT = "production" }

[env.dev]
name = "gta6-tracker-dev"
vars = { ENVIRONMENT = "dev" }
```

[Source: docs/architecture.md:796-825]

**Frontend-to-Backend API Configuration:**
- Cloudflare Pages environment variables: `VITE_API_URL`, `VITE_ENVIRONMENT`
- Local development: `.env.development`
- Frontend code: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'`

[Source: docs/architecture.md:827-854]

**Branch Strategy:**
```
main (production)
  ↑
  └── Pull Request (preview deployment)
        ↑
        └── dev (dev environment)
              ↑
              └── feature/* (local dev, no auto-deploy)
```

[Source: docs/architecture.md:862-871]

**ADR-012: Multi-Environment Deployment Strategy:**
- Three-tier environment strategy
- Wrangler environments and branch-based deployments
- Shared D1 database for simplicity
- Vite environment variables for frontend-to-backend configuration
- Risk reduction: test in dev before production

[Source: docs/architecture.md:1245-1375]

### Technical Implementation Notes

**Wrangler Environment Configuration:**

The `wrangler.toml` file supports environment-specific configurations:

```toml
# Base config (shared across all environments)
name = "gta6-tracker"
main = "src/index.ts"
compatibility_date = "2025-11-09"
compatibility_flags = ["nodejs_compat"]

# Shared D1 binding
[[d1_databases]]
binding = "DB"
database_name = "gta6-predictions"
database_id = "150217ee-5408-406e-98be-37b15a8e5990"

# Production environment
[env.production]
name = "gta6-tracker"
vars = { ENVIRONMENT = "production" }

# Dev environment
[env.dev]
name = "gta6-tracker-dev"
vars = { ENVIRONMENT = "dev" }

# Preview environment (optional)
[env.preview]
name = "gta6-tracker-preview"
vars = { ENVIRONMENT = "preview" }
```

**Key Points:**
- Different `name` values create separate Workers
- `vars` sets runtime environment variables accessible via `env.ENVIRONMENT`
- Shared D1 binding works across all environments
- Deploy with: `wrangler deploy --env dev` or `wrangler deploy --env production`

**GitHub Actions Workflow Update:**

```yaml
# Deploy to DEV environment (dev branch)
- name: Deploy to Cloudflare Workers (DEV)
  if: github.ref == 'refs/heads/dev' && github.event_name == 'push'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env dev
  env:
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

# Deploy to PRODUCTION environment (main branch)
- name: Deploy to Cloudflare Workers (PRODUCTION)
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env production
  env:
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

# Optional: Deploy to PREVIEW environment (pull requests)
- name: Deploy to Cloudflare Workers (PREVIEW)
  if: github.event_name == 'pull_request'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env preview
  env:
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Frontend Environment Variable Setup:**

**`.env.development` (local dev):**
```env
VITE_API_URL=http://localhost:8787
VITE_ENVIRONMENT=local
```

**Cloudflare Pages Dashboard Configuration:**
- Navigate to: **Pages → gta6-tracker → Settings → Environment variables**
- Production environment:
  - `VITE_API_URL` = `https://gta6-tracker.yojahnychavez.workers.dev`
  - `VITE_ENVIRONMENT` = `production`
- Preview environment (for dev branch and PRs):
  - `VITE_API_URL` = `https://gta6-tracker-dev.yojahnychavez.workers.dev`
  - `VITE_ENVIRONMENT` = `dev`

**Frontend API Helper:**

```typescript
// src/utils/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'local';

export async function callAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log(`[${ENVIRONMENT}] API call: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Usage
export async function submitPrediction(predictedDate: string) {
  return callAPI('/api/predict', {
    method: 'POST',
    body: JSON.stringify({ predicted_date: predictedDate }),
  });
}

export async function getStats() {
  return callAPI('/api/stats');
}
```

**TypeScript Type Definitions:**

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENVIRONMENT: 'local' | 'dev' | 'production' | 'preview';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Vite Configuration Update:**

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT),
    },
    build: {
      outDir: 'dist',
    },
  };
});
```

### Testing Strategy

**Unit Tests:**
- Environment variable resolution tests
- API URL helper function tests
- Fallback logic tests (when VITE_API_URL is undefined)

**Integration Tests:**
- Dev environment deployment verification
- Production environment deployment verification
- Frontend-to-backend communication per environment

**Manual Tests:**
- Push to dev branch → Verify dev Worker URL responds
- Push to main branch → Verify production Worker URL responds
- Local dev: `npm run dev` → Frontend calls `localhost:8787`
- Dev Pages preview → Frontend calls dev Worker URL
- Production Pages → Frontend calls production Worker URL

**Test Coverage Requirements (ADR-011):**
- Environment configuration tests: 90%+ coverage
- API helper utilities: 100% coverage (critical path)
- Manual validation of each environment: Required before story "done"

### Performance Targets

**No performance impact expected:**
- Environment variables resolved at build time (no runtime cost)
- Multiple Workers on free tier (no additional cost)
- Shared D1 database (no duplication overhead)

### Prerequisites

**Before Starting:**
- Story 1.3 completed (CI/CD pipeline exists)
- GitHub repository with main branch
- Cloudflare account with Pages and Workers configured
- Access to Cloudflare dashboard for environment variable configuration

**After Completion:**
- Dev branch workflow established
- Safe testing before production deployments
- Foundation for future environment-specific configurations

### References

- [ADR-012: Multi-Environment Deployment Strategy](../architecture.md#ADR-012)
- [Architecture: Deployment Architecture](../architecture.md#Deployment-Architecture)
- [Cloudflare Workers Environments](https://developers.cloudflare.com/workers/wrangler/environments/)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Story 1.3 Review Notes](1-3-ci-cd-pipeline-with-github-actions.md#Senior-Developer-Review)

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/stories/1-7-multi-environment-deployment-setup.context.xml` - Generated 2025-11-15 by story-context workflow

### Agent Model Used

- claude-sonnet-4-5-20250929

### Debug Log References

**Implementation Plan:**

1. Updated wrangler.toml with three environment configurations (production, dev, preview)
2. Modified GitHub Actions workflow to support branch-based deployments
3. Created .env.development for local development
4. Built environment-aware API utility module with TypeScript types
5. Updated Vite configuration to load and inject environment variables
6. Wrote comprehensive automated tests for environment configuration
7. Updated README.md with multi-environment deployment strategy documentation

**Key Implementation Decisions:**

- Used Wrangler's built-in environment support ([env.*] sections) rather than separate config files
- Implemented generic TypeScript type for callAPI function (<T = unknown>) to avoid ESLint any errors
- Moved API tests to tests/ directory to align with vitest.config.unit.ts include pattern
- Added detailed multi-environment workflow documentation in README for user guidance
- Shared D1 database binding across all environments (MVP strategy per ADR-012)

### Completion Notes List

✅ **Task 1-3: Infrastructure Configuration Complete**
- wrangler.toml now has production, dev, and preview environment configurations
- Each environment has unique Worker name and ENVIRONMENT variable
- GitHub Actions workflow updated with mutually exclusive deployment conditions
- Local development environment variables created (.env.development)

✅ **Task 5-6: Frontend Environment Awareness Complete**
- Created `src/utils/api.ts` with environment-aware API helper functions
- Implemented `callAPI<T>()` generic function for type-safe API calls
- Added `submitPrediction()` and `getStats()` convenience wrappers
- Created TypeScript type definitions in `src/vite-env.d.ts`
- Updated Vite config to load and inject environment variables at build time

✅ **Task 9-10: Documentation and Testing Complete**
- README.md updated with comprehensive multi-environment deployment strategy
- Added development workflow guide (local → dev → production)
- Documented Cloudflare Pages environment variable configuration
- Created `tests/environment-config.test.ts` with 12 tests (wrangler.toml, GitHub workflow, .gitignore, TypeScript types)
- Created `tests/api-utils.test.ts` with 14 tests (100% coverage of API helper functions)

**All automated tests passing:**
- 64 total tests (3 test files)
- Lint, format check, TypeScript compilation: ✅
- Build: ✅

**Manual tasks remaining (Tasks 4, 7, 8):**
- Task 4: Configure Cloudflare Pages dashboard environment variables (requires manual UI configuration)
- Task 7: Test dev environment deployment (requires creating dev branch and pushing)
- Task 8: Test production environment deployment (requires merging to main)

These manual tasks are intentionally left for the user to complete as they require:
1. Access to Cloudflare dashboard
2. Creating and managing git branches
3. Verifying live deployments

The code implementation is 100% complete and ready for deployment testing.

### File List

**Created:**
- `.env.development` - Local development environment variables
- `src/utils/api.ts` - Environment-aware API helper functions with callAPI(), submitPrediction(), getStats()
- `src/vite-env.d.ts` - TypeScript type definitions for Vite environment variables
- `tests/environment-config.test.ts` - Environment configuration validation tests (12 tests)
- `tests/api-utils.test.ts` - API utility function tests (14 tests, 100% coverage)

**Modified:**
- `wrangler.toml` - Added [env.production], [env.dev], [env.preview] configurations
- `.github/workflows/deploy.yml` - Added branch-based deployment steps (dev, main, PR)
- `vite.config.ts` - Added loadEnv() and define option for environment variable injection
- `README.md` - Added Multi-Environment Deployment Strategy section with workflow guide
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress → review

---

## Change Log

- 2025-11-15: Story drafted following ADR-012 discovery - Multi-environment deployment strategy (PM agent)
- 2025-11-15: Implementation complete - Multi-environment deployment infrastructure, API utilities, tests, and documentation (Dev agent: claude-sonnet-4-5-20250929)
