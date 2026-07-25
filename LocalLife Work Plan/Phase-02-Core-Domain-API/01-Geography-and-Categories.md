# Phase 02 / Task 01 — Geography and Categories

**Priority:** P0  
**Depends on:** Phase 01 exit

### Objective
Expose hierarchical geography and place categories needed by all later modules.

### Takes
- Country/Region/City/District/Neighborhood tables
- Category/Tag tables
- At least Tunisia + Djerba rows (manual insert acceptable)

### Gives
| Endpoint concept | Takes | Gives |
| --- | --- | --- |
| List countries | optional status filter | active countries |
| List cities by country | countryId | city list with coords/status |
| Get city | cityId | city details + pack version fields |
| List categories | optional parent | category tree/list |

### Steps
1. Define public read contracts (no sensitive admin fields).
2. Seed Tunisia + Djerba minimally.
3. Seed core categories from MVP list.
4. Ensure inactive cities are not publicly listed.
5. Add indexes usage confirmation for city lookups.

### Tests
| Test | Expected |
| --- | --- |
| Get Djerba by id | Returned with country TN |
| List categories | Non-empty |
| Inactive city | Hidden from public list |

### Done when
- [ ] Geo + categories readable
- [ ] TN/Djerba exist
