# ATDD Connect — hardware & transport limits (Build 2)

## Supported transport paths (this build)

| Transport | iOS support | Notes |
| --- | --- | --- |
| Bluetooth LE (CoreBluetooth via `@capacitor-community/bluetooth-le`) | Yes (native app) | Candidate ELM-class GATT profiles only |
| Wi-Fi OBD (TCP, typically `192.168.0.10:35000`) | Yes (native `ObdWifi` plugin) | Phone must join adapter soft-AP first |
| Web Bluetooth | No on iPhone Safari / Home Screen PWA | Works in Chrome/Edge on Android/desktop |
| Bluetooth Classic (SPP / RFCOMM) | **Not available to App Store iOS apps** | Apple does not expose Classic SPP to third-party apps |

**Universal Bluetooth compatibility is not claimed.**

## FIXD UUID investigation status

- **Claim:** `UNVERIFIED`
- This repository does **not** contain FIXD proprietary service/characteristic UUIDs captured from a live FIXD dongle in this environment.
- Candidate profiles used for ELM-class adapters only:
  - `000018f0-…` / `2af0` / `2af1` (VLinker-style)
  - `0000fff0-…` / `fff1` / `fff2` (common clones)
  - `0000ffe0-…` / `ffe1` (common clones)
  - Nordic UART `6e400001-…`
- **Do not invent FIXD UUIDs.** Until a physical FIXD advertisement + successful Mode 03 (or vendor) round-trip is recorded, ATDD must not claim FIXD protocol support.

## Read-only PIDs implemented

- Mode 03 — stored DTCs
- Mode 01 PID `0C` — RPM
- Mode 01 PID `05` — coolant temperature (°C)
- Mode 01 PID `0D` — vehicle speed (parser present)
- Mode 09 PID `02` — VIN (when the ECU returns a complete 17-character VIN)

Missing / negative replies stay null with reasons — values are never invented.

## CarCare Kids

No CarCare Kids sources were found in this Netgene checkout. Existing trees (`cdi-genius/`, classic diagnostic DBs, prior `atdd/` files) were preserved and not deleted.
