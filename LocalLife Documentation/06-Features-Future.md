# 06 — Features (Future)

**Document type:** Product roadmap features  
**Version:** 1.1  
**Language:** English

---

## 1. Principle

Ship MVP chat + knowledge.  
Grow into an ecosystem without breaking foundations.

```text
MVP: Chat + Places + Events + Reviews + GPS + Local how-to
  ↓
MVP+: Survival kit, emergency mode, scam alerts, follow-up chips
  ↓
Future: Planner → Notifications → Booking → Marketplace → Agent
```

For the full extended backlog (neighborhood fit, ask-a-local, budget day, etc.), see [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md).

---

## 2. Future feature catalog

### 2.0 Near-term differentiators (MVP+)

Prioritize after core MVP stability:

1. Emergency Mode
2. City Survival Kit (48h)
3. Scam / tourist-trap warnings
4. Chat follow-up chips
5. Locals vs Tourists tags
6. Suggest a correction workflow

Details and schema hooks: doc `22`.

### 2.1 Smart notifications

Context-triggered tips:

> You are 400m from one of the best sunset spots, and golden hour starts in 35 minutes.

**Depends on:** geofencing, user interests, place attributes, quiet hours, consent.

### 2.2 AI trip planner

User: “I have 3 days in Djerba.”  
AI returns day-by-day plan with activities, food, transport, budget estimate.

**Depends on:** Experiences, distance matrix, opening hours, preference model.

### 2.3 Booking platform

Book experiences, events, restaurants, activities.

**Depends on:** Booking, Payment, availability, business onboarding, refunds policy.

### 2.4 Business promotion

Sponsored places/events with analytics.

**Rule:** always visibly labeled.

### 2.5 Marketplace

Local providers sell tours, workshops, boat trips, adventure activities.

### 2.6 Premium membership

- Offline city packs
- Advanced AI planning
- Unlimited saved itineraries
- Early feature access

### 2.7 Proactive AI Agent

From answering questions → proposing actions → executing with approval:

- rearrange itinerary for weather
- reserve activity
- remind about transport timing
- remember preferences over trips

---

## 3. MVP vs Future matrix

| Area | MVP | Future |
| --- | --- | --- |
| AI | Grounded chat | Planner + proactive agent |
| Content | Places/events/experiences | Marketplace inventory |
| Commerce | None/light sponsorship prep | Booking + commissions |
| Motions | Manual ask | Smart notifications |
| Memory | Conversation logs | Durable travel memory profiles |
| Coverage | Djerba depth | Tunisia → international packs |
| Accounts | Client + Admin (+ schema for Guide/Business) | Full Guide/Business portals |

---

## 4. Enablement requirements (build now, activate later)

| Future feature | Prepare now |
| --- | --- |
| Booking | `Booking`, `Payment` tables + status enums |
| Premium | `Subscription` table + entitlements |
| Sponsorship | `isSponsored`, campaign dates, disclosure flags |
| Agent | tool interfaces, permissions, action audit log |
| Multi-country | hierarchy + countryCode + currency + locale |
| Offline premium | content pack versioning fields |
| Notifications | device tokens + preference flags |
| Semantic search | `EntityEmbedding` table path |
| Personalization | analytics events + RecommendationLog + consents |
| Corrections | `ContentSuggestion` workflow |
| Ask a Local | `LocalQuestion` / `LocalAnswer` |

---

## 5. AI evolution path (product)

1. **Chat Assistant** — Q&A grounded
2. **Personalized Recommendations** — ranking by profile + history
3. **Trip Planner** — multi-day structured plans
4. **Smart Notifications** — contextual pushes
5. **Autonomous Agent** — propose and execute tasks with consent

Never skip trust. An agent on top of weak knowledge becomes a confident mistake machine.

---

## 6. Feature flags

All future capabilities should be gated:

- `FF_BOOKING`
- `FF_MARKETPLACE`
- `FF_PREMIUM`
- `FF_SMART_NOTIFICATIONS`
- `FF_AI_AGENT`
- `FF_GUIDE_PORTAL`
- `FF_BUSINESS_PORTAL`
- `FF_ASK_A_LOCAL`
- `FF_EMERGENCY_MODE`
- `FF_SURVIVAL_KIT`

---

## 7. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)

---

*Next: [07 — Local Knowledge System](./07-Local-Knowledge-System.md)*
