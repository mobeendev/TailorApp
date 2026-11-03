# One measurement, multiple orders — test record

Date: 30 October 2026 (Asia/Qatar).

## Automated integration scenario — passed

The test `tests/multipleOrders.test.ts` creates a temporary, on-disk SQLite database with one shop, one customer and one immutable measurement, then creates three separate orders using that **same full measurement ID**.

It verifies:

- Three unique order numbers and three order-item foreign-key references to one measurement, with quantities 1, 2 and 3.
- Different delivery dates, totals and advances.
- Additional payments affect only the selected order; an extra payment on a fully paid order is rejected without changing the database.
- Separate Delivered, Ready and New statuses.
- Correct overdue and unpaid filters.
- Each generated Urdu receipt contains its own order number and exact remaining-balance row, and excludes the other order numbers.
- Template version 2 and a new measurement can be created without changing any existing order's original version-1 measurement link.
- Closing and reopening the SQLite file preserves all three orders, their independent balances/statuses and actual SQL foreign-key links.
- Attempting to use this measurement for another customer is rejected without modifying persisted records.

The full automated suite passed **36 tests**. TypeScript and Expo lint passed.

Logs: `artifacts/multiple-orders-test/integration-test.txt` and `all-tests.txt`.

## Native Android scenario

Environment: Android 11 / API 30 x86 emulator, Expo Go 58.0.5. Uses the existing **synthetic** Android QA Tailors shop and Ali Android QA customer. Browser shop data was not changed.

The original version-1 measurement ending **d269** (length 42, chest 40, shoulder 18, sleeve 24 inches) was selected for all orders. The separate copied chest-41 measurement ending e099 was **not** selected.

| Order | Quantity | Delivery | Total PKR | Received PKR | Remaining PKR | Status |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| TM-43619D25 (existing QA order) | 1 | 2026-11-05 | 5,000 | 5,000 | 0 | Ready |
| TM-EF20D510 (created in this run) | 2 | 2026-10-30 | 8,000 | 3,000 | 5,000 | In progress |
| TM-8F9D2977 (created in this run) | 3 | 2026-10-29 | 9,000 | 0 | 9,000 | New |

The second order started with 2,000 advance; a further 1,000 payment was recorded. The third had zero advance.

Android verification passed after force-stopping and reopening Expo Go:

- All orders = 3, due today = 1, overdue = 1, unpaid = 2.
- Each order's balance and status matched the table after restart.
- All three native receipt screens showed their own order number, quantity and correct total/received/remaining amounts.
- Original order remained Ready and fully paid after payments/status changes on the new orders.

UI execution logs: `artifacts/multiple-orders-test/android-run.txt`, `android-verification.txt` and `android-completion.txt`. The harness initially waited for an offscreen filter label on its final return; scrolling the list to the top recovered that navigation anchor, and the completion check passed. All order/receipt/balance/status assertions had already passed before that harness wait. Screenshots include both new-order reviews and all three post-restart receipts.

## Fix from testing

The order measurement selector originally showed date alone. Two versions saved on the same day could look identical. It now includes the date **and time**, template version and a short record identifier; review also shows the selected measurement's identity. This changes presentation only, not saved IDs or old order links.

## Scope

This is an emulator development-runtime test plus a real SQLite integration test. It does not certify a physical Android phone or a signed standalone APK. The previously documented slow-backup issue is outside this test.

Subsequent test note: the later ease-of-use verification collected the third QA order’s remaining 9,000 through the new full-payment confirmation. The table above records the earlier multiple-order test state.
