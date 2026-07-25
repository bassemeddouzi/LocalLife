# Phase 01 / Task 05 — Mobile Skeleton (Expo)

**Priority:** P0  
**Replaces older bare-RN-only wording**  
**Aligned with:** Decisions Log — Expo first, iOS + Android

### Objective
Boot an Expo app shell with MVP tabs placeholders and API config toward local API.

### Takes
- Expo toolchain
- Auth contract sheet
- Navigation IA: Home / Explore / Chat / Saved / Profile
- i18n init for EN/FR/AR (resources can be partial)

### Gives
| Area | Takes | Gives |
| --- | --- | --- |
| Expo app | toolchain | Runs on Android emulator/device; iOS simulator if Mac |
| Tabs | IA | Placeholder screens |
| Auth screens | contracts | Login/Register placeholders |
| Config | local API URL | Env flavor local |
| i18n | locale keys | EN + stubs FR/AR + RTL readiness |

### Steps
1. Scaffold Expo app in `apps/mobile`.
2. Create feature folder structure.
3. Add bottom tabs placeholders.
4. Add Login/Register placeholders.
5. Plan secure token storage (Expo SecureStore).
6. Init i18n with EN/FR/AR files (FR/AR may be incomplete strings).
7. Document Expo start instructions for solo builder.

### Tests
| Test | Expected |
| --- | --- |
| App launches on Android path | No crash |
| Tabs switch | OK |
| iOS path smoke OR documented deferral with date | One of the two |

### Done when
- [ ] Expo mobile shell runs
- [ ] Ready for Phase 05 full UX
