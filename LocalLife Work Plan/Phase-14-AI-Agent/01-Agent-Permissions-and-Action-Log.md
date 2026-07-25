# Phase 14 / Task 01 — Agent Permissions and Action Log

**Priority:** P0

### Objective
Ensure the agent cannot take irreversible actions silently.

### Takes
- AiActionLog model
- User consent/preferences
- RBAC + feature flag

### Gives
| Concept | Takes | Gives |
| --- | --- | --- |
| Action proposal | tool intent + payload | PROPOSED log row shown to user |
| User approval | explicit confirm | APPROVED |
| Execution | approved action | EXECUTED or FAILED |
| Cancel | user/system | CANCELLED |
| Audit | all transitions | forensic history |

### Done when
- [ ] No execute path exists without APPROVED state
- [ ] Flag off disables all agent side effects
