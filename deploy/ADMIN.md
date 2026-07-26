# Deploy Admin / portals on Railway (Phase 06)

API already live: `https://locallife-production.up.railway.app`

> **Important:** Do **not** point Admin at `/railway.toml` (removed) or `/apps/api/railway.toml`.
> Admin must use **`/apps/admin/railway.toml`** or it will run Prisma/API and fail on `DATABASE_URL`.

## Steps (Railway dashboard)

1. **Push** this repo to GitHub (includes `apps/admin/railway.toml`).
2. Open the **same project** as the API + Postgres.
3. Open the Admin service (e.g. `compassionate-unity`) → **Settings**.
4. **Config-as-code → Railway Config File** — type exactly:
   ```text
   /apps/admin/railway.toml
   ```
5. Root Directory: leave empty / `/` (monorepo root — Dockerfile copies from root).
6. Variables:
   - `VITE_API_URL=https://locallife-production.up.railway.app`
   - `VITE_MAPBOX_TOKEN=<your Mapbox public token>` — **required for Admin Map**
   - **No** `DATABASE_URL` on Admin

> Vite bakes `VITE_*` at **build** time. After adding/changing the token → **Redeploy** Admin (clear build cache if the map still says token missing).

### Mapbox troubleshooting (`Failed to fetch`)
1. Token must start with **`pk.`** (full public token). `sk.` will not work in the browser.
2. Stack mentions `injectScriptAdjust.js` → a **browser extension** is wrapping `fetch` and blocking Mapbox. Test in **Incognito** with extensions disabled, or allow `api.mapbox.com` / `events.mapbox.com`.
3. If the token has URL restrictions, add your Admin Railway domain + `http://localhost:5173`.
4. After fixing env → Redeploy Admin → hard refresh (Ctrl+Shift+R).
7. Start Command: leave **empty** (nginx CMD from Dockerfile).
8. **Redeploy** (Clear build cache if needed).
9. **Networking → Generate Domain** if not done.
10. Open Admin URL → login `admin@locallife.local` / `Admin123!`

### Deploy log check
- Good: nginx / static / `apps/admin` build
- Bad: `@locallife/api` / `prisma migrate` / `DATABASE_URL` → wrong config file

## API service (same time)
Set Config File to:
```text
/apps/api/railway.toml
```
(so API keeps working after root `railway.toml` was removed)

## CORS (API service)

```text
CORS_ORIGINS=https://YOUR-ADMIN-DOMAIN.up.railway.app,http://localhost:5173
```

Then **Redeploy API**.
