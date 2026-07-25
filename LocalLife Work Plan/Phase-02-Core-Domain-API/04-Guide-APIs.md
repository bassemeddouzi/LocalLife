# Phase 02 / Task 04 — Guide APIs

**Priority:** P0 (MVP)  
**New relative to older plan that deferred guides**

### Objective
Enable Guide role lifecycle and content contribution via API from day one of domain work.

### Takes
- GUIDE role + GuideProfile
- Places/experiences/tips schemas
- Admin approval workflow

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Apply as guide | bio, cities, languages | GuideProfile APPLIED/PENDING |
| Admin approve/reject guide | application id | APPROVED guide can contribute |
| Submit place/tip/experience | guide auth + payload | content PENDING |
| List my submissions | guide auth | status list |

### Early ops note
Create a **Guide test account** in seed for solo owner to enter Djerba data (fake OK).

### Tests
| Test | Expected |
| --- | --- |
| Unapproved guide cannot publish | 403 |
| Approved guide submits place | PENDING created |
| Admin approves place | Public visible |

### Done when
- [ ] Guide API path usable for seed ops and Phase 05b UI
