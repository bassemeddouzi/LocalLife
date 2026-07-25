# 04 — User Personas & Journeys

**Document type:** UX / product  
**Version:** 1.0  
**Language:** English

---

## 1. Persona summary

| Persona | Main goal | Time horizon | Budget sensitivity |
| --- | --- | --- | --- |
| Tourist | Explore authentically | Days–weeks | Medium–high variance |
| International student | Build daily life | Months–years | High |
| Expat / new resident | Settle permanently | Years | Medium |
| Business traveler | Save time | Hours–days | Lower (time > money) |
| Local resident | Discover what’s new | Ongoing | Variable |

---

## 2. Persona details

### 2.1 Tourist — “Sara, 28”

- Visits Djerba for 5 days
- Wants beaches, food, sunset spots, less tourist-trap risk
- Asks conversational questions, saves favorites, follows map links

**Critical needs:** attractions, restaurants, beaches, events, local food, transport, safety, hidden places

### 2.2 International student — “Youssef, 21”

- New semester in a Tunisian city (later phases); for MVP may visit/study-related stay patterns
- Needs cheap eats, libraries, clinics, transport passes, admin tips

**Critical needs:** affordable housing pointers, discounts, universities, transport, healthcare, coworking

### 2.3 Expat — “Elena, 34”

- Moving for work
- Needs neighborhoods, banks, SIM/internet, hospitals, regulations

**Critical needs:** settle-fast playbooks + trustworthy local rules

### 2.4 Business traveler — “Mark, 41”

- 48-hour trip
- Needs airport → hotel → meeting café → dinner → airport

**Critical needs:** speed, reliability, safety, low decision friction

### 2.5 Local — “Amine, 26”

- Lives in city, wants new restaurants/events/weekends

**Critical needs:** freshness, personalization, less tourist noise

---

## 3. Core journeys (MVP)

### Journey A — First open after landing

```text
1. Install / open app
2. Sign up (email or social later)
3. Select language + trip purpose (tourist/student/...)
4. Allow GPS (or set city manually)
5. Optional: “Just arrived at airport?” → Arrival Guide
6. Ask AI first question OR browse Home recommendations
7. Save 2–3 places
```

**Success:** user completes an arrival-useful action in < 5 minutes.

### Journey B — “Where should I eat tonight?”

```text
1. Open AI Chat
2. Ask natural question (+ budget/food preference)
3. AI returns 3 options with why/distance/price band
4. User opens Place Details
5. Checks tips + hours + reviews
6. Navigates / saves favorite
```

### Journey C — Weekend plan

```text
1. Ask “What should I do this weekend?”
2. AI mixes events + experiences + places
3. User saves an Experience
4. (Future) convert to itinerary / booking
```

### Journey D — Local transport how-to

```text
1. Ask “How do I get from the airport to Midoun?”
2. AI retrieves TransportSystem + GuideSteps + hubs
3. Explains mode, payment, approx cost, warnings
4. Links to hub place / map
```

### Journey E — Guide contribution (Phase 2, schema-ready)

```text
1. Guide applies / gets approved
2. Adds hidden café with tips + photos
3. Submits for approval
4. Admin approves
5. Entity becomes AI-retrievable
```

---

## 4. Journey requirements that force database design

| User moment | Knowledge object required |
| --- | --- |
| Leave airport | ArrivalGuide + GuideStep |
| Take louage/taxi | TransportSystem + PaymentMethod + pricing fields |
| Respect local norms | LocalRule (scope/severity) |
| Find student-budget food | Place + tags + priceLevel + audience fit |
| Sunset plan | Place attributes + bestTime notes + Experience |
| Trust the answer | verificationStatus + sourceType |

---

## 5. UX principles by journey stage

1. **Onboarding:** ask only what changes answers (purpose, interests, budget band, language)
2. **Home:** location + AI shortcut + nearby + events (no dashboard clutter)
3. **Chat:** answers with entity cards, not walls of text only
4. **Details:** why / when / who / how / tips
5. **Saved:** quick revisit
6. **Trust UI:** show “Verified local knowledge” / source badges when useful

---

## 6. Accessibility & language

- Primary UI languages roadmap: English, French, Arabic (Tunisian content may be bilingual)
- Content entities should support translations table
- MVP may ship EN/FR first; schema must not block AR

---

## 7. Edge cases to design for

- GPS denied → manual city selection
- Offline → cached favorites/recent places
- Conflicting reviews → show distribution, prefer verified tips
- Sponsored place in AI answer → clear “Sponsored” label
- No data for query → honest fallback + suggest broader question (never invent)

---

*Next: [05 — Features (MVP)](./05-Features-MVP.md)*
