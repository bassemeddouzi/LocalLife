# Phase 01 / Task 04 — Security Baseline Hooks

**Priority:** P0  
**Depends on:** Task 02–03

### Objective
Install the non-negotiable security hooks early so later features inherit them.

### Takes (inputs)
- Docs 14, 20, 21 (R01 request IDs, R02 flags, R08 consents, R12 rate limit)
- Auth module available

### Gives (outputs)
- Request ID attached to each request/log context
- FeatureFlag storage/config readable by API
- UserPreference consent fields writable/readable (even if UI later)
- Throttling enabled on auth routes at minimum
- AuditLog write capability for future admin actions (function ready)
- Standard error payload shape documented

### What middleware/hooks take / give

| Hook | Takes | Gives |
| --- | --- | --- |
| Request ID | Incoming header or generated id | Correlated logs + response header optional |
| Validation | Raw request body/query | Accepted DTO or 400 with details |
| Throttle | IP/user key | Allow or 429 |
| Feature flag read | flag key + context | boolean/rule result |

### Steps (no code)
1. Add request ID generation/propagation.
2. Define unified error format (status, message, details, requestId).
3. Enable validation pipe/global validator philosophy.
4. Enable throttling on register/login.
5. Ensure consent fields exist and `/me/preferences` can store them (stub OK).
6. Ensure FeatureFlag can be listed/checked server-side.
7. Confirm secrets are read from env, not hardcoded.
8. Add security notes to foundation README for builders.

### Tests
| Test | Expected result |
| --- | --- |
| Two requests produce two request IDs in logs | Distinct IDs |
| Invalid register payload | 400 structured error |
| Burst login attempts | Eventually 429 |
| Preferences consent update | Persisted booleans |

### Done when
- [ ] Hooks exist and tested
- [ ] No secrets in source control

### Links
- `LocalLife Documentation/20-Non-Functional-Requirements.md`
- `LocalLife Documentation/21-Engineering-Recommendations.md`
