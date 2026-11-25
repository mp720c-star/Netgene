# ATDD Connect — GM ABS / FIXD capability report

**Primary vehicle:** 2008 GMC Sierra 1500 SLT, 5.3L V8 (GMT900)  
**Primary adapter:** FIXD Bluetooth OBD-II  
**App claim for FIXD protocol:** `PARTIAL`  
**Evidence:** Owner confirmed (2026-11-24) the last ATDD TestFlight build reached the Sierra. PR #36 recorded live Mode 03 powertrain codes (`P0016`, `P0325`). FIXD app PDF (2026-11-17) listed ABS `C0035`/`C0040`/`C0045`/`C0050`/`C0245`/`C0561` (app list, not raw CAN).

## What ATDD does now

1. Native iPhone BLE connect via Capacitor `bluetooth-le` (FIXD-named devices detected by name only).
2. ELM adapter fingerprint commands: `ATI`, `ATDP`, `ATDPN`, `ATRV` (informational).
3. Full vehicle scan: Modes 01/03/07/0A/09 plus per-module probes on:
   - Powertrain `7E0`–`7E7`
   - Extended `18DA*` candidates
   - GM candidates `241/641` (EBCM), `24C/64C` (EBCM alt), `244/644` (BCM), `760/768`
4. Live DID probes (`22xxxx`) only against modules that answered. Without a verified decode profile, replies are **raw_unverified** — never shown as wheel-speed or switch readings.
5. **Clear All Supported Codes** saves before/after snapshots, requires confirmation, clears answered modules only, rescans, and reports cleared / remained / appeared.
6. UI sections: Engine, Transmission, ABS, Traction Control, Parking Brake, Live Sensor Data, Full Vehicle Scan, Diagnostic History.
7. Priority guidance for **C0035**, **C0040**, **C0045**, **C0050**, **C0245**, **C0561** from the Sierra FIXD set. Subtypes are not invented.

## Verified vs still open

| Check | Status |
|-------|--------|
| Last TestFlight ↔ Sierra reach | Owner-confirmed |
| Mode 03 powertrain on Sierra | Confirmed (`P0016` / `P0325`) |
| FIXD app ABS code list for this truck | PDF evidence (not raw frames) |
| ATDD Full Vehicle Scan EBCM/BCM headers on FIXD | Needs session transcript on this branch |
| Wheel-speed DID scaling for GMT900 | Unverified — fail-closed |
| Parking-brake / fluid / lamp DID mapping | Unverified — fail-closed |
| Clear-all before/after on the truck | Needs TestFlight + vehicle transcript |

## Technical reason FIXD may still miss ABS / BCM

GMT900 EBCM and BCM traffic often uses module headers or GMLAN paths that many consumer OBD dongles never bridge from the 16-pin HS-CAN pins alone. FIXD’s public BLE surface behaves like a limited ELM327 UART. ATDD therefore:

- Probes candidate headers
- Marks silent modules **unreachable**
- Does **not** fabricate ABS codes, wheel speeds, or parking-brake states

## Compatible alternatives (not purchased)

- OEM-class GM tool with documented EBCM access (Tech2 / MDI-class workflow)
- Aftermarket bidirectional tool that documents GMT900 ABS module addressing
- An ELM327 variant that documents successful physical addressing to this truck’s EBCM

## Safety non-negotiables (enforced in code)

- No programming session (`1002` blocked)
- No `ATMA` / `ATPP`
- No fabricated or simulated live readings presented as real
- Clear requires explicit confirmation
- History delete does not send vehicle commands

## TestFlight

Unsigned/unit tests run in CI/local Node. A verified ABS/module session still requires:

1. Merge/build this branch with signing secrets
2. `workflow_dispatch` on `atdd-ios-testflight.yml` with `upload: true`
3. Full Vehicle Scan transcript from the Sierra attached to the board (powertrain reach alone is already confirmed)
