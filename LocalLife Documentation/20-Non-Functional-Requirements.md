# 20 — Non-Functional Requirements

**Document type:** Engineering quality requirements  
**Version:** 1.1  
**Language:** English  
**Status:** Mandatory for MVP and beyond

---

## 1. Purpose

Functional features are not enough. LocalLife AI must also be:

1. **Fast and light** for end users (not laggy)
2. **Secure** by default
3. **Traceable** (history for trust, ops, and future recommendations)
4. **Multi-language** ready from day one
5. **Observable** (crashes, performance, AI cost)

This document is normative: engineering should treat these as release requirements, not optional polish.

---

## 2. Performance & lightness

### 2.1 Product goals

| Goal | Target (MVP guideline) |
| --- | --- |
| App feels responsive on mid-range Android | UI interactions < 100ms locally |
| Home cold load (cached city) | useful content visible quickly |
| Place list scroll | no jank; paginated |
| AI first token | as fast as provider allows; show typing/streaming |
| Image weight | compressed variants; lazy load |

Exact SLOs can be tightened after beta metrics exist.

### 2.2 Mobile caching strategy (mandatory)

Use aggressive caching for read-heavy, slowly changing data.

| Data | Cache approach |
| --- | --- |
| User preferences | local secure/persistent store |
| Favorites | local + sync |
| Recently viewed places | local disk cache |
| City categories | HTTP cache / TanStack Query |
| Home feed for city | Query cache with TTL |
| Arrival guide / transport systems | longer TTL (hours–days) |
| AI conversations list | short TTL; messages fetched on open |
| Images | disk cache + CDN |

**Rules**

- Prefer TanStack Query (or equivalent) for server state
- Paginate all lists (`page`, `pageSize`)
- Never download an entire city catalog in one request
- Map markers load by viewport/radius
- Show offline banner when network unavailable
- AI requires network in MVP (honest UX)

### 2.3 Backend caching strategy

| Layer | Use |
| --- | --- |
| PostgreSQL indexes | cityId, verificationStatus, geo, startsAt |
| Redis (recommended early) | hot city home payload, transport systems, arrival guides, categories |
| CDN | media from R2 |
| HTTP cache headers | public read endpoints where safe |

**Cache invalidation**

- On admin approve/update of place/guide/rule → invalidate city/entity keys
- Prefer TTL + explicit bust on publish

### 2.4 Payload & media rules

- API responses: lean DTOs (no huge nested blobs by default)
- Photos: upload original → generate webp/jpeg sizes
- AI context: send summaries + top-N entities, not entire DB rows

### 2.5 What “not laggy” means in practice

- Skeleton loaders instead of blocked screens
- Streaming AI answers
- Progressive entity cards
- Debounced search/GPS updates
- Avoid unnecessary full-app re-renders

---

## 3. Security requirements

### 3.1 Must-have controls

| Area | Requirement |
| --- | --- |
| Transport | HTTPS only |
| Passwords | Argon2id (preferred) or bcrypt |
| Tokens | short-lived access JWT + rotating refresh + revoke |
| Authz | RBAC on every protected route |
| Validation | DTO validation on all inputs |
| Rate limits | login, signup, reviews, AI messages |
| Uploads | type/size limits; virus scan later if needed |
| Secrets | env/secret manager; never commit |
| Admin | AuditLog for approve/reject/suspend |

### 3.2 AI security

- Treat user prompts as untrusted (prompt injection awareness)
- Retrieve only APPROVED knowledge by default
- Never expose other users’ conversations
- No irreversible agent actions without explicit confirmation (future)
- Log tool calls for forensic traceability

### 3.3 Commercial integrity

- Sponsored content always labeled in API + UI + AI text
- Businesses cannot fabricate organic reviews

See also: [14 — Security & Compliance](./14-Security-Compliance.md)

---

## 4. Traceability & history (recommendation fuel)

### 4.1 Why it matters

Future personalization and ranking need **behavioral history**, not only static preferences.

Without traceability:

- recommendations stay generic
- content quality issues are invisible
- AI regressions cannot be diagnosed

### 4.2 Mandatory analytics / product events

Emit at least:

| Event | Purpose |
| --- | --- |
| `auth_sign_up` / `auth_login` | funnel |
| `place_view` | interest |
| `place_save` / `place_unsave` | strong intent |
| `review_create` | contribution |
| `chat_message_sent` | engagement |
| `chat_answer_grounded` / `chat_answer_ungrounded` | AI quality |
| `chat_citation_clicked` | usefulness |
| `nav_handoff_click` | conversion to action |
| `arrival_guide_open` | local-knowledge value |
| `transport_guide_open` | local-knowledge value |
| `search_performed` | demand signals |
| `recommendation_impression` | ranking training |
| `recommendation_click` | ranking training |
| `content_report_create` | trust ops |
| `emergency_mode_open` | safety feature usage |

### 4.3 Context fields on every event

Attach when available:

- `userId` (if authenticated)
- `sessionId`
- `requestId`
- `cityId` / `countryId`
- `appVersion`
- `platform` (ios/android)
- `locale`
- `timestamp`

### 4.4 Persistence model

| Store | Content |
| --- | --- |
| `Conversation` / `Message` / `MessageCitation` | AI history + grounding |
| `RecommendationLog` | what was shown and why signals |
| `AnalyticsEvent` (or external analytics + warehouse) | product events |
| `AuditLog` | admin/moderation actions |
| `AiActionLog` | future agent proposals/executions |

### 4.5 Privacy constraints

- Consent flags gate non-essential tracking
- Limit retention of precise GPS breadcrumbs
- Prefer event-time location snapshots over continuous tracking in MVP
- Support future export/delete workflows architecturally

---

## 5. Multi-language requirements

### 5.1 Two layers

1. **App UI i18n** — buttons, errors, navigation (`en`, `fr`, `ar` minimum roadmap)
2. **Content translations** — places, rules, guides, experiences

### 5.2 MVP language policy

- Schema and UI framework support EN + FR + AR from day one
- Launch content may prioritize EN/FR for Djerba if needed
- Arabic UI must support RTL
- User `locale` stored on profile and sent to AI

### 5.3 Fallback chain

```text
requested locale → English → original content language
```

### 5.4 AI language behavior

- Answer in the user’s preferred language when possible
- Keep citations linked to entity IDs (language-independent)
- Translated summaries preferred in retrieval context when available

### 5.5 Data model support

- `User.locale`
- `PlaceTranslation` (and equivalents for guides/rules/events as needed)
- Country pack default locales
- Avoid hardcoded UI strings in components

---

## 6. Reliability & observability

| Requirement | Tooling direction |
| --- | --- |
| Crash reporting | Sentry (or equivalent) from early builds |
| API logs | structured logs with `requestId` |
| AI cost/latency | per-request metrics |
| Uptime | health checks `/health` |
| Backups | PostgreSQL automated backups |

---

## 7. Acceptance checklist before public MVP

- [ ] Lists paginated; home uses cache
- [ ] Images compressed; lazy loading on
- [ ] Auth hardening + rate limits live
- [ ] Audit log for admin moderation
- [ ] Core analytics events firing with appVersion
- [ ] Chat stores citations
- [ ] UI i18n framework in place (at least EN + one more)
- [ ] Content translation tables exist
- [ ] Consent flags stored and respected
- [ ] Sentry (or equivalent) receiving mobile/API errors

---

*Related: [21 — Engineering Recommendations](./21-Engineering-Recommendations.md) · [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)*
