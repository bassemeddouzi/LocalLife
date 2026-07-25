# 11 — Mobile Architecture

**Document type:** Client architecture  
**Version:** 1.1  
**Language:** English  
**Stack:** React Native + TypeScript

> Performance/cache and i18n rules: [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)

---

## 1. Goals

- One codebase for iOS and Android
- Feature-based structure for scale
- Fast AI chat UX with entity cards
- GPS-aware home and recommendations
- Offline cache for limited use
- App must feel light (no lag): pagination, image compression, Query caching
- Multi-language UI with RTL support for Arabic

---

## 2. Navigation

### Auth stack
Splash → Welcome → Login/Register → Onboarding preferences

### Main tabs (bottom navigation)
1. **Home**
2. **Explore**
3. **Chat**
4. **Saved**
5. **Profile**

### Common stacks
Place Details, Event Details, Experience Details, Arrival Guide, Transport Guide, Settings

---

## 3. Screen responsibilities

### Home
- Current city/GPS state
- AI shortcut
- Categories
- Nearby recommendations
- Events highlights
- Arrival CTA if newly arrived / airport geofence later

### Explore
- Map + list toggle
- Filters (category, price, distance, open now)
- Search

### Chat
- Conversation list + active thread
- Composer
- Streaming/typed assistant responses
- Citation cards (place/transport/rule/guide)

### Saved
- Favorites by type
- (Later) trips/itineraries

### Profile
- Persona, interests, budget, language
- Notification settings
- Legal links / logout

---

## 4. Folder structure

```text
src/
  app/                 # providers, entry
  features/
    auth/
    home/
    explore/
    chat/
    places/
    events/
    experiences/
    saved/
    profile/
    localKnowledge/
  components/          # shared UI
  navigation/
  services/            # API clients
  hooks/
  store/               # if needed
  utils/
  assets/
  theme/
  types/
```

Feature modules own screens, hooks, and API calls for that domain.

---

## 5. State & data fetching

Recommended approach:

- Server state via React Query / TanStack Query
- Light local UI state via React state / context
- Secure token storage (Keychain/Keystore wrappers)
- Avoid overusing global stores

---

## 6. Services layer

- `authService`
- `placesService`
- `eventsService`
- `aiService`
- `localKnowledgeService`
- `favoritesService`
- `locationService`

All HTTP through one API client with refresh-token interceptor.

---

## 7. Location strategy

1. Request permission with clear rationale
2. Fallback to manual city picker
3. Pass lat/lng to AI and search endpoints
4. Debounce location updates
5. Deep-link to external maps for turn-by-turn

---

## 8. Offline strategy (MVP)

Cache:

- recent place details viewed
- favorites
- user preferences + consents
- last arrival guide / transport systems for current city
- categories for current city

Show explicit offline banner.  
AI requires network in MVP.

### Cache TTLs (guideline)

| Resource | Client TTL guideline |
| --- | --- |
| Categories | 12–24h |
| Arrival/transport guides | 6–24h |
| Home feed | 5–15 min |
| Place detail | 15–60 min (invalidate on pull) |
| Conversations list | 1–5 min |

---

## 9. Design system notes

- Define theme tokens (colors, spacing, typography)
- Entity cards reusable across Home/Chat/Explore
- Always show recommendation `reasons[]` (“why this”)
- Always label sponsored content
- Keep Chat readable: short paragraphs + cards + actions + follow-up chips
- i18n: no hardcoded user-facing strings; support RTL

---

## 10. Analytics hooks

Log screen views and key actions defined in MVP doc (`05`) and NFR doc (`20`).  
Always attach `appVersion`, `platform`, `locale`, `cityId` when known.

---

## 11. Build flavors

- `dev` / `staging` / `prod` API bases
- Feature flags fetched or bundled for gradual rollout
- Crash reporting enabled in staging/prod

---

## 12. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)

---

*Next: [12 — Backend Architecture](./12-Backend-Architecture.md)*
