# Phase 05b / Task 04 — Business Portal UX

**Priority:** P0  
**No payments in MVP**

### Objective
Business basics only: claim place + manage allowed fields.

### Takes
- BUSINESS role APIs
- Admin claim verification

### Gives
| Flow | Takes | Gives |
| --- | --- | --- |
| Business onboarding | profile fields | BusinessProfile |
| Claim place | evidence | PENDING claim |
| Manage linked place | allowed edits | updated pending/live fields |
| Optional events | form | PENDING event |

### Explicitly excluded
- Checkout, sponsorship purchase UI, booking calendar payments

### Done when
- [ ] Claim → verify → edit loop works in UI
