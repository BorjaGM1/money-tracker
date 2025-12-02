# Money Tracker - Implementation Plan

> Created: 2025-12-01

## Overview

Personal finance tracker to replace the Excel spreadsheet. Tracks monthly earnings from multiple sources, bank balances, and calculates net worth over time.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | Existing stack |
| Language | TypeScript (strict) | Existing stack |
| Styling | TailwindCSS + Radix UI | Existing stack |
| Database | SQLite + Drizzle ORM | Self-hosted, zero deps, type-safe |
| Auth | Simple env-based credentials | Single user, cookie session |
| Deployment | Hetzner VPS + Coolify | Persistent storage, full control |
| Charts | Recharts | Familiar, good for financial data |

## Data Model (Normalized)

### Configuration Tables
```sql
-- Income sources (Job, TC, Elevate, YouTube, etc.)
CREATE TABLE earning_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- "Job", "TubeChef", "Elevate"
  slug TEXT NOT NULL UNIQUE,       -- "job", "tc", "elevate"
  color TEXT,                      -- "#10b981" for charts
  icon TEXT,                       -- "briefcase" (lucide icon name)
  is_active INTEGER DEFAULT 1,     -- soft delete
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bank/asset accounts (OpenBank, Cajamar, Mercury, Crypto, etc.)
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- "OpenBank", "Mercury"
  slug TEXT NOT NULL UNIQUE,       -- "openbank", "mercury"
  type TEXT DEFAULT 'bank',        -- "bank", "investment", "crypto", "cash"
  currency TEXT DEFAULT 'EUR',
  color TEXT,
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Monthly Data Tables
```sql
-- One record per month
CREATE TABLE monthly_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,          -- 1-12
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, month)
);

-- Earnings for each month (only sources with income that month)
CREATE TABLE monthly_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES monthly_records(id) ON DELETE CASCADE,
  source_id INTEGER NOT NULL REFERENCES earning_sources(id),
  amount REAL NOT NULL DEFAULT 0,
  UNIQUE(record_id, source_id)
);

-- Account balances at day 1 of each month
CREATE TABLE monthly_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES monthly_records(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  amount REAL NOT NULL DEFAULT 0,
  UNIQUE(record_id, account_id)
);
```

### Computed fields (in app layer)
- `totalEarnings`: SUM of monthly_earnings for that record
- `netWorth`: SUM of monthly_balances for that record
- `difference`: current netWorth - previous month's netWorth

### Benefits
- Add/remove income sources anytime (e.g., new freelance gig)
- Add/remove accounts anytime (open new bank, close old one)
- Track different asset types (bank, investment, crypto)
- Each month only stores what's relevant
- Easy to query for charts (GROUP BY source, account, etc.)

## File Structure

```
money-tracker/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Login form
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell with nav
│   │   ├── page.tsx                # Main view (records table)
│   │   ├── records/
│   │   │   ├── new/page.tsx        # Add record
│   │   │   └── [id]/edit/page.tsx  # Edit record
│   │   └── settings/
│   │       ├── page.tsx            # Settings overview
│   │       ├── sources/page.tsx    # Manage earning sources
│   │       └── accounts/page.tsx   # Manage bank/asset accounts
│   ├── api/auth/route.ts           # Login/logout endpoints
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx                    # Redirect to dashboard or login
├── components/
│   ├── ui/                         # Radix primitives (Button, Input, Table, etc.)
│   ├── records-table.tsx           # Main data table (dynamic columns)
│   ├── record-form.tsx             # Add/edit form (dynamic fields based on sources/accounts)
│   └── summary-cards.tsx           # Net worth, monthly change stats
├── lib/
│   ├── db/
│   │   ├── index.ts                # Drizzle client
│   │   ├── schema.ts               # Drizzle schema (5 tables)
│   │   └── migrations/             # SQL migrations
│   ├── auth.ts                     # Session helpers
│   ├── validations.ts              # Zod schemas
│   └── utils.ts                    # cn(), formatCurrency(), etc.
├── middleware.ts                   # Auth protection
├── drizzle.config.ts
├── data/                           # SQLite database lives here (gitignored)
│   └── .gitkeep
├── Dockerfile                      # For production deployment
├── docker-compose.yml              # For production deployment
├── .env.example
└── package.json
```

## Authentication

Simple cookie-based auth with credentials from environment variables:

```env
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=<bcrypt hash>
AUTH_SECRET=<random 32+ char string for signing cookies>
```

Flow:
1. Middleware checks for `auth-token` cookie on all routes except `/login`
2. No cookie → redirect to `/login`
3. Login form POSTs to `/api/auth`
4. API verifies password with bcrypt, sets HTTP-only signed cookie
5. Cookie expires in 30 days (configurable)

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18",
    "drizzle-orm": "^0.36",
    "better-sqlite3": "^11",
    "bcryptjs": "^2.4",
    "zod": "^3.23",
    "react-hook-form": "^7.53",
    "@hookform/resolvers": "^3.9",
    "recharts": "^2.13",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-select": "latest",
    "lucide-react": "latest",
    "tailwind-merge": "^2.5",
    "class-variance-authority": "^0.7",
    "sonner": "^1.7"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28",
    "@types/better-sqlite3": "^7",
    "@types/bcryptjs": "^2",
    "typescript": "^5",
    "tailwindcss": "^3.4"
  }
}
```

## Development Setup

**Local development is simple:**
```bash
npm install
npm run db:push      # Create SQLite tables
npm run dev          # Start dev server at localhost:3000
```

SQLite file lives in `./data/money-tracker.db` - same location for dev and Docker.

## Docker Setup (Production Only)

Docker is only needed for deploying to Coolify. Locally, just use `npm run dev`.

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# SQLite needs these for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Data directory for SQLite
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  money-tracker:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # Persistent SQLite storage
    environment:
      - DATABASE_URL=file:/app/data/money-tracker.db
      - AUTH_USERNAME=${AUTH_USERNAME}
      - AUTH_PASSWORD_HASH=${AUTH_PASSWORD_HASH}
      - AUTH_SECRET=${AUTH_SECRET}
    restart: unless-stopped
```

## Implementation Order

### Phase 1: Core Setup
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Drizzle ORM with SQLite schema (5 tables)
3. Create base UI components (Button, Input, Card, Table, Dialog)
4. Implement auth middleware + login page
5. Seed initial earning sources and accounts from Excel data

### Phase 2: Settings (Manage Sources & Accounts)
6. Settings page with list of earning sources (add/edit/delete/reorder)
7. Settings page with list of accounts (add/edit/delete/reorder)
8. These are simple CRUD pages - do them first so record form has data

### Phase 3: Monthly Records CRUD
9. Records table with dynamic columns based on active sources/accounts
10. Record form with dynamic fields (only shows active sources/accounts)
11. Summary cards (current net worth, monthly change, YTD earnings)

### Phase 4: Polish & Deploy
12. Docker configuration + Coolify deployment
13. Basic responsive design

### Phase 5: Charts (Future)
14. Net worth over time line chart
15. Earnings breakdown by source (bar/pie chart)
16. Account balances stacked area chart

## Environment Variables

```env
# Database
DATABASE_URL=file:./data/money-tracker.db

# Auth
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2b$10$... # Generate with: npx bcryptjs hash "your-password"
AUTH_SECRET=your-random-secret-at-least-32-characters

# Optional
NODE_ENV=production
```

## Security Considerations

- Password hashed with bcrypt (cost factor 10)
- HTTP-only, secure, SameSite=Strict cookies
- HTTPS via Coolify/Caddy reverse proxy
- No sensitive data in client-side code
- Input validation with Zod on all forms
