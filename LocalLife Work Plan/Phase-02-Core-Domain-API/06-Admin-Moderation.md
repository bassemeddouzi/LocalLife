# Phase 02 / Task 04 — Admin Moderation

**Priority:** P0  
**Depends on:** Places + reports

### Objective
Let ADMIN approve/reject content and resolve reports with auditability.

### Takes
- ADMIN authenticated user
- Pending places/reviews/reports
- AuditLog table

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Moderation queue | filters/type | pending items list |
| Approve content | type + id | status APPROVED + audit row |
| Reject content | type + id + reason | status REJECTED + audit row |
| Resolve report | report id + resolution | status RESOLVED/DISMISSED + audit |

### Steps
1. Define queue filters (type, city, date).
2. Ensure only ADMIN (scoped later) can call.
3. Write AuditLog on each decision (actor, before/after, requestId).
4. Ensure approval immediately affects public visibility.
5. Document admin credentials process for staging later.

### Tests
| Test | Expected |
| --- | --- |
| CLIENT calls approve | 403 |
| ADMIN approves place | Public list includes it |
| AuditLog created | Actor + entity recorded |

### Done when
- [ ] Queue + approve/reject + report resolve work
- [ ] Audit trail verified
