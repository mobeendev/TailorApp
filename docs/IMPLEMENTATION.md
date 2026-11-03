# Implementation and verification

Source of truth: PRD.md and the supplied 12-screen storyboard.

1. Domain model, SQLite migrations, repositories, legacy import. Gate: relationship, isolation, transaction and migration tests.
2. Onboarding and shop/device settings. Gate: required fields, persisted completion, RTL and language preference checks.
3. Immutable template versions and dynamic forms. Gate: field validation, custom field types, old measurement preservation.
4. Customers and measurement history. Gate: create/edit/search/archive and multiple revisions.
5. Orders, fixed-decimal payments, receipts. Gate: balance, references, statuses and printable output.
6. Backup/restore. Gate: corruption/compatibility/isolation validation and atomic replacement.
7. Secure local pairing/sync. Gate: transport feasibility and three physical Android devices, authentication, duplicates, conflicts, lifecycle/reconnection.
8. Pilot hardening. Gate: six reviewed translations, accessibility, device performance and 5-shop pilot.

Browser checks do not count as Android hardware verification. Incomplete stages are explicitly recorded; no placeholder sync indicator is treated as implemented networking.

## Current development status (2026-10-30)

Stages 1–5 are implemented as a single-device development build, with browser/manual checks and domain/repository tests. Native Android receipt/sharing and full workflow QA remain unverified. Stage 6 provides encrypted logical backups and atomic same-shop restore; raw SQLite-file export is outstanding. Stage 7 has an outbox foundation but no transport/pairing implementation. Stage 8 is outstanding.

UI: accepted heritage visual direction, vector sewing-machine emblem, stitched border, three device-local palettes and corrected Urdu label `ایپ کی زبان`. Tests cover theme fallback and real-file persistence. See STARTUP-VERIFICATION.md for observed preview errors and fixes; ANDROID-TESTING.md for a concrete beta handoff plan.
