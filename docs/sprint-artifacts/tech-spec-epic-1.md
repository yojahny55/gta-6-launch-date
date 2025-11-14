# Epic Technical Specification: Foundation & Infrastructure Setup

Date: 2025-11-13
Author: yojahny
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the technical foundation for the GTA 6 Launch Date Prediction Tracker by setting up a production-ready Cloudflare-based architecture. This epic implements the core project structure, infrastructure components, and deployment pipeline that all subsequent development depends on. The foundation uses **Hono + Cloudflare Workers + D1** with TypeScript for type-safe, edge-optimized performance.

**Strategic Importance:** This epic enables the "ruthlessly simple" architecture principle from the PRD - zero-cost infrastructure that scales globally while maintaining sub-2-second load times. Every architectural decision here prevents technical debt and ensures AI agents can implement subsequent stories consistently.

## Objectives and Scope

**In Scope:**
- TypeScript project initialization with strict type safety
- Cloudflare infrastructure setup (Pages, Workers, D1 database)
- Database schema deployment with indexes for weighted median queries
- CI/CD pipeline with automated testing and deployment
- Database transaction support with error handling
- Rollback capability for deployment safety (< 5 minutes)
- Basic performance monitoring via Cloudflare Analytics

**Out of Scope:**
- Application logic or business features (covered in Epic 2+)
- Frontend UI components (covered in Epic 3)
- Social sharing or widgets (covered in Epic 5-6)
- Advanced monitoring or alerting (deferred to post-MVP)

**Success Metrics:**
- Project can be set up by new developer in < 30 minutes
- Deployments complete in < 5 minutes end-to-end
- Rollback capability tested and documented
- Database connection from Workers verified
- Performance baseline established (< 2s load time target)

## System Architecture Alignment

**Architecture Components Referenced:**

1. **Runtime Environment** (ADR-001)
   - Cloudflare Workers for serverless edge compute
   - Ensures < 50ms global latency via edge network
   - Free tier: 100K requests/day (sufficient for MVP)

2. **Database Layer** (Architecture Section: Data Architecture)
   - Cloudflare D1 (serverless SQLite)
   - Schema with UNIQUE constraints for IP-based rate limiting (FR5)
   - Indexes on `predicted_date`, `cookie_id`, `submitted_at` for query optimization

3. **Deployment Pipeline** (Architecture Section: Deployment Architecture)
   - GitHub Actions for CI/CD automation
   - Cloudflare Pages for static assets (HTML/CSS/JS)
   - Wrangler CLI for Workers deployment

4. **Type Safety** (NFR-M1)
   - TypeScript throughout with strict mode
   - Supports parameterized queries (NFR-S5, FR78)
   - Better AI agent implementation consistency

**Architectural Constraints:**
- Must work on Cloudflare free tier (100K req/day)
- Database migrations must be backward-compatible for rollback
- All deployments must be zero-downtime
- Global CDN distribution via Cloudflare edge network

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Project Structure** | TypeScript configuration, build tools, linting | Developer code | Type-checked bundles | Story 1.1 |
| **Infrastructure** | Cloudflare resources provisioning | Wrangler config | Live Workers + D1 binding | Story 1.2 |
| **CI/CD Pipeline** | Automated testing and deployment | Git commits | Deployed application | Story 1.3 |
| **Database Transactions** | Atomic operations with error handling | Query functions | Success/error responses | Story 1.4 |
| **Rollback System** | Deployment version management | Deployment IDs | Previous version restored | Story 1.5 |
| **Performance Monitoring** | Metrics collection and dashboards | User requests | Analytics data | Story 1.6 |

### Data Models and Contracts

**Database Schema** (Story 1.2):

```sql
-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  predicted_date DATE NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL,
  cookie_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  weight REAL DEFAULT 1.0,
  UNIQUE(ip_hash) ON CONFLICT FAIL
) STRICT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date);
CREATE INDEX IF NOT EXISTS idx_predictions_cookie ON predictions(cookie_id);
CREATE INDEX IF NOT EXISTS idx_predictions_submitted ON predictions(submitted_at);
```

