# 03 — Roles, Tools & Accounts Checklist

**Document type:** Preparation inventory  
**Version:** 1.1  
**Language:** English  
**Aligned with:** [07-Decisions-Log.md](./07-Decisions-Log.md)

---

## 1. Human roles (solo — wear all hats)

| Hat | Responsibilities |
| --- | --- |
| Product owner | Priorities, phase exits, scope control |
| Backend engineer | API, DB, OpenRouter orchestration |
| Mobile engineer | Expo app iOS+Android |
| Admin web engineer | Real admin dashboard |
| Content / Guide | Djerba seed, later real photos |
| AI quality owner | Golden questions, grounding metrics |
| DevOps/launch | Railway envs, EAS, TestFlight, Play Internal |
| Support | Monitor support form |

Prod secrets: **Admin hat only**.

---

## 2. Accounts to create (Phase 00)

| Account / service | Purpose | Status |
| --- | --- | --- |
| GitHub | Monorepo + CI | [ ] |
| PostgreSQL local + Railway Postgres | DB | [ ] |
| Railway | Staging + early production host | [ ] |
| Cloudflare R2 | Media storage | [ ] |
| Mapbox | Maps | [ ] |
| **OpenRouter** | Multi-model LLM gateway | [ ] |
| Sentry | Crash/error monitoring | [ ] |
| Expo / EAS | Mobile builds & internal distribution | [ ] |
| Apple Developer | TestFlight / iOS | [ ] |
| Google Play Console | Internal testing / Android | [ ] |
| Analytics (optional + first-party events) | Product analytics | [ ] |
| Domain/email for support form | User support | [ ] |

---

## 3. Secrets inventory (never commit)

| Secret | Used by | Envs |
| --- | --- | --- |
| DATABASE_URL | API | local/staging/prod |
| JWT access/refresh secrets | API | all |
| **OPENROUTER_API_KEY** | API | staging/prod (local optional) |
| Mapbox tokens | Mobile (+ API if needed) | all |
| R2 keys | API | all |
| Sentry DSNs | API + Mobile + Admin | staging/prod |
| Railway project tokens | Deploy | CI/local deploy |
| Apple/Google signing | EAS | release |

Admin Dashboard stores **selected model id** in DB/config; API key stays in env/secret store.

---

## 4. Local machine tools

| Tool | Why |
| --- | --- |
| Node.js LTS | Monorepo tooling |
| Package manager | Dependencies |
| Git | Version control |
| PostgreSQL | Local DB |
| Expo CLI / EAS CLI | Mobile |
| Xcode (macOS) | iOS builds |
| Android Studio | Android builds |
| Browser | Admin web |
| API client | Manual API checks |

---

## 5. Documentation companions

| Need | Doc |
| --- | --- |
| Locked decisions | Work Plan `07-Decisions-Log.md` |
| Schema | `LocalLife Documentation/08-...` |
| NFRs | `.../20-...` |
| AI | `.../10-...` |

---

*Next: [04-Testing-Strategy.md](./04-Testing-Strategy.md)*
