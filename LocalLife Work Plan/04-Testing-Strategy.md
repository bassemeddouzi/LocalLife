# 04 — Testing Strategy (All Phases)

**Document type:** Quality strategy  
**Version:** 1.0  
**Language:** English  
**Rule:** No implementation code here — only what to verify and when.

---

## 1. Testing principles

1. Test early (Phase 01), not only before launch.
2. Prefer many small gates over one giant final test.
3. AI tests measure **grounding**, not eloquence.
4. Content QA is a real test type (not optional).
5. Every phase has a named test gate.

---

## 2. Test types

| Type | Takes | Gives | Used for |
| --- | --- | --- | --- |
| Static/lint | Source tree | Pass/fail report | Style/safety basics |
| Unit | Isolated function/module contract | Pass/fail | Auth helpers, rankers, validators |
| Integration/API | Running API + test DB | Pass/fail per endpoint flow | Register→login→create→read |
| Content QA | Seed records | Signed checklist | Accuracy of Djerba knowledge |
| AI golden set | Fixed questions + expected entity types | Grounding score | Chat quality |
| Manual mobile QA | Build + script | Signed checklist | UX journeys |
| Security checklist | System + config | Signed checklist | Authz, rate limits, secrets |
| Smoke | Deployed env | Critical paths green | Staging/prod |
| UAT/beta | Real users | Feedback + bug list | Phase 07 |
| Regression | Previous gates pack | No critical reopen | Each later release |

### Phase 05c companion gates
- `test/companion.e2e-spec.ts` — plans CRUD, avatar cues, search
- SubGuide propose → Admin approve (manual + API)
- Hard filter adult nightlife on search when prefs set
- Freshness jobs Admin-triggerable
- Security notes: `Phase-05c-Local-Companion/04-Security-Notes.md`

---

## 3. First tests (exact moment)

### First automated tests = **Phase 01**

**Takes**

- API skeleton running locally
- Test database
- Auth contracts implemented at baseline

**Gives**

- A repeatable command/report that proves:
  - health/readiness concept works
  - register/login/refresh happy path works
  - protected route rejects anonymous access

**Done when:** these tests pass twice in a row on a clean setup.

If Phase 01 tests fail → **do not start Phase 02**.

---

## 4. Phase test gates

| Phase | Gate name | Must prove |
| --- | --- | --- |
| 01 | Foundation Gate | Auth + API/mobile/admin skeletons tests green |
| 02 | Core API Gate | Places + guide/business + moderation flows green |
| 03 | Knowledge Gate | Seed P0 answers without AI from data (fake OK) |
| 04 | Grounding Gate | OpenRouter answers cite approved entities; model config API works |
| 05 | Mobile MVP Gate | Expo client journeys + EN/FR/AR |
| 05b | Portals QA Gate | Admin/Guide/Business MVP UX |
| 06 | Staging Gate | Railway smoke + security + EAS channels |
| 07 | Beta Gate | ~30 testers; critical bugs closed; Go/No-Go |
| 08 | Launch Gate | Railway prod smoke + monitoring + rollback |
| 09+ | Expansion Gates | Regression pack green |

---

## 5. AI golden set (minimum themes)

Each question has:

- input question (+ fake GPS/city context)
- expected retrieval domain (place/transport/arrival/rule)
- must include citations
- must not invent missing facts

Themes:

1. Airport first hour
2. Airport → Midoun transport + payment
3. Budget food nearby
4. Sunset beach
5. Pharmacy/hospital
6. Safety cautious answer from rules
7. Weekend plan mix
8. Missing-data behavior test (ask something not seeded)

---

## 6. Manual mobile QA journeys (minimum)

1. Sign up → set persona/budget/locale → land on Home
2. Open Arrival Guide CTA → read steps
3. Ask AI food question → open place → save favorite
4. Explore filter → open place → navigate handoff
5. Write review → see it (or pending state)
6. Report content
7. Offline: open favorite while network off (cached)
8. Language switch does not crash UI

---

## 7. Evidence to keep

For each gate, store (folder or notes):

- date
- environment
- who ran it
- result
- known failures + ticket links

---

*Next: [05-Environments-and-Deploy-Path.md](./05-Environments-and-Deploy-Path.md)*
