# ATDD iPhone Home Screen — PR #16

**Build number:** `16.iphone-pwa.2`  
**Branch:** `cursor/complete-platform-atdd-scanner-e3f0`

## What the icon opens

| Item | Value |
| --- | --- |
| Icon title | `ATDD+CDI` (`apple-mobile-web-app-title` / PWA `short_name`) |
| Kind | **Web PWA** (Add to Home Screen), not a native App Store / TestFlight binary |
| URL | Cloudflare branch preview `/atdd/` (e.g. `…-proud-bread-5014.mp720c.workers.dev/atdd/`) |
| First screen after reopen | **Connect Scanner** (`start_url` → `#obd2-connect`) |

## Connect Scanner → FIXD

- Button label: **Connect Scanner**
- Live path: Web Bluetooth (Chrome/Edge) or Capacitor BLE (native shell)
- iPhone Safari / Home Screen PWA: **no Web Bluetooth** → Connect Scanner shows install gate; does **not** silently Demo

## Install link (iPhone native)

- **Working TestFlight / IPA link:** none  
- **Xcode build:** **SKIPPED** (Linux agent; GitHub macOS runners unsupported / unavailable for this repo)  
- Native source ready: `atdd/ios/` (Capacitor 6 + bluetooth-le)

## Saved vehicles

- Reader preserves legacy keys (`atdd.vehicles`, `savedVehicles`, etc.) and migrates to `atdd.savedVehicles` without deleting old keys.

## Physical verification (this run)

| Check | Result |
| --- | --- |
| ATDD connects to FIXD on a physical iPhone | **NOT VERIFIED** (no physical iPhone in this environment) |
| ATDD gets a real diagnostic response from a truck | **NOT VERIFIED** |
