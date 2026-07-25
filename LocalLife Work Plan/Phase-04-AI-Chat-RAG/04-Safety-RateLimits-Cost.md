# Phase 04 / Task 04 — Safety, Rate Limits, Cost Controls

**Priority:** P0

### Objective
Protect users, trust, and budget while chat is live.

### Takes
- Working orchestrator
- Throttle infrastructure
- Abuse considerations from doc 21 R12

### Gives
| Control | Takes | Gives |
| --- | --- | --- |
| Per-user AI rate limit | user id + window | allow or 429 |
| Per-IP limit | IP | allow or 429 |
| Max context size policy | retrieved candidates | truncated top-N |
| Prompt-injection posture | raw user text | treated as untrusted data |
| Cost metrics | token/latency logs | observability fields |
| Report AI answer | message id + reason | report row |

### Steps
1. Set conservative default quotas for MVP.
2. Log model name, latency, tool counts (not secrets).
3. Ensure cross-user conversation isolation tests remain green.
4. Add AI answer reporting path.
5. Keep agent action execution disabled.

### Tests
| Test | Expected |
| --- | --- |
| Exceed quota | 429 |
| User cannot fetch another user’s messages | Denied |
| Report assistant message | Created |

### Done when
- [ ] Limits active
- [ ] Isolation verified
- [ ] Cost logging present
