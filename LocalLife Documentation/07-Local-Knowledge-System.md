# 07 — Local Knowledge System

**Document type:** Domain model / content architecture  
**Version:** 1.0  
**Language:** English  
**Why this document exists:** Local transport, laws/practical rules, and arrival procedures differ by country and city. They must be modeled as data, not hardcoded product logic.

---

## 1. Problem this system solves

A traveler can open Google Maps in Tunisia, China, or Finland and see roads.  
They still will not know:

- how **louage** works vs metro tickets vs city cards
- how payment is expected (cash, app, card, negotiation norms)
- what to do in the **first hour after landing**
- which practical rules matter for visitors vs residents

LocalLife’s differentiation depends on encoding this as a **structured Local Knowledge System** retrievable by AI.

---

## 2. Knowledge layers

```text
Layer A — Geography
Country → Region → City → District → Neighborhood → Place

Layer B — Local systems
TransportSystem, Payment norms, LocalRule packs

Layer C — Procedural guides
ArrivalGuide, HowToGuide, GuideStep sequences

Layer D — Places & experiences
Place, Event, Experience, Review

Layer E — Trust
verificationStatus, sourceType, trustWeight
```

AI answers by composing layers B–D inside geographic scope A, filtered by trust E and user profile.

---

## 3. Country packs

A **Country Pack** is a versioned bundle of local operating knowledge.

### 3.1 Contents

- default locales / languages
- currency
- emergency numbers
- transport systems library
- local rules library
- arrival guides for major airports
- cultural practical tips
- payment norms summary

### 3.2 Activation

Countries/cities can be `DRAFT | ACTIVE | DISABLED`.  
MVP: Tunisia pack active, Djerba city deep-seeded.

### 3.3 Expansion rule

New country = new pack data + translations + seeding workflow.  
Not a fork of the application.

---

## 4. Transport knowledge model

### 4.1 Global modes (enum dictionary)

Use stable global modes, then specialize locally:

- `BUS`
- `METRO`
- `TRAM`
- `TRAIN`
- `TAXI`
- `RIDE_HAILING`
- `SHARED_TAXI` (maps to louage-style systems)
- `FERRY`
- `BOAT`
- `BIKE`
- `SCOOTER`
- `WALK`
- `CAR_RENTAL`
- `AIRPORT_SHUTTLE`
- `OTHER`

### 4.2 TransportSystem (local)

Represents a real local system, e.g.:

- “Djerba Airport Taxis”
- “Louage from Houmt Souk”
- “Tunis Light Metro” (later)
- “Helsinki HSL” (later)
- “Shanghai Metro” (later)

**Key fields (conceptual)**

- id, name, slug
- countryId, cityId (nullable for nationwide systems)
- mode
- description / howItWorks
- accessInstructions (how to find/board)
- paymentMethods[]
- pricingType: `FIXED | METERED | ZONE | SUBSCRIPTION | NEGOTIABLE | FREE`
- priceMin, priceMax, currency
- apps / operators (optional links)
- operatingHours
- coverageNotes
- accessibilityNotes
- warnings[]
- verificationStatus
- sourceType

### 4.3 TransportHub

Stations, louage stands, ports, taxi ranks.

Link hubs to Place (geo) and TransportSystem.

### 4.4 TransportRoute (optional MVP-light, stronger later)

- fromHub → toHub
- systemId
- approxDurationMin
- approxPrice
- frequencyNotes
- scheduleRef (future GTFS)

### 4.5 Tunisia examples (illustrative)

| Local reality | Mode mapping | Pricing type notes |
| --- | --- | --- |
| Individual taxi | TAXI | Metered or zone; cash common |
| Louage | SHARED_TAXI | Fixed-ish per seat/destination; cash |
| City bus | BUS | Ticket/subscription patterns vary |
| Ferry to islands | FERRY | Scheduled; ticketed |
| Ride apps (where available) | RIDE_HAILING | App payment |

**Never assume** Finland-style contactless city cards exist in Djerba. Encode actual norms.

---

## 5. Payment norms

Payment is cross-cutting (transport, venues, services).

### 5.1 PaymentMethod enum examples

- `CASH`
- `CARD`
- `CONTACTLESS`
- `BANK_TRANSFER`
- `MOBILE_MONEY`
- `APP_PAY`
- `TRANSPORT_CARD`
- `QR_PAY`
- `OTHER`

### 5.2 Acceptance profiles

Attach accepted methods to:

- TransportSystem
- Place (optional)
- GuideStep (e.g., “pay taxi in cash”)

Include notes like “small bills recommended”, “cards rarely accepted”.

---

## 6. Local rules & practical law tips

### 6.1 What LocalRule is

Practical, scoped guidance users should know — **not** a substitute for official legal counsel.

Categories examples:

