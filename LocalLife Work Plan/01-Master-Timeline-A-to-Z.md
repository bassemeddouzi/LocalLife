# 01 — Master Timeline (A → Z)

**Document type:** End-to-end execution map  
**Version:** 1.1  
**Language:** English  
**Aligned with:** [07-Decisions-Log.md](./07-Decisions-Log.md)

---

## 1. One-line journey

```text
Prepare tools (Expo monorepo + Railway + OpenRouter + Mapbox)
  → Foundation (DB + Auth + API + Expo mobile + Admin web + FIRST TESTS)
  → Core APIs (places + guide/business APIs + moderation)
  → Local knowledge + Djerba seed (fake OK first)
  → Grounded AI chat (OpenRouter)
  → Mobile MVP UX (EN/FR/AR)
  → Admin + Guide + Business MVP UX
  → Harden + Railway staging
  → Closed beta Djerba (30 testers)
  → Railway production MVP
  → Tunisia expansion
  → Portal enhancements
  → Light monetization
  → International packs
  → Marketplace/booking
  → AI Agent
```

---

## 2. Stage A — Before any feature work

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| A1 | Accounts: GitHub, Railway, Mapbox, OpenRouter, R2, Sentry, Apple, Google Play | 00 | Access checklist |
| A2 | Local toolchain (Node, Postgres, Expo tooling, Mac path for iOS) | 00 | Machine ready |
| A3 | Confirm monorepo layout `api` + `mobile` + `admin` | 00 | Locked structure |
| A4 | Env matrix local / Railway staging / Railway prod | 00 | Environment matrix |

**Gate A:** Local Postgres works; Expo tooling ready; decisions log followed.

---

## 3. Stage B — Technical foundation

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| B1 | Database schema v1 (+ LLM config + guide/business tables) | 01 | Migrated schema |
| B2 | API skeleton + health | 01 | API boots |
| B3 | Auth + RBAC (CLIENT/GUIDE/BUSINESS/ADMIN) | 01 | Auth contracts |
| B4 | Expo mobile skeleton | 01 | App tabs shell |
| B5 | Admin web skeleton | 01 | Admin app boots + login shell |
| B6 | **FIRST automated tests** | 01 | Foundation Gate green |

**Gate B:** Do not start Places until Foundation Gate is green.

---

## 4. Stage C — Product core without AI

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| C1 | Geography + categories | 02 | TN + Djerba readable |
| C2 | Places APIs (APPROVED-only public) | 02 | Place contracts |
| C3 | Reviews + favorites + reports | 02 | Social proof |
| C4 | Guide application + contribution APIs | 02 | Guide write paths |
| C5 | Business claim/profile APIs | 02 | Business write paths |
| C6 | Admin moderation APIs | 02 | Approve/reject + audit |
| C7 | Core API integration tests | 02 | Core API Gate green |

---

## 5. Stage D — Local operating knowledge

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| D1–D3 | Transport / arrival / rules APIs | 03 | Knowledge APIs |
| D4 | Djerba seed P0 (**fake data + fake photos OK**) via Guide/Admin | 03 | Seeded DB |
| D5 | Content QA Gate | 03 | Knowledge Gate green |

---

## 6. Stage E — AI Chat (OpenRouter)

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| E1–E2 | Conversations + retrieval tools | 04 | Tooling ready |
| E3 | Orchestrator via **OpenRouter** + citations | 04 | Grounded answers |
| E3b | Admin-readable/writable **active model config** | 04 | Model switch without code change |
| E4–E5 | Safety + **Grounding Gate** | 04 | Golden tests green |

---

## 7. Stage F — Client + portals MVP UX

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| F1 | Expo client full MVP (EN/FR/AR) | 05 | Mobile MVP QA Gate |
| F2 | Admin web MVP (moderation, LLM model, flags, users) | 05b | Admin usable |
| F3 | Guide contribution UX | 05b | Guide can submit content |
| F4 | Business claim/profile UX | 05b | Business basics (no payments) |
| F5 | Portals QA Gate | 05b | MVP portals signed |
| F6 | **Local Companion** (plans, Avatar, SubGuide, rich knowledge, hard filters) | **05c** | Companion Gate (Vision 2.0) |

---

## 8. Stage G — Hardening & Railway staging

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| G1–G2 | Security + performance | 06 | Checklists |
| G3 | **Deploy API (+ admin) to Railway staging** | 06 | Staging URLs |
| G4 | Mobile staging via EAS → TestFlight / Play Internal / EAS internal | 06 | Beta-ready builds |
| G5 | Smoke + backup drill | 06 | Staging Gate green |

---

## 9. Stage H — Closed beta → public MVP

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| H1 | Deepen Djerba seed; replace fake photos via Guide when ready | 07 | Richer content |
| H2 | Invite **30 testers** | 07 | Feedback loop |
| H3–H4 | Fix + metrics Go/No-Go | 07 | Beta Gate |
| H5 | **Railway production** + monitoring + legal/support form | 08 | Launch Gate |

---

## 10. Stage I — After MVP

| Order | Work | Phase | Main output |
| --- | --- | --- | --- |
| I1 | Tunisia cities | 09 | Multi-city |
| I2 | Portal enhancements (Ask-a-Local, richer analytics…) | 10 | Stronger portals |
| I3 | Sponsored listings | 11 | Light revenue |
| I4 | International packs | 12 | New countries |
| I5 | Booking/payments | 13 | Commerce |
| I6 | AI Agent | 14 | Proactive companion |
| I7 | Optional AWS migration | post-08 when scale needs | Cloud maturity |

---

## 11. When tests happen (summary)

| Test type | First appears | Mandatory before |
| --- | --- | --- |
| Lint + auth/health tests | Phase 01 | Phase 02 |
| Core API + guide/business API tests | Phase 02 | Phase 04 |
| Content QA | Phase 03 | Phase 04 |
| AI golden / grounding | Phase 04 | Phase 07 |
| Mobile manual QA | Phase 05 | Phase 06 |
| Admin/Guide/Business QA | Phase 05b | Phase 06 |
| Local Companion QA (plans/Avatar/SubGuide) | Phase 05c | Phase 06 |
| Railway staging smoke | Phase 06 | Phase 07 |
| Beta UAT (30) | Phase 07 | Phase 08 |
| Prod smoke | Phase 08 | public announce |

---

## 12. Dependency rule

```text
Schema/Auth/Admin skeleton tests
  → Core Place + Guide/Business APIs
  → Local knowledge + seed (fake OK)
  → OpenRouter grounded AI (+ admin model config)
  → Expo mobile MVP
  → Admin/Guide/Business MVP UX (05b)
  → Local Companion Vision 2.0 (05c)
  → Railway staging
  → 30-tester beta
  → Railway prod MVP
  → Expansion
```

---

*Next: [02-Definition-of-Done.md](./02-Definition-of-Done.md) · Binding: [07-Decisions-Log.md](./07-Decisions-Log.md)*
