# 07 — Decisions Log (Locked)

**Document type:** Binding product/engineering decisions  
**Version:** 2.0  
**Date locked:** 2026-07-24 (re-decision Vision 2.0: 2026-08-02)  
**Status:** LOCKED — Vision 2.0 Local Companion supersedes prior MVP framing where noted below

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

- **One** Expo mobile app with role modes + **Vision 2.0 Local Companion** (For You/Plans, Search, AI Chat, Saved, Profile; floating **AI Avatar**)
- Grounded AI chat (RAG) + **Client plans** (packs, editable timelines, offline)
- Places, events, experiences, reviews, favorites, reports (inaccurate/closed → Admin → Guide → replan)
- Local knowledge: transport (FIXED/METER), arrival, rules, zone safety-by-time, special-place checklists + Djerba seed
- **Guide**: Admin-provisioned Main Guides; hierarchical scope; rich contributions; may **propose SubGuides** (map border) for Admin confirm after formation; may propose Business; **no** Guide Google
- **Business**: Admin-provisioned **or** Guide-proposed then Admin-approved; claim/profile basics (**no payments**)
- **Admin web**: moderation, users, SubGuide confirm queue, assignment cascade, Map, AI model switch, flags, seed
- Multi-language UI: **EN + FR + AR** (RTL for AR)
- Limited offline cache (active plan + emergency + Avatar cues)
- Analytics + crash reporting + rate limits

### Out of MVP (later phases)

- SMS / phone OTP login
- Apple Sign-In (App Store follow-up when Google ships on iOS production)
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
| Guide ops location | **Admin-assigned hierarchical scope**: `assignmentLevel` = Hood → District → City → State (`Region`) → Country. Guide Map = **green circle** (centroid + radius). Guide cannot change assignment. |
| Guide scope radii | Hood 800 m · District 2 500 m · City 8 km · State 40 km · Country 150 km (config constants). |
| Hood | Neighborhood under `District` (`Hood` model); seed examples under Houmt Souk / Midoun. |
| Business ops location | **Same pattern** as Guides for city + district Map pins (Business not using hierarchical levels in MVP). Seed: `business@locallife.local` / `Business123!` (Midoun). |

---

## 6. Roles & provisioning

| Topic | Decision |
| --- | --- |
| Public register (mobile) | **CLIENT only** |
| Client Google Sign-In | **In MVP** — `POST /v1/auth/google` + mobile Auth Session; upsert CLIENT by `googleId` / email; same JWT as password login |
| Client email/password | **In MVP** — from landing “Continue with email” |
| Phone / SMS OTP | **Deferred** — not in this MVP pass; choose provider later |
| Apple Sign-In | **Follow-up** when shipping Google on iOS App Store production |
| Guide create | **Admin web only** (temp password shown once; email mailer later) |
| Business create | **Admin web** *or* **Guide proposes** (`BusinessApplication` PENDING) → Admin approve creates account + temp password |
| Guide / Business Google | **Out of MVP** — email login only (Admin-provisioned) |
| Guide contributions | Places (category + metadata attributes), tips (`HowToGuide`), events, experiences — all `PENDING` until Admin approve; geo entities appear on map when approved |
| Guide historic (Admin) | Counts + recent lists for places, tips, events, experiences, business applications |
| Map pins vs knowledge | Pins = places (and events with place coords). Transport how-to / danger / rental / camping guidance = tips + LocalRules + place metadata — not custom polygons in MVP |
| Tip category keys | Fixed MVP set: `transport`, `safety`, `money`, `sunset`, `repair`, `camping`, `local_tip`. Tips = zone knowledge, not venue reviews |
| Event prerequisites | Optional free-text `Event.prerequisites` for “what to do before” (tickets, booking, bring ID) |
| Guide self-profile | `PATCH /v1/guides/me` — bio, languages, displayName (**not** assignment / city / district — Admin only) |
| Guide Map zone | `GET /v1/guides/me/zone` — assignment circle GeoJSON + own in-scope pins. Guide creates require point inside circle (403 otherwise). |
| Guide media | `POST /v1/media/presign` (R2); if unset, Guides paste public image URL |
| Block | `UserStatus.SUSPENDED` — cannot login; approved content stays until separately unpublished |
| Admin create/delete in UI | **Out of MVP** (seed / script only) |
| Admin accounts | Seed `admin@locallife.local` |

