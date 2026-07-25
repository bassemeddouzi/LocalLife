# Phase 14 / Task 03 — Proactive Suggestion Loop

**Priority:** P1

### Objective
Allow the assistant to initiate helpful suggestions, not only react.

### Takes
- User context (GPS, time, prefs, consents, quiet hours)
- Knowledge + itinerary state
- Notification infrastructure

### Gives
| Trigger example | Takes | Gives |
| --- | --- | --- |
| Near sunset spot | location + interests | suggestion card + optional navigate |
| Tomorrow weather good for beach | forecast + plan | rearrange proposal |
| Booking deadline soon | itinerary | reminder proposal |

### Rules
- Respect quiet hours & notification consent
- Suggestions are dismissible
- High-impact actions still need approval

### Done when
- [ ] At least two proactive suggestion types work in staging with consent on
