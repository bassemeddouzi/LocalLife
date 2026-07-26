# Guide & Business ops (Admin-provisioned)

**Aligned with:** Decisions Log v1.2 — one mobile app, Admin web provisioning.

## Create a Guide
1. Open Admin web → **Users → Guides → Add Guide**.
2. Enter email + display name (languages optional).
3. Copy the **temporary password** shown once; send it to the Guide (email mailer later).
4. Guide installs **LocalLife** (same Expo app as Clients) → **Login** (no Register).
5. App detects `role=GUIDE` → Guide tabs (submit place/tip, submissions, profile).

## Create a Business
Same flow under **Users → Business → Add Business**. Login on the same mobile app → Business tabs.

## Block / Reactivate
- **Block** sets `status=SUSPENDED` → login fails.
- **Reactivate** sets `ACTIVE` again.
- Approved public content is not auto-hidden on suspend.

## Clients
- Public **Register** on mobile creates **CLIENT** only.
- Admin **Users → Clients** list + Block/Reactivate.

## Seed shortcuts (local/staging)
- Admin: `admin@locallife.local` / `Admin123!`
- Guide: `guide@locallife.local` / `Guide123!`

## Flags
- `FF_GUIDE_SELF_APPLY` default **false** — public guide apply disabled unless Admin enables it.
