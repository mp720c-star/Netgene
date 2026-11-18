# ATDD iPhone Home Screen — PR #16 (source description only)

**Build number:** `16.iphone-pwa.2`  
**Branch:** `cursor/complete-platform-atdd-scanner-e3f0`  
**Delivery status:** **NOT DELIVERED** to Michael’s installed iPhone app (see `ATDD-IPHONE-DELIVERY-STATUS-2026-11-18.md`).

## What PR #16’s PWA would open (if published + installed as a separate icon)

| Item | Value |
| --- | --- |
| Icon title | `ATDD+CDI` (`apple-mobile-web-app-title` / PWA `short_name`) |
| Kind | **Web PWA** (Add to Home Screen), not a native App Store / TestFlight binary |
| Intended URL | Cloudflare `/atdd/` from a branch that includes `atdd/web` |
| Live production `proud-bread-5014…/atdd/` (2026-11-18) | **HTTP 404** — production still serves `main` (no ATDD card) |
| First screen after reopen | **Connect Scanner** (`start_url` → `#obd2-connect`) |

## Connect Scanner → FIXD

- Button label: **Connect Scanner**
- Live path: Web Bluetooth (Chrome/Edge) or Capacitor BLE (native shell)
- iPhone Safari / Home Screen PWA: **no Web Bluetooth** → Connect Scanner shows install gate; does **not** silently Demo
- **Working FIXD on iPhone requires separate native install** `com.netgene.atdd.ble` (TestFlight path in delivery status doc)

## Install link (iPhone native)

- **Working TestFlight / IPA link:** none  
- **Xcode build:** **SKIPPED** (Linux agent; GitHub macOS runners unsupported / unavailable for this repo)  
- Native source ready: `atdd/ios/` (Capacitor 6 + bluetooth-le)

## Saved vehicles

- Reader preserves legacy keys (`atdd.vehicles`, `savedVehicles`, etc.) and migrates to `atdd.savedVehicles` without deleting old keys.

## Physical verification (this run)

| Check | Result |
| --- | --- |
| Michael’s existing Home Screen ATDD shows Connect Scanner | **NO** (Michael: unchanged, no Bluetooth scanner button) |
| ATDD connects to FIXD on a physical iPhone | **NOT VERIFIED** |
| ATDD gets a real diagnostic response from a truck | **NOT VERIFIED** |
