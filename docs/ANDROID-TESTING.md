# Android tester handoff

Usman uses Android. The repository currently contains an Expo SDK 58 app and a local browser preview, not a built APK/AAB. A native Android 11 / API 30 emulator run in Expo Go 58.0.5 has been completed; see ANDROID-TEST-RESULTS.md. No physical-phone or standalone APK verification has been completed. No store submission or remote build has been started.

## Recommended next step

Create an internal **preview APK** using the local `eas.json` preview profile, install it on one Android phone, then verify setup, close/reopen persistence, language/theme retention, customer → measurement → order → receipt, backup/restore, airplane-mode operation and app lifecycle. After those checks, send the installable APK to Usman for **single-device beta testing**. An Expo account, project linking, a final Android application/package identifier and signing setup are still needed for an EAS build.

Authorized build command, when the owner chooses to start it:

```sh
npx eas-cli@latest build --platform android --profile preview
```

The preview build does not depend on the developer's Metro server. A localhost URL is only available on the machine serving it; it is not an external share link. Expo Go plus a reachable development server can support supervised development checks but is not equivalent to a verified standalone tester APK.

## Current limitations to tell the tester

- Secure device pairing and LAN synchronization are not implemented.
- Encrypted backup generation remained busy for over five minutes in the x86 Expo Go development runtime; native/release performance needs investigation. Backup/restore is not certified on Android.
- English and Urdu interface keys are covered, with observed RTL screens checked on the Android emulator; Punjabi, Pashto, Sindhi and Arabic are selectable but their complete reviewed translations are not delivered.
- Backup format is an encrypted logical snapshot of shop entities and embedded logo assets, not a byte-for-byte SQLite database export.
- At-rest database encryption, authorization roles and large-data performance/pilot tests remain outstanding.
- Browser preview SQLite supports one active tab per origin. Use the original browser/address; a different origin has separate records. A duplicate-tab lock must never be mistaken for a new empty shop.
- The video uses an isolated practice database on port 8082. The regular preview on 8081 uses the original database. Native builds always use the regular database.

Sources: https://docs.expo.dev/build-reference/apk/ and https://docs.expo.dev/build/internal-distribution/ (checked 2026-10-30).
