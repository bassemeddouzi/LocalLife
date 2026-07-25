# Phase 01 / Task 01 — Database Schema v1

**Priority:** P0  
**Depends on:** Phase 00 exit  
**Aligned with:** Decisions Log + Documentation/08

### Objective
Apply schema v1 including MVP portal entities and **LLM/OpenRouter settings** for Admin model switching.

### Takes
- Documentation/08
- Need for GuideProfile, BusinessProfile, claims
- Need for runtime AI config (model id) editable by Admin

### Gives
- Migrated local DB
- All MVP tables including:
  - identity/roles/prefs/consents
  - geo/places/reviews/favorites/reports
  - transport/rules/guides
  - conversations/citations
  - FeatureFlag, AuditLog, AnalyticsEvent
  - Guide/Business profiles + claims
  - **AiModelConfig / LlmSettings** (active provider=OpenRouter, model id, fallback, updatedByAdmin)
- Future booking tables may exist unused

### AiModelConfig contract (conceptual)
**Takes (admin writes):** provider name (`openrouter`), model id string, fallback model, enabled  
**Gives (API reads):** orchestrator selects model at runtime without code change

### Steps
1. Implement Documentation/08 groups.
2. Explicitly include Guide/Business tables (MVP).
3. Add AiModelConfig (or equivalent) table.
4. Apply migration; verify critical tables.
5. Note deviations.

### Tests
| Test | Expected |
| --- | --- |
| Migration on empty DB | Success |
| Tables User, Place, GuideProfile, BusinessProfile, AiModelConfig exist | Present |

### Done when
- [ ] Schema supports MVP portals + OpenRouter model switch
