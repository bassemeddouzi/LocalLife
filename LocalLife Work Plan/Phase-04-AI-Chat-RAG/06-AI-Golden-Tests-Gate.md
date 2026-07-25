# Phase 04 / Task 05 — AI Golden Tests Gate (GROUNDING GATE)

**Priority:** P0  
**Depends on:** Tasks 01–04 + Djerba seed

### Objective
Create the second major quality gate: AI must be useful **and grounded**.

### Takes
- Fixed golden question pack (Work Plan testing strategy §5)
- Seeded Djerba data
- Orchestrator in test/staging mode

### Gives
- Automated or semi-automated golden runner results
- Grounding score (e.g. % answers with valid citations where required)
- Failure list with owners

### Minimum pass bar (recommended)
- All P0 golden themes executed
- Required-citation questions have >= 1 valid citation to APPROVED entities
- Missing-data question does not invent a fake place name
- No cross-user data leakage

### Steps
1. Write golden pack with expected domain tags.
2. Run against local/staging API.
3. Manually spot-check 5 answers for quality tone.
4. Fix retrieval/prompt/policy issues.
5. Re-run until pass bar met.
6. Store evidence (date, score, env).

### Done when
- [ ] Grounding Gate signed green
- [ ] Team agrees Phase 05 can bind Chat UI to this API

### Links
- Work Plan `04-Testing-Strategy.md`
- `LocalLife Documentation/10-AI-Architecture-RAG-Agent.md`
