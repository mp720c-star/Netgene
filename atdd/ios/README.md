# ATDD iOS (native)

This folder is intentionally empty until the candidate package is imported.

Expected source (from OneDrive / handoff):
`ATDD_BLE_IPHONE_REVIEW_20261117/ios` — Capacitor 6 + `@capacitor-community/bluetooth-le@6.1.0`

Import steps:
1. Place the zip under `mike-ai/recovery/private/inbox/`
2. Run `node scripts/import-atdd-ios-candidate.mjs`
3. Confirm `CURSOR_HANDOFF.txt` is reviewed
4. GitHub Actions `atdd-ios-simulator` builds unsigned simulator on macOS

Do not overwrite the signed ATDD 1.2.0 Home Screen app.

