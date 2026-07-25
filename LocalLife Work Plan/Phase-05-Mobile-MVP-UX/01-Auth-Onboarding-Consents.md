# Phase 05 / Task 01 — Auth, Onboarding, Consents

**Priority:** P0

### Objective
Let a new user create an account, set preferences that affect recommendations, and record privacy consents.

### Takes
- Auth API contracts
- Preference/consent fields
- Persona/budget/locale enums

### Gives
| Screen/flow | Takes | Gives |
| --- | --- | --- |
| Register/Login | credentials | stored tokens + session |
| Onboarding | persona, interests, budget, locale | preferences saved |
| Consents | toggles | consent flags persisted |
| GPS permission prompt | rationale copy | lat/lng available or manual city fallback |

### Done when
- [ ] User reaches Home with profile context set
- [ ] Consents visible in Profile later
