# Phase 05 / Task 03 — Chat UX, Citations, Cards

**Priority:** P0

### Objective
Make AI Chat the main companion interface with trustworthy presentation.

### Takes
- AI message API (text + citations + cards + grounding flag)
- Conversation list/detail APIs

### Gives
| UI element | Takes | Gives |
| --- | --- | --- |
| Conversation list | user chats | resume history |
| Composer | text + implicit GPS context | sends message |
| Assistant bubble | text | readable answer |
| Citation/cards | entity refs | tap → place/guide detail |
| Reasons chips | reasons[] | “why this” clarity |
| Follow-up chips (MVP+) | suggested refinements | cheaper/closer/more local prompts |
| Report control | message id | trust feedback |

### Done when
- [ ] Seeded golden questions usable from mobile UI
- [ ] Cards navigate correctly
