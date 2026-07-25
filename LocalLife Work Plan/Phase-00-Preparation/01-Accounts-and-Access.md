# Phase 00 / Task 01 — Accounts and Access

**Priority:** P0  
**Depends on:** nothing  
**Aligned with:** [07-Decisions-Log.md](../07-Decisions-Log.md)

### Objective
Open every account required by locked vendors before Phase 01 depends on them.

### Takes (inputs)
- Checklist in Work Plan `03-Roles-Tools-Checklist.md` v1.1
- Billing method where needed

### Gives (outputs)
Checked accounts for:

- GitHub
- Railway (staging + future prod)
- Mapbox
- **OpenRouter**
- Cloudflare R2
- Sentry
- Expo/EAS
- Apple Developer (for TestFlight)
- Google Play Console (Internal Testing)
- Support form destination (email/form tool)

### Steps (no code)
1. Create/verify GitHub repo owner access.
2. Create Railway account/project placeholder.
3. Create Mapbox token account.
4. Create OpenRouter account; note usage/budget guardrails.
5. Create R2 + Sentry.
6. Create Expo account; enable EAS.
7. Enroll Apple Developer + Google Play (can finalize payment timing, but start process).
8. Choose support form tool (Typeform/Google Form/custom later).
9. Enable 2FA everywhere possible.
10. Fill status checkboxes in tools checklist.

### Tests
| Test | Expected |
| --- | --- |
| Login each critical account | Success |
| OpenRouter dashboard reachable | Success |
| Railway dashboard reachable | Success |

### Done when
- [ ] Critical accounts exist or dated deferrals only for non-blockers
- [ ] Owners = solo Admin

### Risks
- Apple Developer approval can take time — start early for iOS beta.
