# Faster date entry, full payments and customer lookup

Implemented 30 October 2026.

## Delivery date

Order entry now has Today, Tomorrow, In 7 days and Calendar. There is no date string to type. The calendar supports previous/next month and direct day selection, showing the selected day when reopened. Closing the calendar does not change the date. Dates remain stored as YYYY-MM-DD with local-calendar arithmetic; shortcuts handle month/year boundaries and daylight-saving changes. The shared component works on native and web without a new dependency.

## Full remaining payment

Open an unpaid order → Collect full remaining balance. The amount is filled automatically and a confirmation shows the customer, order number and amount. Confirm only after physically receiving the money. Cancel performs no database write. The confirmation binds to that order and expected balance; if the balance has changed or is already paid, it is rejected and must be reviewed again. Cancelled/archived orders cannot be settled through this action. Existing partial-payment entry remains available.

## Customer search

All five main headers (Dashboard, Customers, Orders, Templates, Settings) have a Find customer button. Search by name or phone, then tap a result to open that customer. Spaces, common phone punctuation and Urdu/Arabic digits are supported. Search is scoped to the active shop and excludes archived customers. Recent records are shown before typing, with at most 20 result cards and a prompt to refine larger result sets. The main Customers screen uses the same matching logic.

## Verification

- 41 automated tests passed, including date boundaries, leap years, local dates across DST, customer/shop isolation, formatted phone matching, exact full-balance collection, duplicate/stale confirmation rejection, cancelled orders and Urdu-key coverage.
- TypeScript and Expo lint passed.
- Web export passed (`/private/tmp/tailor-ease-web-check`).
- Android 11 emulator: Today, Tomorrow and In 7 days selected correctly; calendar month navigation, November 12 selection and reopening that selection passed. The draft was not saved as an extra order.
- Android name search and spaced phone search returned the correct QA customer. Search action was verified on all five main screens using bottom navigation.
- Android full-payment cancellation left the existing 9,000 balance and zero received unchanged. Confirming recorded the 9,000 payment and updated the receipt to zero remaining. After process restart, the order count stayed 3, unpaid count changed from 2 to 1, and the other unpaid order still showed 3,000 received / 5,000 remaining.

Screenshots and execution logs: `artifacts/ease-test/`. The first two UI harness runs needed route-navigation wait corrections; those interruptions occurred before the payment was confirmed. Final business assertions are in `android-final.txt` and the completion log.

Only emulator QA data was used. Ali Android QA received a synthetic phone number for search testing. No physical-phone or signed APK certification is implied.
