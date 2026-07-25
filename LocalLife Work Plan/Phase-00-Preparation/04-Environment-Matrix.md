# Phase 00 / Task 04 — Environment Matrix

**Priority:** P0  
**Aligned with:** Railway staging/prod decision

### Objective
Fill local / Railway staging / Railway production matrix before coding.

### Gives (fill)

| Topic | local | staging (Railway) | production (Railway first) |
| --- | --- | --- | --- |
| API URL | localhost | Railway URL | Railway URL |
| Admin URL | localhost | Railway URL | Railway URL |
| DB | local Postgres | Railway Postgres | Railway Postgres |
| OpenRouter key | optional/dev | yes | yes |
| Mapbox | dev token | staging token | prod token |
| R2 bucket | dev | staging | prod |
| Sentry | optional | on | on |
| Seed | fake OK | rich Djerba | real Djerba |
| Mobile profile | local | EAS staging | EAS prod |

### Notes
- AWS migration is a **future** option, not an env to build now.
- Prod secrets: Admin only.

### Done when
- [ ] Matrix filled with no contradictions
- [ ] Team (solo) agrees staging starts Phase 06, prod Phase 08
