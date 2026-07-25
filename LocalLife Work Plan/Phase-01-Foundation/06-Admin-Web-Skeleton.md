# Phase 01 / Task 06 — Admin Web Skeleton

**Priority:** P0  
**New (MVP requirement)**

### Objective
Create a real Admin web app shell that will host moderation, flags, and OpenRouter model settings.

### Takes
- Monorepo `apps/admin` slot
- Auth ADMIN role
- API health + login contracts

### Gives
| Area | Takes | Gives |
| --- | --- | --- |
| Admin app boot | web framework choice (document choice: Next.js/Vite/React…) | App opens in browser |
| Login page | admin credentials | Session toward API |
| Shell layout | nav placeholders | Dashboard / Moderation / Users / AI Config / Flags sections empty |
| Env config | local API URL | Points to local API |

### Steps
1. Choose admin web stack (recommend React/Vite or Next.js — record choice).
2. Scaffold `apps/admin`.
3. Add login screen calling API auth.
4. Add protected layout requiring ADMIN role.
5. Add empty pages for: Moderation, Users/Guides/Business, AI Model Config, Feature Flags, Seed tools.
6. Confirm anonymous users cannot see admin pages.

### Tests
| Test | Expected |
| --- | --- |
| Open admin locally | Renders |
| Login as CLIENT | Denied |
| Login as ADMIN | Enters shell |

### Done when
- [ ] Admin shell exists and role-gated
- [ ] Ready for Phase 05b real screens
