# 14 — Security & Compliance

**Document type:** Security & trust  
**Version:** 1.1  
**Language:** English

> Full non-functional security + privacy checklist also lives in [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md) and [21 — Engineering Recommendations](./21-Engineering-Recommendations.md).

---

## 1. Security goals

1. Protect user accounts and conversations
2. Protect integrity of local knowledge (anti-spam, anti-fake)
3. Prevent AI from exposing private data across users
4. Prepare for international privacy expectations
5. Ensure admin and abuse actions are auditable (`AuditLog`, reports, rate limits)

---

## 2. Authentication security

- Password hashing: Argon2id (preferred) or bcrypt
- Short-lived access tokens
- Rotating refresh tokens with revocation
- Lockout / throttling on login
- Email verification recommended
- Secure password reset flow

---

## 3. Authorization security

- Role-based access control (`CLIENT`, `GUIDE`, `BUSINESS`, `ADMIN`)
- Ownership checks on updates/deletes
- Admin scope (city/country/global) ready
- Least privilege for AI tools (read approved public knowledge + current user context only)

---

## 4. API security

- HTTPS only
- Input validation on all DTOs
- Rate limiting (global + AI-specific)
- CORS allowlist
- File upload type/size checks
- Pagination limits
- SQL injection avoided via Prisma parameterized queries

---

## 5. Data privacy

### Personal data examples
email, GPS coordinates, chat logs, preferences, device tokens

### Practices
- collect minimum necessary
- purpose limitation
- retention policy for chats/logs
- delete/export request process (implement progressively)
- separate production access controls

### GPS
- request permission with rationale
- do not store high-frequency raw tracks in MVP unless required
- prefer event-time context snapshots for AI messages

---

## 6. Content trust & safety

- verification workflow before public AI retrieval
- report/moderation tools
- anti-spam on reviews
- ban/suspend capabilities
- audit log for admin approvals

---

## 7. AI safety

- grounding required for local facts
- citation persistence
- prompt injection awareness (treat user text as untrusted)
- no executing booking actions without explicit confirmation (future agent)
- filter clearly dangerous queries with policy responses

---

## 8. Commercial integrity

- sponsored content must be disclosed
- businesses cannot write their own “organic” reviews
- claim verification for business ownership

---

## 9. Compliance notes (practical)

LocalLife will eventually face:

- privacy laws depending on markets (e.g., GDPR-like expectations for EU users)
- consumer rules for rankings/ads transparency
- payments compliance when booking launches (PCI via provider, not self-store cards)

MVP action: write privacy policy + terms before public launch; keep architecture compatible with deletion/export.

---

## 10. Incident readiness

- centralized error monitoring (Sentry or equivalent)
- backup/restore tested for DB
- secret rotation process
- admin contact path for abuse reports
- requestId present in API logs for traceability

---

## 11. Consent & tracking

- Store consentAnalytics / consentPersonalization / consentPush / consentMarketing
- Do not use non-essential analytics without consent
- Personalized ranking respects consentPersonalization
- Privacy policy + terms required before public launch

---

## 12. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)

---

*Next: [15 — Monetization](./15-Monetization.md)*
