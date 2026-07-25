# Deploy Admin / portals on Railway (Phase 06)

API already live: `https://locallife-production.up.railway.app`

## Steps (Railway dashboard)

1. Open the **same project** as the API + Postgres.
2. **New** → **GitHub Repo** → select `LocalLife` (same repo).
3. Service settings:
   - **Root Directory:** `/` (repo root)
   - **Builder:** Dockerfile
   - **Dockerfile path:** `apps/admin/Dockerfile`
4. Variables / Build:
   - Build argument (or variable available at build):  
     `VITE_API_URL=https://locallife-production.up.railway.app`  
     (also the Dockerfile default — set explicitly to be safe)
5. **Settings → Networking → Generate Domain**  
   Example: `https://locallife-admin-xxxx.up.railway.app`
6. Open that URL → Login page → `admin@locallife.local` / `Admin123!`

## CORS (API service)

On the **API** service Variables, set:

```text
CORS_ORIGINS=https://YOUR-ADMIN-DOMAIN.up.railway.app,http://localhost:5173
```

Then **Redeploy API** (env change only).

## Quick check
- Admin loads login screen
- Login works
- Moderation / AI config pages load (need seed done)
