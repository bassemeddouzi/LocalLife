# Phase 13 / Task 02 — Payments Provider Integration

**Priority:** P0

### Objective
Collect money safely through a PCI-compliant provider.

### Takes
- Provider account
- Idempotency keys
- Webhook capabilities

### Gives
| Flow | Takes | Gives |
| --- | --- | --- |
| Create payment intent/session | booking amount/currency | provider redirect/token |
| Webhook confirmation | provider event | Payment CAPTURED + booking confirm |
| Failed payment | failure event | booking remains not confirmed |
| Refund | admin/policy | REFUNDED states |

### Hard rules
- No card numbers stored in LocalLife DB
- All money mutations audited
- Retry-safe webhooks

### Done when
- [ ] Test-mode payment succeeds and fails cleanly
- [ ] Webhook signature verification enabled
