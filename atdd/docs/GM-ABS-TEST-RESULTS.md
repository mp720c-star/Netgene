# ATDD GM ABS enhancement — automated test results

**When:** 2026-11-24 (America/Chicago agent run)  
**Branch:** `cursor/atdd-gm-abs-diagnostics-dd32`  
**Environment:** Cloud agent (no physical FIXD / Sierra)

## Automated (passed)

- `atdd/tests/obd-command-guard.test.mjs` — Mode 22 / ATI allowed; ATMA/ATPP/1002 blocked
- `atdd/classic/tests/gm-brake-diagnostics.test.mjs` — C0035/C0045/C0050, clear diff, fail-closed live data
- Full `atdd/classic/tests/*.mjs` suite
- `atdd/ios/scripts/verify-ios-content.mjs` (if present in run)
- `npm run build:www` packages classic → iOS www

## Physical / TestFlight (not claimed verified)

| Item | Result |
|------|--------|
| iPhone ↔ FIXD BLE | Not executed here |
| Sierra EBCM reachability | Not executed here |
| Clear-all before/after on truck | Not executed here |
| Wheel-speed / park-brake live values | Fail-closed until live DID + SI scaling proven |

Do **not** label a TestFlight build “verified” until the Sierra session transcript is attached.
