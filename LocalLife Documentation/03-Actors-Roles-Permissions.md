# 03 — Actors, Roles & Permissions

**Document type:** Product + security model  
**Version:** 1.0  
**Language:** English

---

## 1. Overview

LocalLife AI has four primary system roles:

| Role code | Display name | Primary purpose |
| --- | --- | --- |
| `CLIENT` | Client / End user | Ask, discover, save, review |
| `GUIDE` | Local Guide | Contribute verified local knowledge |
| `BUSINESS` | Business Owner | Manage venue profile, promote, analytics |
| `ADMIN` | Administrator | Moderate, approve, configure platform |

A single human account may hold **one primary role**.  
Future option: multi-role accounts via explicit linking (e.g., user is also guide) — not required for MVP, but schema should allow `UserRole` join if needed.

---

## 2. Role relationship

```text
Administrator
      │
 ┌────┴────┐
 │         │
Guide   Business
 │         │
 └────┬────┘
      │
 Verified Knowledge Base
      │
      ▼
 AI Assistant (retrieval + generation)
      │
      ▼
   Client
```

Guides and businesses **feed** knowledge.  
Admins **gate** quality.  
AI **serves** clients from approved knowledge.

---

## 3. Actor: Client

### 3.1 Description

The final consumer of the product — tourist, student, expat, business traveler, or local resident.

### 3.2 Capabilities (MVP)

- Register / login / logout
- Manage profile and preferences
- Use AI chat
- Browse places, events, experiences
- View maps / distances
- Save favorites
- Write reviews / upload photos (with moderation rules)
- Report content
- Receive basic notifications (later-ready)

### 3.3 Permissions matrix (Client)

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Own profile | — | Yes | Yes | Soft-delete request |
| Own preferences | Yes | Yes | Yes | Yes |
| Places | No | Approved only | No | No |
| Events | No | Approved/public | No | No |
| Reviews (own) | Yes | Yes | Yes | Soft-delete |
| Reviews (others) | No | Yes | No | No |
| Favorites | Yes | Own | Yes | Yes |
| Conversations | Yes | Own | — | Soft-delete own |
| Reports | Yes | Own | No | No |

### 3.4 Client constraints

- Cannot publish places directly in MVP (optional “suggest place” → pending)
- Cannot bypass sponsorship labeling
- Rate-limited on AI and review creation

---

## 4. Actor: Local Guide

### 4.1 Description

Trusted local experts who enrich the platform with authentic knowledge.

### 4.2 Onboarding states

`APPLIED` → `UNDER_REVIEW` → `APPROVED` | `REJECTED` | `SUSPENDED`

Only `APPROVED` guides can publish (or submit for approval, depending on policy).

### 4.3 Capabilities

- Maintain guide profile (bio, languages, city expertise, assigned city/district)
- Add/edit places with category + practical attributes (submit for approval)
- Add local tips / how-to content
- Create events and experiences (moderated)
- Suggest hidden / practical places (repair, budget shops, beaches, sunset spots, etc.)
- Propose new **Business** accounts for Admin approval
- Update outdated information (own submissions)
- (Future / Wave 2) LocalRule + transport note contributions; answer community questions

### 4.4 Permissions matrix (Guide)

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Guide profile (own) | Yes | Yes | Yes | No |
| Places (own submissions) | Yes | Yes | Yes (while pending/owned) | Soft |
| Local tips / HowTo | Yes | Yes | Own | Soft |
| Events (own submissions) | Yes | Yes | Own | Soft |
| Experiences | Yes | Yes | Own | Soft |
| Business applications | Propose | Own | No | No |
| Reviews | As client | As client | As client | As client |
| Admin settings | No | No | No | No |

### 4.5 Guide quality rules

- Content should include source notes where relevant
- Edits to critical safety/rules content always require admin review
- Trust score can weight AI retrieval later

---

## 5. Actor: Business Owner

### 5.1 Description

Represents a venue or service provider (restaurant, hotel, tour company, museum, café, activity operator).

### 5.2 Capabilities

- Claim / manage business profile linked to Place(s)
- Update business info (hours, photos, contact) under moderation policy
- Publish events
- Promote services (sponsorship later)
- View analytics (views, saves, chat mentions — later)
- Manage bookings (future)

### 5.3 Permissions matrix (Business)

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Business profile (own) | Yes | Yes | Yes | No |
| Linked place fields | Limited | Yes | Limited | No |
| Events (own) | Yes | Yes | Own | Soft |
| Sponsorship campaigns | Future | Own | Own | Own |
| Bookings | Future | Own | Own | — |
| Platform users’ private data | No | No | No | No |

### 5.4 Business constraints

- Cannot fake reviews
- Cannot silently inject ads into AI answers without `isSponsored` labeling
- Claim verification required before full control

---

## 6. Actor: Administrator

### 6.1 Description

Internal operators responsible for quality, safety, and configuration.

### 6.2 Capabilities

- Approve/reject guides, business claims, and **Guide-proposed Business applications**
- Validate places, events, experiences, tips, local rules, arrival guides
- View full Guide historic (all contribution types)
- Moderate reports and reviews
- Manage categories, countries, cities
- Manage sponsorship inventory
- View platform analytics
- Suspend users/content
- Configure feature flags / country pack activation

### 6.3 Admin tiers (recommended)

| Tier | Scope |
| --- | --- |
| `ADMIN_CITY` | One or more cities |
| `ADMIN_COUNTRY` | Country pack |
| `ADMIN_SUPER` | Global configuration |

MVP may start with `ADMIN_SUPER` only, but schema should support scoped admins.

---

## 7. Cross-cutting permission concepts

### 7.1 Verification status

Most public content uses:

`DRAFT | PENDING | APPROVED | REJECTED | ARCHIVED`

AI retrieval default: **APPROVED only**.

### 7.2 Ownership

Every mutable entity should track:

- `createdByUserId`
- `updatedByUserId`
- `ownedByGuideId` / `ownedByBusinessId` when applicable

### 7.3 Report & moderation

Any client can report:

- place
- review
- event
- user
- AI answer quality (feedback)

Admins resolve reports: `OPEN | IN_REVIEW | RESOLVED | DISMISSED`

---

## 8. Authentication & authorization model

- Auth: JWT access token + refresh token
- Passwords hashed (Argon2id or bcrypt)
- Authorization: role guards + resource ownership checks
- Optional later: OAuth (Google/Apple)

Every protected endpoint must check:

1. authenticated identity
2. role permission
3. resource ownership / city scope (for admins)
4. content status visibility rules

---

## 9. AI-facing actor implications

The AI is **not** a separate login role.  
It is a system component that reads as a privileged internal service with constraints:

- may read APPROVED knowledge
- may read requesting user’s profile/preferences/conversation
- may not expose other users’ private conversations
- must respect sponsorship disclosure rules
- must prefer higher-trust sources

---

## 10. Future actors (documented, not MVP)

| Actor | Purpose |
| --- | --- |
| Content Agency Partner | Bulk city pack production |
| Municipality / Tourism Board | Official events & notices |
| Support Agent | Customer support console |
| Data Analyst (read-only) | BI access |

---

## 11. Summary permission philosophy

- **Clients consume**
- **Guides contribute expertise**
- **Businesses manage commercial presence**
- **Admins protect trust**

Trust is the product. Permissions exist to protect trust.

---

*Next: [04 — User Personas & Journeys](./04-User-Personas-Journeys.md)*
