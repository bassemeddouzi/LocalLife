# Phase 02 / Task 05 — Business APIs

**Priority:** P0 (MVP)  
**Note:** No payments/booking in MVP

### Objective
Enable business claim and limited profile management without commerce.

### Takes
- BusinessProfile + BusinessPlaceClaim
- Place ownership fields
- ADMIN verification

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Register/upgrade business profile | user auth | BusinessProfile |
| Claim place | evidence | claim PENDING |
| Admin verify claim | decision | place linked |
| Update allowed fields | hours/photos/contact | pending or live per policy |
| Create event (optional MVP) | payload | PENDING event |

### Explicit non-goals here
- Payments, sponsorship checkout, booking

### Tests
| Test | Expected |
| --- | --- |
| Claim without auth | 401 |
| Edit unclaimed place | 403 |
| Verified business edits allowed fields | Success per policy |

### Done when
- [ ] Claim → verify → limited edit works via API
