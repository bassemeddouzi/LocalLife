# Phase 01 / Task 02 — Backend Skeleton

**Priority:** P0  
**Depends on:** Task 01 schema (can start skeleton in parallel, finish after DB connected)

### Objective
Create a NestJS (or chosen) API application that boots, connects to DB, and exposes a health/readiness contract.

### Takes (inputs)
- Repo structure decision
- DB connection settings (local)
- Documentation `12-Backend-Architecture.md` module list
- Config/env naming from Phase 00 matrix

### Gives (outputs)
- Bootable API application
- Module folders placeholders matching domains (auth, users, places, ai, …) even if empty
- Health/readiness response contract documented
- Shared logging with request ID placeholder
- Config loader for environment variables

### Contract example (conceptual, not code)

**Health Takes:** nothing (or shallow checks)  
**Health Gives:** `{ status: ok, service, timestamp }`

**Readiness Takes:** DB connectivity  
**Readiness Gives:** `{ status: ready|not_ready, checks: { database: ... } }`

### Steps (no code)
1. Scaffold API app in chosen repo path.
2. Wire configuration for port, database URL, jwt secrets names.
3. Connect ORM to database.
4. Create empty domain modules per documentation.
5. Add global validation philosophy (all inputs validated later).
6. Add request ID middleware/interceptor intention.
7. Add CORS allowlist intention for local mobile.
8. Confirm app starts and stops cleanly.
9. Document how to start API in a short README for builders (commands can be listed as names only).

### Tests
| Test | Expected result |
| --- | --- |
| Start API against local DB | Process stays up |
| Call health | OK payload |
| Call readiness with DB up | Ready |
| Stop DB and call readiness | Not ready (or degraded), not silent success |

### Done when
- [ ] API boots repeatedly
- [ ] Health/readiness contracts stable
- [ ] Module folders exist for upcoming phases

### Links
- `LocalLife Documentation/12-Backend-Architecture.md`
- `LocalLife Documentation/09-API-Architecture.md`
