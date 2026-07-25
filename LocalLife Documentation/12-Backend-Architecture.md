# 12 — Backend Architecture

**Document type:** Server architecture  
**Version:** 1.0  
**Language:** English  
**Stack:** NestJS + TypeScript + Prisma + PostgreSQL

---

## 1. Goals

- Modular domain boundaries
- Independent scaling of API and AI workers later
- Strict validation and RBAC
- Clean path from Chat tools to future Agent actions

---

## 2. High-level diagram

```text
Mobile App
    │ HTTPS
    ▼
NestJS API Gateway / App
    │
    ├── Auth Module
    ├── Users Module
    ├── Locations Module
    ├── Places Module
    ├── Events / Experiences
    ├── Reviews / Favorites
    ├── Local Knowledge Module
    ├── AI Module (orchestrator + tools)
    ├── Notifications Module
    ├── Business / Guide Modules
    ├── Admin Module
    ├── Bookings Module (flagged)
    └── Shared (config, prisma, guards, logging)
            │
            ▼
        PostgreSQL
            │
            ├── Cloudflare R2 (media)
            ├── LLM provider API
            ├── Maps provider API
            └── Email provider (optional)
```

---

## 3. Module folder structure

```text
src/
  auth/
  users/
  locations/
  places/
  events/
  experiences/
  reviews/
  favorites/
  recommendations/
  local-knowledge/
  ai/
  notifications/
  business/
  guides/
  bookings/
  admin/
  shared/
  main.ts
```

Each module typically contains:

- controller
- service
- dto
- entities/prisma delegates
- guards/policies where specific

---

## 4. Request flow

```text
Controller → DTO validation → Guards (auth/role) → Service → Prisma → Service → Controller
```

AI flow adds:

```text
AI Controller → AI Orchestrator → Tools → Domain services/repos → Ranker → LLM → Persist messages
```

---

## 5. Why NestJS

- Modular architecture matches product domains
- Dependency injection eases testing
- Guards/interceptors for cross-cutting concerns
- Strong TypeScript DX with Prisma

---

## 6. Data access

- Prisma schema mirrors doc `08`
- Use transactions for multi-table writes (claim approval, etc.)
- Avoid leaking Prisma types directly to controllers; map to response DTOs

---

## 7. AI worker split (recommended path)

**MVP:** AI orchestration in API process.  
**Growth:** move LLM calls to a queue worker (`BullMQ` + Redis) to protect API latency.

Same tool interfaces either way.

---

## 8. Security controls (server)

See also doc `14`.

- hashed passwords
- JWT access short-lived + refresh rotation
- RBAC guards
- rate limits
- input validation
- hardened CORS
- secrets in env/secret manager
- admin audit logs for approvals

---

## 9. Environments

| Env | Purpose |
| --- | --- |
| local | developer machines |
| staging | QA + seed-like data |
| production | real users |

Separate DB/R2/LLM keys per env.

---

## 10. Testing strategy

- Unit tests for rankers, auth, permission checks
- Integration tests for critical routes
- AI golden-set evaluation scripts (grounding cases)
- Seed-based e2e smoke on Djerba scenarios

---

## 11. Scalability notes

Scale independently:

- API replicas
- Worker replicas for AI
- PostgreSQL vertical then read replicas
- R2 for media
- CDN for public assets

No need to rewrite modules if boundaries stay clean.

---

*Next: [13 — Technology Stack & Tools](./13-Tech-Stack-Tools.md)*
