# GTA 6 Launch Date Prediction Tracker

A community-driven platform for predicting the GTA 6 launch date, built with Cloudflare Workers, Hono, and D1.

## Overview

This project allows users to anonymously submit their predictions for when GTA 6 will launch. The platform calculates a weighted median from all submissions, giving more weight to reasonable predictions and less to outliers. Built for speed (<2s load time) and zero-cost infrastructure using Cloudflare's edge network.

**Key Features:**
- Anonymous predictions with cookie-based tracking
- Weighted median algorithm for intelligent consensus
- Real-time statistics and social comparison
- Privacy-first (IP hashing, GDPR compliant)
- Global edge deployment via Cloudflare Workers
- Zero-cost infrastructure (100K requests/day free tier)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** (for version control)
- **Cloudflare Account** (free tier) - Sign up at [cloudflare.com](https://cloudflare.com)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gta-6-launch-date
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Hono (API framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- Vitest (testing)
- Wrangler (Cloudflare CLI)

### 3. Configure Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .dev.vars
```

Edit `.dev.vars` with your actual credentials:
- **CLOUDFLARE_ACCOUNT_ID**: Get from Cloudflare Dashboard → Workers
- **CLOUDFLARE_API_TOKEN**: Create at Cloudflare Dashboard → My Profile → API Tokens
- **RECAPTCHA_SITE_KEY/SECRET_KEY**: Register at [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
- **ADSENSE_CLIENT_ID**: Get from [Google AdSense Dashboard](https://www.google.com/adsense)
- **IP_HASH_SALT**: Generate with `openssl rand -hex 32`

**Note:** DATABASE_NAME will be configured in Story 1.2 when you create the D1 database.

### 4. Run Development Server

```bash
npm run dev
```

The application will start at **http://localhost:8787**

Available endpoints:
- `GET /` - API welcome message
- `GET /health` - Health check endpoint

### 5. Run Tests

The project includes comprehensive test coverage using Vitest and Cloudflare Workers testing pool:

```bash
npm test
```

**Test Coverage:**
- ✅ API Endpoints (`src/index.test.ts`) - 9 tests
  - Health check and root endpoints
  - Database connection testing
  - Error handling validation
  - Response header verification
- ✅ Database Schema (`src/db/schema.test.ts`) - 21 tests
  - UNIQUE constraints (ip_hash, cookie_id, email)
  - STRICT mode type enforcement
  - Indexes verification
  - Default values testing
  - Auto-increment validation

**Watch Mode:** For continuous testing during development:
```bash
npm test -- --watch
```

**Test Infrastructure:**
- Framework: Vitest v3.2
- Workers Testing: @cloudflare/vitest-pool-workers
- Database: Local D1 with schema auto-applied
- Setup File: `src/test-setup.ts`

### 6. Lint and Format Code

```bash
# Run linter
npm run lint

# Format code with Prettier
npx prettier --write .
```

## Project Structure

```
gta6-tracker/
├── src/
│   ├── index.ts                    # Hono app entry point
│   ├── routes/                     # API endpoints (Epic 2)
│   ├── middleware/                 # Meta injection, caching
│   ├── services/                   # Business logic
│   ├── utils/                      # Utilities (weighted median, IP hash)
│   ├── db/
│   │   ├── schema.sql              # D1 database schema
│   │   └── queries.ts              # Typed D1 query functions
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── public/                         # Static assets
│   ├── index.html                  # Main page
│   ├── styles.css                  # Tailwind output
│   └── app.js                      # Frontend JavaScript
├── wrangler.toml                   # Cloudflare Workers config
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS config
├── vite.config.ts                  # Vite + Vitest config
├── .dev.vars                       # Local environment variables (gitignored)
├── .env.example                    # Environment template
└── README.md                       # This file
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server with hot reload |
| `npm run build` | Build for production (Vite + TypeScript compilation) |
| `npm test` | Run test suite with Vitest |
| `npm run lint` | Check code quality with ESLint |
| `npm run deploy` | Deploy to Cloudflare Workers (production) |

## Multi-Environment Deployment Strategy

This project uses a three-tier deployment strategy to ensure safe, iterative development:

### Environments

| Environment | Branch | Worker URL | Purpose |
|-------------|--------|------------|---------|
| **Local** | N/A | `http://localhost:8787` | Local development with `wrangler dev` |
| **Dev** | `dev` | `https://gta6-tracker-dev.yojahnychavez.workers.dev` | Testing changes in a live environment before production |
| **Production** | `main` | `https://gta6-tracker.yojahnychavez.workers.dev` | Live production deployment |
| **Preview** | Pull Requests | `https://gta6-tracker-preview.yojahnychavez.workers.dev` | Preview deployments for PRs (optional) |

### Development Workflow

**Standard Feature Development:**

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Develop locally
npm run dev  # Runs on localhost:8787

# 3. Test and commit changes
git add .
git commit -m "feat: implement feature"

# 4. Push to dev branch for live testing
git checkout dev
git merge feature/my-feature
git push origin dev  # Auto-deploys to dev environment

# 5. Test on dev environment
# Visit https://gta6-tracker-dev.yojahnychavez.workers.dev
# Verify feature works correctly in live environment

# 6. Merge to main for production deployment
git checkout main
git merge dev
git push origin main  # Auto-deploys to production
```

**Why this workflow?**
- **Safety:** Test changes in dev environment before production
- **Risk Reduction:** Catch environment-specific issues early
- **Iteration:** Experiment freely in dev without impacting production users

### Local Development Setup

Create a `.env.development` file for frontend environment variables (local development only):

```env
# Local development environment variables
VITE_API_URL=http://localhost:8787
VITE_ENVIRONMENT=local
```

**Note:** This file is already in `.gitignore` and should never be committed to git.

### Frontend-to-Backend Configuration

The frontend automatically uses the correct backend URL based on the environment:

- **Local development:** Calls `localhost:8787` (via `.env.development`)
- **Dev Pages preview:** Calls `gta6-tracker-dev` Worker (Cloudflare Pages env vars)
- **Production Pages:** Calls `gta6-tracker` Worker (Cloudflare Pages env vars)

**Cloudflare Pages Environment Variables:**

Configure these in **Cloudflare Dashboard → Pages → gta6-tracker → Settings → Environment variables**:

**Production:**
- `VITE_API_URL` = `https://gta6-tracker.yojahnychavez.workers.dev`
- `VITE_ENVIRONMENT` = `production`

**Preview (for dev and PRs):**
- `VITE_API_URL` = `https://gta6-tracker-dev.yojahnychavez.workers.dev`
- `VITE_ENVIRONMENT` = `dev`

### Using the API Helper

All frontend API calls should use the environment-aware API utility:

```typescript
import { callAPI, submitPrediction, getStats } from './utils/api';

// Make a prediction
const result = await submitPrediction('2025-12-31');

// Get current stats
const stats = await getStats();

// Check environment info
import { getEnvironmentInfo } from './utils/api';
console.log(getEnvironmentInfo());
// { apiUrl: 'http://localhost:8787', environment: 'local' }
```

**Benefits:**
- Automatic environment detection
- Centralized error handling
- Debugging logs with environment context
- Type-safe API calls

## CI/CD Pipeline

This project uses GitHub Actions for automated testing and deployment. Deployments are triggered based on the branch:

### GitHub Actions Workflow

The workflow executes the following steps in order:

1. **Install dependencies** (`npm ci`)
2. **Run linter** (`npm run lint`)
3. **Check code formatting** (`npm run format:check`)
4. **Run TypeScript type check** (`npx tsc --noEmit`)
5. **Run unit tests** (`npm run test:unit`)
6. **Build project** (`npm run build`)
7. **Deploy to Cloudflare Workers:**
   - **Dev branch** → Deploy to `gta6-tracker-dev` (dev environment)
   - **Main branch** → Deploy to `gta6-tracker` (production environment)
   - **Pull Requests** → Deploy to `gta6-tracker-preview` (preview environment)

### Required GitHub Secrets

To enable automated deployment, configure the following secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers edit permission | Cloudflare Dashboard → My Profile → API Tokens → Create Token → Use "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Workers & Pages → Overview → Account ID (right sidebar) |

**Generating Cloudflare API Token:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on your profile icon → My Profile → API Tokens
3. Click "Create Token"
4. Use the "Edit Cloudflare Workers" template
5. Customize the token:
   - **Permissions:** Account / Workers Scripts / Edit
   - **Account Resources:** Include your account
   - **Zone Resources:** All zones (or specific zones if preferred)
6. Click "Continue to summary" → "Create Token"
7. Copy the token immediately (it won't be shown again)
8. Add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

**Finding Cloudflare Account ID:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Your Account ID is displayed in the right sidebar
4. Copy and add it to GitHub Secrets as `CLOUDFLARE_ACCOUNT_ID`

### Workflow Behavior

- **Dev branch:** Run quality checks + deploy to dev environment (`gta6-tracker-dev`)
- **Main branch:** Run quality checks + deploy to production environment (`gta6-tracker`)
- **Pull Requests:** Run quality checks + deploy to preview environment (`gta6-tracker-preview`)
- **Other branches:** Run quality checks only (no deployment)

**Failed builds prevent deployment** - the workflow uses fail-fast strategy, halting immediately if any step fails.

### Local Testing Before Push

Recommended pre-commit checks to avoid CI failures:

```bash
# Run all quality checks locally
npm run lint
npm run format:check
npx tsc --noEmit
npm run test:unit -- --run
npm run test:workers -- --run  # Important: Workers tests only run locally
npm run build
```

Or run them all at once:

```bash
npm ci && npm run lint && npm run format:check && npx tsc --noEmit && npm test -- --run && npm run build
```

**Important:** Workers tests currently only run locally due to a [known issue](https://github.com/cloudflare/workers-sdk/issues/10600) with `vitest-pool-workers` in CI environments. Always run `npm run test:workers -- --run` locally before pushing to ensure your changes don't break the Workers runtime tests.

## Deployment

### Infrastructure Resources

**Cloudflare D1 Database:**
- Database Name: `gta6-predictions`
- Database ID: `150217ee-5408-406e-98be-37b15a8e5990`
- Created: 2025-11-14
- Status: Active with schema deployed

**Cloudflare Workers:**

Three separate Workers for different environments:

- **Production Worker:**
  - Name: `gta6-tracker`
  - URL: `https://gta6-tracker.yojahnychavez.workers.dev`
  - Deployed from: `main` branch

- **Dev Worker:**
  - Name: `gta6-tracker-dev`
  - URL: `https://gta6-tracker-dev.yojahnychavez.workers.dev`
  - Deployed from: `dev` branch

- **Preview Worker:**
  - Name: `gta6-tracker-preview`
  - URL: `https://gta6-tracker-preview.yojahnychavez.workers.dev`
  - Deployed from: Pull requests

**Endpoints (all environments):**
- `GET /` - API welcome
- `GET /health` - Health check
- `GET /api/db-test` - Database connection test

**Cloudflare Pages:**
- Project Name: `gta6-predictions` (to be configured when frontend is ready)

### Prerequisites for Deployment

1. **Cloudflare Account** with Workers enabled
2. **Wrangler CLI** authenticated: `npx wrangler login`
3. **D1 Database** created (Story 1.2 - ✅ Complete)

### Manual Deployment Commands

**Deploy to specific environment:**

```bash
# Deploy to dev environment
npx wrangler deploy --env dev

# Deploy to production environment
npx wrangler deploy --env production

# Deploy to preview environment
npx wrangler deploy --env preview
```

**Legacy command (deploys to production):**
```bash
npm run deploy  # Same as: wrangler deploy --env production
```

**Test environment locally:**
```bash
# Test dev environment configuration locally
npx wrangler dev --env dev

# Test production environment configuration locally
npx wrangler dev --env production
```

Each deployment:
1. Builds the application
2. Uploads to Cloudflare Workers
3. Deploys globally to edge network (~2 minutes)

### Rollback (if needed)

```bash
npx wrangler rollback --deployment-id=<previous-id>
```

Find deployment IDs in Cloudflare Dashboard → Workers → Deployments

## Technology Stack

**Runtime & Framework:**
- Cloudflare Workers (edge compute)
- Hono v4.10.0 (lightweight API framework, 14KB)
- TypeScript (strict mode for type safety)

**Database:**
- Cloudflare D1 (serverless SQLite)
- Free tier: 5GB storage, 5M reads/day, 100K writes/day

**Frontend:**
- Vanilla JavaScript (zero framework overhead)
- Tailwind CSS v4.0 (utility-first, tree-shaken to ~5-10KB)

**Testing & Quality:**
- Vitest v4.0 (fast testing framework)
- ESLint + Prettier (code quality and formatting)

**Dependencies:**
- `js-cookie` v3.0.5 (cookie management, 2KB)
- `dayjs` v1.11.19 (date utilities, 2KB)

## Architecture Decisions

Key architectural decisions are documented in `/docs/architecture.md`:

- **ADR-001:** Use Hono instead of vanilla Workers for better DX
- **ADR-002:** Vanilla JS frontend for fastest load times
- **ADR-003:** Tailwind CSS for rapid development with minimal bundle size
- **ADR-009:** Vitest over Jest for modern testing experience

## Performance

**Target Metrics:**
- Desktop load time: < 2 seconds (3G)
- Mobile load time: < 3 seconds (3G)
- API response time: < 200ms (cached), < 500ms (database writes)
- Global latency: < 50ms via Cloudflare edge network

## Security

- **HTTPS Only:** Automatic TLS 1.3 via Cloudflare
- **IP Address Privacy:** SHA-256 hashing with salt before storage
- **SQL Injection Prevention:** Parameterized queries only
- **GDPR Compliance:** Cookie consent, privacy policy, data deletion support
- **Rate Limiting:** One prediction per IP address (cookie-based updates allowed)

## Contributing

This project follows the BMad Method for structured development. For development workflow and coding standards, see `/docs/architecture.md`.

## Documentation

- **Product Requirements:** `/docs/PRD.md`
- **Architecture:** `/docs/architecture.md`
- **Epic Breakdown:** `/docs/epics.md`
- **Story Files:** `/docs/sprint-artifacts/`

## License

[Your License Here]

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with:**
- ⚡ Cloudflare Workers
- 🔥 Hono
- 🎯 TypeScript
- 🎨 Tailwind CSS

**Setup time:** < 30 minutes | **Deploy time:** < 5 minutes | **Global edge:** < 50ms latency