### Wave 2+ (documented, not MVP Wave 1)

- Guide submit/update LocalRule + light Transport hub/route suggestions
- District theme tags without polygons; full mobile Guide form parity
- Aggregated “best of” rankings, neighborhood fit scores, trusted Guide direct-publish tier

---

## 6b. Vision 2.0 — Local Companion (explicit re-decision 2026-08-02)

**North star:** Trusted Guide knowledge + Client identity + AI plans + floating AI Avatar. **Not** a Google Maps clone. UX may be redesigned for this vision (existing screens are not sacred).

### Product identity
| Topic | Decision |
| --- | --- |
| Positioning | Local companion: operating instructions for a zone, personalized plans, grounded AI |
| Client IA | For You / Plans · Search · AI Chat · Saved (favorites + plans) · Profile — vision-first redesign allowed |
| Floating AI Avatar | Draggable companion on Client screens; delivers in-app notifications; opens chat/plan actions; calm tips only (no scare banners) |
| Design doctrine | Brand + place imagery + intentional motion; Avatar + plan timeline are signature motions |

### Guide knowledge (rich)
| Topic | Decision |
| --- | --- |
| Transport | Modes, how-to hubs, FIXED vs METER pricing, availability, Guide comment; AI best scenario + transport-only plans |
| Venues | Event/café/restaurant/bar/hotel: geo, contacts, menu/photos, audience tags, hours, tickets, duration/effort/budget, Guide comment |
| Zone intel | Safety/comfort by time (DAY/NIGHT/WEEKEND); reason; how to arrive; industrial/tourist/residential — **AI-internal**; Client sees derived advice only |
| Gov / shops | Surface: location + phone/email (+ photo for shops) |
| Special places | 3+ photos, checklist, precautions, paid entry, best arrive/leave, difficulty, season note, Guide comment |
| Freshness | `lastReviewedAt` / freshnessScore; monthly Guide refresh notify; no update → AI down-rank |
| Scores | Guide = **comments only**; Client = **rating + comment** |
| Language | Guide writes in chosen language; translation later |

### SubGuide (revised flow)
| Topic | Decision |
| --- | --- |
| Role | Same `GUIDE` role + `parentGuideId` |
| Who invites | **Main Guide** from dashboard (after formation/entretien) |
| Border | Main Guide **draws** SubGuide border on map (inside parent scope) |
| Confirmation | Status `PENDING_ADMIN` until **Admin confirms**; then SubGuide may publish inside border |
| One main per zone | One Main Guide per assignment zone key |

### Client identity & plans
| Topic | Decision |
| --- | --- |
| Onboarding | Light required + optional personality (≤7 Q): purpose, conservatism, budget, walks, vehicle, vibe, setting, group |
| Hard filters | Rules not hints (e.g. never adult nightlife if blocked) |
| Plans | Editable offline timelines; packs (arrival, student, family, care, transport-only…); Chat→save plan; companion + optional nearby |
| Explainability | “Why this for you” on suggestions/steps |
| Reports | Client report inaccurate/closed → Admin → Guide verify → update → replan + notify (Avatar) |
| Offline | Active plan + emergency strip + cached Avatar notifications |

### Sensitive content
| Topic | Decision |
| --- | --- |
| 18+ | Bars / resto-bars (legal leisure), not illegal content |
| Audience fit | e.g. “great for…” tags — preference match, not unfair exclusion |
| Danger labels | Never dump raw “very danger” on Client UI |

### External secrets
Wire OpenRouter / Mapbox / R2 / Google from env when present; mock AI when OpenRouter empty. Never commit secrets.

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