**Field Definitions:**
- `id`: Auto-incrementing primary key
- `predicted_date`: User's prediction (ISO 8601 format, supports FR73 UTC storage)
- `submitted_at`: Creation timestamp (automatic)
- `updated_at`: Last modification timestamp (for FR4 updates)
- `ip_hash`: SHA-256 hashed IP (enforces FR5 one submission per IP)
- `cookie_id`: UUID for user tracking (supports FR3-4)
- `user_agent`: Browser identification (optional analytics)
- `weight`: Pre-calculated weight for weighted median (FR8 algorithm)

**STRICT Mode:** Prevents SQLite type coercion bugs, ensures data integrity

**Transaction Wrapper Type** (Story 1.4):

```typescript
interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function executeTransaction<T>(
  db: D1Database,
  operations: (tx: D1Database) => Promise<T>
): Promise<TransactionResult<T>>
```

### APIs and Interfaces

**No public APIs in Epic 1** - This epic provides infrastructure only.

**Internal Interfaces:**

1. **D1 Database Connection** (Story 1.2):
```typescript
// Access via Hono context
interface Env {
  DB: D1Database;
  IP_HASH_SALT: string;
}

// Usage in Workers
const result = await c.env.DB.prepare(
  'SELECT * FROM predictions WHERE cookie_id = ?'
).bind(cookieId).first();
```

2. **Transaction Helper** (Story 1.4):
```typescript
// Atomic database operations
const result = await executeTransaction(c.env.DB, async (tx) => {
  await tx.prepare('INSERT INTO predictions ...').bind(...).run();
  await tx.prepare('UPDATE predictions ...').bind(...).run();
  return { success: true };
});
```

3. **Wrangler CLI Commands** (Story 1.2, 1.5):
```bash
# Deploy
wrangler deploy

# Rollback
wrangler rollback --deployment-id=<previous-id>

# Database migration
wrangler d1 execute gta6-predictions --file=./src/db/schema.sql
```

### Workflows and Sequencing

**Development Workflow:**

1. **Developer writes code** → Commits to Git
2. **GitHub Actions triggered** → Lint, test, build
3. **Build succeeds** → Deploy to Cloudflare via Wrangler
4. **Deployment completes** → Global edge network updated (~2 min)
5. **Monitoring active** → Cloudflare Analytics tracking

**Database Operation Sequence** (Story 1.4):

```
1. Client requests database operation
2. executeTransaction() called
3. BEGIN IMMEDIATE transaction
4. Execute all operations in sequence
5. If all succeed → COMMIT
6. If any fails → ROLLBACK
7. On deadlock → Retry (max 3 attempts)
8. Return success/error response
```

**Rollback Sequence** (Story 1.5):

```
1. Identify bad deployment (via monitoring or manual)
2. Retrieve previous deployment ID from Cloudflare dashboard
3. Run: wrangler rollback --deployment-id=<id>
4. Cloudflare routes traffic to previous version
5. Verify service health via /health endpoint
6. Monitor for 5 minutes to confirm stability
```

## Non-Functional Requirements

### Performance

**Targets:**
- **Infrastructure Provisioning:** < 5 minutes for complete setup (Stories 1.1-1.2)
- **Deployment Time:** < 5 minutes from commit to live (Story 1.3)
- **Rollback Time:** < 2 minutes for global propagation (Story 1.5)
- **Database Connection:** < 50ms latency from Workers to D1
- **Page Load Baseline:** < 2s desktop, < 3s mobile (FR40, measured by Story 1.6)

**Measurements:**
- Use Cloudflare Analytics for load time tracking (Story 1.6)
- GitHub Actions build time monitoring
- Wrangler deployment logs for timing

**Source:** NFR-P1, NFR-P2 (Page load), NFR-P3 (API response), FR96 (5-min rollback)

### Security

**Requirements:**
- **IP Hashing:** SHA-256 with salt before storage (Story 1.2 schema, implements FR53)
- **Database Access:** Only via Workers environment binding (no public access)
- **Secrets Management:** All secrets in Cloudflare dashboard (IP_HASH_SALT)
- **HTTPS:** Automatic via Cloudflare (NFR-S1 TLS 1.3)
- **Parameterized Queries:** All D1 queries use prepared statements (NFR-S5, FR78)

**Validation:**
- Test IP hashing with known inputs
- Verify secrets not committed to Git
- Confirm HTTPS-only access via Cloudflare dashboard

