# 13 — Technology Stack & Tools

**Document type:** Engineering toolkit  
**Version:** 1.0  
**Language:** English

---

## 1. Stack summary

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile | React Native + TypeScript | Cross-platform single codebase |
| Backend | NestJS + TypeScript | Modular, enterprise-ready DI |
| DB | PostgreSQL | Reliability + geo capability |
| ORM | Prisma | Type-safe schema & migrations |
| Auth | JWT + refresh tokens | Stateless mobile-friendly auth |
| Media | Cloudflare R2 | S3-compatible object storage, cost-efficient |
| Maps | Mapbox (recommended), Google Maps optional | GPS, maps, directions handoff |
| AI | LLM + RAG pipeline | Grounded answers over LocalLife DB |
| Cache/Queue (growth) | Redis + BullMQ | AI jobs, hot city cache, rate-limit support |
| Error monitoring | Sentry (recommended) | Mobile + API crashes/exceptions |
| Analytics | PostHog/Mixpanel/Amplitude (pick one) + first-party AnalyticsEvent | Traceability & ranking fuel |
| Email (optional) | Provider TBD (Resend/SendGrid/etc.) | password reset, admin alerts |
| Hosting API | TBD (Railway/Fly/AWS/GCP/Azure) | choose at infra stage |
| CI/CD | GitHub Actions (recommended) | lint/test/deploy |

---

## 2. Mobile tooling

- React Native (CLI or Expo — decide before scaffold; Expo recommended for speed if no hard native blockers)
- TypeScript strict mode
- React Navigation
- TanStack Query
- Secure storage library
- Maps SDK matching provider choice
- Push notifications library (later)

---

## 3. Backend tooling

- NestJS
- Prisma + PostgreSQL
- class-validator / Zod for DTO validation
- Passport/JWT or equivalent Nest auth
- Throttler for rate limits
- Swagger/OpenAPI for API docs
- Pino/Winston logging

---

## 4. AI tooling

| Need | Tooling approach |
| --- | --- |
| Generation | Hosted LLM API (provider selectable) |
| Embeddings (phase 2) | Same provider or specialized embedding model |
| Vector store | pgvector extension **or** external vector DB later |
| Evaluation | Internal golden question set for Djerba |
| Observability | Log prompts metadata carefully (avoid leaking PII) |

**Rule:** provider is swappable behind an interface (`LlmClient`).

---

## 5. Maps tooling

Responsibilities:

- render map
- geocode/reverse geocode if needed
- nearby search assist (optional)
- directions deep link / SDK routes

Prefer one primary vendor to reduce complexity in MVP.

---

## 6. Storage tooling

Cloudflare R2 buckets:

- `public-media` (place photos)
- `private-uploads` (if needed)
- signed upload URLs from backend

Image pipeline later: resize/webp variants.

---

## 7. DevOps & quality tools

- ESLint + Prettier
- Husky/lint-staged (optional)
- Jest / Vitest
- Detox/Maestro later for mobile e2e
- Sentry (crash & error monitoring) recommended
- Analytics: PostHog/Mixpanel/Amplitude (pick one)

---

## 8. Security tools

- Secret manager / env encryption in CI
- Dependency scanning (npm audit / Dependabot)
- Backup tooling for PostgreSQL

---

## 9. Collaboration tools (non-runtime)

- GitHub for code
- Notion/Linear/Jira for tasks (optional)
- Figma for UI (optional)

---

## 10. Cost-aware choices for MVP

Start lean:

1. One API service
2. One Postgres
3. R2 storage
4. Hosted LLM pay-as-you-go
5. Map SDK free tier / low volume
6. Redis as soon as hot-read caching is needed (often before heavy traffic)
7. Sentry from staging onward
8. No microservices until metrics demand them

---

## 11. Decision log template

For each major vendor decision, record:

- options considered
- winner
- reasons
- revisit trigger (cost, lock-in, missing feature)

---

## 12. Related documents

- [20 — Non-Functional Requirements](./20-Non-Functional-Requirements.md)
- [21 — Engineering Recommendations](./21-Engineering-Recommendations.md)

---

*Next: [14 — Security & Compliance](./14-Security-Compliance.md)*
