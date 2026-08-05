# 10 — AI Architecture (RAG → Agent)

**Document type:** AI system design  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

---

## 1. AI philosophy

The AI must **not invent local facts**.  
It answers from verified LocalLife knowledge, applies Client **hard filters**, prefers **fresh** content, and can turn answers into **editable plans** — surfaced via chat and the floating Avatar.

```text
Fluency is secondary. Grounding + filters + freshness are primary.
```

---

## 2. High-level workflow (companion)

```text
User question / pack request
  + GPS / city
  + UserPreference (hardFiltersJson + identity)
  ↓
Intent (place | transport | arrival | rules | zone | plan | mixed)
  ↓
Retrieve APPROVED candidates
  ↓
Hard-filter (drop blocked) → rank (distance, budget, audience, hours, trust, freshness, sponsorship rules)
  ↓
Zone safety: use assessments internally → derived advice only
  ↓
Build grounded context pack
  ↓
LLM answer + citations + optional plan draft
  ↓
Store message / plan / AvatarCue as needed
```

Mock AI when OpenRouter key empty; never invent local facts in either mode.

---

## 3. Components

| Component | Responsibility |
| --- | --- |
| Orchestrator | conversation + plan state |
| Intent router | choose tools |
| Retrievers | Postgres entities |
| Hard-filter gate | enforce preference rules |
| Freshness ranker | down-rank stale `freshnessScore` / `lastReviewedAt` |
| Grounding guard | block ungrounded local claims |
| Safety redactor | strip raw SafetyLevel from Client-facing payloads |
| LLM provider | OpenRouter (Admin-switchable model) |
| Avatar cue writer | notify / soft-warn / celebrate |
| Action layer (future) | booking agent |

---

## 4. Tools

### 4.1 Knowledge (MVP)

1. `searchPlaces` / `getPlaceDetails`
2. `searchEvents`
3. `getTransportOptions` (FIXED vs METER clarity)
4. `getArrivalGuide` / `searchHowToGuides`
5. `getLocalRules`
6. `getZoneAdvice` — derived tips only

### 4.2 Plan tools (Vision 2.0)

7. `listPlanPacks` / `instantiatePlanPack`
8. `createOrUpdatePlan` / `addPlanSteps`
9. `getActivePlan` / `markStepDone`

### 4.3 Avatar cues

10. `enqueueAvatarCue` (system) — freshness, replan, plan saved, calm tips

Future (not MVP): `proposeBooking`, `confirmBooking`, in-app turn-by-turn.

---

## 5. Ranking signals

- Hard filters (binary reject)
- Freshness / lastReviewedAt (stale → down-rank, not hide if only option — disclose uncertainty)
- Distance, budget, hours, audience fit, trust
- Sponsorship eligible but labeled
- Conservatism / vibe / setting / group as soft rank after hard filters

---

## 6. Prompting rules

1. Local facts only from context.
2. Insufficient context → say so; clarify.
3. Explain why options fit the user.
4. Prefer safer phrasing; **never** dump “VERY_DANGER” style labels.
5. Mark sponsored clearly.
6. Legal/visa: summarize LocalRule + official sources.
7. Match UI locale; Guide excerpts may stay in author language until translation.

---

## 7. Grounding & citation

`MessageCitation` on entity references. Track `% grounded answers`. Plans store `whyJson` per step.

---

## 8. RAG evolution

Phase 1: SQL/filtered retrieval.  
Phase 2: `EntityEmbedding` + vector.  
Phase 3: hybrid keyword + vector + geo.

---

## 9. From Chat companion to Agent

**Now:** answer + plans + Avatar cues.  
**Later:** observe → propose → approve → execute (bookings, schedules) with `AiActionLog` + `FF_AI_AGENT`.

---

## 10. Personalization memory

MVP: preferences + hard filters + conversation + active plan.  
Later: durable travel memory with consent.

---

## 11. Failure modes

| Failure | Behavior |
| --- | --- |
| No matches after filters | Honest empty + suggest relaxing a soft preference (never silently break hard filters) |
| Stale-only results | Answer with freshness caveat + Avatar refresh path for Guides |
| LLM outage | Ranked cards / plan template without prose if possible |
| Suspected hallucination | Guardrail reject / regenerate |

---

## 12. Evaluation checklist

- Hard filter never violated
- Freshness down-rank observable
- Airport / FIXED-METER transport
- Zone advice without raw danger enums
- Pack → plan → Avatar cue
- Report → replan cue
- Sponsorship disclosure
- Multilingual UI requests

---

## 13. Cost controls

Cache city retrievals · limit context tokens · rate limits · Admin model switch · cost per session

---

*Next: [11 — Mobile Architecture](./11-Mobile-Architecture.md)*
