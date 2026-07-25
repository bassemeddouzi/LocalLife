# Phase 04 / Task 01 — Conversation Persistence

**Priority:** P0

### Objective
Store chat history per user for UX continuity and future personalization.

### Takes
- Auth user
- Conversation / Message tables
- Optional cityId context

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Create conversation | auth + optional title/city | conversation id |
| List conversations | auth | user’s conversations |
| Get conversation | id + ownership | messages ordered |
| Soft-delete conversation | id + ownership | hidden from list |

### Message roles supported
USER | ASSISTANT | SYSTEM | TOOL (tool messages may be internal)

### Tests
| Test | Expected |
| --- | --- |
| User A cannot read User B conversation | 403/404 |
| Messages returned chronological | Ordered |

### Done when
- [ ] Persistence contracts stable before LLM wiring
