# Phase 05 / Task 06 — Analytics and Crash Reporting

**Priority:** P0

### Objective
Turn on traceability and crash visibility before beta.

### Takes
- Event name list from docs
- Sentry (or equivalent) projects
- Consent flags

### Gives
| Pipeline | Takes | Gives |
| --- | --- | --- |
| Analytics | user actions + appVersion/platform/locale/cityId | events for funnel + ranking later |
| Crash reporting | exceptions | actionable stack traces |
| Consent gate | consentAnalytics | non-essential events suppressed when false |

### Minimum events on device
auth_sign_up/login, place_view/save, chat_message_sent, citation_clicked, arrival_guide_open, nav_handoff_click, content_report_create

### Done when
- [ ] Events visible in analytics destination or first-party table
- [ ] Test crash appears in monitoring on staging/local debug hook
