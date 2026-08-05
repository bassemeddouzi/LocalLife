# 14 — Security & Compliance

**Document type:** Security & trust  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

> Full non-functional security + privacy checklist also lives in [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md) and [21 — Engineering Recommendations](./21-Engineering-Recommendations.md).

---

## 1. Security goals

1. Protect user accounts, conversations, and plans
2. Protect integrity of local knowledge (anti-spam, anti-fake)
3. Prevent AI from exposing private data across users
4. **Redact sensitive zone safety** from Client-facing surfaces
5. **Enforce SubGuide borders** on all Guide writes
6. Prepare for international privacy expectations
7. Ensure admin and abuse actions are auditable

---

## 2. Authentication security

- Password hashing: Argon2id (preferred) or bcrypt
- Short-lived access tokens; rotating refresh with revocation
- Lockout / throttling on login
- Email verification recommended; Google OAuth for Clients when configured
- Secure password reset; temp passwords on Admin-created Guide/Business/SubGuide users

---

## 3. Authorization security

- RBAC: `CLIENT`, `GUIDE`, `BUSINESS`, `ADMIN`
- Ownership checks on updates/deletes
- Admin scope (city/country/global)
- **Main Guide** limited to assignment hierarchy
- **SubGuide** (`parentGuideId` set): create/update only if entity geo ∈ `borderGeoJson` ⊆ parent scope
- Reject API writes outside border with clear 403; never rely on UI-only checks
- AI tools: read approved public knowledge + current user context only

---

## 4. API security

- HTTPS only · DTO validation · rate limits (global + AI) · CORS allowlist
- Upload type/size checks · pagination limits · Prisma parameterized queries
- Client DTOs for places/search/chat: **omit raw `SafetyLevel` / internal zone intel**; return derived advice fields only
- Admin/Guide tools may read full `ZoneSafetyAssessment` under role guards

---

## 5. Data privacy

### Personal data examples
email, GPS, chat logs, plans, preferences/hard filters, device tokens, Avatar cues

### Practices
- collect minimum necessary · purpose limitation · retention for chats/logs
- delete/export process (progressive) · production access controls

### GPS
- permission with rationale · no high-frequency raw tracks in MVP
- prefer event-time snapshots for AI messages

### Sensitive safety redaction
- `VERY_DANGER` / `DANGER` enums and internal reasons stay server-side / Admin / AI context
- Client UI: calm, actionable phrasing only (no scare banners)
- Logs/analytics: do not emit raw safety enums tied to user identity without need

---

## 6. Content trust & safety

- verification before public AI retrieval
- report/moderation; anti-spam on reviews; ban/suspend
- audit log for approvals including **SubGuide confirm**
- freshness down-rank is quality control, not a privacy substitute

---

## 7. AI safety

- grounding required for local facts
- citation persistence
- hard filters enforced in retrieval, not only in prompts
- prompt injection awareness (user text untrusted)
- no booking execution without explicit confirmation (future agent)
- Avatar cues: calm tips / replan — never panic copy from safety internals

---

## 8. Commercial integrity

- sponsored content disclosed
- businesses cannot write organic self-reviews
- claim verification for ownership

---

## 9. Compliance notes (practical)

Privacy-law readiness (e.g. GDPR-like for EU users), ranking/ads transparency, payments PCI via provider when booking launches.  
MVP: privacy policy + terms before public launch; architecture compatible with deletion/export.

---

## 10. Incident readiness

Sentry (or equivalent) · DB backup/restore · secret rotation · abuse contact · requestId in API logs

---

## 11. Consent & tracking

- consentAnalytics / Personalization / Push / Marketing
- no non-essential analytics without consent
- personalized ranking respects consentPersonalization

---

## 12. Related documents

- [03 — Actors, Roles & Permissions](./03-Actors-Roles-Permissions.md)
- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)

---

*Next: [15 — Monetization](./15-Monetization.md)*
