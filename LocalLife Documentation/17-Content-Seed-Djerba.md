# 17 — Content Seed Plan (Djerba)

**Document type:** Content operations  
**Version:** 1.0  
**Language:** English  
**Purpose:** Define the minimum high-quality dataset required before MVP launch.

---

## 1. Seeding philosophy

For Djerba MVP:

- **Quality > quantity**
- Every priority user question must have at least one solid grounded answer path
- Prefer verified summaries + structured steps over long unstructured text

---

## 2. Geography seed

Create:

- Country: Tunisia (`TN`) with currency `TND`, emergency numbers JSON
- Region: Medenine
- City: Djerba (active/featured)
- Key districts/neighborhoods: Houmt Souk, Midoun, Aghir, Guellala, Ajim, etc. (as needed)
- Airport place: Djerba–Zarzis Airport (or equivalent official naming)

---

## 3. Categories seed (minimum)

Restaurants, cafés, beaches, hotels, museums/heritage, shops/souks, supermarkets, pharmacies, hospitals/clinics, parks/nature, ATMs/banks, mosques, transport hubs, activities, nightlife (if applicable), family-friendly, student-friendly tags.

---

## 4. Places seed targets

### Priority bands

| Band | Count target | Examples |
| --- | --- | --- |
| P0 Critical | 30–50 | airport, hubs, hospitals, ATMs, core beaches, iconic food |
| P1 Daily life | 50–100 | restaurants, pharmacies, cafés, reliable restaurants |
| P2 Discovery | 50–100 | hidden spots, photo points, cultural places |
| Total MVP feel | ~150–250 quality places | better than 1000 weak rows |

Each P0/P1 place needs:

- name, summary, description
- lat/lng
- category
- hours if relevant
- price level
- at least 1 photo when possible
- 1+ local tip
- verificationStatus=APPROVED

---

## 5. Transport seed (mandatory)

Create TransportSystems such as:

1. Airport taxi system (how to find, payment, price guidance, scam warnings)
2. Local taxi norms
3. Louage / shared taxi options relevant to island routes (if applicable)
4. Bus options if relevant
5. Ferry/boat connections if relevant to user journeys

Add hubs:

- airport taxi rank
- Houmt Souk louage/taxi points
- Midoun hubs
- port hubs if needed

Add at least 5–10 common route notes (airport → Houmt Souk, airport → Midoun, Houmt Souk ↔ Midoun, etc.).

---

## 6. Arrival guide seed (mandatory)

**Guide:** “First hour after landing in Djerba”

Suggested steps:

1. Immigration / exit hall orientation
2. SIM / connectivity options
3. Cash/ATM / exchange notes
4. Official taxi guidance vs risks
5. How to reach Houmt Souk / Midoun / hotel zones
6. First food/water tip
7. Safety basics for first night

Each step: actionType, time estimate, cost band, payment methods, warnings, linked entities.

---

## 7. Local rules seed (mandatory)

At least:

- emergency numbers (CRITICAL)
- money/payment practicalities
- tourist safety basics (night movement, tourist zones)
- scam / tourist-trap warnings relevant to Djerba
- cultural respect tips (IMPORTANT/INFO)
- photography sensitivities where relevant
- transport behavior tips
- student/expat pointers if available (can be INFO level)

Every rule: scope=COUNTRY or CITY, sourceType, lastReviewedAt.

Also seed a **City Survival Kit** HowToGuide (`SURVIVAL_48H`) linking SIM, cash, transport, supermarket, pharmacy/hospital.

---

## 8. Events & experiences seed

- 10–30 events sample (or recurring templates)
- 5–15 experiences (e.g., sunset route, souk + lunch, coastal day)

Experiences should reference real places.

---

## 9. Reviews seed

Use carefully:

- Prefer real beta-user reviews after soft launch
- If bootstrap reviews are needed, mark source clearly and avoid fake social proof patterns that damage trust

---

## 10. AI golden questions (content QA)

Before launch, ensure grounded answers exist for:

1. What should I do after leaving the airport?
2. How do I get to Midoun and how do I pay?
3. Best sunset beach options
4. Local food not tourist-trap
5. Quiet café nearby (with GPS sample points)
6. Pharmacy/hospital near Houmt Souk
7. Is area X okay at night? (based on LocalRule + tips, cautious tone)
8. Weekend plan for 48 hours
9. Student-budget meals
10. Family-friendly half-day plan

Document expected entity citations for each.

---

## 11. Content ops checklist per item

- [ ] Correct geo assignment
- [ ] Summary written for AI
- [ ] Structured fields filled
- [ ] Source/trust set
- [ ] Approved by admin
- [ ] Photo rights OK
- [ ] Review date set for volatile info (prices/transport)

---

## 12. Ownership

| Role | Responsibility |
| --- | --- |
| Content lead | completeness of P0/P1 |
| Local guide contributors | tips & hidden gems |
| Admin | approvals |
| Engineer | seed scripts & imports |
| AI owner | golden-question pass rate |

---

*Next: [18 — Development Standards & Naming](./18-Dev-Standards-Naming.md)*
