# Phase 01 / Task 03 — Auth and RBAC Baseline

**Priority:** P0  
**Depends on:** Task 01 + Task 02

### Objective
Deliver identity contracts so clients can register/login and the API can distinguish roles.

### Takes (inputs)
- User / RefreshToken / UserPreference tables
- Role enum: CLIENT, GUIDE, BUSINESS, ADMIN
- Security rules from docs 03/14/20
- Password hashing policy (Argon2id/bcrypt)

### Gives (outputs)
- Auth API contracts working on local:
  - register
  - login
  - refresh
  - logout/revoke
  - me (profile read)
- Password hashes stored (never plain text)
- Access + refresh token behavior defined
- Default role CLIENT on register
- Ability to create an ADMIN user via controlled seed/script process (documented)

### What each auth operation takes / gives

| Operation | Takes | Gives |
| --- | --- | --- |
| Register | email, password, displayName, locale optional | user id + tokens OR verification-needed state |
| Login | email, password | access token + refresh token + basic profile |
| Refresh | refresh token | new access token (+ rotated refresh) |
| Logout | refresh token / session id | revoked session |
| Me | access token | user profile + role + prefs stub |

### Steps (no code)
1. Define request/response field lists for each auth operation.
2. Implement password hashing and verification flow.
3. Implement JWT access short TTL + refresh rotation philosophy.
4. Persist refresh token hashes with expiry/revocation fields.
5. Protect `/me` with auth guard.
6. Add role guard capability (at least CLIENT vs ADMIN).
7. Ensure register cannot self-assign ADMIN.
8. Create documented method to promote/create ADMIN for local/staging.
9. Create documented method to create **GUIDE** seed user (owner will use it for Djerba data entry).
10. Add basic rate-limit intention on login/register.
11. Write auth contract sheet for mobile + admin + portals.

### Tests
| Test | Expected result |
| --- | --- |
| Register new user | Success; password not stored plain |
| Login correct password | Tokens returned |
| Login wrong password | Safe error; no user enumeration leakage if possible |
| Access `/me` without token | 401 |
| Access `/me` with token | Profile returned |
| Refresh with valid token | New access issued |
| Refresh after logout/revoke | Rejected |
| Register with role ADMIN in body | Ignored/rejected |

### Done when
- [ ] All auth contracts pass manual + automated tests (Task 06)
- [ ] Admin creation path documented
- [ ] Mobile has a clear auth contract sheet

### Risks / notes
- Email verification can be Phase 01 recommended or immediate Phase 02; decide and document.
- Never log tokens/passwords.

### Links
- `LocalLife Documentation/03-Actors-Roles-Permissions.md`
- `LocalLife Documentation/14-Security-Compliance.md`
