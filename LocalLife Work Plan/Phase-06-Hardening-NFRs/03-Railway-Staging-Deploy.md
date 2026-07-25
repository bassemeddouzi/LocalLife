# Phase 06 / Task 03 — Railway Staging Deploy

**Priority:** P0  
**Replaces generic hosting wording**

### Objective
Deploy API (+ Admin) and Postgres to **Railway** staging.

### Takes
- Railway project
- Staging secrets (DB, JWT, OpenRouter, R2, Sentry, Mapbox server-side if any)
- Migrations + seed process

### Gives
| Component | Gives |
| --- | --- |
| Railway Postgres | Migrated schema |
| API service | HTTPS staging URL |
| Admin web service | HTTPS staging admin URL |
| Seed | Djerba pack on staging |
| Health | readiness green |

### Order
DB migrate → API deploy → Admin deploy → health → seed → point mobile EAS to API URL

### Done when
- [x] Dockerfiles + `railway.toml` + `deploy/STAGING.md` ready
- [ ] Staging URLs work without local machine (owner: create Railway project + set secrets)
