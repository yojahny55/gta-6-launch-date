# Epic 1: Foundation & Infrastructure Setup

**Epic Goal:** Establish robust technical foundation that enables all subsequent development with zero technical debt, secure-by-default architecture, and scalable infrastructure.

**Epic Value:** Every subsequent story depends on this foundation. Cutting corners here creates technical debt that compounds throughout the project.

## Story 1.1: Project Initialization and Repository Setup

As a developer,
I want a properly configured project structure with TypeScript, build tools, and version control,
So that I can develop efficiently with type safety and maintain clean code.

**Acceptance Criteria:**

**Given** a new project needs to be created
**When** I initialize the project
**Then** the following structure exists:
- Git repository initialized with .gitignore (node_modules, .env, dist)
- TypeScript configured (tsconfig.json with strict mode, ES2022 target)
- Package.json with scripts: dev, build, test, deploy
- Directory structure: /src (frontend), /workers (backend), /db (schema)
- ESLint + Prettier configured for code quality
- README.md with setup instructions

**And** environment variables template exists (.env.example):
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN
- DATABASE_NAME
- RECAPTCHA_SITE_KEY
- RECAPTCHA_SECRET_KEY
- ADSENSE_CLIENT_ID

**And** first commit is made with message: "feat: initial project setup"

**Prerequisites:** None (first story)

**Technical Notes:**
- Use Vite for frontend build tool (fast, modern)
- Use Wrangler CLI for Cloudflare Workers deployment
- TypeScript strict mode enforces type safety (FR78 parameterized queries benefit)
- ESLint rules: no-any, no-explicit-any, strict-null-checks

---

## Story 1.2: Cloudflare Infrastructure Configuration

As a developer,
I want Cloudflare Pages, Workers, and D1 database configured,
So that I have a deployment target and data storage ready.

**Acceptance Criteria:**

**Given** Cloudflare account exists
**When** I configure infrastructure
**Then** the following resources are created:
- Cloudflare Pages project named "gta6-predictions"
- Cloudflare Workers service configured with routes
- Cloudflare D1 database "gta6_predictions_db" created
- Wrangler.toml configuration file with bindings

**And** database schema is deployed:
```sql
CREATE TABLE predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
);

CREATE INDEX idx_predictions_date ON predictions(predicted_date);
CREATE INDEX idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX idx_predictions_submitted ON predictions(submitted_at);
```

**And** database connection test succeeds from Workers environment

**Prerequisites:** Story 1.1 (project structure exists)

**Technical Notes:**
- D1 is SQLite-based, supports 5M reads/day on free tier
- Use D1 prepared statements for FR78 (parameterized queries)
- UNIQUE constraints enforce FR5 (one submission per IP)
- Indexes optimize FR7-12 (median calculation queries)
- Store dates as ISO 8601 format for FR73 (UTC storage)

---

## Story 1.3: CI/CD Pipeline with GitHub Actions

As a developer,
I want automated testing and deployment on every commit,
So that code quality is maintained and deployments are reliable.

**Acceptance Criteria:**

**Given** code is pushed to GitHub
**When** GitHub Actions workflow runs
**Then** the following steps execute:
1. Install dependencies (npm ci)
2. Run linter (eslint)
3. Run TypeScript compiler (tsc --noEmit)
4. Run tests (if any exist)
5. Build project (npm run build)
6. Deploy to Cloudflare (on main branch only)

**And** deployment uses secrets:
- CLOUDFLARE_API_TOKEN (stored in GitHub secrets)
- Wrangler automatically deploys to Pages + Workers

**And** deployment status is reported back to commit

**And** failed builds prevent deployment

**Prerequisites:** Story 1.1 (project structure), Story 1.2 (Cloudflare configured)

**Technical Notes:**
- GitHub Actions workflow file: .github/workflows/deploy.yml
- Use wrangler action: cloudflare/wrangler-action@2
- Enables FR95 (zero-downtime deployment) - Cloudflare handles blue/green
- Preview deployments for PR branches
- Production deployments only from main branch

---

## Story 1.4: Database Transaction Support and Error Handling

As a developer,
I want database operations wrapped in transactions with proper error handling,
So that data integrity is maintained even under concurrent access.

**Acceptance Criteria:**

**Given** multiple database operations need to execute atomically
**When** I use the database wrapper utility
**Then** a transaction helper function exists:

```typescript
async function executeTransaction<T>(
  db: D1Database,
  operations: (tx: D1Database) => Promise<T>
): Promise<{success: boolean; data?: T; error?: string}>
```

**And** transaction behavior:
- All operations succeed together or all fail together
- Deadlock detection with automatic retry (max 3 attempts)
- Timeout after 5 seconds
- Proper error logging with context

**And** error responses are user-friendly:
- Database errors → "Unable to save prediction. Please try again."
- Timeout errors → "Request took too long. Please try again."
- Constraint violations → Specific message (e.g., "You've already submitted a prediction")

**Prerequisites:** Story 1.2 (database exists)

**Technical Notes:**
- Implements FR83 (database transactions)
- Supports FR61 (race condition prevention)
- D1 supports BEGIN/COMMIT/ROLLBACK
- Use IMMEDIATE transactions for write operations
- Implements FR59 (user-friendly error messages)

---

## Story 1.5: Rollback Capability and Deployment Safety

As a developer,
I want the ability to quickly rollback to the previous version,
So that I can recover from bad deployments within 5 minutes.

**Acceptance Criteria:**

**Given** a deployment causes issues
**When** I trigger a rollback
**Then** Cloudflare automatically serves the previous deployment

**And** rollback process:
- Identify previous deployment ID from Cloudflare dashboard
- Single command rollback: `wrangler rollback --deployment-id=<id>`
- Rollback completes in < 2 minutes (global CDN propagation)
- No data loss (database is forward-compatible)

**And** rollback documentation exists in README:
- How to identify bad deployment
- Rollback command with examples
- Verification steps post-rollback

**And** deployment history is retained for 30 days

**Prerequisites:** Story 1.3 (CI/CD pipeline configured)

**Technical Notes:**
- Implements FR96 (5-minute rollback capability)
- Cloudflare maintains deployment history automatically
- Database migrations must be backward-compatible
- Consider blue/green deployment for zero-downtime (FR95)
- Test rollback in staging environment before launch

---

## Story 1.6: Basic Performance Monitoring via Cloudflare Analytics

As a developer,
I want visibility into page load times and API performance,
So that I can identify and fix performance issues.

**Acceptance Criteria:**

**Given** the site is deployed
**When** users access the site
**Then** Cloudflare Analytics automatically tracks:
- Page load times (p50, p95, p99)
- Total requests per endpoint
- Error rate (4xx, 5xx responses)
- Bandwidth usage
- Geographic distribution

**And** a performance dashboard is accessible via:
- Cloudflare Dashboard → Analytics tab
- Key metrics visible: avg load time, error rate, request count

**And** performance baseline is documented:
- Target: < 2s page load (FR40 desktop)
- Target: < 3s page load (FR40 mobile)
- Target: < 200ms API response (NFR-P3)
- Target: < 1% error rate

**Prerequisites:** Story 1.3 (deployment pipeline)

**Technical Notes:**
- Implements FR102 (basic performance monitoring)
- Cloudflare Analytics is free tier included
- No code changes required (automatic)
- Supports FR40 validation (<2s desktop, <3s mobile)
- Baseline for FR94 (Lighthouse >90 score)
- Growth phase: Add FR81-82 (custom metrics, alerting)

---
