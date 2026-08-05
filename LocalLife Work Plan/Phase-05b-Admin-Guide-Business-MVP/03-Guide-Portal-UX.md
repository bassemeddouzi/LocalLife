# Phase 05b / Task 03 — Guide Portal UX

**Priority:** P0

### Objective
Let Guide account (including owner’s guide account) submit Djerba zone knowledge from a usable contribution workspace.

### IA
```text
Home | Map | Add | Activity | Profile
```

| Tab | Purpose |
| --- | --- |
| Home | Status, assignment zone summary (`level · name`), PENDING/APPROVED/REJECTED counts, shortcuts |
| Map | **Green assignment circle** from `GET /v1/guides/me/zone` + own in-scope pins |
| Add | Hub → Place / Tip / Transport / Event / Experience / Business |
| Activity | Historic submissions with type + status filters; detail payload |
| Profile | Bio, app language, **read-only** assigned zone (`level · name`), logout |

### Takes
- Approved GUIDE user with Admin-assigned hierarchical scope (Hood → District → City → State → Country)
- Contribution APIs (`PATCH /v1/guides/me`, places, tips, events, experiences, business applications)
- `GET /v1/guides/me/zone` for green circle + filtered pins
- Optional R2 via `POST /v1/media/presign` (URL fallback when unset)
- Mapbox token on mobile for Map + pick-on-map (`EXPO_PUBLIC_MAPBOX_TOKEN`)

### Gives
| Flow | Takes | Gives |
| --- | --- | --- |
| Guide home | auth | counts + shortcuts + zone label |
| Profile | bio, displayName, app locale | updated profile (**zone Admin-only**) |
| Submit place | category + lat/lng inside scope + optional photo | PENDING place |
| Submit tip | title + summary + tip `categoryKey` | PENDING HowToGuide |
| Transport | Add shortcut | Tip form with `categoryKey=transport` |
| Submit event | schedule + optional prerequisites/place | PENDING event |
| Submit experience | title + optional steps | PENDING experience |
| Propose Business | email + name + district + optional location/photo in scope | PENDING BusinessApplication |
| Track submissions | auth | Activity list + detail |
| Upload photo | file or URL | R2 public URL or pasted URL |

### Tip categories (locked for MVP)
`transport` · `safety` · `money` · `sunset` · `repair` · `camping` · `local_tip`

Tips are **zone knowledge** (how to move, stay safe, camp, etc.), not Tripadvisor-style venue reviews.

### Event prerequisites
Optional free-text `prerequisites` on Event (“buy tickets”, “bring ID”, etc.).

### Scope / Map (locked)
- Assignment levels: **Hood → District → City → State (Region) → Country**
- Geometry = **circle** (centroid + default radius per level); green on Guide Map
- Guide may only contribute / see own pins **inside** that circle (client UX guard + server 403)
- Zone changes: **Admin only**

### Notes
- Fake / pasted photo URLs acceptable when R2 is not configured
- Map requires native rebuild after adding `@rnmapbox/maps`
- Pins = own places / events-with-place / business proposals **inside** the assignment circle
- Transport how-to stays a Tip category until a dedicated LocalRules write API

### Done when
- [x] Guide can edit profile (not zone)
- [x] Guide can submit Place/Tip/Event/Business with real location/type/schedule (no hardcodes)
- [x] Guide can see Activity historic with filters
- [x] Guide Map shows **green scope circle** + own in-scope pins when Mapbox is configured
- [x] Photo upload works via R2 when configured; otherwise URL field
