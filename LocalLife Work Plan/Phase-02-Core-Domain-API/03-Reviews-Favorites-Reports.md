# Phase 02 / Task 03 — Reviews, Favorites, Reports

**Priority:** P0  
**Depends on:** Places API

### Objective
Enable social proof, saving, and trust reporting.

### Takes
- Authenticated CLIENT
- Existing APPROVED place
- Review/Favorite/Report tables

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Create/update review | placeId, rating, text, optional photos | review entity (status per policy) |
| List reviews | placeId, page | visible reviews |
| Add favorite | targetType/targetId | favorite row |
| List favorites | auth user | saved items |
| Remove favorite | favorite id/target | deleted/soft-deleted |
| Create report | targetType/targetId, reason | report OPEN |

### Rules
- One active review per user per place
- Rate-limit review creation
- Reports available on place/review at minimum (AI message reports in Phase 04)

### Tests
| Test | Expected |
| --- | --- |
| Dual review same place | Upsert or reject duplicate cleanly |
| Favorite twice | Idempotent unique constraint behavior |
| Report without auth | 401 |

### Done when
- [ ] Favorites + reviews + reports usable via API
