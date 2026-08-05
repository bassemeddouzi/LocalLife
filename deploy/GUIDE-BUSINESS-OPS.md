# Guide & Business ops (Admin-provisioned + Guide propose)

**Aligned with:** Decisions Log v1.5 — one mobile app; Admin web provisioning; Guide may propose Business.

## Client auth (for contrast)

- Travelers (**CLIENT**) use the pre-login landing: **Continue with Google** or **Continue with email**.
- Google Sign-In is **CLIENT only** (`POST /v1/auth/google`). Guide and Business accounts stay Admin-provisioned email/password — no Google for those roles in MVP.
- Phone / SMS OTP is deferred.

## Contribution catalog (what Guide adds)

| Content | Becomes map pin? | Notes |
| --- | --- | --- |
| Place (+ category, metadata attributes) | Yes (after Admin approve) | Beaches, repair shops, budget shops, rental, camping spots, sunset viewpoints, etc. |
| Event (optional placeId) | Via linked place / explore | Schedule + summary |
| Experience | Explore / AI | Multi-step itinerary |
| Tip / HowTo | No | Transport how-it-works, practical advice |
| LocalRule (Wave 2 Guide write) | No | Danger / safety / rental norms |
| Business application | No | Admin approve → creates Business user |

## Create a Guide
1. Open Admin web → **Users → Guides → Add Guide**.
2. Enter email + display name + **city + district** (required).
3. Copy the **temporary password** shown once; send it to the Guide (email mailer later).
4. Guide installs **LocalLife** (same Expo app as Clients) → landing → **Continue with email** → **Login** (no Register / no Google for Guide).
5. App detects `role=GUIDE` → Guide tabs (place / tip / event / experience / propose Business / submissions).

## Create a Business (Admin)
Same flow under **Users → Business → Add Business**. Login on the same mobile app → Business tabs.

## Guide proposes a Business
1. Guide → **Propose Business** (email, display name, city, district, note).
2. Admin → **Moderation → Business applications** → Approve.
3. Admin copies the **temporary password** returned once and sends it to the business owner.
4. Business logs in on the same mobile app.

## Block / Reactivate
- **Block** sets `status=SUSPENDED` → login fails.
- **Reactivate** sets `ACTIVE` again.
- Approved public content is not auto-hidden on suspend.

## Clients
- Public **Register** on mobile creates **CLIENT** only.
- Admin **Users → Clients** list + Block/Reactivate.

## Guide historic (Admin)
Users → Guides → Historic shows places, tips, events, experiences, and business applications for that Guide.

## Seed shortcuts (local/staging)
- Admin: `admin@locallife.local` / `Admin123!`
- Guide: `guide@locallife.local` / `Guide123!`
- Business: `business@locallife.local` / `Business123!`

## Flags
- `FF_GUIDE_SELF_APPLY` default **false** — public guide apply disabled unless Admin enables it.
