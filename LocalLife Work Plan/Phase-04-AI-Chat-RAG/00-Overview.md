# Phase 04 — AI Chat RAG — Overview

**Phase goal:** Grounded AI chat via **OpenRouter**, citations, Admin-selectable model.  
**Depends on:** Phase 03 Knowledge Gate.  
**Aligned with:** Decisions Log.

---

## Takes
- Approved Djerba knowledge (fake OK)
- OpenRouter API key
- AiModelConfig table
- Conversation tables

## Gives
- Conversations + grounded answers
- Retrieval tools
- Citations + reasons[]
- Runtime model read from AiModelConfig (Admin can change later in 05b)
- Rate limits + isolation
- Grounding Gate green

## Tasks
1. [01-Conversation-Persistence](./01-Conversation-Persistence.md)
2. [02-Retrieval-Tools](./02-Retrieval-Tools.md)
3. [03-Orchestrator-OpenRouter-and-Grounding](./03-Orchestrator-OpenRouter-and-Grounding.md)
4. [04-Safety-RateLimits-Cost](./04-Safety-RateLimits-Cost.md)
5. [05-Admin-Model-Config-API](./05-Admin-Model-Config-API.md)
6. [06-AI-Golden-Tests-Gate](./06-AI-Golden-Tests-Gate.md)
7. [07-Phase-Exit](./07-Phase-Exit.md)
