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

```bash
npm test
```

For watch mode during development:
```bash
npm test -- --watch
```

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

## Deployment

### Prerequisites for Deployment

1. **Cloudflare Account** with Workers enabled
2. **Wrangler CLI** authenticated: `npx wrangler login`
3. **D1 Database** created (Story 1.2)

### Deploy to Production

```bash
npm run deploy
```

This command:
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
