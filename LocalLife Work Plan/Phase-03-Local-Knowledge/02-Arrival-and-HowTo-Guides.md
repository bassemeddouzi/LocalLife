# Phase 03 / Task 02 — Arrival and HowTo Guides

**Priority:** P0

### Objective
Provide ordered procedural guides (airport first hour, survival kit).

### Takes
- ArrivalGuide, HowToGuide, GuideStep tables
- Airport place entity
- ActionType vocabulary from Documentation 07

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Get arrival guide | cityId or airportPlaceId | guide + ordered steps |
| Get how-to guide | id or type key (e.g. SURVIVAL_48H) | guide + steps |
| Step payload | — | actionType, cost band, payments, warnings, related entity ids |

### What a GuideStep takes/gives conceptually
**Takes (stored fields):** order, title, actionType, description, time/cost estimates, payment methods, related transport/place, warnings, optional flag  
**Gives to clients/AI:** a checklist item that can be rendered and cited

### Tests
| Test | Expected |
| --- | --- |
| Arrival guide for Djerba airport | Steps ordered ascending |
| Missing guide | Clean 404 / empty with message |

### Done when
- [ ] Arrival + how-to read contracts ready for seed and AI tools
