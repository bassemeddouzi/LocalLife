# 07 — Decisions Log (Locked)

**Document type:** Binding product/engineering decisions  
**Version:** 1.4  
**Date locked:** 2026-07-24 (updated 2026-07-26)  
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
| Mobile binary | **Single app** — UI switches by role (`CLIENT` / `GUIDE` / `BUSINESS`) after login |
| Admin surface | **Real Admin web app** (not scripts-only; not a separate Admin mobile app) |

---

## 3. MVP product scope (updated)

### In MVP (must ship before/at public Djerba launch)

- **One** Expo mobile app: Client (auth, home, explore, chat, saved, profile) + Guide mode + Business mode by role
- Grounded AI chat (RAG) for Client
- Places, events, experiences, reviews, favorites, reports
- Local knowledge: transport, arrival, rules + Djerba seed
- **Guide**: Admin-provisioned accounts; zone-knowledge contributor (places + attributes, tips, events, experiences — all moderated); may **propose Business** applications; login on same mobile app (**no** public Guide registration)
- **Business**: Admin-provisioned **or** Guide-proposed then Admin-approved; claim/profile basics (**no payments**); same mobile app
- **Admin web**: moderation (incl. events/experiences/business applications), **Clients / Guides / Business** lists, Add Guide/Business (Guide requires city + district), Block/Reactivate, **full Guide historic** (all contribution types), **Map** (service zone + Guide/Business base pins + places), AI model switch, feature flags, seed tools
- Multi-language UI + content path: **EN + FR + AR** (RTL for AR)
- Limited offline cache
- Analytics + crash reporting + rate limits

### Out of MVP (later phases)

- Separate Guide or Business store apps / flavors
- Admin mobile app
- SMTP invite emails (staging: show temporary password once in Admin UI)
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
| Guide from day one | **Admin creates** Guide (or seed `guide@locallife.local`) — no self-serve Guide signup by default (`FF_GUIDE_SELF_APPLY=false`) |
| Guide ops location | **Admin-assigned** `baseCityId` + `primaryDistrictId` (district centroid on Admin map). New Guides require both. |
| Business ops location | **Same pattern** as Guides — Admin-assigned city + district; Map purple pins. Seed: `business@locallife.local` / `Business123!` (Midoun). |

---

## 6. Roles & provisioning

| Topic | Decision |
| --- | --- |
| Public register (mobile) | **CLIENT only** |
| Guide create | **Admin web only** (temp password shown once; email mailer later) |
| Business create | **Admin web** *or* **Guide proposes** (`BusinessApplication` PENDING) → Admin approve creates account + temp password |
| Guide contributions | Places (category + metadata attributes), tips (`HowToGuide`), events, experiences — all `PENDING` until Admin approve; geo entities appear on map when approved |
| Guide historic (Admin) | Counts + recent lists for places, tips, events, experiences, business applications |
| Map pins vs knowledge | Pins = places (and events with place coords). Transport how-to / danger / rental / camping guidance = tips + LocalRules + place metadata — not custom polygons in MVP |
| Block | `UserStatus.SUSPENDED` — cannot login; approved content stays until separately unpublished |
| Admin create/delete in UI | **Out of MVP** (seed / script only) |
| Admin accounts | Seed `admin@locallife.local` |

### Wave 2+ (documented, not MVP Wave 1)

- Guide submit/update LocalRule + light Transport hub/route suggestions
- District theme tags without polygons; full mobile Guide form parity
- Aggregated “best of” rankings, neighborhood fit scores, trusted Guide direct-publish tier

---

## 7. Work Plan implications

1. Phase 00 repo decision is **pre-answered** (monorepo + 3 apps + Expo).
2. Phase 01 must scaffold **api + mobile (Expo) + admin**.
3. Phase 02–04 must include Guide/Business **API** capabilities needed for MVP.
4. **Phase 05b** delivers Admin + Guide + Business **MVP UX** before staging.
5. Phase 04 AI uses **OpenRouter**; Admin can change default model.
6. Phase 06/08 deploy targets = **Railway**.
7. Phase 07 beta size = **30 testers**.
8. Phase 10 becomes **portal enhancements**, not first introduction of Guide/Business.
9. **One mobile binary** with role navigators — do not split Guide/Business into separate Expo apps for MVP.

---

## 8. OpenRouter Admin config (contract)

**Takes (Admin sets):** API key ref (secret), default model id, optional fallback model, enabled flag, rate/budget notes  
**Gives (API runtime):** Chat orchestrator reads active model config from DB/config store — **no redeploy to switch model**

---

*All Work Plan phases must stay consistent with this log.*
