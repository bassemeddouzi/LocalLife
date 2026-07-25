# Phase 03 — Local Knowledge — Overview

**Phase goal:** Encode Djerba operating knowledge (transport, arrival, rules) and seed P0 content so AI has truth to retrieve.  
**Depends on:** Phase 02 Core API Gate.  
**Exit unlocks:** Phase 04 AI Chat.

---

## Why this phase is before AI
If AI starts before knowledge exists, answers will hallucinate.  
This phase makes “airport first hour” answerable from DB alone.

## Takes
- Places/geo APIs
- Documentation 07 + 17 seed plan
- Content owner time

## Gives
- TransportSystem/Hub/Route APIs
- ArrivalGuide + GuideStep APIs
- LocalRule APIs
- HowToGuide survival kit stub
- Djerba seed v1 (P0 minimum)
- Content QA sign-off

## Tasks
1. [01-Transport-APIs-and-Model](./01-Transport-APIs-and-Model.md)
2. [02-Arrival-and-HowTo-Guides](./02-Arrival-and-HowTo-Guides.md)
3. [03-Local-Rules-API](./03-Local-Rules-API.md)
4. [04-Djerba-Seed-P0](./04-Djerba-Seed-P0.md)
5. [05-Content-QA-Gate](./05-Content-QA-Gate.md)
6. [06-Phase-Exit](./06-Phase-Exit.md)

## Test gate: Knowledge Gate
Without AI, an operator can fetch arrival steps + transport options for airport→Midoun from APIs.
