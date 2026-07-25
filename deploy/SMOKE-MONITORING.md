# Staging smoke + monitoring (Phase 06)

## Smoke journeys
| # | Journey | Pass? |
| --- | --- | --- |
| 1 | Auth register/login | [ ] |
| 2 | Places list/detail | [ ] |
| 3 | Arrival + transport APIs | [ ] |
| 4 | AI grounded Q + citations | [ ] |
| 5 | Favorite / review | [ ] |
| 6 | Admin approve content | [ ] |
| 7 | Admin change AI model | [ ] |
| 8 | Guide submit place | [ ] |
| 9 | Support form opens | [ ] |
| 10 | Sentry test event (if DSN set) | [ ] |

Automated helper (API only):

```bash
API_BASE_URL=https://YOUR-API.up.railway.app pnpm smoke:api
```

## Monitoring
1. Create Sentry projects `locallife-api` + `locallife-mobile`
2. Set `SENTRY_DSN` on Railway API (SDK wiring can complete when DSN present)
3. Trigger a deliberate 500 / test event and confirm in Sentry

## Sign-off
Env URL: ________  
Signed: ________  Date: ________
