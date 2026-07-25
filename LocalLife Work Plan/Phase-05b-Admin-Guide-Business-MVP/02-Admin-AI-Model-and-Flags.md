# Phase 05b / Task 02 — Admin AI Model and Flags

**Priority:** P0

### Objective
Switch OpenRouter models and feature flags from Admin Dashboard without code changes.

### Takes
- AiModelConfig API
- FeatureFlag API/store
- OpenRouter model id knowledge

### Gives
| Screen | Takes | Gives |
| --- | --- | --- |
| AI Config | modelId, fallback, enabled | Saved config; next chats use it |
| Feature Flags | flag keys | toggle FF_* for dark features |
| Status | “API key configured?” boolean | No secret key displayed |

### Tests
| Test | Expected |
| --- | --- |
| Change model in Admin | Persists |
| Send chat | Logs/metadata show new model (or clear failure) |
| Disable a flag | Gated UI/API respects it |

### Done when
- [ ] Model switch works end-to-end from Admin UI
