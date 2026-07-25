# Phase 00 / Task 02 — Local Dev Environment

**Priority:** P0  
**Aligned with:** Decisions Log (Expo + iOS/Android + Admin web)

### Objective
Ready one machine for API + Expo mobile + Admin web development.

### Takes
- Admin rights on machine
- Ideally **macOS access** for iOS/TestFlight path (required eventually)

### Gives
- Node LTS + package manager verified
- PostgreSQL local verified
- Expo tooling verified (create blank Expo app smoke optional)
- Browser + API client for Admin/API
- Android emulator path OR device
- iOS simulator path noted (Mac) OR external Mac plan documented
- Versions written in private setup note

### Steps
1. Install Git, Node, Postgres.
2. Install Expo/EAS CLI tooling.
3. Confirm Android Studio or device debugging.
4. Confirm Xcode/simulator **or** write “Mac borrow/CI plan”.
5. Install API client + browser for Admin.
6. Create local DB name decision (`locallife_dev`).

### Tests
| Test | Expected |
| --- | --- |
| `node` / package manager versions print | OK |
| Postgres connects | OK |
| Expo doctor/tooling responds | OK |

### Done when
- [ ] Toolchain ready for Phase 01 three-app scaffold
- [ ] iOS path is either ready or explicitly planned
