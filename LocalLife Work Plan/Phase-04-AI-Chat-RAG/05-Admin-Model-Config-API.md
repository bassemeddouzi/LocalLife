# Phase 04 / Task 05 — Admin Model Config API

**Priority:** P0

### Objective
Expose API for Admin to read/update OpenRouter model selection without redeploying code.

### Takes
- ADMIN role
- AiModelConfig table
- OpenRouter model id strings

### Gives
| Operation | Takes | Gives |
| --- | --- | --- |
| Get AI config | ADMIN auth | provider, modelId, fallbackId, enabled, updatedAt |
| Update AI config | ADMIN auth + payload | saved config used by next chat requests |
| Optional list suggested models | static catalog note | helper for Admin UI |

### Security
- CLIENT/GUIDE/BUSINESS cannot change model
- API key never returned to Admin UI (only “configured: yes/no”)

### Tests
| Test | Expected |
| --- | --- |
| CLIENT update config | 403 |
| ADMIN update modelId | Persisted |
| Next chat uses new model id in logs | Visible |

### Done when
- [ ] Config API ready for Admin UI in Phase 05b
