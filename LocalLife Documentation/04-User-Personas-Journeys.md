# 04 — User Personas & Journeys

**Document type:** UX / product  
**Version:** 2.0 (Vision 2.0 Local Companion)  
**Language:** English

---

## 1. Persona summary

| Persona | Main goal | Companion focus |
| --- | --- | --- |
| Tourist | Explore authentically | Packs + day plans + Avatar tips |
| Student | Build daily life | Budget hard filters + student packs |
| Worker / business traveler | Save time | Fast arrival → meeting → dinner plans |
| Visiting (short stay) | Orient quickly | Arrival pack + transport-only plan |
| Family | Safe, fitting days | Conservatism / kids filters + family pack |

---

## 2. Persona details (brief)

### Tourist — “Sara”
Beaches, food, sunset, less trap risk → Chat or For You pack → editable plan → Avatar reminds next step.

### Student — “Youssef”
Cheap eats, transport, clinics → hard budget + walksOk → student pack → report closed café → replan cue.

### Worker — “Mark”
48h trip → arrival pack → AI “airport → hotel → meeting café” plan → nav handoff; no booking in MVP.

### Visiting friend/relative — “Nadia”
Short stay, mixed tourist/local → light onboarding → Search + save → companion plan for one evening.

### Family — “Elena + kids”
Conservatism / `FAMILY_KIDS` / block adult nightlife → family pack → zone advice phrased calmly (no scare UI).

---

## 3. Companion journeys (Vision 2.0)

### Journey A — First open (any persona)

```text
1. Open app → identity (purpose + optional ≤7 personality Qs)
2. Set hard filters if needed
3. For You: open a plan pack OR ask Avatar/Chat
4. Save plan → offline-ready active plan
```

**Success:** useful next action in < 5 minutes.

### Journey B — Chat → plan

```text
1. Ask “What should I do this afternoon?”
2. AI respects hard filters + freshness
3. User saves plan with why-chips
4. Avatar celebrate → continue timeline later
```

### Journey C — Transport how-to

```text
1. Ask airport → Midoun
2. AI returns FIXED vs METER options + Guide comment
3. Optional: save as transport-only plan
```

### Journey D — Report → replan

```text
1. Client reports place closed/inaccurate
2. Admin → Guide verify → update
3. Avatar soft-warn: replan available
```

### Journey E — Guide team (Main → SubGuide)

```text
1. Main Guide: Team → Add SubGuide + draw border
2. Admin confirm queue → Approve
3. SubGuide contributes only inside border
```

---

## 4. Journey → data objects

| Moment | Objects |
| --- | --- |
| Onboarding filters | UserPreference.hardFiltersJson + identity fields |
| Pack / plan | PlanPack, ClientPlan, ClientPlanStep |
| Avatar nudge | AvatarCue, Notification |
| Zone comfort | ZoneSafetyAssessment (internal) → derived advice |
| Special place | Place checklist / precautions / freshness |
| SubGuide | SubGuideApplication, GuideProfile.parentGuideId/borderGeoJson |

---

## 5. UX principles

1. Companion first — not a map browser dashboard
2. Brand + one job per viewport; Avatar + plan timeline as signature motion
3. Explain “why this for you”; never raw danger labels
4. Offline: active plan + emergency + cached cues
5. Trust badges when useful

---

## 6. Accessibility & language

UI: EN / FR / AR (RTL). Guide content stays in author language until translation ships (doc 06).

---

## 7. Edge cases

GPS denied → manual city · Offline → cached plan · Sponsored → labeled · Missing data → honest fallback · Reduce-motion → static Avatar

---

*Next: [05 — Features (MVP)](./05-Features-MVP.md)*
