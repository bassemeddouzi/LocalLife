# Phase 03 / Task 03 — Local Rules API

**Priority:** P0

### Objective
Serve scoped practical rules with severity and audience targeting.

### Takes
- LocalRule table + enums (scope/category/severity/audience)
- SCAM_WARNING / EMERGENCY categories available

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| List rules | cityId/countryId, category, audience | approved rules summaries |
| Get rule | id | full details + sourceType + lastReviewedAt |

### Rules for AI consumption
- Prefer CRITICAL/IMPORTANT when relevant
- Always include sourceType
- Never present as formal legal advice in product copy

### Tests
| Test | Expected |
| --- | --- |
| Filter category SAFETY | Only safety/scam related |
| Rejected rule | Not listed publicly |

### Done when
- [ ] Rules API ready for seed + AI tool `getLocalRules`
