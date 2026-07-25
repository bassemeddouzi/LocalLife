# Phase 05b / Task 01 — Admin Moderation and Users

**Priority:** P0

### Objective
Give Admin a real UI to approve content and manage roles needed for MVP ops.

### Takes
- Admin shell
- Moderation + guide/business APIs
- AuditLog

### Gives
| Screen | Takes | Gives |
| --- | --- | --- |
| Moderation queue | pending entities | approve/reject actions |
| Users list | filters | view role/status |
| Guide applications | pending guides | approve/reject |
| Business claims | pending claims | verify/reject |
| Reports inbox | OPEN reports | resolve/dismiss |

### Done when
- [ ] Solo admin can operate Djerba content without raw DB edits for daily moderation