**Source:** NFR-S1 (HTTPS), NFR-S2 (IP hashing), NFR-S5 (SQL injection prevention)

### Reliability/Availability

**Targets:**
- **Uptime:** > 99.5% (Cloudflare SLA, NFR-R1)
- **Database Backups:** Daily automatic via D1 (NFR-R2)
- **Zero Data Loss:** Transaction support prevents partial writes (Story 1.4, NFR-R3)
- **Error Handling:** User-friendly messages for all failure modes (Story 1.4, NFR-R4)

**Mechanisms:**
- Cloudflare automatic failover and load balancing
- D1 Time Travel for point-in-time recovery
- Transaction deadlock detection with retry logic
- Deployment rollback capability (Story 1.5)

**Source:** NFR-R1 (uptime), NFR-R2 (backups), NFR-R3 (zero data loss), NFR-R4 (graceful errors)

### Observability

**Logging:**
- **Structure:** JSON format with timestamp, level, message, context (Architecture: Logging Strategy)
- **Levels:** INFO (deployments), WARN (rollbacks), ERROR (failures)
- **Storage:** Cloudflare Workers logs (dashboard access)

**Metrics** (Story 1.6):
- Page load times (p50, p95, p99)
- Request count per endpoint
- Error rate (4xx, 5xx)
- Geographic distribution
- Bandwidth usage

**Monitoring Dashboard:**
- Cloudflare Analytics → Performance tab
- Workers logs → Real-time tail
- GitHub Actions → Build status

**Source:** NFR-R5 (monitoring), Architecture Section: Logging Strategy

## Dependencies and Integrations

**Core Dependencies:**

```json
{
  "dependencies": {
    "hono": "^4.10.0"
  },
  "devDependencies": {
    "wrangler": "latest",
    "@cloudflare/workers-types": "latest",
    "typescript": "latest",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vitest": "^4.0.0"
  }
}
```

**Infrastructure Dependencies:**
- **Cloudflare Account:** Free tier required
- **GitHub Repository:** For version control and CI/CD
- **Node.js:** >= 18 for local development
- **Git:** For version control

**External Services:**
- **Cloudflare Pages:** Static asset hosting
- **Cloudflare Workers:** Edge compute runtime
- **Cloudflare D1:** Serverless database
- **GitHub Actions:** CI/CD pipeline

**Version Constraints:**
- TypeScript: Latest (strict mode required)
- Wrangler: Latest (for D1 support)
- Node.js: >= 18 (for native fetch, crypto)

**Integration Points:**
- Wrangler ↔ Cloudflare API (deployment)
- GitHub Actions ↔ Wrangler (CI/CD)
- Workers ↔ D1 Database (environment binding)

## Acceptance Criteria (Authoritative)

**AC1: Project Initialization** (Story 1.1)
- Git repository initialized with proper .gitignore
- TypeScript configured with strict mode enabled
- Package.json with dev, build, test, deploy scripts
- Directory structure: /src, /workers, /db
- ESLint + Prettier configured
- README.md with setup instructions exists

**AC2: Cloudflare Infrastructure** (Story 1.2)
- Cloudflare Pages project "gta6-predictions" exists
- Cloudflare Workers service configured
- D1 database "gta6_predictions_db" created and accessible
- Database schema deployed with all tables and indexes
- Database connection test from Workers succeeds

**AC3: CI/CD Pipeline** (Story 1.3)
- GitHub Actions workflow executes on every commit
- Pipeline runs: install → lint → typecheck → test → build → deploy
- Deployment only on main branch
- Failed builds prevent deployment
- Deployment status reported to GitHub commit

**AC4: Database Transactions** (Story 1.4)
- Transaction helper function exists with type safety
- Atomic operations: all succeed or all fail
- Deadlock detection with retry (max 3 attempts)
- Timeout after 5 seconds
- User-friendly error messages for all failure modes

**AC5: Rollback Capability** (Story 1.5)
- Rollback command documented in README
- Rollback completes in < 2 minutes
- Deployment history retained for 30 days
- No data loss during rollback
- Rollback procedure tested successfully

