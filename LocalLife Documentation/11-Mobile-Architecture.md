# 11 — Mobile Architecture

**Document type:** Client architecture  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English  
**Stack:** Expo / React Native + TypeScript

> Performance/cache and i18n: [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)  
> UX doctrine: Phase 05c design system (companion, not map browser)

---

## 1. Goals

- One binary: Client + Guide + Business role navigators
- Vision-first **Client IA** + floating **AI Avatar**
- Guide **contribution workspace** + SubGuide team map
- Fast grounded chat with entity cards and plan save
- Limited offline: active plan + emergency + Avatar cues
- Multi-language UI with RTL

---

## 2. Navigation

### Auth stack
Splash → Landing/Welcome → Login/Register → Onboarding (identity + optional hard filters)

### Client tabs (Vision 2.0 IA)

| Tab | Job |
| --- | --- |
| **For You / Plans** | Persona packs, progressive plan timeline, emergency strip |
| **Search** | Universal search → safe detail → add to plan / ask / report |
| **AI Chat** | Grounded answers + plan builder + why-chips |
| **Saved** | Favorites + plans; open companion |
| **Profile** | Identity, hard filters, language, consents |

### Avatar overlay
Draggable floating companion on Client navigator (not a tab). Snap corners; never fully block primary CTAs. RTL docks flip.

### Guide tabs (team-aware)
Home / Map (my zone green + SubGuide borders) / Add (rich forms) / Activity / Profile + **Team** (Add SubGuide → draw border → Waiting Admin)

### Business
Claim/profile navigator (Phase 05b) — unchanged intent.

### Common stacks
Place/Event/Experience detail, Plan detail/editor, Arrival/Transport guides, Settings

---

## 3. Screen responsibilities

### For You / Plans
- Packs by persona
- Active plan timeline (motion)
- Emergency strip
- Entry to Chat / Avatar

### Search
- Query + filters; detail with add-to-plan / ask / report
- No Google-Maps-clone chrome as primary metaphor

### Chat
- Threads, streaming, citations, save-as-plan

### Saved
- Favorites + saved/active plans

### Profile
- Purpose, conservatism, budget, walks/vehicle, vibe, setting, group, hard filters, language

### Guide Map / Team
- Parent zone + child borders
- Propose SubGuide flow

---

## 4. Avatar component

| State | Behavior |
| --- | --- |
| idle | breathe |
| notify | badge + soft pulse |
| speak | chat active |
| celebrate | plan saved |
| soft-warn | replan available (calm copy) |

Tap → sheet: unread cues, Open chat, Continue plan, Hide for session.  
Reduce-motion: static icon + badge.  
APIs: `/v1/me/avatar-cues`, notifications.

---

## 5. Folder structure (indicative)

```text
src/
  navigation/          # Main, Guide, Business navigators
  screens/
    guide/             # forms, map, team/subguide
    ...
  components/          # AvatarFloating, shared UI
  context/             # Auth
  services/            # API clients (plans, avatar, guides)
  i18n/
  theme/
```

---

## 6. State & data

- TanStack Query for server state
- Secure token storage
- Offline payload on `ClientPlan.offlinePayloadJson` + cue cache
- Avoid overusing global stores

---

## 7. Services

`auth` · `places` · `events` · `ai` · `plans` · `avatar` · `localKnowledge` · `favorites` · `guides` (scope/subguides) · `location`

HTTP client with refresh interceptor.

---

## 8. Location

Permission with rationale → manual city fallback → lat/lng to AI/search → **external maps deep link** for directions (turn-by-turn = future).

---

## 9. Offline (companion MVP)

Cache: active plan, emergency strip, Avatar cues, prefs, recent details, arrival/transport for city.  
AI requires network. Explicit offline banner.

---

## 10. Design system notes

- Brand + place imagery; intentional motion (Avatar, plan timeline, sheets)
- Why-chips on suggestions/steps; sponsored labeled
- No fear UI for safety; no purple-glow AI clichés

---

## 11. Analytics

Events in doc `05` (plans, avatar, hard_filter_blocked, subguide_*). Attach `appVersion`, `platform`, `locale`, `cityId`.

---

## 12. Build flavors

`dev` / `staging` / `prod` · feature flags · Sentry in staging/prod

---

*Next: [12 — Backend Architecture](./12-Backend-Architecture.md)*
