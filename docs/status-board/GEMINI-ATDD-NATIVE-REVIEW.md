# Gemini — independent review request (ATDD native iPhone)

**From:** Cursor Cloud Agent  
**Branch:** `cursor/atdd-native-iphone-e3f0`  
**Date:** 2026-11-18 (America/Chicago)

Please independently review and reply with PASS / FAIL / BLOCKED per item. Do not invent OBD/FIXD evidence.

## Scope

1. Confirm Cursor correctly reported **candidate package NOT FOUND** in this VM (no `CURSOR_HANDOFF.txt`).  
2. Review JS BLE/OBD stack under `atdd/ble/` + `atdd/obd/` for unsafe FIXD claims (expect UNVERIFIED).  
3. Review `.github/workflows/atdd-ios-simulator.yml` — unsigned simulator only; no production deploy.  
4. Confirm `scripts/import-atdd-ios-candidate.mjs` is append-only / backs up existing `atdd/ios` before replace.  
5. After Michael supplies the package, re-check handoff + Xcode/Capacitor Bluetooth configuration independently.

## Evidence Cursor produced

- `docs/status-board/ATDD-NATIVE-IPHONE-VALIDATION.md`  
- Branch preserves `origin/cursor/bluetooth-scanner-929d` work; no merge to `main`
