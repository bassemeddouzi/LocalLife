# 07 — Decisions Log (Locked)

**Document type:** Binding product/engineering decisions  
**Version:** 1.1  
**Date locked:** 2026-07-24  
**Status:** LOCKED for MVP — change only with explicit re-decision

---

## 1. Team & ownership

| Topic | Decision |
| --- | --- |
| Team size | **Solo** |
| Prod secrets access | **Admin only** (same person wearing Admin hat) |
| Privacy policy & Terms | Written/owned by **Guide role / project owner** before public launch |
| User support | **In-app / web support form** |
| Beta testers target | **30** |
| Launch bar | **Phase 07 Go/No-Go + Phase 08 Launch Gate** |

---

## 2. Repository & apps

| Topic | Decision |
| --- | --- |
| Repo style | **Monorepo** |
| Apps in monorepo | `apps/api` · `apps/mobile` · `apps/admin` · optional `packages/shared-types` |
| Mobile framework | **Expo first** (switch to bare RN later only if blocked) |
| Mobile targets | **iOS + Android** |
| Admin surface | **Real Admin web app** (not scripts-only) |

---

## 3. MVP product scope (updated)

### In MVP (must ship before/at public Djerba launch)

- Client mobile app (Expo): auth, home, explore, chat, saved, profile
- Grounded AI chat (RAG)
- Places, events, experiences, reviews, favorites, reports
- Local knowledge: transport, arrival, rules + Djerba seed
- **Guide portal capabilities in MVP** (account from start, contribute content, moderated)
- **Business portal basics in MVP** (claim/profile; **no payments**)
- **Admin web app**: moderation, users/roles, content, seed tools, feature flags, **LLM model config**
- Multi-language UI + content path: **EN + FR + AR** (RTL for AR)
- Limited offline cache
- Analytics + crash reporting + rate limits

### Out of MVP (later phases)

- Booking / payments / marketplace (Phase 13)
- Full proactive AI Agent (Phase 14)
- Heavy monetization beyond prep (Phase 11+)
- AWS migration (optional after Railway prod)
- Deep Tunisia multi-city (Phase 09) — after Djerba MVP

---

## 4. Vendors & infrastructure

| Topic | Decision |
| --- | --- |
| LLM gateway | **OpenRouter** (access many models: OpenAI, Claude, Gemini, …) |
| Model switching | **From Admin Dashboard**, without code change |
| Maps | **Mapbox** |
| Staging host | **Railway** |
| Production host | **Railway initially**; migrate to **AWS** later if scale requires |
| Object storage | Cloudflare R2 (unchanged recommendation) |
| Beta distribution | **TestFlight** (iOS) + **Google Play Internal Testing** (Android) |
| Quick internal builds | **EAS Internal Distribution** (APK/IPA-style internal) |

---

## 5. Geography & content ops

| Topic | Decision |
| --- | --- |
| First city | **Djerba** (known deeply by owner) |
| Early data | **Fake/demo seed allowed** for development tests |
| Early photos | **Fake/placeholder images first** |
| Real Djerba media | Uploaded later via **Guide account** |
| Guide from day one | Create **Guide account early** and use it to enter/manage seed |

---

## 6. Work Plan implications

1. Phase 00 repo decision is **pre-answered** (monorepo + 3 apps + Expo).
2. Phase 01 must scaffold **api + mobile (Expo) + admin**.
3. Phase 02–04 must include Guide/Business **API** capabilities needed for MVP.
4. **Phase 05b** delivers Admin + Guide + Business **MVP UX** before staging.
5. Phase 04 AI uses **OpenRouter**; Admin can change default model.
6. Phase 06/08 deploy targets = **Railway**.
7. Phase 07 beta size = **30 testers**.
8. Phase 10 becomes **portal enhancements**, not first introduction of Guide/Business.

---

## 7. OpenRouter Admin config (contract)

**Takes (Admin sets):** API key ref (secret), default model id, optional fallback model, enabled flag, rate/budget notes  
**Gives (API runtime):** Chat orchestrator reads active model config from DB/config store — **no redeploy to switch model**

---

*All Work Plan phases must stay consistent with this log.*
