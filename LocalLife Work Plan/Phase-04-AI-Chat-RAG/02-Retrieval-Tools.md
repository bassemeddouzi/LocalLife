# Phase 04 / Task 02 — Retrieval Tools

**Priority:** P0  
**Depends on:** Phase 03 APIs

### Objective
Create typed internal tools the orchestrator calls instead of free-browsing the internet for local facts.

### Takes
- Domain services for places/events/transport/arrival/rules/how-to
- City + GPS context
- VerificationStatus filters

### Gives (tool contracts)

| Tool | Takes | Gives |
| --- | --- | --- |
| searchPlaces | cityId, query, lat/lng, filters | ranked place summaries + ids |
| getPlaceDetails | placeId | detail summary |
| searchEvents | cityId, time window, filters | event summaries |
| getTransportOptions | cityId, from/to hints | systems/routes/payment notes |
| getArrivalGuide | cityId/airportPlaceId | guide + steps |
| getLocalRules | cityId, category, audience | rules summaries |
| searchHowToGuides | cityId, query/type | guides |

### Hard rules
- Tools return **only APPROVED** knowledge by default
- Tools return structured data, not prose paragraphs
- Tools include enough fields for citations

### Tests
| Test | Expected |
| --- | --- |
| searchPlaces on Djerba food | Non-empty ids from seed |
| getArrivalGuide | Steps present |
| Tool on empty city | Empty list, not fabricated rows |

### Done when
- [ ] All MVP tools callable by orchestrator with stable JSON shapes
