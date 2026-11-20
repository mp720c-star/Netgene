# ATDD BLE iPhone import

## Required OneDrive trees (not in this VM)

1. `C:\Users\defaultuser0\OneDrive\AI PROJECT PLATFORM IMPORTS\ATDD_LAYOUT_UPLOAD_20261026\ATDD_VALIDATED_BUILD_20261117`
2. `ATDD_BLE_IPHONE_REVIEW_20261117\ios` (Capacitor 6 + `@capacitor-community/bluetooth-le@6.1.0`)

## Drop location

Copy zips/folders into:

`mike-ai/recovery/private/inbox/`

Expected after import:

```
atdd/ios/          # Capacitor iOS project from ATDD_BLE_IPHONE_REVIEW
atdd/obd/obd-protocol-v3-frame-aware.js  # replace cloud continuation if original differs
```

## Do not

- Overwrite the signed ATDD 1.2.0 Home Screen app
- Claim FIXD protocol support without live probe evidence
- Present simulated DTCs as real scanner data
