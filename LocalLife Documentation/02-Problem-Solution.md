# 02 — Problem & Solution

**Document type:** Product strategy  
**Version:** 1.0  
**Language:** English

---

## 1. The problem in one paragraph

When people arrive in an unfamiliar city, they need practical answers for daily life — food, transport, safety, neighborhoods, procedures, events — but information is fragmented across maps, social networks, blogs, and generic AI tools. Existing products each solve only a slice of the problem, and none reliably combine verified local knowledge with personalized, conversational guidance.

---

## 2. Who suffers (by segment)

### 2.1 Tourists

**Pain**

- Fall into tourist traps
- Miss authentic places and local timing (when to go)
- Waste hours comparing conflicting online opinions
- Struggle with local transport norms and payments

**Jobs to be done**

- Discover authentic experiences quickly
- Move safely and efficiently
- Understand “how locals actually do it”

### 2.2 International students

**Pain**

- Need housing, campuses, cheap food, clinics, admin offices
- Budget constraints are strict
- Local bureaucracy is opaque
- Transport subscriptions and student discounts are hard to understand

**Jobs to be done**

- Build a sustainable daily routine
- Minimize cost and confusion
- Find student-relevant places and events

### 2.3 Expats / new residents

**Pain**

- Need banks, SIM, internet, neighborhoods, regulations
- Long-term decisions are high-stakes
- Tourism content is useless for settling

**Jobs to be done**

- Settle permanently with fewer mistakes
- Understand local rules and services
- Discover livable areas matching lifestyle

### 2.4 Business travelers

**Pain**

- Time-poor
- Need hotels, meeting cafés, airport transfers, safe zones
- Do not want long research sessions

**Jobs to be done**

- Get correct recommendations in minutes
- Reduce friction between airport, hotel, and meetings

### 2.5 Local residents

**Pain**

- Still miss new restaurants, events, hidden spots
- City discovery content is noisy

**Jobs to be done**

- Discover what’s new and relevant nearby

---

## 3. Why current solutions fail

| Solution | What it does well | Critical gap |
| --- | --- | --- |
| Google Maps | Navigation, place discovery | Weak “local life operating manual”; limited personalization by life context |
| TripAdvisor | Tourism reviews | Tourism-skewed; weak daily-life adaptation |
| Reddit | Real anecdotes | Unstructured, hard to search, uneven trust |
| Facebook Groups | Community answers | Noisy, slow, not GPS-intelligent |
| Generic ChatGPT-like tools | Fluent answers | Not grounded in verified local inventory; can hallucinate |
| City blogs / influencers | Inspiration | Outdated, biased, not queryable in context |

**Conclusion:** Users assemble a mental mashup of five apps. LocalLife replaces the mashup with one grounded assistant.

---

## 4. Opportunity statement

There is demand for a single intelligent assistant that answers practical city questions using:

- verified local data
- GPS context
- user profile (role, budget, interests)
- structured local systems (transport, rules, arrival playbooks)
- community signal weighted by trust

---

## 5. Solution overview

### 5.1 What LocalLife AI is

An AI-powered mobile platform that connects users to **structured local knowledge** and explains:

- why visit
- when to visit
- who it is for
- how to get there
- how to pay / behave / prepare
- what locals recommend instead

### 5.2 Conceptual flow

```text
User question
  + GPS
  + profile (segment, budget, interests, language)
  ↓
Retrieve verified knowledge (places, events, rules, transport, guides)
  ↓
Rank / filter (distance, fit, trust, hours, popularity)
  ↓
LLM generates natural answer with citations to entities
  ↓
User can open place / save / navigate / ask follow-up
```

### 5.3 Product pillars

1. **AI Conversation** — natural questions
2. **Verified Knowledge Graph** — places, experiences, rules, transport systems
3. **Personalization** — segment + preferences
4. **Geocontext** — GPS, distance, routes
5. **Community + Experts** — guides, reviews, businesses (moderated)
6. **Future commerce** — booking/marketplace (after trust is established)

---

## 6. Why LocalLife is different

| Dimension | Typical travel app | LocalLife AI |
| --- | --- | --- |
| Focus | Attractions | Daily life + experiences |
| Answers | Lists/pins | Conversational + explained |
| Knowledge | Scraped/generic | Verified + sourced |
| Transport | Generic modes | Local systems (e.g., louage) as first-class data |
| Rules | Rarely modeled | LocalRule entities by scope |
| Arrival | Blog posts | Structured airport playbooks |
| AI | Optional chatbot | Core interface, grounded |
| Scale model | Hardcoded cities | Country packs + hierarchy |

---

## 7. Solution principles for local complexity

Cities are not interchangeable. Tunisia’s transport and procedures differ from Finland or China.

Therefore LocalLife models:

- **TransportSystem** per city/country (not only global mode enums)
- **LocalRule** with scope + severity + source
- **ArrivalGuide** + ordered **GuideStep** for first-hour actions
- **PaymentMethod** norms per system
- **CountryPack** content bundles for expansion

This is product strategy, not only database design:  
**local operating knowledge is a core feature.**

---

## 8. Example questions the product must answer well

- Where can I find a quiet café nearby on a student budget?
- What should I do this weekend in Djerba?
- Which beach is best for sunset today?
- How do I buy a bus/transport subscription?
- Is this neighborhood safe at night for a solo traveler?
- Where can I eat local food instead of tourist restaurants?
- What do I do first when I leave the airport?
- How do I take a louage, what does it cost, and how do I pay?

If the database cannot support these answers structurally, the schema is incomplete.

---

## 9. MVP solution boundary (Djerba)

**In scope**

- Auth + profiles
- AI chat grounded on Djerba knowledge
- Places, events, experiences (basic)
- Reviews, favorites
- GPS distance/navigation handoff
- Structured transport + arrival + key local tips for Djerba

**Out of scope for MVP UI (but schema-ready where needed)**

- Full booking payments
- Full marketplace
- Proactive autonomous agent actions
- Nationwide Tunisia coverage on day one

---

## 10. Solution success condition

A new arrival in Djerba can open LocalLife and, within minutes, get trustworthy answers for:

1. first actions after landing  
2. how to move and pay  
3. where to eat/stay/explore for their profile  
4. what to avoid  

…without opening five other apps.

---

*Next: [03 — Actors, Roles & Permissions](./03-Actors-Roles-Permissions.md)*
