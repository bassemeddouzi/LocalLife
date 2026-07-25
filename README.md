# LocalLife AI

Monorepo for **LocalLife AI** — grounded local companion (Djerba MVP first).

## Apps

| Path | Stack | Role |
| --- | --- | --- |
| `apps/api` | NestJS + Prisma + PostgreSQL | REST API |
| `apps/mobile` | Expo + TypeScript | Client (iOS + Android) |
| `apps/admin` | Vite + React + TypeScript | Admin dashboard |
| `packages/shared-types` | TypeScript | Shared enums/types |

## Docs

- [LocalLife Documentation](./LocalLife%20Documentation/00-README.md)
- [LocalLife Work Plan](./LocalLife%20Work%20Plan/00-README.md)
- [Decisions Log](./LocalLife%20Work%20Plan/07-Decisions-Log.md)

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+ (local service). Create database `locallife_dev`.

## Setup

```bash
pnpm install
cp .env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL with your Postgres password
```

Create DB (psql):

```bash
# Adjust path if needed on Windows:
# "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost
CREATE DATABASE locallife_dev;
```

```bash
pnpm --filter @locallife/api prisma:migrate
pnpm --filter @locallife/api prisma:seed
```

## Run locally

```bash
pnpm dev:api      # http://localhost:3000
pnpm dev:admin    # http://localhost:5173
pnpm dev:mobile   # Expo
```

## Tests (Foundation Gate)

```bash
pnpm test:api
```

## Default seed users (after seed)

| Email | Password | Role |
| --- | --- | --- |
| admin@locallife.local | Admin123! | ADMIN |
| guide@locallife.local | Guide123! | GUIDE |

Change these in non-local environments.

## Phase 00 accounts (you)

Create/verify in parallel: GitHub, OpenRouter, Mapbox, Railway, Cloudflare R2, Sentry, Expo/EAS, Apple Developer, Google Play Console.
