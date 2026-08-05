# Phase 05c / Task 02 — SubGuide flow

### Objective
Main Guide recruits SubGuides after formation/entretien; Admin confirms before publish rights.

### Flow
1. Main Guide → Team → Add SubGuide (email, name, formation note)
2. Draw border on map inside parent zone → `POST /v1/guides/me/subguides` (`PENDING_ADMIN`)
3. Admin → SubGuide queue → review border + note → Approve (creates GUIDE user + `parentGuideId` + temp password) or Reject
4. SubGuide contributes only inside `borderGeoJson`

### Done when
- [x] Schema `SubGuideApplication` + `GuideProfile.parentGuideId` / `borderGeoJson`
- [x] Guide propose API
- [x] Admin approve/reject API
- [ ] Guide mobile map-draw UI
- [ ] Admin web confirm UI