- `ENTRY_VISA`
- `SAFETY`
- `TRANSPORT`
- `MONEY`
- `DRESS_CULTURE`
- `RELIGION_CUSTOMS`
- `ALCOHOL`
- `PHOTOGRAPHY`
- `HEALTH`
- `INTERNET_COMMS`
- `HOUSING`
- `WORK_STUDY`
- `EMERGENCY`
- `OTHER`

### 6.2 Scope

`WORLD` rarely used → prefer:

- `COUNTRY`
- `REGION`
- `CITY`
- `DISTRICT`
- `PLACE` (rare)

### 6.3 Severity

- `INFO`
- `IMPORTANT`
- `CRITICAL`

### 6.4 Audience targeting

- `ALL`
- `TOURIST`
- `STUDENT`
- `EXPAT`
- `BUSINESS`
- `LOCAL`

### 6.5 Trust fields

- sourceType: `OFFICIAL | ADMIN | GUIDE_VERIFIED | COMMUNITY`
- sourceUrl optional
- lastReviewedAt
- verificationStatus

### 6.6 AI behavior for rules

- Prefer CRITICAL/IMPORTANT rules when relevant to query
- Always avoid overconfident legal claims
- Quote/summarize verified LocalRule entries
- Encourage checking official sources for immigration/legal status

---

## 7. Arrival & how-to procedural knowledge

### 7.1 ArrivalGuide

One per airport/major arrival point (or city-level fallback).

Example: Djerba–Zarzis Airport arrival guide.

Fields:

- airportPlaceId / cityId
- title
- summary
- audience variants optional
- estimatedTotalTime
- verificationStatus

### 7.2 GuideStep

Ordered steps:

| Field | Example |
| --- | --- |
| stepOrder | 1 |
| title | Get local currency / ATM |
| actionType | EXCHANGE_MONEY / BUY_SIM / TAKE_TAXI / ... |
| description | What to do |
| estimatedTimeMin | 15 |
| estimatedCostMin/Max | values + currency |
| paymentMethods | CASH, CARD |
| relatedTransportSystemId | optional |
| relatedPlaceId | booth/operator |
| warnings | scam/taxi notes |
| isOptional | false |

### 7.3 HowToGuide (general)

Same step machinery for non-arrival procedures:

- How to buy a transport subscription
- How to register a SIM
- How to get to Midoun from Houmt Souk
- How to visit a specific administrative office

---

## 8. Action types (controlled vocabulary)

Use stable actionType values for steps:

- `CLEAR_IMMIGRATION`
- `BUY_SIM`
- `EXCHANGE_MONEY`
- `WITHDRAW_ATM`
- `TAKE_TAXI`
- `TAKE_SHARED_TAXI`
- `TAKE_BUS`
- `TAKE_FERRY`
- `BOOK_TRANSFER`
- `GO_TO_PLACE`
- `BUY_TICKET`
- `INSTALL_APP`
- `REGISTER_ACCOUNT`
- `CHECK_SAFETY`
- `OTHER`

This allows AI and UI to render consistent checklists.

---

## 9. Content quality standards

Every local-knowledge item should have:

1. Clear geographic scope
2. Short AI-ready summary
3. Detailed body
4. Source/trust metadata
5. Review date
6. Language/translation support
7. Approval state

**Bad:** 2,000-character blog paste with no structure.  
**Good:** summary + steps + warnings + linked entities.

---

## 10. Retrieval strategy for AI

When user asks a procedural question:

1. Detect intent: arrival / transport / rules / place discovery
2. Resolve city from GPS or profile
3. Query relevant tables with city/country scope
4. Rank by severity, verification, distance, audience fit
5. Generate answer that references entities
6. If missing data → say so and ask clarifying question

---

## 11. Djerba MVP minimum knowledge set

Before launch, seed at least:

1. Airport arrival guide (full steps)
2. Taxi system notes + payment
3. Louage system notes (if applicable to user routes)
4. Major hubs (airport, Houmt Souk, Midoun, key stands)
5. Safety/practical rules (night movement, tourist zones, emergency numbers)
6. SIM/money first-hour tips
7. 50–200 quality places across priority categories
8. Core events/experiences sample set

Depth beats quantity.

---

## 12. Internationalization implications

Do **not** encode:

```text
if country == 'TN' specialTaxiLogic()
```

Do encode:

```text
TransportSystem where cityId = X
```

UI may have translations; logic remains data-driven.

---

## 13. Editorial workflow

```text
Guide/Admin draft
  → pending review
  → approved
  → AI-retrievable
  → periodic re-review (especially rules & prices)
```

Price and transport norms change — schedule reviews.

---

## 14. Summary

The Local Knowledge System turns LocalLife from “maps with a chatbot” into a **city operating manual**:

- TransportSystem + hubs + payments
- LocalRule packs
- ArrivalGuide + GuideStep playbooks
- Trust and scope metadata
- Country-pack expansion model

This must be designed **before** database lock-in.

---

*Next: [08 — Database Full Schema](./08-Database-Full-Schema.md)*
