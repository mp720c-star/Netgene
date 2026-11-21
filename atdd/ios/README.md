# ATDD Connect — native FIXD (Capacitor BLE)

Live **Connect FIXD** on phone via `@capacitor-community/bluetooth-le@6.1.0`.

## No Mac? Use Android

This Linux/CI environment **cannot** produce a signed iPhone IPA (needs Xcode).

**Fastest path without a Mac:**

1. **Android phone + Chrome** — open the Cloudflare ATDD page and tap **Connect FIXD** (Web Bluetooth works in Chrome).
2. Or install the debug APK: `downloads/atdd-connect-debug.apk` (sideload; allow unknown apps).

## Android APK (built here)

```bash
cd atdd/ios
npm ci
npm run apk:debug
# output: android/app/build/outputs/apk/debug/app-debug.apk
```

Published copy: `downloads/atdd-connect-debug.apk`

## iPhone (needs a Mac or cloud Mac CI)

GitHub Actions macOS runners are **not enabled** on this repo right now.

On a Mac:

```bash
cd atdd/ios
npm ci
npm run sync:ios
cd ios/App && pod install && open App.xcworkspace
```

## Do not

- Claim FIXD protocol support without live evidence
- Present Demo/SIMULATED as live vehicle data
