# Phase 03 / Task 05 — Content QA Gate (Knowledge Gate)

**Priority:** P0

### Objective
Prove knowledge quality before wiring LLM.

### Takes
- Seed P0
- QA script questions answerable via API only

### Gives
- Signed Content QA report

### QA script (API-only answers)
1. Fetch arrival guide — steps cover SIM/money/taxi/reach city
2. Fetch transport for airport→Midoun style route — payment + pricingType present
3. Fetch emergency rules — CRITICAL present
4. Fetch pharmacy/hospital places — at least one each
5. Confirm no PENDING item leaked publicly
6. Confirm summaries exist for all P0 places
7. Confirm lastReviewedAt present on transport/rules/guides

### Done when
- [ ] All QA script rows pass
- [ ] Failures fixed or explicitly deferred with risk acceptance (avoid deferring P0)

### Links
- `LocalLife Documentation/17-Content-Seed-Djerba.md`
