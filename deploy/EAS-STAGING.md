# EAS staging / TestFlight / Play Internal prep (Phase 06)

## Profiles (`apps/mobile/eas.json`)
- `development` — dev client
- `staging` — internal distribution → Railway staging API
- `preview` — internal
- `production` — store builds (Phase 08)

## One-time
1. `npm i -g eas-cli` and `eas login`
2. Set `extra.eas.projectId` in `apps/mobile/app.json` from Expo dashboard
3. Apple Developer + Google Play enrollment (can finish fees before Phase 07)

## Staging build
```bash
cd apps/mobile
# set your Railway API URL
eas env:create --name EXPO_PUBLIC_API_URL --value https://YOUR-API.up.railway.app --environment preview
eas build --profile staging --platform android
```

iOS (when Apple account ready):
```bash
eas build --profile staging --platform ios
eas submit --platform ios  # TestFlight
```

## Tester path (Phase 07 ~30 people)
- Android: Play **Internal testing** track or EAS internal install links
- iOS: TestFlight external/internal groups

## Owner smoke
Install staging build → login → Home/Explore/Chat arrival question → Favorite.
