# 05 — Features (MVP)

**Document type:** Product specification  
**Version:** 1.1  
**Language:** English  
**MVP target geography:** Djerba, Tunisia

---

## 1. MVP goal

Validate that a grounded AI local companion helps real users make better daily decisions in one city (Djerba) with trustworthy content.

MVP must also satisfy non-functional requirements in [20 — NFRs](./20-Non-Functional-Requirements.md): fast/cached UX, security, traceability, multi-language readiness.

---

## 2. MVP feature list (must ship)

### 2.1 Product features

1. Authentication & user profile
2. Preferences (segment, interests, budget, language, consents)
3. Home feed (location-aware, cached)
4. AI Chat (RAG over verified data) with citations + “why this?” reasons
5. Places browse + detail (paginated)
6. Events browse + detail
7. Experiences (basic)
8. Reviews & photos
9. Favorites
10. GPS distance + navigation handoff
11. Basic local knowledge: transport systems, arrival guide, key local tips/rules
12. Report content (places/reviews/events/AI answers)
13. Admin moderation basics (can be simple internal console)
14. Multi-language UI framework (EN + at least one of FR/AR) + translation tables

### 2.2 Platform must-haves (not optional)

15. Analytics event pipeline (see §6 and doc 20)
16. Rate limiting on auth/AI/reviews
17. Soft delete on user content
18. Feature flags service
19. Crash reporting (Sentry or equivalent)
20. Request ID propagation in API logs

---

## 3. Feature specifications

### 3.1 Authentication

**Includes**

- Email + password sign-up/login
- JWT access + refresh tokens
- Logout / token rotation
- Password reset (email) — recommended in MVP if feasible; else immediately post-MVP

**Roles in MVP**

- Client fully supported
- Admin supported
- Guide/Business can exist in schema; UI may be limited

### 3.2 Profile & preferences

**Fields**

- Display name, photo
- Primary persona: TOURIST | STUDENT | EXPAT | BUSINESS | LOCAL
- Interests tags
- Budget band: LOW | MEDIUM | HIGH
- Languages / locale
- Home city (optional)
- Notification preferences (structure ready)
- Consent flags: analytics, personalized recommendations, marketing, push

### 3.3 Home

**Shows**

- Current city / GPS status
- Shortcut to AI Chat
- Category chips
- Nearby recommended places
- Upcoming events
- Optional “Just arrived?” arrival CTA

### 3.4 AI Chat (MVP)

**User can**

- Ask natural language questions
- Share/attach current GPS context automatically
- Receive answers with referenced places/events/guides
- Tap entity cards to open details
- Continue multi-turn conversation

**System must**

- Retrieve only APPROVED knowledge by default
- Include “why” rationale / reason tags on entity cards
- Refuse to invent local facts; say when data is missing
- Log messages + citations for quality improvement and future ranking
- Enforce rate limits
- Offer simple follow-up chips when feasible (Cheaper / Closer / More local) — MVP+ acceptable if core chat ships first

**MVP tools for the AI**

- `searchPlaces`
- `searchEvents`
- `getTransportOptions`
- `getArrivalGuide`
- `getLocalRules`
- `getPlaceById`

### 3.5 Places

**Categories (initial)**

Restaurants, cafés, beaches, hotels, museums, supermarkets, pharmacies, hospitals, parks, shopping centers, banks, ATMs, gas stations, mosques, churches, gyms, transport hubs, universities, coworking, government offices (as available)

**Place detail must include**

- Name, description, category
- GPS, address text
- Opening hours
- Photos
- Price level
- Tags / audience fit
- Local tips
- Reviews summary
- Distance/ETA when GPS known
- Sponsored badge if applicable

### 3.6 Events

- Title, description, schedule, place/location
- Category (concert, festival, workshop, etc.)
- Audience tags
- Link/source

### 3.7 Experiences

A packaged activity narrative (e.g., “Djerba Sunset Experience”) combining multiple stops/tips.

**MVP fields**

- Title, summary, duration estimate
- Steps / included place references
- Price band
- Ideal audience
- Photos

### 3.8 Reviews

- Star rating
- Text
- Optional photos
- Moderation state
- One active review per user per place (update allowed)

### 3.9 Favorites

- Save place / event / experience
- List & remove
- (Schema ready for saved trips; UI optional in MVP)

### 3.10 GPS & navigation

- Capture device location (permissioned)
- Compute distance
- Provide deep link to Mapbox/Google Maps directions
- Show preferred transport note when available

### 3.11 Local knowledge (MVP-critical)

Even in MVP, Djerba needs:

- Airport arrival playbook
- How local transport works (taxi, louage, bus if any, boat if relevant)
- Payment norms
- Key safety / practical rules

This is not “phase 2 content”. It is core differentiation.

### 3.12 Admin basics

- Approve/reject places, events, experiences
- Moderate reviews/reports
- Manage categories
- Mark content verified
- Manage city activation

---

## 4. Explicit non-features for MVP UI

- Autonomous booking agent actions
- Payment checkout
- Full marketplace
- Smart proactive notifications at scale
- Multi-country browsing as a growth loop (may allow architecture, not marketing focus)
- Advanced offline city guides (premium later)

These remain **schema/architecture ready** where specified in docs 06–08.

---

## 5. Acceptance criteria (product)

MVP is successful if:

1. A new user can get a grounded answer about food/transport/arrival in Djerba.
2. Answers cite real Place/Transport/Guide entities from DB.
3. Users can save and revisit places.
4. Admins can block bad content; users can report content.
5. Expanding to a second Tunisian city requires **data + config**, not redesign.
6. App feels responsive with caching/pagination (NFR checklist passes).
7. Core analytics events fire with `appVersion` + `platform`.
8. Consents are stored and respected for non-essential tracking.

---

## 6. Analytics events (minimum)

- `auth_sign_up` / `auth_login`
- `chat_message_sent`
- `chat_answer_grounded` / `chat_answer_ungrounded`
- `chat_citation_clicked`
- `place_view`
- `place_save` / `place_unsave`
- `review_create`
- `search_performed`
- `recommendation_impression` / `recommendation_click`
- `arrival_guide_open`
- `transport_guide_open`
- `nav_handoff_click`
- `content_report_create`

Every event should include context fields defined in doc 20 (§4.3).

---

## 7. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)

---

*Next: [06 — Features (Future)](./06-Features-Future.md)*
