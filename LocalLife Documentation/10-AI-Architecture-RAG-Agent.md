# 10 — AI Architecture (RAG → Agent)

**Document type:** AI system design  
**Version:** 1.0  
**Language:** English

---

## 1. AI philosophy

The AI must **not invent local facts**.  
It answers from verified LocalLife knowledge, then uses an LLM to phrase a helpful response.

```text
Fluency is secondary. Grounding is primary.
```

---

## 2. High-level workflow (MVP Chat)

```text
User question
  + GPS / city
  + user preferences
  ↓
Intent detection (place | transport | arrival | rules | event | mixed)
  ↓
Retrieve candidates from DB (and embeddings later)
  ↓
Rank/filter (distance, budget, audience, hours, trust, sponsorship rules)
  ↓
Build grounded context pack
  ↓
LLM generate answer with citations
  ↓
Store message + citations
  ↓
Return text + UI cards
```

---

## 3. Components

| Component | Responsibility |
| --- | --- |
| Orchestrator | conversation state machine |
| Intent router | choose tools |
| Retrievers | query Postgres entities |
| Ranker | score candidates |
| Grounding guard | block ungrounded local claims |
| LLM provider | generation |
| Tool runtime | execute typed tools |
| Memory store | Conversation/Message tables |
| Action layer (future) | agent proposals/executions |

---

## 4. MVP tools

1. `searchPlaces(cityId, query, lat, lng, filters)`
2. `getPlaceDetails(placeId)`
3. `searchEvents(cityId, timeRange, filters)`
4. `getTransportOptions(cityId, from, to)`
5. `getArrivalGuide(cityId|airportPlaceId)`
6. `getLocalRules(cityId, category, audience)`
7. `searchHowToGuides(cityId, query)`

All tools return structured JSON, not free prose.

---

## 5. Ranking signals

- Distance
- Interest match
- Budget/price level fit
- Opening hours now/soon
- Ratings & popularity
- Trust/verification
- Audience fit (student/tourist/…)
- Sponsorship (eligible but labeled; never silently dominate)

Weather can be added later as a signal.

---

## 6. Prompting rules (system policy)

1. Use only provided context for local facts.
2. If context insufficient → say what is missing; ask a clarifying question.
3. Explain why options were chosen.
4. Prefer safer recommendations when confidence is low.
5. Mark sponsored recommendations clearly.
6. Do not provide illegal instructions; for legal/visa topics, summarize LocalRule and point to official sources.
7. Match user locale/language when possible.

---

## 7. Grounding & citation

Every assistant message that references local entities should create `MessageCitation` rows.

Client UI can show “Based on verified LocalLife data” and links to entities.

**Metric:** `% grounded answers` should be tracked.

---

## 8. RAG evolution

### Phase 1 (MVP)
SQL/filtered retrieval + summaries in prompt context.

### Phase 2
Add embeddings table (`EntityEmbedding`) + vector search for semantic recall, still constrained to approved entities.

### Phase 3
Hybrid retrieval (keyword + vector + geo).

---

## 9. From Chat to Agent

### Chat (now)
Request → answer.

### Agent (later)
Observe context → propose actions → wait for approval → execute tools with side effects.

Examples of future tools:

- `createItinerary`
- `proposeBooking`
- `confirmBooking` (requires explicit user approval)
- `sendNotificationSchedule`
- `updatePreferences`

### Safety for agent actions

- Explicit user confirmation for irreversible actions
- `AiActionLog` audit trail
- Feature flag `FF_AI_AGENT`
- Permission scopes per action

---

## 10. Personalization memory

**MVP:** preferences + conversation history.  
**Later:** durable travel memory (liked cuisines, avoided areas, walking tolerance) with consent.

Store memory as structured preference updates, not only hidden prompt text.

---

## 11. Failure modes

| Failure | Product behavior |
| --- | --- |
| No DB matches | Honest empty state + broaden filters |
| LLM outage | Return ranked entity cards without fancy prose if possible |
| Tool timeout | Partial answer + retry suggestion |
| Suspected hallucination | Guardrail rejects; regenerate or fallback template |

---

## 12. Evaluation checklist

Before production prompts go live:

- Airport arrival questions
- Transport payment questions
- Budget food near me
- Safety neighborhood questions
- “Hidden local” vs tourist trap
- Missing-data behavior
- Sponsorship disclosure
- Multilingual request handling

---

## 13. Cost controls

- Cache frequent retrievals per city
- Limit context token size
- Rate limit heavy users
- Smaller model for intent/routing; stronger model for final answer (optional)
- Monitor cost per successful session

---

*Next: [11 — Mobile Architecture](./11-Mobile-Architecture.md)*
