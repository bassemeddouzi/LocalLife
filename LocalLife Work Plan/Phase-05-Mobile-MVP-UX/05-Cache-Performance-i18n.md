# Phase 05 / Task 05 — Cache, Performance, i18n (EN/FR/AR)

**Priority:** P0  
**Aligned with:** All languages in MVP

### Objective
Keep the Expo app light and fully multi-language for MVP UI.

### Takes
- NFR cache TTLs
- i18n framework
- RTL requirement for Arabic

### Gives
| Mechanism | Takes | Gives |
| --- | --- | --- |
| Query cache | GET APIs | Fewer refetch storms |
| Pagination | page params | Bounded lists |
| Images | placeholders OK | Lazy load; compress when real media arrives |
| i18n | EN/FR/AR resources | All MVP screens translated |
| RTL | AR locale | Layout mirrors correctly |
| Offline cache | favorites/prefs/recent/guides | Limited offline |

### Tests
| Test | Expected |
| --- | --- |
| Switch EN→FR→AR | No crash; strings change |
| AR RTL | Layout direction correct |
| Warm Home reopen | Faster second load |

### Done when
- [ ] EN/FR/AR MVP UI complete enough for beta
- [ ] Performance checklist acceptable
