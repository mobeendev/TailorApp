# Daily work and measurement history

Implemented 30 October 2026.

## Daily filters

Dashboard has three count shortcuts; Orders has All, Due today, Overdue deliveries and Remaining payments. Search and status filters combine with the selected quick filter. Counts describe the entire active shop. Dates use the phone's local calendar and refresh every minute.

- Due today: delivery date is today, excluding archived, delivered and cancelled orders.
- Overdue: delivery date is before today, excluding archived, delivered and cancelled orders.
- Remaining payments: positive balance after recorded payments; includes delivered orders, excludes archived/cancelled orders.
- Empty filtered results explain how to broaden the selection.

## Copy measurements

Open a customer → Measurement history → Copy as new measurement, or open a new measurement and choose Copy latest measurement. Choose an active template to use its latest measurement. If entries have been edited, replacing them requires confirmation.

Copying produces an editable draft, not a saved record. Review and save create a new immutable measurement ID; old measurements and order links remain intact. Stable field keys map source fields to the current active template version. Compatible number fields convert inch/cm units; invalid enum choices, incompatible types, missing unit definitions and out-of-range values are skipped. Defaults for new fields are retained and required fields must still pass validation. Copy feedback shows the source date/version and copied/skipped counts.

## Compare measurements

Customer history → Compare measurements. Select a template and two saved measurements of that same customer/template. The screen shows values with their original units, changed/unchanged fields and numeric differences (second minus first, expressed in the second unit). Equivalent inch/cm measurements are not counted as changes. Added and removed template fields remain visible; text/checkbox changes do not invent numeric differences. “Only changed fields” hides unchanged rows.

## Validation

- 35 automated tests passed; includes date boundaries, statuses, remaining payments, combined search/status, shop/customer isolation, immutable copy/save, unit conversion, incompatible field changes, false/zero values, added/removed fields and Urdu translation completeness.
- TypeScript and Expo lint passed.
- Native Android 11 emulator: opened overdue-filter deep link and observed correct empty state for the existing future paid order; copied an existing qameez measurement, changed chest 40 → 41 inches, saved it, and verified comparison reports 1 changed field with +1 inch. Original chest remained 40.
- Screenshots and test log: `artifacts/daily-work-test/`.

No schema migration or new dependency was required. Existing shop/customer/order records are preserved. Prior backup-performance and physical-device/release-build limitations are unchanged.

Android dashboard shortcut check: tapping Remaining payments opened Orders with that quick filter selected. Daily-work tiles were visually checked in Urdu/RTL. The emulator QA order is future-dated and fully paid, so these quick-filter counts correctly show zero; nonzero date/payment boundary combinations are covered by automated tests.
