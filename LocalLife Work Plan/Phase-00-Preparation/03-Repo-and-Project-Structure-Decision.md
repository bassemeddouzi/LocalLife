# Phase 00 / Task 03 — Repo and Project Structure Decision

**Priority:** P0  
**Depends on:** Task 01 Git account  
**Status:** PRE-DECIDED — see [07-Decisions-Log.md](../07-Decisions-Log.md)

### Objective
Confirm and materialize the locked monorepo structure (no re-debate).

### Takes (inputs)
- Locked decisions: Monorepo + Expo + Admin web app
- Solo builder

### Gives (outputs)
- Remote GitHub repo created
- Documented structure:

```text
apps/
  api/        # NestJS + Prisma
  mobile/     # Expo (iOS + Android)
  admin/      # Real Admin web app
packages/
  shared-types/   # optional
```

- Branching: `main` + `feature/*`
- Conventional commits intention
- Docs/Work Plan linked or included

### Steps (no code)
1. Create private GitHub repository.
2. Record monorepo layout exactly as above (do not omit `admin`).
3. Record Expo as mobile choice.
4. Record branching + commit conventions.
5. Ensure LocalLife Documentation + Work Plan are referenced from repo README later.

### Tests
| Test | Expected |
| --- | --- |
| Decision matches Decisions Log | Identical |
| Remote repo clone works | Success |

### Done when
- [ ] Repo exists
- [ ] Structure note committed or saved in Work Plan evidence

### Links
- `../07-Decisions-Log.md`
