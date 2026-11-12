# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Tailor Master: an offline-first tailoring-shop manager (customers, measurements, orders, payments, receipts, encrypted backups) built on Expo SDK 58, React Native 0.88, TypeScript and `expo-sqlite`. English/Urdu UI with RTL. The project uses npm (`package-lock.json`), not bun. Node version is in `.nvmrc` (24).

## Commands

```sh
npm ci                                   # install from lockfile
npm start                                # Expo dev server
npm start -- --web --port 8081           # normal web preview (keep the same origin; storage is per-origin)
EXPO_PUBLIC_DEMO_MODE=1 npm start -- --web --localhost --port 8082   # tutorial/demo instance (separate DB)
npm run typecheck                        # tsc --noEmit (tests/ excluded)
npm run lint                             # expo lint (tests/ ignored)
npm test                                 # node --experimental-strip-types --test tests/*.test.ts
node --experimental-strip-types --test tests/backup.test.ts                        # one test file
node --experimental-strip-types --test --test-name-pattern="balances" tests/domain.test.ts   # one test by name
npx expo export --platform android       # bundle check used as part of verification
npx eas-cli@latest build --platform android --profile preview   # internal APK (only profile configured)
```

The full verification set is typecheck, lint, test and the Android export. Tests use Node's built-in runner and `node:sqlite` (real SQLite in memory). They don't use Jest and don't render React.

## Architecture

**Entry point.** `package.json` `main` is `expo-router/entry`, so the app starts at `src/app/_layout.tsx`. The root `App.tsx`, `index.ts` and `src/storage.ts` are the original AsyncStorage prototype. The running app does not use them. Their only remaining role is as the source format for the one-time legacy import (`src/database/legacy.ts`, AsyncStorage key `tailorapp.workshop.v1`).

**Data flow (whole-state, pure functions).**
- `src/domain/model.ts` defines `Workshop`, a single in-memory snapshot with arrays for shops, customers, templates, templateVersions, measurements, orders, orderItems and payments. Every record carries `RecordMeta` (`id`, `shopId`, `recordVersion`, `deviceId`, `archived`, timestamps).
- `src/domain/services.ts` and the other `src/domain/*` modules are pure functions shaped `(state: Workshop, ctx: Context, shopId, ...) => new state` (sometimes with new ids). `Context` supplies `id()`, `now()` and `deviceId`, which tests inject.
- `src/store.tsx` (`StoreProvider`, `useStore`, `useShop`, `useI18n`, `usePalette`) holds the snapshot. Screens compute the next state with a domain function and call `commit(next)`, which saves the entire snapshot through the repository. Commits are serialized: a concurrent commit throws `'saving'`.
- Startup in `StoreProvider` opens the DB, runs one-time data migrations gated by `MigrationMarkers` (`legacy-v1`, `paper-form-fields-v1`), resolves the active shop (`domain/startup.ts`) and ensures a usable template (`domain/availableTemplate.ts`). New one-time data upgrades should follow the same marker pattern.
- `_layout.tsx` redirects between `/onboarding`, `/shops` and the app depending on whether the active shop has `setupComplete`.

**Persistence invariants (`src/database/repository.ts`).** `persist()` diffs the incoming snapshot against what is in the DB and enforces rules that domain code must respect:
- Records are never removed. A record missing from the new state throws `recordRemoval`. To delete something, set `archived`/tombstone it.
- `templateVersions`, `measurements`, `payments` and `orderItems` are immutable once written (`immutableRecord`). Changing one means creating a new record. For example, a template edit creates a new version, and a re-measurement adds a new history entry.
- A changed mutable record must bump `recordVersion` (`staleRecord` otherwise).
- Each row stores the full record as JSON in `data`, plus a few indexed/constrained columns. Every write also appends to `SyncChanges` (an outbox; sync is not implemented).
- `validateWorkshop` runs on every load, save and restore.
- The schema version is `PRAGMA user_version = 1` in `schema.ts`. A newer DB version throws `databaseNewer`.
- Money is stored as integer minor units (`money()` in `domain/validation.ts`). Never use floats.

**Database selection.** `src/database/connection.ts` caches one repository per DB name on `globalThis`. It uses `tailor-master.db` unless `isWalkthrough` (`database/mode.ts`) is true, which requires `__DEV__`, web, port 8082 and `EXPO_PUBLIC_DEMO_MODE=1`. The demo instance must never touch the real database. `metro.config.js` adds `wasm` assets and COOP/COEP headers so `expo-sqlite` works on web. Web SQLite allows only one active tab per origin.

**Platform splits.** `src/services/*.web.ts` files (`backupFiles`, `printing`) are the web counterparts that Metro resolves on web. Keep each pair's exports in sync.

**Backups (`src/services/backup.ts`).** These are logical per-shop snapshots (`shopSnapshot`), encrypted with AES-GCM using a PBKDF2-SHA256 key (`@noble/*`), with a minimum 12-character password. Restore goes through `Repository.restoreShop`, which only replaces data for the same shop id.

**Localization.** Strings live in `src/localization/en.json` and `ur.json`. `translate()` falls back from Urdu to English to the raw key. Error codes thrown by the domain and repository (`'recordRemoval'`, `'shopMismatch'`, and so on) are translation keys shown to the user, so a new error code needs entries in both JSON files. `rtl()` is true for every non-English language. User-defined labels (`Labels`) fall back through `label()`.

## Conventions

- Files under `src/domain`, `src/database` and `src/services` import each other **with explicit `.ts` extensions** (`'../domain/model.ts'`). Node's strip-types test runner needs this, and `allowImportingTsExtensions` permits it. Keep it for any module the tests import directly or indirectly. Route and component files import without extensions.
- Keep business rules in `src/domain` as pure functions so the Node tests can cover them without React Native. `src/app/` holds only routes (it is Expo Router's directory).
- `/test-data` is a dev-only screen that adds the repeat-safe synthetic scenario from `fixtures/` (`domain/testData.ts`).

## Docs

`docs/` holds the PRD, implementation plan, database ERD (`DATABASE-ERD.md`, `database-erd.mmd`), Android testing handoff and startup verification notes. Read the relevant one before changing schema, startup or Android-specific behavior. Browser checks do not prove Android behavior; native printing/sharing/file APIs need device QA.
