# Phase 13 — Marketplace & Booking — Overview

**Phase goal:** Turn attention into transactions with bookings and commissions.  
**Depends on:** Strong trust, business accounts, stable UX.  
**Exit unlocks:** commerce revenue + agent booking tools later.

---

## Takes
- Booking/Payment/Subscription tables already in schema
- Payment provider choice
- Feature flags FF_BOOKING / FF_MARKETPLACE
- Legal/refund policy

## Gives
- Bookable experiences/activities/events (scoped rollout)
- Checkout flow via payment provider (no raw card storage)
- Booking statuses visible to user/business
- Commission reporting basics
- Refund/cancel policy implemented at process level
- Idempotent booking/payment handling

## Tasks
1. [01-Booking-Domain-Contracts](./01-Booking-Domain-Contracts.md)
2. [02-Payments-Provider-Integration](./02-Payments-Provider-Integration.md)
3. [03-Business-and-User-Booking-UX](./03-Business-and-User-Booking-UX.md)
4. [04-Commerce-QA-Compliance-and-Phase-Exit](./04-Commerce-QA-Compliance-and-Phase-Exit.md)
