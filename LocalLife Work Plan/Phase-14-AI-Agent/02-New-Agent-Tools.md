# Phase 14 / Task 02 — New Agent Tools

**Priority:** P0

### Objective
Extend tool registry for planning and booking assistance.

### Takes
- Itinerary/booking domain
- Existing retrieval tools

### Gives
| Tool | Takes | Gives |
| --- | --- | --- |
| createItinerary | city, days, prefs | structured day plan entity/cards |
| proposeBooking | target + time | PROPOSED booking action |
| confirmBooking | approval token/action id | executes booking tool |
| scheduleNotification | time + message + context | scheduled notice proposal |
| updatePreferences | inferred likes + consent | preference patch proposal |

### Done when
- [ ] Tools return structured results and write action logs correctly