**AC6: Performance Monitoring** (Story 1.6)
- Cloudflare Analytics tracking page loads
- Dashboard shows p50, p95, p99 load times
- Error rate (4xx, 5xx) visible
- Geographic distribution tracked
- Performance baseline documented

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
|----|--------------|---------------|-----------|
| AC1 | Project Structure | TypeScript config, package.json | Verify strict mode enabled, scripts exist |
| AC2 | Infrastructure | Wrangler.toml, D1 schema | Test DB connection, query sample data |
| AC3 | CI/CD | GitHub Actions workflow | Trigger build, verify deployment |
| AC4 | Transactions | executeTransaction() | Test rollback on error, retry logic |
| AC5 | Rollback | Wrangler CLI | Deploy v1, deploy v2, rollback to v1 |
| AC6 | Monitoring | Cloudflare Analytics | Check dashboard after sample requests |

**Requirements Mapping:**
- FR78 (Parameterized queries) → AC2 (D1 prepared statements)
- FR83 (Database transactions) → AC4 (Transaction helper)
- FR95 (Zero-downtime) → AC3 (CI/CD deployment)
- FR96 (5-min rollback) → AC5 (Rollback capability)
- NFR-P1/P2 (Load time) → AC6 (Performance monitoring)
- NFR-S5 (SQL injection) → AC2 (D1 schema, prepared statements)

## Risks, Assumptions, Open Questions

**Risk: Cloudflare Free Tier Limits**
- Description: 100K requests/day may be exceeded during viral spike
- Probability: Medium (depends on launch success)
- Impact: High (service degradation)
- Mitigation: Monitor usage via Analytics, document upgrade path to paid tier
- Owner: Story 1.6 (monitoring establishes baseline)

**Risk: Database Migration Complexity**
- Description: Schema changes may require backward-incompatible migrations
- Probability: Medium (as features evolve)
- Impact: Medium (complicates rollback)
- Mitigation: Test migrations in staging, use forward-compatible schema design
- Owner: Story 1.2 (schema design), Story 1.5 (rollback testing)

**Assumption: GitHub Actions Free Tier Sufficient**
- Description: Assuming 2,000 minutes/month covers CI/CD needs
- Validation: Monitor build minutes via GitHub billing dashboard
- Fallback: Self-hosted runner or alternative CI/CD (GitLab CI)

**Assumption: D1 Performance Adequate for Weighted Median**
- Description: Assuming D1 can handle median calculation queries efficiently
- Validation: Load test with 10K predictions (Epic 2)
- Fallback: Pre-calculate median via cron job if real-time too slow

**Open Question: How to handle D1 database during local development?**
- Options: (1) Wrangler local mode with Miniflare, (2) Separate dev D1 instance
- Decision: Use wrangler dev with local D1 (Story 1.2)
- Rationale: Closer to production environment, easier debugging

**Open Question: Should we implement blue/green deployment?**
- Options: (1) Cloudflare automatic, (2) Manual blue/green via Wrangler
- Decision: Defer to post-MVP, rely on Cloudflare automatic for now
- Rationale: Cloudflare Workers already handle gradual rollout automatically

## Test Strategy Summary

**Unit Tests:**
- Transaction helper error handling (Story 1.4)
- Deadlock retry logic (Story 1.4)
- User-friendly error message generation (Story 1.4)

**Integration Tests:**
- Database connection from Workers (Story 1.2)
- End-to-end CI/CD pipeline (Story 1.3)
- Rollback procedure (Story 1.5)

**Manual Tests:**
- Project setup from scratch (Story 1.1) - verify < 30 min setup time
- Cloudflare dashboard verification (Story 1.2)
- Performance baseline collection (Story 1.6) - verify < 2s load

**Acceptance Tests:**
- All 6 ACs validated before epic marked "contexted"
- Each story's ACs verified before story marked "done"

**Test Tools:**
- Vitest for unit tests (per Architecture ADR-009)
- Wrangler local dev for integration tests
- Cloudflare Analytics for performance validation
- GitHub Actions for CI validation

**Coverage Target:**
- 90%+ for transaction helper (Story 1.4)
- 100% for critical paths (database connection, rollback)

**Edge Cases:**
- Database deadlock under high concurrency (Story 1.4)
- Network failure during deployment (Story 1.3)
- Rollback with in-flight database migrations (Story 1.5)
- Cloudflare free tier limit reached (Story 1.6)
