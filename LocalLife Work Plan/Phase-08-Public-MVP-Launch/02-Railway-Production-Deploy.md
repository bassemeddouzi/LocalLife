# Phase 08 / Task 02 — Railway Production Deploy

**Priority:** P0

### Objective
Release MVP backend/admin/content to Railway production.

### Takes
- Staging-proven release
- Prod Railway project + secrets (Admin-only access)
- Djerba content import

### Gives
| Step | Gives |
| --- | --- |
| Migrate | Prod schema |
| Deploy API + Admin | Health OK HTTPS |
| Seed/import | Djerba live |
| Mobile prod config | Store/EAS prod API URL |

### Order
migrate → deploy → health → seed → mobile release

### Done when
- [ ] Prod health green
- [ ] Spot-check places/arrival/AI/admin model config on prod
