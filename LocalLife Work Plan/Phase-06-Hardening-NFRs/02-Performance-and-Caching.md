# Phase 06 / Task 02 — Performance and Caching

**Priority:** P0

### Objective
Reduce latency for hot city reads and confirm mobile stays light against staging-like data.

### Takes
- Djerba seed volume
- Optional Redis
- Indexes from schema

### Gives
| Optimization | Takes | Gives |
| --- | --- | --- |
| DB indexes used | frequent filters | faster list queries |
| Redis/hot cache | city home/transport/arrival/categories | lower DB load |
| Cache invalidation rules | admin approve/update | freshness |
| API payload trim | fat joins | lean DTOs |
| Perf notes | measurements | baseline numbers recorded |

### Done when
- [x] In-memory hot cache for geo/transport (+ invalidate on place approve)
- [x] No obvious N+1 in public list paths used by mobile/home
- [ ] Optional: record before/after timings on Railway staging
