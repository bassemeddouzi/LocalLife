# Phase 06 / Task 01 — Security Review Checklist

**Priority:** P0

### Objective
Verify security baseline before external users touch the system.

### Takes
- Running staging candidate build (or local prod-like config)
- Docs 14 + 20 + 21

### Gives
Signed checklist covering:

| Area | Takes | Expected give |
| --- | --- | --- |
| HTTPS | staging endpoint | TLS only |
| Secrets | env/secret store | no secrets in git |
| Auth | tokens | short access + rotating refresh |
| RBAC | role tests | admin routes protected |
| Validation | bad payloads | 400s |
| Rate limits | auth/AI/reviews | 429 under abuse |
| AI isolation | two users | no cross-read |
| Sponsorship disclosure | responses | labeled |
| Consents | flags | respected |
| Uploads | files | type/size limits |
| Audit | admin actions | AuditLog rows |

### Done when
- [x] Security checklist document ready (`deploy/SECURITY-CHECKLIST.md`)
- [x] Helmet, CORS prod guard, JWT/RBAC/throttle/validation in place
- [ ] Checklist signed against live **staging** HTTPS (owner after Railway deploy)
- [ ] Exceptions documented with expiry (on sign-off)
