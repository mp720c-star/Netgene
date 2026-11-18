# ATDD Connect — native iPhone (Capacitor BLE)

Live **Connect FIXD** on iPhone uses this Capacitor shell + `@capacitor-community/bluetooth-le@6.1.0`.

## Why this exists

The OneDrive review zip (`ATDD_BLE_IPHONE_REVIEW_20261117`) was not in the agent inbox.
This scaffold matches the expected stack so FIXD pairing can work on device/simulator.
See `CURSOR_HANDOFF.txt`.

## Build (Mac + Xcode)

```bash
cd atdd/ios
npm ci
npm run sync
cd ios/App
pod install
open App.xcworkspace
```

Run on a physical iPhone (Bluetooth) or simulator (UI only — no radio).

## Connect FIXD

1. Install/run **ATDD Connect**
2. Open **OBD2 / ATDD** → **Connect FIXD**
3. Select the FIXD adapter
4. Probe / Read DTCs — protocol claim stays **UNVERIFIED** until live evidence is recorded
