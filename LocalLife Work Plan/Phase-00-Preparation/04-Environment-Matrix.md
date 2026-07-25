# Phase 00 / Task 04 — Environment Matrix (filled Phase 06)

**Priority:** P0  
**Aligned with:** Railway staging/prod decision

### Objective
Fill local / Railway staging / Railway production matrix before coding.

### Gives (fill)

| Topic | local | staging (Railway) | production (Railway first) |
| --- | --- | --- | --- |
| API URL | `http://localhost:3000` | `https://<api>.up.railway.app` | `https://<api-prod>.up.railway.app` |
| Admin URL | `http://localhost:5173` | `https://<admin>.up.railway.app` | `https://<admin-prod>.up.railway.app` |
| DB | local Postgres `locallife_dev` | Railway Postgres | Railway Postgres (separate) |
| OpenRouter key | optional/dev | yes | yes |
| Mapbox | empty/dev token | staging token | prod token |
| R2 bucket | empty/dev | staging bucket | prod bucket |
| Sentry | optional | on (DSN set) | on |
| Seed | fake OK (`djerba-fake-v1`) | rich Djerba fake→real | real Djerba |
| Mobile profile | Expo Go / local | EAS `staging` | EAS `production` |
| CORS | localhost origins | Admin + app origins | Admin + app origins |
| Secrets owner | solo | solo Admin | Admin only |

### Notes
- AWS migration is a **future** option, not an env to build now.
- Prod secrets: Admin only.
- Fill exact Railway URLs after first deploy (`deploy/STAGING.md`).

### Done when
- [x] Matrix filled with no contradictions
- [x] Solo agrees staging starts Phase 06, prod Phase 08
