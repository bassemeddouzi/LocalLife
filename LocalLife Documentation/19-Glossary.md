# 19 — Glossary

**Document type:** Reference  
**Version:** 1.0  
**Language:** English

---

## A

**Admin** — Platform operator who approves content, manages configuration, and moderates reports.  
**ArrivalGuide** — Structured playbook for what to do after arriving (usually at an airport).  
**Agent (AI)** — Future proactive system that can propose/execute actions with user approval, beyond Q&A chat.

## B

**Booking** — Reservation of an experience/event/service (future commerce module).  
**Business Owner** — Role managing one or more commercial places and promotions.  
**Budget band** — User preference: LOW / MEDIUM / HIGH.

## C

**Citation** — Link from an AI message to a concrete DB entity used as evidence.  
**Country pack** — Versioned bundle of local operating knowledge for one country.  
**Client** — End-user role consuming recommendations and chat.

## E

**Entity** — A database object AI/UI can reference (Place, LocalRule, TransportSystem, etc.).  
**Experience** — Multi-step activity package, richer than a single place.  
**Expat** — Persona settling into daily life in a new country/city.

## F

**Feature flag** — Runtime switch enabling/disabling future capabilities safely.  
**Favorite** — User-saved place/event/experience.

## G

**Grounding** — Constraining AI answers to verified retrieved knowledge.  
**Guide (Local Guide)** — Trusted contributor of local knowledge.  
**GuideStep** — Ordered step inside ArrivalGuide or HowToGuide.  
**GTFS** — Standard for public transit schedules (future integration possibility).

## H

**HowToGuide** — Procedural guide unrelated to arrival (e.g., buy subscription, register SIM).  
**Hub (TransportHub)** — Physical access point: station, taxi rank, louage stand, port.

## L

**LocalRule** — Scoped practical rule/tip users should know (not formal legal advice).  
**Louage** — Tunisian shared-taxi style transport; modeled as local TransportSystem (often `SHARED_TAXI`).  
**LLM** — Large Language Model used for natural-language generation.

## M

**MVP** — Minimum Viable Product; for LocalLife = Djerba grounded companion.  
**MessageCitation** — Persistence of grounding references per assistant message.

## P

**Persona** — User segment influencing recommendations (tourist, student, expat, business, local).  
**Place** — Core location entity with geo + category + tips.  
**Premium** — Paid user subscription tier (future).  
**Prisma** — ORM used with PostgreSQL.

## R

**RAG** — Retrieval-Augmented Generation; retrieve verified data then generate answer.  
**Ranker** — Component scoring candidate entities for a query.  
**RBAC** — Role-based access control.

## S

**Seed** — Initial dataset loaded for a city launch.  
**Sponsored content** — Paid promotion; must be disclosed.  
**SourceType** — Origin/trust class of knowledge (official, admin, guide-verified, etc.).

## T

**TransportSystem** — Local transport operating model (how it works, pay, price type).  
**Trust score** — Optional computed reliability signal for contributors/entities.

## V

**VerificationStatus** — Workflow state: DRAFT/PENDING/APPROVED/REJECTED/ARCHIVED.

---

## Product phrase

**Local operating knowledge** — The practical information required to function in a city (transport, payments, arrival steps, rules, daily services), which LocalLife encodes structurally for AI retrieval.

## Additional terms (v1.1)

**AnalyticsEvent** — Stored/product-tracked user action used for funnels and future ranking.  
**Consent flags** — User choices gating analytics, personalization, push, marketing.  
**Content pack version** — Version stamp for city/country offline or seeded knowledge bundles.  
**ContentSuggestion** — User-proposed correction to place/guide data pending admin review.  
**Emergency Mode** — Safety UX for emergency numbers and nearest critical services.  
**EntityEmbedding** — Vector representation of an entity for semantic retrieval.  
**Feature flag** — Runtime toggle for unfinished or risky capabilities.  
**NFR** — Non-functional requirement (performance, security, i18n, observability).  
**Request ID** — Correlation id for a single API request across logs.  
**Soft delete** — Marking rows deleted via `deletedAt` instead of physical removal.  
**Survival Kit** — First-48-hours checklist for a city.  
**Why-this reasons** — Explicit rationale tags attached to recommendations.

---

## Document set

Return to the index: [00 — README](./00-README.md)

Also read:

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)
- [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md)

Executive condensed overview: [LocalLife-AI-Executive-Documentation.md](./LocalLife-AI-Executive-Documentation.md)
