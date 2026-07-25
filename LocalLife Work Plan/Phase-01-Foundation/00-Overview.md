# Phase 01 — Foundation — Overview

**Phase goal:** Schema v1, API skeleton, auth/RBAC, **Expo mobile skeleton**, **Admin web skeleton**, first automated tests.  
**Exit unlocks:** Phase 02.  
**Aligned with:** Decisions Log (monorepo 3 apps, Expo, OpenRouter config table ready).

---

## Takes
- Phase 00 exit
- Docs 08 schema (+ LLM settings entity needed for Admin model switch)
- Roles CLIENT/GUIDE/BUSINESS/ADMIN

## Gives
- [ ] Schema v1 applied (includes Guide/Business + AiProviderConfig/LlmSettings)
- [ ] API boots + health/readiness
- [ ] Auth contracts + RBAC
- [ ] Expo mobile shell (tabs placeholders)
- [ ] Admin web shell (login + empty dashboard layout)
- [ ] Request IDs, feature flags, consents hooks
- [ ] Foundation Gate tests green
- [ ] Documented way to create ADMIN + GUIDE seed users

## Tasks
1. [01-Database-Schema-v1](./01-Database-Schema-v1.md)
2. [02-Backend-Skeleton](./02-Backend-Skeleton.md)
3. [03-Auth-and-RBAC-Baseline](./03-Auth-and-RBAC-Baseline.md)
4. [04-Security-Baseline-Hooks](./04-Security-Baseline-Hooks.md)
5. [05-Mobile-Skeleton-Expo](./05-Mobile-Skeleton-Expo.md)
6. [06-Admin-Web-Skeleton](./06-Admin-Web-Skeleton.md)
7. [07-First-Automated-Tests](./07-First-Automated-Tests.md)
8. [08-Phase-Exit](./08-Phase-Exit.md)

## Test gate: Foundation Gate
Health + auth + protected route + lint green. Admin app at least boots and can hit health/login page.
