# Phase 05b / Task 03 — Guide Portal UX

**Priority:** P0

### Objective
Let Guide account (including owner’s guide account) submit Djerba zone knowledge from UI.

### Takes
- Approved GUIDE user
- Contribution APIs
- Placeholder image upload path (R2)

### Gives
| Flow | Takes | Gives |
| --- | --- | --- |
| Guide home | auth | submission dashboard |
| Submit place | category + lat/lng + optional attributes | PENDING place (map pin after approve) |
| Submit tip | title + summary + categoryKey | PENDING HowToGuide |
| Submit event | title + schedule + optional place | PENDING event |
| Submit experience | title + summary + optional steps | PENDING experience |
| Propose Business | email + name + city/district | PENDING BusinessApplication |
| Track submissions | auth | places / tips / events / experiences / applications |
| Upload photo | file | placeholder or real image URL |

### Notes
- Fake photos acceptable now
- Real Djerba photos replace later using same flows
- Pins on map = approved places (events use place coords when linked)
- Transport how-to / danger / camping / rental = tips + LocalRules (Wave 2 for Guide LocalRule writes)

### Done when
- [x] Guide can submit place/tip/event/experience and see moderation outcomes
- [x] Guide can propose Business; Admin approves in moderation
