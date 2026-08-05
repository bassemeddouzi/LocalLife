# 03 — Actors, Roles & Permissions

**Document type:** Product + security model  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

---

## 1. Overview

LocalLife AI has four primary system roles:

| Role code | Display name | Primary purpose |
| --- | --- | --- |
| `CLIENT` | Client / End user | Ask, plan, save, review; Avatar companion |
| `GUIDE` | Local Guide (Main or SubGuide) | Contribute verified zone knowledge |
| `BUSINESS` | Business Owner | Manage venue profile, promote, analytics |
| `ADMIN` | Administrator | Moderate, approve, SubGuide confirm, configure |

A single human account may hold **one primary role**.  
SubGuide is **not** a separate role code — same `GUIDE` + `GuideProfile.parentGuideId`.

---

## 2. Role relationship

```text
Administrator
      │ confirms SubGuides / moderates
 ┌────┴────┐
 │         │
Main Guide ──proposes──► SubGuide (border)
 │         │
 │      Business
 └────┬────┘
      ▼
 Verified Knowledge Base (+ freshness)
      ▼
 AI Companion (retrieval + plans + Avatar cues)
      ▼
   Client
```

---

## 3. Actor: Client

### 3.1 Capabilities (MVP companion)

- Register / login / logout
- Deep identity onboarding + **hard filters**
- AI chat → save/edit **plans**; open plan packs
- Browse/search places, events, experiences
- Floating **Avatar** cues (open chat / continue plan)
- Favorites, reviews/photos, content reports
- Offline: active plan + emergency strip + cached cues

### 3.2 Permissions matrix (Client)

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Own profile / preferences | — / Yes | Yes | Yes | Soft-delete request |
| Places / events | No | Approved public | No | No |
| ZoneSafetyAssessment | No | **Derived advice only** | No | No |
| ClientPlan / steps | Yes | Own | Own | Soft |
| AvatarCue | No | Own | Mark read | No |
| Reviews (own) | Yes | Yes | Yes | Soft |
| Favorites / Reports | Yes | Own | Yes / No | Yes / No |
| Conversations | Yes | Own | — | Soft |

### 3.3 Constraints

- Hard filters are enforced server-side (not optional hints)
- Cannot see raw `SafetyLevel` dumps
- Rate-limited on AI and review creation

---

## 4. Actor: Local Guide (Main vs SubGuide)

### 4.1 Shared

Both use role `GUIDE`. Onboarding: `APPLIED` → `UNDER_REVIEW` → `APPROVED` | `REJECTED` | `SUSPENDED`.  
Only approved guides publish inside their scope.

### 4.2 Main Guide

| Capability | Allowed |
| --- | --- |
| Hierarchical zone assignment (Admin-set) | Yes — one Main per zone key |
| Rich contributions (places, transport, tips, events, experiences, zone safety) | Inside assignment scope |
| Propose Business | Yes → Admin approve |
| **Propose SubGuide** (email, name, formation note + **draw border**) | Yes → `PENDING_ADMIN` |
| Publish outside own assignment | No |

### 4.3 SubGuide

| Capability | Allowed |
| --- | --- |
| Created only after **Admin confirms** SubGuideApplication | Yes |
| `parentGuideId` + `borderGeoJson` set | Required |
| Contribute / publish | **Inside border only** (server enforces) |
| Propose further SubGuides | No (MVP) |
| Change own border | No — Main/Admin only |

### 4.4 Permissions matrix (Guide)

| Resource | Main | SubGuide |
| --- | --- | --- |
| Guide profile (own) | CRUD limited | CRUD limited |
| Places / tips / events / experiences (own) | Create/update in scope | Create/update **in border** |
| ZoneSafetyAssessment | In scope | In border |
| SubGuideApplication | Create / read own proposals | No |
| Business applications | Propose | No |
| Admin settings | No | No |

### 4.5 Quality rules

- Guide = **comments only** (no Guide star scores); Client = rating + comment
- Critical safety/rules edits need Admin review
- Freshness: monthly refresh; stale → AI down-rank
- Author language as written; content translation later

---

## 5. Actor: Business Owner

*(Unchanged intent from v1 — claim/profile, limited place fields, events; bookings future.)*

| Resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Business profile (own) | Yes | Yes | Yes | No |
| Linked place fields | Limited | Yes | Limited | No |
| Events (own) | Yes | Yes | Own | Soft |
| Bookings / sponsorship | Future | Own | Own | — |

Constraints: no fake reviews; sponsorship labeled; claim verified before full control.

---

## 6. Actor: Administrator

### 6.1 Capabilities (companion additions)

- Approve/reject guides, business claims, Guide-proposed Business apps
- **SubGuide confirm queue:** review parent zone vs drawn border + formation note → Approve (create GUIDE user + `parentGuideId` + temp password) or Reject
- Validate places, events, experiences, tips, local rules, arrival, **zone safety**
- Moderate reports → route Guide verify → replan notify
- Manage geo, categories, feature flags, AI model config, city activation
- Suspend users/content; view Guide historic

### 6.2 Admin tiers

`ADMIN_CITY` | `ADMIN_COUNTRY` | `ADMIN_SUPER` — MVP may start with SUPER only.

---

## 7. Cross-cutting permission concepts

### 7.1 Verification status

`DRAFT | PENDING | APPROVED | REJECTED | ARCHIVED` — AI default: **APPROVED only**.

### 7.2 Scope enforcement

1. Main Guide: assignment hierarchy (country → hood)
2. SubGuide: point-in-polygon / borderGeoJson must be inside parent scope
3. Admin: city/country/global scope

### 7.3 Report & moderation

Clients report place/review/event/user/AI answer. Status: `OPEN | IN_REVIEW | RESOLVED | DISMISSED`.  
Companion path: report inaccurate/closed → Admin → Guide verify → update → replan + Avatar cue.

---

## 8. Authentication & authorization

- JWT access + refresh; passwords Argon2id/bcrypt; optional Google OAuth for Clients
- Guards: identity → role → ownership → **geo/border scope** → visibility status

---

## 9. AI-facing implications

AI is not a login role. It may:

- read APPROVED knowledge + requesting user’s prefs/hard filters/plans
- use zone safety **internally** (never expose raw danger enums to Client)
- create Avatar cues / plan drafts for the current user
- not expose other users’ private data

---

## 10. Future actors (not MVP)

Content Agency Partner · Municipality / Tourism Board · Support Agent · Data Analyst

---

## 11. Summary

- **Clients** consume companion (plans, Avatar, hard filters)
- **Main Guides** own zones and recruit SubGuides
- **SubGuides** contribute inside Admin-confirmed borders
- **Businesses** manage commercial presence
- **Admins** protect trust (including SubGuide confirm)

---

*Next: [04 — User Personas & Journeys](./04-User-Personas-Journeys.md)*
