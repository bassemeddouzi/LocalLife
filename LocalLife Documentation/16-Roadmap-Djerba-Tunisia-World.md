# 16 — Roadmap: Djerba → Tunisia → International

**Document type:** Delivery roadmap  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

---

## 1. Expansion philosophy

```text
Depth in one city → breadth in one country → repeatable country packs worldwide
Companion (plans + Avatar + SubGuide) → MVP+ survival → booking → social → agent
```

Never expand geography faster than content quality and grounding quality.

---

## 2. Phase 1 — Foundation MVP (Djerba)

### Product
- Auth, profiles/consents, grounded AI Chat, places/events/experiences
- Reviews, favorites, reports, GPS + nav handoff
- Arrival + transport + local rules seed
- Analytics, flags, rate limits, i18n UI framework

### Engineering
NestJS + Prisma · Expo client · Admin moderation · Djerba seed · Railway path

### Exit criteria
Core journeys work; grounded answer rate high; NFR checklist passes.

---

## 3. Phase 05b — Portals MVP

Admin web + Guide contribution UX + Business claim/profile (no payments).  
Hierarchical Guide scope. Exit: portals QA gate.

---

## 4. Phase 05c — Local Companion (Vision 2.0)

**Priority P0.** Depends on 05b + Guide scope zones.

### Ships
- Rich Trusted Guide knowledge (FIXED/METER transport, special checklists, zone safety-by-time)
- Client identity + **hard filters**
- Plan packs + ClientPlan timelines (offline active plan)
- Floating **AI Avatar** + cues
- **SubGuide**: Main Guide invite + map border → **Admin confirm**
- Freshness down-rank + report → replan → Avatar notify
- Client IA: For You/Plans · Search · AI Chat · Saved · Profile
- Sensitive safety redaction; SubGuide border enforce

### Waves (summary)
Docs/design → schema → API/security → Admin confirm → Guide redesign → Client + Avatar → offline/freshness jobs → tests → env keys

### Exit criteria
- Decisions Log v2.0 reflected in schema + APIs
- Main Guide proposes SubGuide; Admin approves
- Client onboards, packs, chat→plan, Avatar notifications
- Zone intel redacted from Client DTOs
- Freshness + replan path works (mock AI if keys missing)

---

## 5. Immediately after companion (MVP+)

Emergency Mode · Survival Kit · Scam warnings · richer chips · Locals vs Tourists polish · correction UX depth  
See [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md).

---

## 6. Phase 2 — Tunisia

Multi-city expand · stronger recs · more transport systems · country rules refinement · portal enhancements (Phase 10 workstream).

---

## 7. Phase 3 — International

Multi-language/currency · country transport/regulation packs · **Guide content translation** · local editors.

---

## 8. Phase 4 — Marketplace & booking

Booking flows, experiences commerce, payments/refunds *(explicitly future vs companion MVP)*.

---

## 9. Phase 5 — Proactive AI Agent

Weather/schedule adaptation, bookings with approval, durable memory — on top of mature companion knowledge + audit logs.

---

## 10. Parallel workstreams

| Stream | Ownership |
| --- | --- |
| Product/UX | companion journeys & IA |
| Engineering | platform & quality |
| Content | seeding, freshness, zone intel |
| AI eval | grounding + hard-filter tests |
| Business | partnerships & monetization experiments |

---

## 11. Suggested milestones

- `M1`–`M4` Foundation schema/chat/local knowledge/reviews
- `M5` Portals 05b
- **`M5c` Local Companion 05c**
- `M6` Closed beta Djerba (30 testers)
- `M7` Public MVP Djerba

---

## 12. Risk register (short)

| Risk | Mitigation |
| --- | --- |
| Thin / stale content | deep seed + freshness jobs + Guide nudges |
| Hallucinations | grounding + citations |
| Safety scare UI | redact enums; derived advice only |
| SubGuide scope leak | server-side border enforce |
| Overbuilding commerce early | booking/social/turn-by-turn stay future |
| City expansion too fast | pack quality gate |

---

*Next: [17 — Content Seed Plan (Djerba)](./17-Content-Seed-Djerba.md)*
