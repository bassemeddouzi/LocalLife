# 05 — Features (MVP)

**Document type:** Product specification  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English  
**MVP target geography:** Djerba, Tunisia  
**Aligned with:** Phase 05c Local Companion waves · Decisions Log v2.0

---

## 1. MVP goal

Validate that a grounded **local companion** helps real users make better daily decisions in one city (Djerba): Trusted Guide knowledge, Client identity + hard filters, AI plans, SubGuides, and a floating AI Avatar.

MVP must also satisfy NFRs in [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md).

---

## 2. MVP waves (Phase 05c alignment)

| Wave | Focus | Ships |
| --- | --- | --- |
| 0 | Docs + design system | Avatar motion, Client/Guide IA doctrine |
| 1 | Prisma models | SubGuideApplication, plans, zone safety, AvatarCue, rich Place fields |
| 2 | API + security | Plan/avatar APIs; safety redaction; SubGuide border enforce |
| 3 | Admin | SubGuide confirm queue + moderation extensions |
| 4 | Guide | Dashboard, SubGuide map draw, rich knowledge forms |
| 5 | Client | Redesign + Avatar + plans/search/chat |
| 6 | Offline + freshness | Active plan cache; freshness jobs → Avatar cues |
| 7 | Tests / hardening | E2E + grounding |
| 8 | Env keys | OpenRouter / Mapbox / R2 / Google when provided (mock AI if empty) |

---

## 3. MVP feature list (must ship)

### 3.1 Foundation (pre–05c, still required)

1. Authentication & user profile (email + Google where configured)
2. Preferences + consents
3. AI Chat (RAG over verified data) with citations + “why this?”
4. Places / events / experiences browse + detail
5. Reviews & photos (Client: rating + comment; Guide: comments only)
6. Favorites
7. GPS distance + **nav handoff** (external maps; not in-app turn-by-turn)
8. Local knowledge: transport, arrival, rules
9. Report content → Admin → Guide verify → replan path
10. Admin moderation basics
11. Multi-language **UI** framework (EN + FR/AR readiness)
12. Analytics, rate limits, soft delete, feature flags, crash reporting, request IDs

### 3.2 Companion features (Vision 2.0 / Phase 05c)

13. **Client identity & hard filters** — light onboarding + optional ≤7 personality Qs; hard filters as rules (e.g. never adult nightlife if blocked)
14. **Plan packs & Client plans** — persona packs (arrival, student, family, care, transport-only…); editable offline timelines; Chat → save plan; explainability chips
15. **Floating AI Avatar** — draggable overlay; cues/notifications; open chat / continue plan; calm copy only
16. **Rich Guide knowledge** — transport FIXED/METER (+ modes, how-to, Guide comment); venues with audience/hours/tickets/effort; special-place checklists; zone safety-by-time (AI-internal)
17. **Freshness** — `lastReviewedAt` / freshnessScore; monthly Guide refresh notify; stale → AI down-rank
18. **SubGuide** — Main Guide invites + draws border → Admin confirms → SubGuide publishes inside border only
19. **For You / Plans · Search · AI Chat · Saved · Profile** Client IA (vision-first redesign)

---

## 4. Feature specifications (companion deltas)

### 4.1 Profile & hard filters

**Fields (in addition to persona/budget/locale):** conservatism, walksOk, hasVehicle, vibe, settingPref, groupSize, `hardFiltersJson`.

Hard filters **block** suggestions (not soft rank). Examples: no `ADULT_NIGHTLIFE`, mobility constraints, setting preference.

### 4.2 Plans

- Sources: `CHAT` | `PACK` | `MANUAL`
- Status: `DRAFT` | `ACTIVE` | `COMPLETED` | `ARCHIVED`
- Steps: place/event/free text, duration, transport note, `whyJson`, order
- Offline: active plan payload + emergency strip + cached Avatar cues

### 4.3 AI Chat (companion tools)

Existing tools plus:

- `getPlanPacks` / `createPlanFromPack`
- `savePlanFromChat` / `updatePlanSteps`
- `getZoneAdvice` (derived tips only — never raw danger dumps)
- Respect hard filters + freshness down-rank on all retrieval

### 4.4 Guide rich contributions

Transport scenarios, venue richness, special places (3+ photos, checklist, precautions, paid entry, best arrive/leave, difficulty, season), zone safety assessments (DAY/NIGHT/WEEKEND). Guide language = author language; **content translation later**.

### 4.5 SubGuide & Admin

Main Guide: Team → Add SubGuide (email, name, formation note) → draw border inside parent zone → `PENDING_ADMIN`.  
Admin: confirm queue (parent zone vs border map) → Approve (GUIDE user + `parentGuideId` + temp password) or Reject.

### 4.6 Avatar

States: idle, notify, speak, celebrate, soft-warn (replan). Tap → sheet: unread cues, Open chat, Continue plan, Hide for session. Reduce-motion: static + badge.

---

## 5. Explicit non-features for MVP UI

- Autonomous booking / payment checkout
- Full marketplace
- In-app **turn-by-turn** navigation (handoff only)
- Social feed / follow Guides / Ask-a-Local Q&A
- Automatic translation of Guide-authored content
- Multi-country browsing as a growth loop

Schema/architecture may remain ready where specified in docs 06–08.

---

## 6. Acceptance criteria (product)

1. Client onboards with identity + hard filters; suggestions respect filters.
2. User can open a pack or Chat→plan, edit steps, use offline active plan.
3. Avatar delivers a cue and opens chat/plan action.
4. Guide submits rich place/transport/zone knowledge; stale content is down-ranked.
5. Main Guide proposes SubGuide with border; Admin approves; SubGuide cannot publish outside border.
6. Sensitive zone safety levels are redacted from Client DTOs (derived advice only).
7. Grounded answers cite entities; reports can trigger verify → replan + Avatar notify.
8. NFR checklist (cache, security, analytics, i18n UI) passes.

---

## 7. Analytics events (minimum)

Foundation events from v1.1, plus:

- `plan_created` / `plan_step_completed` / `plan_saved_from_chat`
- `plan_pack_opened`
- `avatar_cue_shown` / `avatar_cue_opened`
- `hard_filter_blocked`
- `subguide_proposed` / `subguide_approved`
- `content_freshness_downrank`
- `report_replan_notified`

---

## 8. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)
- Work Plan Phase 05c overview

---

*Next: [06 — Features (Future)](./06-Features-Future.md)*
