# LocalLife AI — Complete Project Documentation

**Language:** English only  
**Version:** 1.1  
**Status:** Master technical & product documentation set  
**Scope:** Vision → actors → features → local knowledge → database → NFRs → architecture → tools → roadmap → backlog

---

## Purpose of this documentation set

This folder is the **single source of truth** for LocalLife AI.

Use it to:

- Align product, engineering, and content decisions
- Design the database before coding
- Keep MVP (Djerba) future-ready for Tunisia and international expansion
- Prepare AI Chat now and AI Agent later without rewriting foundations
- Enforce performance, security, traceability, and multi-language requirements
- Onboard collaborators with one consistent reference

---

## How to read these documents

| Order | Document | Audience |
| --- | --- | --- |
| 0 | This README | Everyone |
| 1 | Vision, Mission & Goals | Everyone |
| 2 | Problem & Solution | Product / stakeholders |
| 3 | Actors, Roles & Permissions | Product / backend |
| 4 | Personas & Journeys | Product / design |
| 5 | Features — MVP | Engineering / product |
| 6 | Features — Future | Product / architecture |
| 7 | Local Knowledge System | Content / AI / DB |
| 8 | Database Full Schema | Backend / data |
| 9 | API Architecture | Backend |
| 10 | AI Architecture (RAG → Agent) | AI / backend |
| 11 | Mobile Architecture | Mobile |
| 12 | Backend Architecture | Backend |
| 13 | Technology Stack & Tools | Engineering |
| 14 | Security & Compliance | Engineering / ops |
| 15 | Monetization | Business |
| 16 | Roadmap (Djerba → World) | Everyone |
| 17 | Content Seed — Djerba | Content / ops |
| 18 | Dev Standards & Naming | Engineering |
| 19 | Glossary | Everyone |
| 20 | Non-Functional Requirements | Engineering (mandatory) |
| 21 | Engineering Recommendations | Engineering / architecture |
| 22 | Extended Feature Backlog | Product |
| — | Executive Overview (summary) | Stakeholders |

---

## Document index

1. [01 — Vision, Mission & Goals](./01-Vision-Mission-Goals.md)
2. [02 — Problem & Solution](./02-Problem-Solution.md)
3. [03 — Actors, Roles & Permissions](./03-Actors-Roles-Permissions.md)
4. [04 — User Personas & Journeys](./04-User-Personas-Journeys.md)
5. [05 — Features (MVP)](./05-Features-MVP.md)
6. [06 — Features (Future)](./06-Features-Future.md)
7. [07 — Local Knowledge System](./07-Local-Knowledge-System.md)
8. [08 — Database Full Schema](./08-Database-Full-Schema.md)
9. [09 — API Architecture](./09-API-Architecture.md)
10. [10 — AI Architecture (RAG → Agent)](./10-AI-Architecture-RAG-Agent.md)
11. [11 — Mobile Architecture](./11-Mobile-Architecture.md)
12. [12 — Backend Architecture](./12-Backend-Architecture.md)
13. [13 — Technology Stack & Tools](./13-Tech-Stack-Tools.md)
14. [14 — Security & Compliance](./14-Security-Compliance.md)
15. [15 — Monetization](./15-Monetization.md)
16. [16 — Roadmap: Djerba → Tunisia → International](./16-Roadmap-Djerba-Tunisia-World.md)
17. [17 — Content Seed Plan (Djerba)](./17-Content-Seed-Djerba.md)
18. [18 — Development Standards & Naming](./18-Dev-Standards-Naming.md)
19. [19 — Glossary](./19-Glossary.md)
20. [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md) **(cache, security, history, i18n)**
21. [21 — Engineering Recommendations](./21-Engineering-Recommendations.md) **(R01–R12 build-now items)**
22. [22 — Extended Feature Backlog](./22-Extended-Feature-Backlog.md) **(extra product features)**
23. [Executive Overview (condensed)](./LocalLife-AI-Executive-Documentation.md)

---

## Core product principles (always apply)

1. **Verified local knowledge first** — AI must not invent local facts.
2. **Geography is hierarchical** — Country → Region → City → District → Neighborhood → Place.
3. **MVP ships value; schema ships future** — unused future tables/fields may exist; unused UI must not.
4. **Country packs, not hardcoding** — Tunisia transport/laws are data, not code branches named “Tunisia”.
5. **Chat now, Agent later** — same retrieval + tools pipeline, more tools over time.
6. **Sponsored content is always labeled**.
7. **One city deep beats many cities shallow** — start with Djerba quality.
8. **Light client, heavy cache** — the app must feel fast; cache read-heavy local knowledge.
9. **Trace everything that teaches the recommender** — views, saves, citations, clicks, with consent.
10. **Multi-language from day one** — UI i18n + content translations, even if launch languages are limited.

---

## Expansion model

```text
Phase 1: Djerba MVP (validate)
Phase 2: Tunisia cities + guides + businesses
Phase 3: International country packs
Phase 4: Marketplace + booking
Phase 5: Proactive AI Agent
```

---

## Change control

When you change:

- a database entity → update `08-Database-Full-Schema.md`
- a role/permission → update `03-Actors-Roles-Permissions.md`
- a feature scope → update `05`, `06`, or `22`
- a tool/vendor → update `13-Tech-Stack-Tools.md`
- performance/security/i18n rules → update `20` / `14` / `21`

Keep the Executive Overview aligned with major decisions.

---

## Suggested next engineering step after reading

1. Freeze MVP feature list (`05`) + NFR checklist (`20`)
2. Freeze schema v1 (`08`) including recommendation hooks (`21`)
3. Freeze local knowledge model (`07`)
4. Follow execution order in **`../LocalLife Work Plan/`** (Phase 00 → …)
5. Implement NestJS + Prisma skeleton (Phase 01)
6. Seed Djerba content (`17` + Work Plan Phase 03)
7. Connect RAG chat on verified data only (Phase 04)
8. Wire analytics + Sentry + rate limits before public beta

---

## Related folder

- [LocalLife Work Plan (A→Z execution)](../LocalLife%20Work%20Plan/00-README.md) — detailed phase tasks with Takes/Gives/Tests (no code)

---

*LocalLife AI Documentation Set v1.1 — English*
