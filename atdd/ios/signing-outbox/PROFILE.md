# ATDD Connect — App Store profile (non-secret metadata)

Use this profile for **iOS App Store / TestFlight** distribution. Do not commit the `.mobileprovision` binary or any `.p12` / passwords.

| Field | Value |
| --- | --- |
| Profile name | ATDD Connect AppStore |
| Type | App Store Connect (Distribution) |
| Bundle ID | `com.netgene.atdd.ble` |
| Team ID | `AJ2FB298SY` |
| Profile UUID | `ce2e5ad5-a404-44da-9d64-18e53beb419b` |
| Certificate | Existing **Apple Distribution** (reuse; do not mint a new one) |

## Agent host status (this environment)

- `.mobileprovision` file bytes: **not present** in Git / uploads / local mounts
- Distribution private key / `.p12`: **not available** on this Linux Cloud Agent (no Keychain; no signing env vars)
- Public CSR only: `ATDD_Connect_Distribution.certSigningRequest`

## Where the profile must live for signed CI

GitHub Actions secret **`IOS_PROVISION_PROFILE_BASE64`** (values never in chat).  
Workflow: `.github/workflows/atdd-ios-testflight.yml` asserts the installed profile UUID matches the table above.

## No-cost path (continue without signing)

`.github/workflows/atdd-ios-simulator.yml` — `CODE_SIGNING_ALLOWED=NO` simulator build + Ubuntu tree validation + Android `assembleDebug`.
