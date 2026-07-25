# Phase 06 / Task 07 — Phase Exit (Staging Gate)

### Exit checklist
- [x] Security checklist **document** + API hardening in repo
- [x] Performance/caching baseline (in-memory) acceptable for beta prep
- [x] Railway staging API live (`https://locallife-production.up.railway.app`) + `pnpm smoke:api` **SMOKE OK** (2026-07-25)
- [x] Admin deploy path ready (`deploy/ADMIN.md`, Dockerfile defaults `VITE_API_URL` to staging API) — owner creates Admin service in Railway UI
- [x] EAS/TestFlight/Play internal path **documented** (`eas.json` staging → staging API URL)
- [x] Smoke script + checklist ready; staging API smoke green
- [x] No P0 open in code
- [ ] Backup/restore rehearsed on staging (ops drill — can run anytime before Phase 08)
- [ ] Mobile EAS installable build (Phase 07 channel)

### Staging Gate — SIGNED
| Field | Value |
| --- | --- |
| API URL | `https://locallife-production.up.railway.app` |
| Smoke | **SMOKE OK** (2026-07-25) |
| Decision | **GO** for Phase 07 closed beta prep |
| Signed | Owner + engineering prep |
| Date | 2026-07-25 |

### Gives
Permission to invite **30** closed beta testers (Phase 07) once Admin domain is live and CORS updated (see `deploy/ADMIN.md`).
