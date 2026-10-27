# TailorApp

Expo + React Native + TypeScript mobile prototype inspired by the bilingual tailoring storyboard.

## Run

```sh
npm install
npm start
```

Open the development server with a compatible Expo Go client, or use `npm run ios` / `npm run android` with a configured simulator/emulator.

## Implemented

- English/Urdu text and directional text alignment
- Dashboard with live customer and order counts
- Customer search, creation, editing, and optional measurements in inches
- Shalwar kameez and thobe order creation
- Sequential order status tracking through delivery
- Required-name and positive-measurement validation

Data is held in memory and resets on app restart. This is a workflow prototype, not a production app. Permanent storage, shop onboarding, configurable measurement templates, illustrated guides, due dates, pricing, backups, and device QA remain to be added.

## Verify

```sh
npx tsc --noEmit
npx expo export --platform ios --platform android
```
