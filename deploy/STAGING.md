# LocalLife — Staging / Production deploy guide (Phase 06)

## Goal
Deploy **API + Admin + Postgres** to Railway staging without depending on your laptop.

## Prerequisites
- Railway account (GitHub login OK)
- Repo pushed to GitHub
- OpenRouter key (optional for mock mode)
- Strong JWT secrets (≥32 chars)

## 1. Create Railway project
1. New Project → **Empty Project** (or Deploy from GitHub).
2. Add **PostgreSQL** plugin/service.
3. Note `DATABASE_URL` from Postgres variables.

## 2. API service
1. New service from repo.
2. Settings:
   - **Root Directory:** `/` (monorepo root)
   - **Dockerfile path:** `apps/api/Dockerfile`
3. Variables (staging) — set on the **API** service (not only Postgres):

```text
DATABASE_URL=<Variable Reference from Postgres → DATABASE_URL>
NODE_ENV=production
JWT_ACCESS_SECRET=<random 32+>
JWT_REFRESH_SECRET=<random 32+>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://<admin-domain>,https://<optional-expo-web>
OPENROUTER_API_KEY=<optional>
SUPPORT_FORM_URL=https://forms.gle/...
THROTTLE_LIMIT=120
PORT=3000
```

> Postgres already has `DATABASE_URL`. The API must **reference** it, or Prisma fails at boot.

4. Generate domain → copy HTTPS API URL (e.g. `https://locallife-api-staging.up.railway.app`).
5. Health: `GET /v1/health` and `GET /v1/health/ready`.

## 3. Migrate + seed
Railway start command already runs `prisma migrate deploy`.

Seed once (Railway shell or one-off):

```bash
cd apps/api
pnpm prisma:seed
```

## 4. Admin / portals service
See full steps: [ADMIN.md](./ADMIN.md)

1. Push repo (needs `apps/admin/railway.toml`).
2. Admin service → Config File: **`/apps/admin/railway.toml`**
3. Variable: `VITE_API_URL=https://locallife-production.up.railway.app`
4. Variable: `VITE_MAPBOX_TOKEN=<Mapbox public token>` (Admin Map page — rebuild needed)
5. Generate domain for Admin.
6. API service → Config File: **`/apps/api/railway.toml`** (after root config removed).
7. Update API `CORS_ORIGINS` → Redeploy API.

## 5. Point mobile to staging
EAS profile `staging` uses `EXPO_PUBLIC_API_URL`.

```bash
cd apps/mobile
eas build --profile staging --platform android
```

## 6. Smoke
From laptop:

```bash
pnpm smoke:staging
# or
API_BASE_URL=https://<api> pnpm smoke:api
```

## Rollback
- Redeploy previous Railway deployment
- Restore Postgres from backup (see BACKUP-RESTORE.md)
