# 02 — Definition of Done

**Document type:** Quality gates  
**Version:** 1.0  
**Language:** English

---

## 1. Purpose

“Done” never means “code exists”.  
Done means **inputs consumed, outputs delivered, tests passed, docs linked**.

---

## 2. Definition of Done for a single task

A task is done only if all are true:

1. **Objective** achieved as written
2. All **Takes (inputs)** were available and used
3. All **Gives (outputs)** exist and are reviewable
4. Listed **Tests** executed with expected results
5. No known **P0 bug** left open for that task
6. Related Documentation references still accurate (or noted for update)
7. Feature flags set correctly if the capability should stay dark

---

## 3. Definition of Done for a phase

A phase is done only if:

1. Every required task file in the phase is marked complete
2. Phase **Exit criteria** checklist is 100% checked
3. Phase test gate is green
4. Risks/blockers either resolved or explicitly deferred with owner/date
5. Next phase prerequisites are satisfied

---

## 4. Severity definitions

| Level | Meaning | Rule |
| --- | --- | --- |
| P0 | Blocks core journey or security | Must fix before phase exit |
| P1 | Major UX/data issue | Fix before beta/launch as specified |
| P2 | Minor | Can backlog |
| P3 | Nice | Optional |

---

## 5. Output quality bar (no-code meaning)

| Output type | Quality meaning |
| --- | --- |
| API contract | Clear request/response fields, errors, auth rules documented |
| DB schema state | Migrations applied; entities match Documentation/08 intent |
| Seed dataset | Approved entities with summaries, geo, verificationStatus |
| AI answer | Citations present for local claims; missing-data behavior correct |
| Mobile screen | Journey completable; loading/empty/error states defined |
| Deploy | Environment URL, health check, rollback note exist |

---

## 6. “Not done” examples

- “Auth works on my machine” but no test proof → **not done**
- “AI answers fluently” but no citations → **not done**
- “Places API exists” but returns unapproved content to clients → **not done**
- “App has screens” but no pagination/cache plan for lists → **not done for Phase 05 exit**
- “Deployed” but no backup/restore rehearsal → **not done for Phase 06/08**

---

## 7. Sign-off roles (even if one person wears all hats)

| Role | Signs |
| --- | --- |
| Builder | Task outputs exist |
| Reviewer (can be same person next day) | Checks Takes/Gives/Tests |
| Content owner | Seed/QA for knowledge phases |
| Launch owner | Phase 07/08 exit |

---

*Next: [03-Roles-Tools-Checklist.md](./03-Roles-Tools-Checklist.md)*
