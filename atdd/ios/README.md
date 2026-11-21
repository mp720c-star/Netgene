# ATDD Connect — native iOS (Build 2)

Bundle ID: `com.netgene.atdd.ble` · Apple App ID: `6837583273` · Version `1.2.0` Build `2`

Native Capacitor shell with:

- Classic ATDD diagnostic UI (main screen) + **Bluetooth · Connect Scanner** button
- CoreBluetooth via `@capacitor-community/bluetooth-le@6.1.0`
- Wi-Fi OBD TCP via local `ObdWifiPlugin` (typical `192.168.0.10:35000`)
- CDI Genius + advanced scanner under `www/connect/`
- Read-only PIDs: DTCs, VIN (when returned), RPM, coolant

## Limits (honest)

- FIXD proprietary GATT UUIDs: **not verified** in this repo — claim stays `UNVERIFIED`
- Bluetooth Classic (SPP): **not available** to iOS App Store apps
- Do **not** upload Build 2 until BLE and Wi-Fi paths are verified on hardware
- Do **not** create another App ID; do not delete Build 1

See `atdd/docs/HARDWARE-TRANSPORT-LIMITS.md`.

## Develop

```bash
cd atdd && npm test
cd ios && npm ci && npm run sync:ios
# On a Mac: open ios/App/App.xcworkspace
```

## TestFlight

Workflow: `.github/workflows/atdd-ios-testflight.yml` (manual). Upload defaults to **false**.
