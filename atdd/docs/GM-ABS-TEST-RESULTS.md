# ATDD GM ABS enhancement — automated test results

**When:** 2026-11-24 (America/Chicago agent run)  
**Branch:** `cursor/atdd-gm-abs-diagnostics-dd32`  
**Environment:** Cloud agent (no physical FIXD / Sierra in this VM)

## Automated (passed)

- `atdd/tests/obd-command-guard.test.mjs` — Mode 22 / ATI allowed; ATMA/ATPP/1002 blocked; FIXD claim `PARTIAL`
- `atdd/classic/tests/gm-brake-diagnostics.test.mjs` — Sierra ABS set, clear diff, fail-closed live data, owner-reach evidence
- Full `atdd/classic/tests/*.mjs` suite
- `atdd/ios/scripts/verify-ios-content.mjs` (if present in run)
- `npm run build:www` packages classic → iOS www

## Physical / TestFlight

| Item | Result |
|------|--------|
| Last TestFlight ↔ Sierra | Owner-confirmed (2026-11-24) |
| Mode 03 powertrain codes | Confirmed (`P0016` / `P0325`, PR #36) |
| FIXD app ABS code list | PDF 2026-11-17 (`C0035`/`C0040`/`C0045`/`C0050`/`C0245`/`C0561`) |
| ATDD EBCM header reach on this branch | Needs Full Vehicle Scan transcript |
| Clear-all before/after on truck | Needs transcript |
| Wheel-speed / park-brake live values | Fail-closed until live DID + SI scaling proven |

**TestFlight:** marketing `1.2.0` build **24** uploaded 2026-11-24 (America/Chicago); Apple processing `VALID` ([run 45538697598](https://github.com/mp720c-star/Netgene/actions/runs/45538697598)).

Do **not** label ABS/module diagnostics “verified” until a Full Vehicle Scan transcript from the Sierra is attached. Powertrain reach is already established.
