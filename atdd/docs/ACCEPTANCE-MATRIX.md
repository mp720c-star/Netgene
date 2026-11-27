# ATDD acceptance matrix (A1–A11)

Automated coverage lives in `tests/acceptance-matrix.test.mjs` (`npm run test:acceptance`).

## Status rule

- **PASS (automated):** synthetic / mocked fixture labeled `SYNTHETIC`.
- **HARDWARE:** every device × platform cell remains **NOT_TESTED** until a dated live log exists (adapter `ATI`/`STI`, vehicle `ATDP`, raw transcript, tester).

This suite does **not** claim any Bluetooth scanner or vehicle works with ATDD.

## Rows

| ID | Test | Automated fixture | Hardware |
| --- | --- | --- | --- |
| A1 | Pair / discover | Mock scan returns a labeled SYNTHETIC device | NOT_TESTED |
| A2 | Connect transport | Session reaches `connected` | NOT_TESTED |
| A3 | `ATZ` + `ATI` | Probe logs ELM327 id and `>` | NOT_TESTED |
| A4 | `ATSP0` + `ATDP` | Probe logs protocol name | NOT_TESTED |
| A5 | `0100` | Bitmap `41 00 …` in transcript | NOT_TESTED |
| A6 | `03` / `07` / `0A` | Parsed P0301 / P0420 | NOT_TESTED |
| A7 | `0902` VIN | 17-char VIN decode | NOT_TESTED |
| A8 | `04` clear gated | Not in probe; UI confirmation dialog required | NOT_TESTED |
| A9 | Timeout | `Scanner timeout`; empty report has no codes | NOT_TESTED |
| A10 | Reconnect | Second probe re-sends init | NOT_TESTED |
| A11 | `010C` / `010D` / `0105` | Plausible SYNTHETIC RPM / speed / coolant | NOT_TESTED |

## Probe sequence

`ELM_PROBE_SEQUENCE` includes identity and protocol logging for A3/A4:

`ATZ, ATI, ATE0, ATL0, ATS0, ATH0, ATSP0, ATDP, 0100`

## Related draft

Google Drive: `ATDD_Scanner_Protocol_Inventory_and_Acceptance_Matrix_GROK_20261117.md`
