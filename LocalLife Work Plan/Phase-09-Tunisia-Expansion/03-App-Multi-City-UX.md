# Phase 09 / Task 03 — App Multi-City UX

**Priority:** P0

### Objective
Let users select/switch cities and keep AI/search scoped correctly.

### Takes
- Cities list API
- Selected city in profile/session
- GPS city inference optional

### Gives
| UX | Takes | Gives |
| --- | --- | --- |
| City picker | active cities | selected cityId |
| Scoped Home/Explore/AI | cityId | content only for that city |
| Clear empty states | thin city packs | honest coverage messaging |

### Done when
- [ ] Switching city changes feed/AI scope reliably
