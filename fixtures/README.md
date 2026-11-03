# Reusable synthetic test data

- `customers.json`: 17 schema-compatible customers (10 male, 7 female). Gender is explicitly described in `notes`; the current Customer schema has no gender column. No real phone numbers or addresses are used.
- `test-workshop.json`: complete, schema-valid Workshop snapshot with the same 17 customers, 17 measurements, template definitions and immutable versions, 50 orders/items, and associated payments. It uses a separate synthetic shop ID and inch units.

Orders cover all five statuses (10 each), different quantities, unpaid/part-paid/fully-paid balances, and dates around October 30, 2026. Records are labeled `(Test)`, `TEST-`, and/or `[Tailor Master test batch v1]`.

## Reuse

For domain or repository tests, parse `test-workshop.json`, call `validateWorkshop(snapshot)`, and use a fresh test database. The plain JSON is not an encrypted `.tmb` backup and should not be loaded through the backup screen.

To add the same scenario to an existing development shop with fresh UUIDs, that shop's currency, current dates, and configured unit, call `addTestData(state, context, shopId)` from `src/domain/testData.ts`, then persist its result with the repository/store. Alternatively open `/test-data` in the development app and select **Add test customers and orders**. The batch marker makes repeated calls a no-op. Existing records are preserved.

Customer IDs in `customers.json` reference the synthetic shop from `test-workshop.json`; use the full snapshot when testing relationships. Do not combine it directly with another shop's records.
