# Phase 08 / Task 01 — Production Infra and Secrets

**Priority:** P0

### Objective
Prepare Railway production resources; secrets accessible to Admin only.

### Takes
- Railway account
- Decisions Log hosting choice
- Secrets inventory

### Gives
| Resource | Gives |
| --- | --- |
| Prod Railway project | Isolated from staging |
| Prod Postgres | Ready for migrate |
| Prod API + Admin services | Deploy targets |
| Prod R2 / OpenRouter / Mapbox / Sentry | Configured |
| Access control | Only Admin hat |

### Done when
- [ ] Prod resources named/documented
- [ ] Staging credentials not reused casually for prod
