# Phase 03 / Task 01 — Transport APIs and Model

**Priority:** P0

### Objective
Expose local transport systems as first-class knowledge (not hardcoded Tunisia logic).

### Takes
- TransportSystem, TransportHub, TransportRoute tables
- PaymentMethod / PricingType enums
- City Djerba

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| List transport systems | cityId/countryId | approved systems with payment/pricing fields |
| Get system detail | id | howItWorks, warnings, price bands, lastReviewedAt |
| List hubs | systemId/cityId | hubs linked to places |
| List routes | systemId / from-to hubs | approx duration/price notes |

### Steps
1. Define public DTO including payment methods + pricingType + warnings.
2. Enforce APPROVED-only public reads.
3. Ensure `lastReviewedAt` returned for freshness UX/admin later.
4. Admin write path for creating/updating systems (can be seed-driven first).
5. Validate that mode mapping supports SHARED_TAXI (louage).

### Tests
| Test | Expected |
| --- | --- |
| List systems for Djerba | Includes taxi/louage style entries after seed |
| Pending system | Hidden publicly |

### Done when
- [ ] Read APIs stable for AI tool use later
