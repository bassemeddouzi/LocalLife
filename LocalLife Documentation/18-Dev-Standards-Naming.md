# 18 — Development Standards & Naming

**Document type:** Engineering standards  
**Version:** 1.0  
**Language:** English

---

## 1. Goals

Keep the codebase consistent so Djerba → Tunisia → international expansion stays maintainable.

---

## 2. Repository strategy (recommended)

Monorepo option:

```text
/apps
  /mobile
  /api
/packages
  /shared-types
/docs  (or keep current LocalLife Documentation folder)
```

Multi-repo is acceptable if team prefers separation; shared DTO types then need discipline.

---

## 3. Naming conventions

| Area | Convention | Example |
| --- | --- | --- |
| DB tables | PascalCase Prisma models / mapped names clear | `TransportSystem` |
| DB columns | camelCase in Prisma | `createdAt` |
| API routes | kebab-case plural resources | `/transport-systems` |
| TS files | kebab-case or feature convention consistent | `arrival-guide.service.ts` |
| Enums | SCREAMING_SNAKE or Prisma enum style consistent | `SHARED_TAXI` |
| Feature flags | `FF_FEATURE_NAME` | `FF_AI_AGENT` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |

---

## 4. Code principles

1. Feature modules over giant shared dumpsters
2. No city hardcoded in business logic (`if djerbaSpecial`)
3. Country/city behavior comes from data
4. AI tools are typed and testable
5. Prefer explicit status enums
6. Additive migrations
7. Every public content write path has verification state

---

## 5. API DTO rules

- Validate all inputs
- Never expose password hashes
- Map Prisma models → response DTOs
- Include `verificationStatus` only for privileged callers when needed
- Public responses show only APPROVED content

---

## 6. Git standards

- Conventional commits recommended: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Small PRs
- No secrets committed
- Protect `main`

---

## 7. Branching (simple)

- `main` production-ready
- `develop` optional
- `feature/<name>`
- `fix/<name>`

---

## 8. Documentation standards

- English for all technical docs in this folder
- Update schema doc when entities change
- Update feature docs when MVP scope changes
- Record major vendor decisions in stack doc

---

## 9. Testing minimum before release

- Auth register/login/refresh
- Place search by city
- AI message returns citations on golden questions
- Favorite create/delete
- Admin approve content visibility change

---

## 10. Definition of done (feature)

A feature is done when:

1. Spec aligned with docs 05/06
2. Schema fields used as designed
3. API + mobile wired
4. Permissions enforced
5. Analytics event added if user-facing
6. Docs updated if model changed

---

*Next: [19 — Glossary](./19-Glossary.md)*
