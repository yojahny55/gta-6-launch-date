# Story 1.1: Project Initialization and Repository Setup

Status: ready-for-dev

## Story

As a developer,
I want a properly configured project structure with TypeScript, build tools, and version control,
so that I can develop efficiently with type safety and maintain clean code.

## Acceptance Criteria

**Given** a new project needs to be created
**When** I initialize the project
**Then** the following structure exists:

1. **Git repository initialized** with .gitignore (node_modules, .env, dist)
2. **TypeScript configured** (tsconfig.json with strict mode, ES2022 target)
3. **Package.json with scripts**: dev, build, test, deploy
4. **Directory structure** created: /src (frontend), /workers (backend), /db (schema)
5. **ESLint + Prettier configured** for code quality
6. **README.md** with setup instructions

**And** environment variables template exists (.env.example):
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN
- DATABASE_NAME
- RECAPTCHA_SITE_KEY
- RECAPTCHA_SECRET_KEY
- ADSENSE_CLIENT_ID

**And** first commit is made with message: "feat: initial project setup"

## Tasks / Subtasks

- [ ] **Task 1:** Initialize Hono + Cloudflare Workers project (AC: 1, 2, 3, 4)
  - [ ] Run `npm create hono@latest gta6-tracker -- --template cloudflare-workers`
  - [ ] Navigate to project directory: `cd gta6-tracker`
  - [ ] Verify TypeScript configuration includes strict mode
  - [ ] Verify package.json has dev, build, test, deploy scripts

- [ ] **Task 2:** Set up additional dependencies (AC: 2, 5)
  - [ ] Install production dependencies: `npm install js-cookie dayjs tailwindcss`
  - [ ] Install dev dependencies: `npm install -D vitest @cloudflare/workers-types eslint prettier`
  - [ ] Initialize Tailwind CSS: `npx tailwindcss init`
  - [ ] Configure ESLint rules: no-any, no-explicit-any, strict-null-checks
  - [ ] Configure Prettier for consistent formatting

- [ ] **Task 3:** Create directory structure (AC: 4)
  - [ ] Verify /src directory exists (Hono default)
  - [ ] Create /workers directory for backend API routes
  - [ ] Create /db directory for database schema files
  - [ ] Create /public directory for static HTML/CSS/JS

- [ ] **Task 4:** Configure Git repository (AC: 1, 7)
  - [ ] Initialize Git: `git init`
  - [ ] Create .gitignore with entries: node_modules, .env, dist, .dev.vars, wrangler.toml (local overrides)
  - [ ] Create first commit: `git commit -m "feat: initial project setup"`
  - [ ] Verify clean working tree: `git status`

- [ ] **Task 5:** Create environment template (AC: 6)
  - [ ] Create .env.example file with required variables
  - [ ] Add comments explaining each variable's purpose
  - [ ] Document where to obtain API keys (Cloudflare dashboard, reCAPTCHA console, AdSense)

- [ ] **Task 6:** Write comprehensive README.md (AC: 6)
  - [ ] Add project title and description
  - [ ] Document prerequisites: Node.js >= 18, npm >= 9
  - [ ] Document setup instructions (clone, install, configure .env)
  - [ ] Document development commands (npm run dev)
  - [ ] Document deployment commands (npx wrangler deploy)
  - [ ] Link to Cloudflare Workers documentation

- [ ] **Task 7:** Verify project setup (Testing)
  - [ ] Run `npm install` succeeds without errors
  - [ ] Run `npm run dev` starts local server
  - [ ] Verify TypeScript compilation: `npx tsc --noEmit` passes
  - [ ] Verify linting: `npm run lint` passes (or configure script)
  - [ ] Verify project structure matches expected layout

## Dev Notes

### Architecture Alignment

**From Architecture Document (architecture.md):**

