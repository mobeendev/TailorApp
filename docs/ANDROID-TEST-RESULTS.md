# Android emulator test results

Test date: 30 October 2026 (Asia/Qatar).

Environment: Pixel 4 Android 11 / API 30, x86 emulator, Expo Go 58.0.5, Expo SDK 58. Metro on port 8083. This is a native Android development-runtime test, not a standalone APK or physical-phone certification. No physical phone was connected. EAS account/build was deferred at the owner's request.

Only synthetic records were created in a new emulator-local shop, **Android QA Tailors**. Browser shop data was not reset or imported.

| Check | Result and evidence |
| --- | --- |
| Native launch and SQLite initialization | Passed; reached setup and saved a completed shop |
| Setup | Passed, three garment templates selected |
| Required customer name | Passed; empty Save showed “Enter a name” and did not create a customer |
| Create customer | Passed; Ali Android QA saved |
| Dynamic qameez measurements | Passed; length 42, chest 40, shoulder 18, sleeve 24 inches; review and immutable history saved |
| Link order to measurement | Passed; Kameez Only V1, quantity 1, delivery 2026-11-05 |
| Advance validation | Passed; total 5000 / advance 6000 rejected |
| Valid order | Passed; total 5000 / advance 1500 / remaining 3500 |
| Additional payment | Passed; 3500 received, total received 5000 and remaining 0 |
| Status | Passed; New → In progress → Ready; Ready retained after process restart |
| Receipt | Passed; order TM-43619D25, shop, customer, quantity and amounts visible |
| Native print preview | Passed; Android print UI rendered one page; cancelled without printing |
| PDF share sheet | Failed initially due to an Expo Go file-permission boundary; fixed and retested successfully; share sheet opened with a PDF attachment; no recipient selected |
| Urdu and RTL | Passed for observed settings, navigation and order screens; missing backup/error/search translations completed |
| Theme | Indigo selected, checkmark and colors observed |
| Process restart persistence | Passed; force-stop Expo Go, reopen same experience; same shop, Urdu, Indigo, order, Ready status and paid balance restored |
| Encrypted backup export | Not passed: export remained busy for more than five minutes in the x86 Expo Go development runtime. The attempt was stopped by restarting Expo Go; no data loss or crash observed. Native/release performance investigation remains open. |
| Native backup restore | Not yet tested on emulator; transactional restore/decryption checks pass in automated tests |
| Offline UI operations | Not certified: airplane mode was enabled, but the emulator still reported an active Wi-Fi network. A second synthetic customer named Offline Android QA saved, but this is not counted as proof of network-disconnected operation. |
| Physical phone / release APK | Not tested; Expo sign-in/build deferred |

## Fixes from this run

- Setup and measurement/order review now start at the top when moving between stages, rather than inheriting a previous scroll offset.
- Receipt sharing writes the rendered PDF into the app's own cache before invoking Android sharing. It awaits completion of the file write.
- Backup export now creates and awaits writing its file before sharing it (SDK 58 file writes are asynchronous).
- Receipt action errors are cleared when a new print/share attempt starts.
- All missing Urdu interface keys were translated, including backup, validation and order search. A completeness regression test was added.
- The top safe area now uses the dark header color so light Android status-bar icons remain readable.

## Automated verification

27 existing tests and the Urdu-key completeness regression test passed, including SQLite transactions, cross-shop isolation, immutable history, payment arithmetic, encrypted backup round-trip/tamper rejection, restore rollback and startup persistence. Typecheck and Expo lint passed. Final checks are rerun after the last edits.

## Evidence

Screenshots are under `artifacts/android-test/`: measurement review, order review, paid receipt, native print preview, successful PDF share sheet, Urdu settings, post-restart settings and retained order.

## Limits

This run does not verify production APK signing, release performance, unattended background operation, multi-device synchronization, all Android versions, or physical-printer output. Single-device workflows passing does not make the full PRD production-ready.
