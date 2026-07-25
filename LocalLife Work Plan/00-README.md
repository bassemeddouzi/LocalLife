# LocalLife AI — Work Plan (A → Z)

**Language:** English  
**Version:** 1.1  
**Type:** Execution plan & task documentation (NO source code)  
**Companion docs:** `../LocalLife Documentation/`  
**Binding decisions:** [07-Decisions-Log.md](./07-Decisions-Log.md) ← **read first**

---

## What this folder is

This is the **step-by-step working plan** to build LocalLife AI from zero to the long-term vision.

It answers:

- What to do **now**
- In **which order**
- What each step **takes as input**
- What each step **must produce as output**
- When to run the **first tests** and every later test gate
- When a phase is **done**
- How to go from local environment → staging → production deploy

**Important:** This plan describes objectives, inputs, outputs, checklists, and acceptance criteria.  
It does **not** contain implementation code.

---

## Locked MVP stack (summary)

| Area | Choice |
| --- | --- |
| Team | Solo |
| Repo | Monorepo: `api` + `mobile` (Expo) + `admin` |
| AI | OpenRouter (model switchable in Admin) |
| Maps | Mapbox |
| Hosting | Railway (staging + early prod) |
| Languages | EN + FR + AR |
| MVP extras | Guide + Business portals + real Admin web |
| Not in MVP | Booking/payments, full AI Agent |

---

## How to use this plan

1. Read [07-Decisions-Log.md](./07-Decisions-Log.md) (locked).
2. Read `01-Master-Timeline-A-to-Z.md` once.
3. Read `02-Definition-of-Done.md` and keep it as your quality bar.
4. Complete phases **in order**. Do not skip exit criteria.
5. Inside each phase folder, start with `00-Overview.md`, then follow numbered tasks.
6. After each task: verify **Outputs** exist, then run the listed **Tests**.
7. Only then mark the phase exit checklist and move forward.

---

## Phase map

| Phase | Folder | Goal |
| --- | --- | --- |
| 00 | [Phase-00-Preparation](./Phase-00-Preparation/00-Overview.md) | Accounts, tools, local env (decisions already locked) |
| 01 | [Phase-01-Foundation](./Phase-01-Foundation/00-Overview.md) | Schema, API, Expo mobile, **Admin web skeleton**, first tests |
| 02 | [Phase-02-Core-Domain-API](./Phase-02-Core-Domain-API/00-Overview.md) | Places + Guide/Business APIs + admin moderation APIs |
| 03 | [Phase-03-Local-Knowledge](./Phase-03-Local-Knowledge/00-Overview.md) | Transport/arrival/rules + Djerba seed (fake OK first) |
| 04 | [Phase-04-AI-Chat-RAG](./Phase-04-AI-Chat-RAG/00-Overview.md) | Grounded chat via **OpenRouter** + golden tests |
| 05 | [Phase-05-Mobile-MVP-UX](./Phase-05-Mobile-MVP-UX/00-Overview.md) | Client Expo app MVP (EN/FR/AR) |
| 05b | [Phase-05b-Admin-Guide-Business-MVP](./Phase-05b-Admin-Guide-Business-MVP/00-Overview.md) | **Admin + Guide + Business MVP UX** |
| 06 | [Phase-06-Hardening-NFRs](./Phase-06-Hardening-NFRs/00-Overview.md) | NFRs + **Railway staging** |
| 07 | [Phase-07-Closed-Beta-Djerba](./Phase-07-Closed-Beta-Djerba/00-Overview.md) | Seed depth + **30 testers** beta |
| 08 | [Phase-08-Public-MVP-Launch](./Phase-08-Public-MVP-Launch/00-Overview.md) | **Railway production** launch |
| 09 | [Phase-09-Tunisia-Expansion](./Phase-09-Tunisia-Expansion/00-Overview.md) | Multi-city Tunisia packs |
| 10 | [Phase-10-Guides-Business](./Phase-10-Guides-Business/00-Overview.md) | Portal **enhancements** (MVP portals already shipped in 05b) |
| 11 | [Phase-11-Monetization-Light](./Phase-11-Monetization-Light/00-Overview.md) | Sponsored listings (labeled) |
| 12 | [Phase-12-International](./Phase-12-International/00-Overview.md) | Country packs beyond Tunisia |
| 13 | [Phase-13-Marketplace-Booking](./Phase-13-Marketplace-Booking/00-Overview.md) | Bookings + payments |
| 14 | [Phase-14-AI-Agent](./Phase-14-AI-Agent/00-Overview.md) | Proactive agent with approval |

---

## Root documents

- [01 — Master Timeline A→Z](./01-Master-Timeline-A-to-Z.md)
- [02 — Definition of Done](./02-Definition-of-Done.md)
- [03 — Roles, Tools & Accounts Checklist](./03-Roles-Tools-Checklist.md)
- [04 — Testing Strategy (all phases)](./04-Testing-Strategy.md)
- [05 — Environments & Deploy Path](./05-Environments-and-Deploy-Path.md)
- [06 — Task Template (copy for new tasks)](./06-Task-Template.md)
- [07 — Decisions Log (LOCKED)](./07-Decisions-Log.md)

---

## Task documentation format (standard)

Every task file uses this contract:

| Section | Meaning |
| --- | --- |
| Objective | Why this task exists |
| Takes (inputs) | What must already exist / what enters the step |
| Gives (outputs) | Concrete artifacts you must have when finished |
| Steps | Ordered human actions (no code) |
| Tests | How to prove it works |
| Done when | Exit gate for this task |
| Links | Related product/tech docs |

---

## Hard rules

1. No phase advance without exit criteria.
2. First automated tests happen in **Phase 01**.
3. AI must stay grounded (citations) before public beta.
4. Prefer depth in Djerba before Tunisia breadth.
5. Follow **07-Decisions-Log** over older conflicting notes.
6. Guide + Business + Admin web are **MVP**, not post-launch.
7. Booking/payments stay **out of MVP**.
8. This plan stays **code-free**.

---

## Suggested weekly rhythm

1. Pick current phase overview
2. Complete 1–3 tasks fully (inputs→outputs→tests)
3. Re-check phase exit criteria at end of week

---

*Start: [07-Decisions-Log.md](./07-Decisions-Log.md) → [01-Master-Timeline-A-to-Z.md](./01-Master-Timeline-A-to-Z.md)*
