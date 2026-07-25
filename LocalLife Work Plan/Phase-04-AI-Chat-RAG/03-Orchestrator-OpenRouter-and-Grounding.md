# Phase 04 / Task 03 — Orchestrator OpenRouter and Grounding

**Priority:** P0  
**Replaces generic “LLM provider” wording**

### Objective
Grounded answers using **OpenRouter** as the single gateway to multiple models.

### Takes
| Input | Source |
| --- | --- |
| User message + GPS/city/locale/persona | client/profile |
| Tool outputs | retrieval tools |
| Active model id | AiModelConfig (default seeded) |
| OpenRouter API key | env secret |

### Gives
| Output | Meaning |
| --- | --- |
| Assistant text | Localized when possible |
| Citations[] | entity refs |
| Cards[] + reasons[] | UI payload |
| Grounding flag | grounded/partial/fallback |
| Persisted messages/citations | traceability |
| Provider metadata logs | model id, latency (no secrets) |

### Rules
- Do not hardcode a single vendor model in source for production behavior
- Read model id from config store
- Switching model must not require code edit (Admin UI in Phase 05b)

### Tests
| Test | Expected |
| --- | --- |
| Seeded airport question | Citations present |
| Change AiModelConfig model id + ask again | Still works (or clear error if model invalid) |
| Missing data question | No invented place |

### Done when
- [ ] OpenRouter path works with config-driven model id
