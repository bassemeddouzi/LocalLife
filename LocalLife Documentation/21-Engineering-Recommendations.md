# 21 — Engineering Recommendations (Build From Day One)

**Document type:** Technical recommendations  
**Version:** 1.1  
**Language:** English  
**Priority:** Include in architecture/schema even when UI is minimal

---

## 1. Purpose

These recommendations came from LocalLife planning discussions.  
They are **cheap to prepare now** and **expensive to retrofit later**.

---

## 2. Recommendation catalog

### R01 — Request IDs + idempotency keys

**What**  
Every API request carries a `requestId` (and optionally `Idempotency-Key` for sensitive writes).

**Why**  
Debugging (“show me request abc-123”), support traces, and safe retries for future booking/payments.

**If skipped**  
Blind logs, duplicate bookings/charges later, hard incident response.

**Implement now**  
- Middleware generates/propagates `requestId`  
- Include in logs and error payloads  
- Reserve idempotency for booking/payment endpoints (flagged)

---

### R02 — Feature flags

**What**  
Runtime switches such as `FF_AI_AGENT`, `FF_BOOKING`, `FF_SMART_NOTIFICATIONS`, `FF_GUIDE_PORTAL`.

**Why**  
Ship code dark; enable gradually; kill-switch broken features without mobile store delay.

**If skipped**  
Every unfinished feature risks production; slow rollback.

**Implement now**  
`FeatureFlag` table or config service + server-driven flags to mobile.

---

### R03 — Soft delete (`deletedAt`)

**What**  
User content and important entities are soft-deleted, not hard-removed by default.

**Why**  
Preserve history for moderation, recommendations, and recovery from mistakes.

**If skipped**  
Broken recommendation history, lost audit context, irreversible user errors.

**Implement now**  
`deletedAt` on reviews, messages (policy-dependent), places revisions ownership rows, favorites, etc.

---

### R04 — `lastReviewedAt` on volatile local knowledge

**What**  
Transport systems, local rules, prices, arrival steps track when a human last verified them.

**Why**  
LocalLife differentiates on practical accuracy. Stale transport/payment advice destroys trust.

**If skipped**  
Confident but outdated AI answers.

**Implement now**  
Fields + admin UI reminder queue for outdated items (e.g., older than N days).

---

### R05 — App version & device context in analytics

**What**  
Events include `appVersion`, `platform`, optional device class.

**Why**  
Isolate bugs to specific releases; know when to force-upgrade.

**If skipped**  
“App is broken” with no cohort visibility.

**Implement now**  
Analytics client attaches build metadata automatically.

---

### R06 — Crash/error reporting (Sentry or equivalent)

**What**  
Automatic crash and exception capture for mobile + API.

**Why**  
Users rarely report stack traces; you need them anyway.

**If skipped**  
Late discovery of production failures.

**Implement now**  
Wire Sentry (or equivalent) in staging/prod builds before public launch.

---

### R07 — Embedding-ready path

**What**  
Keep a planned `EntityEmbedding` (entityType, entityId, vector, modelVersion) path for semantic retrieval.

**Why**  
MVP can use SQL filters; later “quiet romantic café near beach” needs hybrid search without redesign.

**If skipped**  
RAG v2 becomes a rewrite.

**Implement now**  
Document + optional empty table/migration; interface for retrievers.

---

### R08 — Consent flags

**What**  
Store explicit consents:

- analytics tracking  
- personalized recommendations  
- marketing notifications  
- push notifications  

**Why**  
Privacy expectations (including future EU users), trust, legal readiness.

**If skipped**  
Hard-to-fix tracking assumptions; compliance risk.

**Implement now**  
Fields on `UserPreference` + settings screen toggles.

---

### R09 — Offline / content pack versioning

**What**  
`contentPackVersion` (city or country pack) for downloaded offline bundles (premium later).

**Why**  
Know when a user’s offline Djerba pack is stale and needs refresh.

**If skipped**  
Painful premium offline launch later.

**Implement now**  
Version field on city/country pack; download feature can wait.

---

### R10 — “Why this?” on every recommendation

**What**  
API/AI returns short rationale tags: distance, budget fit, open now, student-friendly, verified local tip, etc.

**Why**  
Builds trust, improves UX, and creates training labels for rankers (what reasons convert).

**If skipped**  
Generic lists indistinguishable from competitors.

**Implement now**  
Include `reasons: string[]` in recommendation and AI card payloads.

---

### R11 — Report content everywhere

**What**  
Users can report places, reviews, events, guides, and AI answers.

**Why**  
Scalable trust & safety; catches scams/outdated info early.

**If skipped**  
Toxic/wrong content lingers; slow moderation signal.

**Implement now**  
`Report` entity + UI entry points + admin queue.

---

### R12 — Rate limiting + abuse scoring

**What**  
Per-IP/per-user limits on auth, reviews, AI; basic abuse score for spammy accounts.

**Why**  
Protect LLM budget, prevent fake reviews, reduce brute force.

**If skipped**  
Cost spikes and trust attacks.

**Implement now**  
Nest throttler + AI-specific quotas; suspend path for admins.

---

## 3. Priority matrix

| ID | Priority | Effort now | Cost if delayed |
| --- | --- | --- | --- |
| R01 Request IDs | P0 | Low | High |
| R02 Feature flags | P0 | Low | High |
| R03 Soft delete | P0 | Low | High |
| R04 lastReviewedAt | P0 | Low | High |
| R08 Consents | P0 | Low | High |
| R10 Why this | P0 | Low | Medium |
| R11 Report | P0 | Medium | High |
| R12 Rate limit/abuse | P0 | Medium | High |
| R05 App version events | P1 | Low | Medium |
| R06 Sentry | P1 | Low | High |
| R07 Embeddings path | P1 | Low | High |
| R09 Pack version | P2 | Low | Medium |

---

## 4. Schema / API echoes (checklist)

Ensure documentation and implementation include:

- [ ] `requestId` middleware
- [ ] `FeatureFlag` (or equivalent)
- [ ] `deletedAt` on user-generated content
- [ ] `lastReviewedAt` on TransportSystem / LocalRule / ArrivalGuide / GuideStep parents
- [ ] analytics context: appVersion/platform
- [ ] crash reporting wired
- [ ] `EntityEmbedding` planned
- [ ] consent fields
- [ ] `contentPackVersion` on Country/City pack
- [ ] recommendation `reasons[]`
- [ ] `Report` flow
- [ ] throttling on auth/AI/reviews

---

## 5. Example payloads

### Analytics event

```json
{
  "event": "place_view",
  "userId": "…",
  "sessionId": "…",
  "requestId": "…",
  "cityId": "…",
  "placeId": "…",
  "appVersion": "1.0.0",
  "platform": "android",
  "locale": "fr",
  "timestamp": "2026-07-24T21:00:00Z"
}
```

### Recommendation card

```json
{
  "placeId": "…",
  "name": "Café XYZ",
  "distanceMeters": 450,
  "reasons": ["near_you", "budget_fit", "open_now", "student_friendly"],
  "isSponsored": false
}
```

---

*Related: [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md) · [08 — Database Full Schema](./08-Database-Full-Schema.md)*
