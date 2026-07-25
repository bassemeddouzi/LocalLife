# Phase 13 / Task 01 — Booking Domain Contracts

**Priority:** P0

### Objective
Define booking lifecycle before taking money.

### Takes
- Booking entity + statuses
- Bookable target types (experience/event/place service)

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Create booking draft | user, target, schedule, party size | DRAFT/PENDING booking |
| Confirm booking | payment success signal | CONFIRMED |
| Cancel | actor + policy | CANCELLED + refund path decision |
| Complete | time passage/ops | COMPLETED |
| List bookings | user/business | filtered lists |

### Done when
- [ ] State machine documented and implemented behind flag
