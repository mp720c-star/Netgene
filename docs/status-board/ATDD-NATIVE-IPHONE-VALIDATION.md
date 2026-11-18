# ATDD native iPhone — validation report

**When:** 2026-11-18 ~6:20 AM America/Chicago  
**Branch:** `cursor/atdd-native-iphone-e3f0` (from `cursor/bluetooth-scanner-929d`)  
**Rule:** No production merge · no overwrite of ATDD 1.2.0 Home Screen app · no secrets in chat/GitHub

---

## 1. Candidate package / CURSOR_HANDOFF.txt

| Check | Result |
| --- | --- |
| Archive attached to this Cloud Agent run | **NOT FOUND** |
| `CURSOR_HANDOFF.txt` anywhere in VM | **NOT FOUND** |
| `mike-ai/recovery/private/inbox/` contents | README only (created this run) |
| `atdd/ios/` native Xcode/Capacitor tree | **ABSENT** (placeholder README only) |

**Actual error:** Import script blocked — no zip/tgz and no `CURSOR_HANDOFF.txt` in inbox.

```text
node scripts/import-atdd-ios-candidate.mjs
→ exit 2 BLOCKED: No candidate package in mike-ai/recovery/private/inbox/
```

---

## 2. CoreBluetooth / Xcode review (what exists without the package)

Present on branch (JS layer only):

- `atdd/ble/scanner-session.js` — transport-agnostic session (Capacitor BLE / Web Bluetooth / labeled simulated)
- `atdd/ble/fixd-protocol-probe.js` — FIXD claim stays **UNVERIFIED**; does not assume ELM327
- `atdd/obd/obd-protocol-v3-frame-aware.js` — Mode 03 frame-aware parser + tests
- `atdd/ble/IMPORT.md` — expects OneDrive `ATDD_BLE_IPHONE_REVIEW_20261117\ios` (Capacitor 6 + `@capacitor-community/bluetooth-le@6.1.0`)

**Not present (blocked until package import):**

- `.xcodeproj` / `.xcworkspace`
- `Info.plist` Bluetooth usage strings
- Native Swift/ObjC CoreBluetooth bridge (Capacitor plugin sources)
- Signing / provisioning profiles (must never be committed)

Host for this agent: **Linux x86_64** — `xcodebuild` **not installed**. Unsigned simulator build cannot run here.

---

## 3. GitHub Actions macOS simulator workflow

Added: `.github/workflows/atdd-ios-simulator.yml`

- Runner: `macos-14`
- Unsigned: `CODE_SIGNING_ALLOWED=NO`
- Gates on presence of `atdd/ios` native project
- Runs `atdd` JS tests when project present
- Does **not** use Apple signing secrets

Until the iOS tree is imported, the workflow records `RESULT=BLOCKED_NO_IOS_PACKAGE` (soft gate on push without ios project).

---

## 4. Local JS tests (this VM — actual)

Run from `atdd/` after checkout of this branch (see agent log). Protocol/unit tests do not require Xcode.

---

## 5. Signed physical iPhone / TestFlight

**CI wired** (awaiting secret *values* in GitHub):

1. Native `atdd/ios` Capacitor scaffold present on platform branch  
2. Workflow: `.github/workflows/atdd-ios-testflight.yml` (manual Run workflow)  
3. Secret names + setup: `docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md`  
4. Michael must add the seven GitHub Actions secrets (never paste values in chat)  
5. Approval to upload: granted 2026-11-18 (“Test flight signing secrets for ci. Do that”)

---

## 6. Gemini independent review — request

Ask Gemini to independently verify:

1. Whether the candidate package Michael attached includes `CURSOR_HANDOFF.txt` and a Capacitor `ios/` tree with Bluetooth permissions.  
2. Whether FIXD remains UNVERIFIED until live GATT + Mode 03 evidence exists.  
3. That this branch does not modify production / ATDD 1.2.0 signed Home Screen app.  
4. That the new workflow is unsigned-simulator only.

---

## Next action for Michael (unblocks native Bluetooth on iPhone)

1. **Re-attach** the complete candidate zip to this agent chat **or** copy it to `mike-ai/recovery/private/inbox/` on a self-hosted worker (`agent worker start` on the PC that has OneDrive).  
2. Confirm the zip contains `CURSOR_HANDOFF.txt`.  
3. Reply **“package uploaded”** — Cursor will run `node scripts/import-atdd-ios-candidate.mjs`, push, and let Actions build the unsigned simulator.  
4. After green simulator build + Gemini review, configure Apple signing secrets for TestFlight (names only in chat; values in secure form).
