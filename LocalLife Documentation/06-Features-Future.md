# 06 — Features (Future)

**Document type:** Product roadmap features  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

---

## 1. Principle

Ship the **local companion** MVP (plans, Avatar, SubGuide, rich Guide knowledge, hard filters).  
Grow into ecosystem features without breaking foundations.

```text
MVP (Vision 2.0): Companion + grounded chat + plans + Avatar + SubGuide + rich knowledge
  ↓
MVP+: Survival kit, emergency mode, scam alerts, richer follow-up chips
  ↓
Future: Booking → Social → In-app turn-by-turn → Marketplace → Proactive agent
         + Guide content translation
```

Extended backlog: [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md).

---

## 2. Future feature catalog

### 2.0 Near-term differentiators (MVP+)

After companion stability:

1. Emergency Mode
2. City Survival Kit (48h)
3. Scam / tourist-trap warnings (structured)
4. Richer chat follow-up chips
5. Locals vs Tourists tags polish
6. Suggest-a-correction UX depth

### 2.1 Booking platform *(post-MVP)*

Book experiences, events, restaurants, activities.

**Depends on:** Booking, Payment, availability, business onboarding, refunds.

### 2.2 Social & community *(post-MVP)*

- Follow Guides / Ask-a-Local Q&A
- Social feed or trip sharing
- Guide public profiles for Clients

*(Not in Vision 2.0 companion MVP.)*

### 2.3 In-app turn-by-turn *(post-MVP)*

MVP uses **external nav handoff** only. Future may embed Mapbox/Google directions inside the app.

### 2.4 Guide content translation *(later)*

Guides write in their chosen language. Automatic or editorial translation of Guide-authored bodies (places, tips, zone comments) is **explicitly deferred** — UI i18n ships first.

### 2.5 Smart notifications (push scale)

Geofenced / quiet-hours pushes beyond in-app Avatar cues.

### 2.6 Business promotion & marketplace

Sponsored listings (labeled), then marketplace inventory.

### 2.7 Premium membership

Offline city packs at scale, advanced planning entitlements, early access.

### 2.8 Proactive AI Agent

Propose and execute (with approval): rearrange for weather, reserve, remember across trips. Requires mature knowledge + `AiActionLog`.

---

## 3. MVP vs Future matrix

| Area | MVP (Vision 2.0) | Future |
| --- | --- | --- |
| AI | Grounded chat + plan tools + Avatar cues | Proactive agent + booking tools |
| Plans | Packs + editable offline timelines | Multi-day commerce-linked itineraries |
| Content | Rich Guide knowledge + freshness | Marketplace inventory |
| Commerce | None / sponsorship prep | Booking + commissions |
| Navigation | Distance + external handoff | In-app turn-by-turn |
| Social | Reports + favorites | Follow / Ask-a-Local / sharing |
| Language | UI i18n; Guide author language | Translate Guide content |
| Coverage | Djerba depth | Tunisia → international packs |
| Guides | Main Guide + SubGuide (Admin confirm) | Portal enhancements (Phase 10+) |

---

## 4. Enablement requirements (build now, activate later)

| Future feature | Prepare now |
| --- | --- |
| Booking | `Booking`, `Payment` tables + status enums |
| Premium | `Subscription` + entitlements |
| Sponsorship | `isSponsored`, campaign dates, disclosure |
| Agent | tool interfaces, permissions, `AiActionLog` |
| Multi-country | geo hierarchy + countryCode + currency + locale |
| Offline premium | content pack versioning |
| Push at scale | device tokens + preference flags |
| Semantic search | `EntityEmbedding` |
| Personalization | analytics + RecommendationLog + consents |
| Corrections | `ContentSuggestion` |
| Ask a Local | `LocalQuestion` / `LocalAnswer` |
| Guide translation | `PlaceTranslation` / content locale tables |

---

## 5. AI evolution path (product)

1. **Chat Assistant** — grounded Q&A *(shipped)*
2. **Companion plans + Avatar** — identity filters + timelines *(Vision 2.0 MVP)*
3. **Personalized Recommendations** — ranking polish
4. **Smart Notifications** — contextual pushes
5. **Autonomous Agent** — propose/execute with consent

Never skip trust.

---

## 6. Feature flags

- `FF_BOOKING`
- `FF_MARKETPLACE`
- `FF_PREMIUM`
- `FF_SMART_NOTIFICATIONS`
- `FF_AI_AGENT`
- `FF_TURN_BY_TURN`
- `FF_SOCIAL` / `FF_ASK_A_LOCAL`
- `FF_GUIDE_CONTENT_TRANSLATION`
- `FF_EMERGENCY_MODE`
- `FF_SURVIVAL_KIT`

---

## 7. Related documents

- [05 — Features (MVP)](./05-Features-MVP.md)
- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)

---

*Next: [07 — Local Knowledge System](./07-Local-Knowledge-System.md)*