- **Runtime:** Cloudflare Workers (latest) [Source: architecture.md#Decision-Summary]
- **Framework:** Hono v4.10.0 - Lightweight (14KB), TypeScript-first [Source: architecture.md#ADR-001]
- **Language:** TypeScript latest with strict mode [Source: architecture.md#Decision-Summary]
- **Testing:** Vitest v4.0 for unit tests [Source: architecture.md#ADR-009]
- **CSS:** Tailwind CSS v4.0 with tree-shaking [Source: architecture.md#ADR-003]
- **Dependencies:** js-cookie v3.0.5, day.js v1.11.19 [Source: architecture.md#Dependencies]

**Key Architectural Decisions:**
- ADR-001: Use Hono for routing (not vanilla Workers)
- ADR-003: Use Tailwind CSS for rapid styling
- ADR-009: Use Vitest over Jest for testing

### Project Structure (Expected)

```
gta6-tracker/
├── src/
│   ├── index.ts                    # Hono app entry, routes, middleware
│   ├── routes/                     # API endpoints (created in Epic 2)
│   ├── middleware/                 # Meta injection, caching
│   ├── services/                   # Business logic
│   ├── utils/                      # Weighted median, IP hash, etc.
│   ├── db/
│   │   ├── schema.sql              # D1 database schema
│   │   └── queries.ts              # Typed D1 query functions
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── public/                         # Static assets (Cloudflare Pages)
│   ├── index.html
│   ├── privacy.html
│   ├── terms.html
│   ├── styles.css                  # Tailwind output
│   └── app.js                      # Frontend vanilla JavaScript
├── wrangler.toml                   # Cloudflare Workers configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts                  # For Tailwind build + Vitest
├── .dev.vars                       # Local environment variables
├── .env.example                    # Environment template
├── .gitignore
└── README.md
```

[Source: architecture.md#Project-Structure]

### TypeScript Configuration Requirements

**tsconfig.json must include:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  }
}
```

**Rationale:**
- Strict mode enforces type safety (NFR-M1)
- ES2022 target for modern JS features
- Cloudflare Workers types for D1 bindings

[Source: architecture.md#Technology-Stack-Details, tech-spec-epic-1.md#System-Architecture-Alignment]

### ESLint Rules (Code Quality)

**Required rules from Architecture:**
- `no-any`: Prevent use of `any` type
- `no-explicit-any`: Enforce strict typing
- `strict-null-checks`: Null safety

[Source: epics.md#Story-1.1, architecture.md#Maintainability]

### Package.json Scripts

**Minimum required scripts:**
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "build": "vite build && tsc",
    "test": "vitest",
    "deploy": "wrangler deploy",
    "lint": "eslint src/**/*.ts"
  }
}
```

[Source: tech-spec-epic-1.md#Services-and-Modules]

### Testing Strategy

**From Tech Spec:**
- Vitest for unit tests (per Architecture ADR-009)
- Manual verification for project setup (< 30 min setup time)
- TypeScript compilation check (`tsc --noEmit`)
- Linter verification

[Source: tech-spec-epic-1.md#Test-Strategy-Summary]

### Environment Variables

**Required for .env.example:**

| Variable | Purpose | Where to Obtain |
|----------|---------|-----------------|
| CLOUDFLARE_ACCOUNT_ID | Account identifier | Cloudflare Dashboard → Workers |
| CLOUDFLARE_API_TOKEN | API authentication | Cloudflare Dashboard → API Tokens |
| DATABASE_NAME | D1 database name | Created in Story 1.2 |
| RECAPTCHA_SITE_KEY | reCAPTCHA v3 client key | Google reCAPTCHA Console |
| RECAPTCHA_SECRET_KEY | reCAPTCHA v3 server key | Google reCAPTCHA Console |
| ADSENSE_CLIENT_ID | Google AdSense publisher ID | Google AdSense Dashboard |

**Note:** DATABASE_NAME will be created in Story 1.2 (Cloudflare Infrastructure Configuration)

[Source: epics.md#Story-1.1, architecture.md#Environment-Variables]

### Security Considerations

**From NFRs:**
- `.gitignore` MUST exclude `.env` and `.dev.vars` (prevent secret leaks)
- `.env.example` contains NO real values (only placeholders)
- Secrets stored in Cloudflare dashboard (production)
- Local development uses `.dev.vars` (gitignored)

[Source: architecture.md#Configuration, NFR-S7]

### Performance Baseline

**From Tech Spec:**
- This story establishes foundation for < 2s page load target (NFR-P1)
- Minimal dependencies: Hono (14KB), Tailwind (5-10KB after tree-shaking)
- Vite build tool for fast bundling

[Source: tech-spec-epic-1.md#Non-Functional-Requirements]

### Prerequisites

**Before Starting:**
- Node.js >= 18 installed
- npm >= 9 installed
- Cloudflare account created (free tier)
- Git installed

**After Completion:**
- Story 1.2 can proceed (Cloudflare Infrastructure Configuration)

[Source: architecture.md#Prerequisites, epics.md#Story-1.1]

### Learnings from Previous Story

This is the **first story in Epic 1** - no predecessor context.

### References

- [Architecture Document](../architecture.md)
- [Epic 1 Tech Spec](tech-spec-epic-1.md)
- [Epics Document - Story 1.1](../epics.md#Story-1.1)
- [PRD - Technical Stack](../PRD.md#Technical-Stack)
- [Architecture - Project Initialization](../architecture.md#Project-Initialization)
- [Architecture - ADR-001 (Hono)](../architecture.md#ADR-001)
- [Architecture - Dependencies](../architecture.md#Dependencies)

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-1-project-initialization-and-repository-setup.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Dev agent will add debug log paths here -->

### Completion Notes List

<!-- Dev agent will document:
- New patterns/services created
- Architectural decisions made
- Technical debt deferred
- Warnings for next story
- Interfaces/methods created
-->

### File List

<!-- Dev agent will list:
- NEW: Files created
- MODIFIED: Files changed
- DELETED: Files removed
-->

---

**Story Change Log:**

- 2025-11-13: Story drafted by SM workflow (status: backlog → drafted)
