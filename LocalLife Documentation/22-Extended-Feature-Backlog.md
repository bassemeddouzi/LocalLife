# 22 — Extended Feature Backlog

**Document type:** Product backlog (beyond core MVP/future commerce)  
**Version:** 1.1  
**Language:** English

---

## 1. Purpose

This backlog captures additional differentiating features discussed for LocalLife AI.  
It complements:

- [05 — Features MVP](./05-Features-MVP.md)
- [06 — Features Future](./06-Features-Future.md)

**Rule:** do not inflate MVP. Use this list for prioritization after core grounded chat + local knowledge quality are solid.

---

## 2. Priority legend

| Tag | Meaning |
| --- | --- |
| MVP+ | Strong candidate right after core MVP or small MVP add-on |
| P2 | Tunisia / post-validation phase |
| P3+ | Later international / ecosystem |
| Avoid-early | Explicitly de-prioritized for now |

---

## 3. Differentiation features

| Feature | Description | Phase | Notes |
| --- | --- | --- | --- |
| City Survival Kit | First 48h checklist: SIM, money, transport, hospital, supermarket | MVP+ | Pairs with ArrivalGuide |
| Emergency Mode | One-tap emergency numbers, nearest hospital/pharmacy, share location | MVP+ | Safety-critical UX |
| Scam / tourist-trap alerts | Verified warnings about common scams or trap patterns | MVP+ | Content + LocalRule category |
| Open now + “worth it now” | Not only open: timing value (sunset, less crowded) | MVP→P2 | Needs attributes + optional weather later |
| Chat follow-up chips | After answer: Cheaper / Closer / More local / Safer | MVP+ | Low effort, high UX |
| Locals vs Tourists tags | Place audience positioning | MVP+ | Tag + ranking signal |
| Suggest a correction | Users propose hour/price/status fixes → pending | MVP+ | Trust ops loop |
| Neighborhood fit score | “This area fits you because…” by persona/budget | P2 | Needs enough place/neighborhood data |
| Ask a Local (async) | Question to verified guide, answer in ~24h | P2 | Moderation + SLA |
| Budget day mode | “I have 40 TND today” → plan | P2 | Planner lite |
| Compare places | Side-by-side 2–3 places | P2 | UI + attributes |
| Seasonal city calendar | What’s on this month | P2 | Events aggregation |
| Local phrasebook | Key phrases EN/FR/AR (+ audio later) | P3 | Nice-to-have |
| Voice input | Speak questions while moving | P3 | Mobile permission UX |
| Group mode | Plan for family/friends preferences | P3 | Multi-profile prefs |
| Weather-aware plans | Adapt itinerary to weather | P3 | External weather API |
| Multi-stop route optimize | Best order for souk → lunch → beach | P3 | Routing complexity |
| Trip memory | Remember liked cuisines/areas across trips | P3 | Consent + memory store |

---

## 4. Social & trust features (lightweight)

| Feature | Description | Phase |
| --- | --- | --- |
| Follow a Local Guide | Subscribe to a guide’s tips | P2 |
| Trusted reviewer badge | Reputation for helpful reviews | P2 |
| Photo freshness weighting | Prefer recent photos in ranking/UI | P2 |
| Guide weekly digest | Optional notification of new verified tips | P2 |

Keep LocalLife **not** a social network. No tourist-to-tourist open chat feed in early phases.

---

## 5. Business / growth features

| Feature | Description | Phase |
| --- | --- | --- |
| Business claim + review replies | Owners respond publicly | P2 |
| Student discount badges | Verified student offers | P2 |
| Hotel QR → Arrival Guide | Partners onboard guests into LocalLife | P2 |
| Waitlist / busy-now | Advanced ops signal | P3 |
| Commission tours | Marketplace packages | Phase 4 |

---

## 6. AI feature extensions

| Feature | Description | Depends on |
| --- | --- | --- |
| Beginner vs expat explanation mode | Adjust depth of answers | persona + prompt profiles |
| Plan vs improvisation modes | Structured day vs near-me now | trip planner maturity |
| Grounded refusal templates | Consistent “we don’t have verified data” UX | AI guardrails |
| Preference learning from clicks | Update soft preferences from behavior | analytics history + consent |

---

## 7. Explicitly avoid early

Do **not** prioritize early:

- Full social feed / stories / random user chat
- Super-app sprawl (jobs + housing marketplace + dating)
- Heavy gamification badge spam
- Crypto / web3 features
- Unconstrained open-web browsing agent without grounding

These dilute focus and increase moderation/security cost.

---

## 8. Recommended sequencing (top 8)

After core MVP is stable, implement in this order unless metrics say otherwise:

1. **Emergency Mode**
2. **City Survival Kit (48h)**
3. **Scam / tourist-trap warnings**
4. **Chat follow-up chips**
5. **Locals vs Tourists tags**
6. **Suggest a correction**
7. **Neighborhood fit score**
8. **Budget day planner**

---

## 9. Schema hooks for backlog items

Prepare (fields/tags/entities), even if UI waits:

| Feature | Hook |
| --- | --- |
| Survival kit | HowToGuide type `SURVIVAL_48H` or checklist entity |
| Emergency | Country/City `emergencyNumbersJson` + nearest hospital query |
| Scam alerts | `LocalRule.category = SAFETY` or `SCAM_WARNING` |
| Locals/Tourists | tags `locals_favorite`, `tourist_popular` |
| Corrections | `ContentSuggestion` table (status workflow) |
| Neighborhood fit | neighborhood attributes + scoring service |
| Ask a Local | `LocalQuestion` / `LocalAnswer` entities |
| Follow guide | `GuideFollow` join table |
| Phrasebook | `Phrase` + translations |
| Trip memory | structured memory keys with consent |

---

## 10. Acceptance rule for adding backlog items to a release

A backlog feature may enter a release only if:

1. Core grounded chat quality metrics are healthy
2. Content coverage for the city supports the feature
3. NFR performance/security impacts are reviewed
4. Analytics events are defined
5. Docs 05/06/08/22 are updated

---

*Related: [05 — MVP](./05-Features-MVP.md) · [06 — Future](./06-Features-Future.md) · [20 — NFRs](./20-Non-Functional-Requirements.md)*
