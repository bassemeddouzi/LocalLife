# Phase 05c — Local Companion (Vision 2.0)

**Priority:** P0  
**Depends on:** Phase 05b portals + Guide scope zones  
**Status:** In progress (2026-08-02)

### Objective
Ship the LocalLife **local companion**: rich Trusted Guide knowledge, Client identity + hard filters, AI plans, SubGuides (Guide invite → map border → Admin confirm), floating AI Avatar, freshness/report/replan — with vision-first UX (not Google Maps).

### Waves (execution order)
0. Docs + design system (Avatar motion, Client/Guide IA)  
1. Prisma models (SubGuideApplication, plans, zone safety, notifications cues, rich place fields)  
2. API + security  
3. Admin confirm SubGuide + moderation extensions  
4. Guide dashboard redesign + SubGuide map draw + rich forms  
5. Client redesign + Avatar + plans/search/chat  
6. Offline + freshness jobs → Avatar  
7. Tests / hardening  
8. Env keys (OpenRouter, Mapbox, R2, Google) when provided  

### Done when
- [x] Decisions Log v2.0 reflected in schema + APIs  
- [x] Main Guide can propose SubGuide with drawn border; Admin can approve  
- [x] Client can onboard deeply, get packs, chat→plan, Avatar notifications  
- [x] Sensitive zone intel redacted from Client DTOs (AI-internal)  
- [x] Freshness down-rank + report→replan path works with mocks if keys missing  
- [x] Search, offline plan cache, Admin freshness + jobs endpoints  
