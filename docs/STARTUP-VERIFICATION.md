# Startup investigation and verification — 2026-10-30

## Established evidence

- The original normal-browser shop **Gulf Tailor** remained present at `http://localhost:8081/`, showing **18 customers**, **19 pending orders**, and **10 ready orders**. No storage reset or deletion was used in this investigation.
- A second tab on the same origin showed `Invalid VFS state` or `createSyncAccessHandle`/exclusive access-handle errors. The original tab still showed its shop and records. This is a preview storage lock, not proof of deleted records.
- The explicitly isolated tutorial on port 8082 uses a separate database and origin. It starts empty on purpose. Different browser/address storage can also appear as an empty installation. Do not treat the recording environment as the user's original shop.
- Code inspection found that a direct `/onboarding` route could show setup even for a completed shop, and fallback selection could choose an incomplete first shop. Both paths were corrected.

## Changes

- Startup prefers the selected completed shop, then a unique completed shop; ambiguous saved shops get an explicit selector instead of a fresh setup.
- Completed shops redirect away from `/onboarding`; incomplete setups remain resumable.
- Shop switching is available through Settings → Saved shops.
- Cached repository promises survive Fast Refresh. Initialization failures do not initialize an empty replacement dataset.
- Browser storage-lock errors have clear close-the-other-tab guidance; no saved indicator is shown while initial load fails.
- The main native/database name stays `tailor-master.db`. Demo mode is gated to development web on port 8082 and has a visible banner.
- Legacy and unknown theme settings safely default to Heritage green; language/shop selection are retained.

## Verification

- Automated tests close and reopen a real on-disk SQLite file, verifying shop, customer, Urdu preference and Indigo theme persistence.
- Browser recording verified the customer/measurement/order workflow and a reload returning the same shop, Urdu language and customer count.
- Native Chrome demo theme testing verified selecting Indigo, closing the demo tab, reopening it, and returning to the same completed shop with Indigo checked.
- Immediate reload in a browser with stale/duplicate preview handles can still show a storage-lock error. Close duplicate or failed preview tabs and reopen the original URL. This browser limitation must be resolved or avoided in any hosted web rollout; Android testing remains required.

The exact trigger for the user's earlier repeated wizard cannot be proven from a single report; the concrete faulty routes, origin separation and lock behavior above were observed, and no claim of recovering deleted data is made.
