# Security review checklist (Phase 06)

Date: ________  Env: local / staging  Reviewer: ________

| # | Area | Check | Pass? |
| --- | --- | --- | --- |
| 1 | HTTPS | Staging/admin only via HTTPS | [ ] |
| 2 | Secrets | No secrets in git (`.env` gitignored; `.env.example` placeholders) | [ ] |
| 3 | JWT | Short access TTL + rotating refresh | [ ] |
| 4 | RBAC | `/v1/admin/*` requires ADMIN | [ ] |
| 5 | Validation | Bad payloads → 400 | [ ] |
| 6 | Rate limits | Auth/AI throttled; abuse → 429 | [ ] |
| 7 | AI isolation | User A cannot read User B conversations | [ ] |
| 8 | Sponsored | Sponsored places labeled in API/UI | [ ] |
| 9 | Consents | Stored on preferences; visible in Profile | [ ] |
| 10 | Uploads | Photo URLs validated; no raw binary upload yet | [ ] |
| 11 | Audit | Admin approve/reject writes AuditLog | [ ] |
| 12 | Helmet | Security headers enabled on API | [ ] |
| 13 | CORS | Explicit origins in production (not `*`) | [ ] |

### Exceptions (with expiry)
| Item | Reason | Expiry |
| --- | --- | --- |
| Sentry optional locally | Staging-on | |
| Store accounts deferred | Expo Go OK until beta | |

### Sign-off
Signed: ________  Date: ________
