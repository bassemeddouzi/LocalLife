# 16 — Roadmap: Djerba → Tunisia → International

**Document type:** Delivery roadmap  
**Version:** 1.0  
**Language:** English

---

## 1. Expansion philosophy

```text
Depth in one city → breadth in one country → repeatable country packs worldwide
Chat grounded → planner → notifications → booking → agent
```

Never expand geography faster than content quality and grounding quality.

---

## 2. Phase 1 — MVP (Djerba)

### Target
Djerba

### Product
- Authentication
- Profiles/preferences + consents
- AI Chat (grounded) with citations + why-this reasons
- Places, events, experiences
- Reviews, favorites, reports
- GPS + nav handoff
- Arrival guide + transport systems + key local rules
- Analytics event pipeline

### Engineering
- NestJS + Prisma schema v1 (future-ready)
- React Native app tabs with cache/pagination
- Admin moderation basics
- Djerba seed dataset
- Feature flags, rate limits, request IDs
- Crash reporting (Sentry or equivalent)
- i18n framework (EN + FR/AR readiness)

### Exit criteria
- Real users complete core journeys
- Grounded answer rate is high
- Content ops process works
- NFR checklist passes (cache, security, analytics, i18n readiness)
- No schema rewrite needed for Phase 2

---

### Immediately after MVP (MVP+)
- Emergency Mode
- City Survival Kit
- Scam/tourist-trap warnings
- Chat follow-up chips
- Locals vs Tourists tags
- Suggest a correction

See [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md).

---

## 3. Phase 2 — Tunisia

### Expand cities
Tunis, Sousse, Hammamet, Sfax, Tozeur, Bizerte, and remaining cities progressively.

### Add
- Local Guide portal
- Business accounts / claims
- Stronger recommendation quality
- More transport systems per city
- Country-level rules pack refinement

### Exit criteria
- Multi-city switching works with same app
- Guides producing approved content weekly
- Early sponsorship experiments possible

---

## 4. Phase 3 — International

### Focus
- Multi-language
- Multi-currency
- Country-specific transport packs
- Local regulations packs
- Cultural adaptation of onboarding/content

### Operating model
Country pack playbook + local editors/guides.

---

## 5. Phase 4 — Marketplace

- Booking flows
- Experiences commerce
- Local services
- Payments + refunds + support process

Transforms LocalLife into a local ecosystem, not only an assistant.

---

## 6. Phase 5 — AI Agent

Proactive companion capable of:

- planning trips
- suggesting real-time activities
- adapting to weather/schedules
- managing bookings with approval
- remembering preferences
- acting as a personal local companion

Requires mature knowledge quality + action audit logs + feature flags.

---

## 7. Parallel workstreams (all phases)

| Stream | Ownership |
| --- | --- |
| Product/UX | journeys & prioritization |
| Engineering | platform & quality |
| Content | seeding & verification |
| AI eval | grounding scorecards |
| Business | partnerships & monetization experiments |

---

## 8. Suggested milestone naming

- `M1` Schema + auth + places read APIs
- `M2` Chat grounded on places
- `M3` Local knowledge tools (transport/arrival/rules)
- `M4` Reviews/favorites/polish
- `M5` Closed beta Djerba
- `M6` Public MVP Djerba

---

## 9. Risk register (short)

| Risk | Mitigation |
| --- | --- |
| Thin content | seed deeply before marketing |
| Hallucinations | grounding guard + citations |
| Overbuilding commerce early | feature flags; schema only |
| City expansion too fast | pack quality checklist gate |
| Transport data goes stale | review dates + guide updates |

---

*Next: [17 — Content Seed Plan (Djerba)](./17-Content-Seed-Djerba.md)*
