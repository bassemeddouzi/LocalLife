# Phase 05c — Security notes (Vision 2.0)

## Sensitive zone intel
- `SafetyLevel` / zone assessments are Guide/Admin write; Client DTOs must not expose raw “VERY_DANGER” enums — AI uses them for hard steering only.
- Avatar cues use calm copy only.

## SubGuide borders
- SubGuide cannot publish until Admin approve.
- `borderGeoJson` must be inside Main Guide scope (enforce on write).
- SubGuides cannot recruit SubGuides.
- One Main Guide per zone key (`assertOneMainGuidePerZone`).

## AuthZ
- Plan CRUD scoped to `userId`.
- Notification/AvatarCue scoped to owner.
- Report rate-limited via global throttler.
- Optional JWT on `/v1/search` for hard-filter adult nightlife exclusion.

## Secrets
- Never commit `.env`; OpenRouter/Mapbox/R2/Google wired from env when present.
