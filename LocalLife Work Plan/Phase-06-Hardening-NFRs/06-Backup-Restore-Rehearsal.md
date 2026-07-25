# Phase 06 / Task 05 — Backup Restore Rehearsal

**Priority:** P0

### Objective
Prove you can recover staging/prod-like data before beta depends on it.

### Takes
- Staging DB with seed
- Backup mechanism enabled

### Gives
| Drill | Takes | Gives |
| --- | --- | --- |
| Create backup | live staging DB | backup artifact |
| Restore to clean instance | backup | data restored |
| Verify row samples | place/guide counts | match expectations |
| Record RTO/RPO notes | timings | ops document |

### Done when
- [ ] Restore drill succeeded once
- [ ] Notes stored for Phase 08 prod adaptation
