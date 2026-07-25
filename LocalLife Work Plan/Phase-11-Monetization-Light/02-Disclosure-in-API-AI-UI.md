# Phase 11 / Task 02 — Disclosure in API, AI, UI

**Priority:** P0

### Objective
Make sponsorship impossible to miss.

### Takes
- isSponsored / campaign data
- AI card renderer
- Home/Explore lists

### Gives
| Surface | Takes | Gives |
| --- | --- | --- |
| API DTO | sponsored flags | clients always receive disclosure fields |
| Mobile cards | flags | “Sponsored” badge |
| AI text policy | flagged entities | explicit disclosure sentence/label |
| Analytics | impression/click | measurable |

### Tests
| Test | Expected |
| --- | --- |
| Sponsored place in AI answer | Label present |
| Organic place | No sponsored badge |

### Done when
- [ ] Disclosure 100% on all surfaces that can show sponsored entities
