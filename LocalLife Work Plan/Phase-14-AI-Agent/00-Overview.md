# Phase 14 — AI Agent — Overview

**Phase goal:** Evolve grounded Chat into a proactive Agent that can propose and (with approval) execute actions.  
**Depends on:** Strong grounding history + optional booking tools.  
**This is the long-term vision phase, not MVP.**

---

## Takes
- Existing orchestrator + tools
- AiActionLog table
- Feature flag FF_AI_AGENT
- Notification channel
- Clear permission model for side effects

## Gives
- Agent modes: suggest-only → suggest+execute-with-approval
- New tools: createItinerary, proposeBooking, confirmBooking (approval), scheduleNotification
- Action audit trail
- Proactive suggestions based on context (time/location/preferences/weather later)
- Evaluation harness for agent safety
- Controlled rollout

## Tasks
1. [01-Agent-Permissions-and-Action-Log](./01-Agent-Permissions-and-Action-Log.md)
2. [02-New-Agent-Tools](./02-New-Agent-Tools.md)
3. [03-Proactive-Suggestion-Loop](./03-Proactive-Suggestion-Loop.md)
4. [04-Agent-Safety-Eval-and-Phase-Exit](./04-Agent-Safety-Eval-and-Phase-Exit.md)
