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

- `.mobileprovision` file bytes: **not present** in Git / uploads / local mounts — cannot re-validate UUID/team/App ID from binary here (metadata only, below)
- `/home/ubuntu/.atdd-signing/`: **absent on this VM**
- Prior claim (agent `bc-01a1f93c-c1b0-711e-9205-ce71f64bd374`, ~2026-11-20 12:00–13:00 America/Chicago): encrypted key + matching `.p12` lived only on **that ephemeral Linux host**; cert subject included Team `AJ2FB298SY` and matched the key **on that host**
- This Cloud Agent is a **different VM** (same Cursor environment id, different boot). Ephemeral home from the earlier agent is **not mounted** and is **not** in environment builds/snapshots inspected
- Public CSR only here: `ATDD_Connect_Distribution.certSigningRequest`
- No certificates regenerated; no signing assets overwritten; no private key material printed

## Where the profile must live for signed CI

GitHub Actions secret **`IOS_PROVISION_PROFILE_BASE64`** (values never in chat).  
Workflow: `.github/workflows/atdd-ios-testflight.yml` asserts the installed profile UUID matches the table above.

## No-cost path (continue without signing)

`.github/workflows/atdd-ios-simulator.yml` — `CODE_SIGNING_ALLOWED=NO` simulator build + Ubuntu tree validation + Android `assembleDebug`.
