# Phase 01 / Task 07 — First Automated Tests (FOUNDATION GATE)

**Priority:** P0  
**Depends on:** Tasks 01–04 (mobile/admin boot smoke optional)

### Objective
First automated quality gate for foundation.

### Takes
- Bootable API + test DB
- Auth + health contracts

### Gives
- Green suite for health/auth/RBAC basics
- Evidence note
- CI intention

### Minimum cases
1. Health OK
2. Register/login/refresh/me
3. Duplicate email rejected
4. `/me` without token → 401
5. CLIENT cannot access admin-only route stub
6. Invalid payload → 400 with requestId

### Done when
- [ ] Foundation Gate green twice
- [ ] No Phase 02 without this gate

### Links
- `../04-Testing-Strategy.md`
