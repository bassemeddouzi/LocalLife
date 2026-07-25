# Phase 05 / Task 02 — Home, Explore, Place Flows

**Priority:** P0

### Objective
Deliver discovery UX: nearby recommendations, map/list explore, place details, navigation handoff.

### Takes
- Places list/detail APIs
- Categories
- GPS or selected city
- Arrival CTA data availability

### Gives
| Screen | Takes | Gives to user |
| --- | --- | --- |
| Home | city/GPS + feed APIs | AI shortcut, categories, nearby, events, arrival CTA |
| Explore | filters + map region | browsable places |
| Place detail | placeId | tips/hours/reviews/reasons/sponsored label |
| Nav handoff | coordinates | opens external maps |

### Rules
- Paginate lists
- Empty/loading/error states defined
- PENDING places never shown

### Done when
- [ ] User can discover and open places end-to-end
