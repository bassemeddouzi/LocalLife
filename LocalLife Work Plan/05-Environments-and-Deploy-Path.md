# 05 — Environments & Deploy Path

**Document type:** Delivery path  
**Version:** 1.1  
**Language:** English  
**Aligned with:** [07-Decisions-Log.md](./07-Decisions-Log.md)

---

## 1. Environments

| Env | Host | Purpose | Data |
| --- | --- | --- | --- |
| local | Developer machine | Build/debug | Fake/dev seed OK |
| staging | **Railway** | Pre-prod + closed beta often | Near-real Djerba seed |
| production | **Railway initially** | Real users | Real data + backups |

**Later option:** migrate production to **AWS** when scale/ops require it (not MVP blocker).

---

## 2. What each environment takes / gives

### Local
**Takes:** toolchain, local Postgres, OpenRouter key optional, Mapbox token  
**Gives:** fast loop for api + Expo + admin

### Staging (Railway)
**Takes:** Railway project, staging secrets, migrations, seed  
**Gives:** HTTPS API URL, admin URL, Postgres, attachment to EAS staging builds

### Production (Railway first)
**Takes:** prod secrets, migrations, monitoring, backup plan, legal/support form  
**Gives:** live MVP

---

## 3. Mobile distribution path

| Channel | Phase | Gives |
| --- | --- | --- |
| Expo Go / local | 01–05 | Dev speed |
| EAS Internal Distribution | 06–07 quick | Internal APK/IPA installs |
| TestFlight | 07–08 | iOS beta (30 testers pool) |
| Google Play Internal Testing | 07–08 | Android beta |
| Store production | 08+ | Public MVP |

---

## 4. Deploy path (conceptual)

```text
1. Migrations on Railway Postgres
2. Deploy API (and Admin web) to Railway
3. Health check passes
4. Seed / content pack version noted
5. Point EAS profile to env API URL
6. Smoke journeys pass
7. Monitoring receives events
8. Invite testers or announce
```

---

## 5. First deploy moments

| Deploy | Phase |
| --- | --- |
| Railway staging #1 | Phase 06 |
| Railway production #1 | Phase 08 |
| Optional AWS migration | After MVP scale need |

---

## 6. Release checklist (copy per release)

- [ ] Changelog summary
- [ ] Feature flags intentional
- [ ] OpenRouter model config verified in Admin
- [ ] Migrations reviewed
- [ ] Smoke passed
- [ ] Sentry verified
- [ ] Seed/contentPackVersion noted
- [ ] Rollback note attached
- [ ] Support form reachable

---

*Next: [06-Task-Template.md](./06-Task-Template.md)*
