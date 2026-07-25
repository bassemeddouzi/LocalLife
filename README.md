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
pnpm dev:admin    # http://localhost:5173 — Admin / Guide / Business portals
pnpm dev:mobile   # Expo (set EXPO_PUBLIC_API_URL if device ≠ localhost)
```

### Mobile notes (Phase 05)

- Auth + onboarding (persona/budget/consents) + EN/FR/AR
- Tabs: Home, Explore, Chat (citations), Saved, Profile
- Default API: `http://localhost:3000` — on a physical phone use your PC LAN IP, e.g. `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`
- EAS profiles: `apps/mobile/eas.json` (wire Expo project id in `app.json` later)

## Tests

```bash
pnpm test:api
```

## Useful API routes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/countries` | Active countries |
| GET | `/v1/countries/:id/cities` | Active cities |
| GET | `/v1/cities/:id` | City + country |
| GET | `/v1/categories` | Category tree roots |
| GET | `/v1/places?cityId=` | APPROVED places only |
| POST | `/v1/places` | ADMIN/GUIDE |
| POST | `/v1/admin/content/:type/:id/approve` | place \| review \| tip \| guide \| claim |
| POST | `/v1/guides/apply` | Guide application |
| POST | `/v1/business/profile` | Business profile |
| GET | `/v1/local-rules?cityId=` | Includes city + country rules |
| GET | `/v1/arrival-guides?cityId=` | Ordered first-hour steps |
| GET | `/v1/how-to-guides?categoryKey=SURVIVAL_48H` | Survival kit |
| GET | `/v1/transport-systems?cityId=` | Taxi / louage systems |
| POST | `/v1/ai/conversations` | Auth required |
| POST | `/v1/ai/conversations/:id/messages` | Grounded chat (+ citations) |
| GET/PATCH | `/v1/admin/ai-config` | ADMIN model switch (no API key leaked) |
| PATCH | `/v1/auth/me/preferences` | Persona / budget / consents |

Set `OPENROUTER_API_KEY` in `apps/api/.env` to use live OpenRouter; empty key uses grounded mock answers from seed knowledge (tests pass either way).

## Deploy / staging (Phase 06)

- Guide: [deploy/STAGING.md](./deploy/STAGING.md)
- Admin: [deploy/ADMIN.md](./deploy/ADMIN.md)
- Security checklist: [deploy/SECURITY-CHECKLIST.md](./deploy/SECURITY-CHECKLIST.md)
- Smoke: `API_BASE_URL=https://locallife-production.up.railway.app pnpm smoke:api`
- EAS: [deploy/EAS-STAGING.md](./deploy/EAS-STAGING.md)
- Beta ops: [deploy/BETA-OPS.md](./deploy/BETA-OPS.md)
- Photo upgrade: [deploy/PHOTO-UPGRADE-PLAN.md](./deploy/PHOTO-UPGRADE-PLAN.md)

## Default seed users (after seed)

| Email | Password | Role |
| --- | --- | --- |
| admin@locallife.local | Admin123! | ADMIN |
| guide@locallife.local | Guide123! | GUIDE |

Change these in non-local environments.

## Phase 00 accounts (you)

Create/verify in parallel: GitHub, OpenRouter, Mapbox, Railway, Cloudflare R2, Sentry, Expo/EAS, Apple Developer, Google Play Console.
