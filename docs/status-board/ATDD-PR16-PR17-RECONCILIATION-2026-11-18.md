# ATDD — PR #16 / PR #17 reconciliation vs 1.2.0 baseline

**When:** 2026-11-18 ~5:28 PM America/Chicago  
**Agent:** Cursor Cloud (read-only reconcile; no merge / signing / deploy)  
**Rules honored:** Preserve originals · no production modifications · FIXD = passive discovery only until Michael approves GATT · no Mode 04 · no purchases · no unverified compatibility claims

---

## Verdict (short)

| Question | Answer | Confidence |
| --- | --- | --- |
| Exact iOS bundle ID in PR #16 / #17 code | **`com.netgene.atdd.ble`** | **VERIFIED** (Xcode, Capacitor, Android, TestFlight workflow) |
| `com.michaelpaine.autotruckdiagnosticsfordummies` in this repo? | **Not present** on any searched ref | **VERIFIED (negative)** |
| Parser used by PR #16 | **v3 only** — `obd-protocol-v3-frame-aware.js` @ meta version **`3.1.0-cloud-continuation`** | **VERIFIED** |
| v4 / v7 in PR #16 or #17 trees? | **Absent** | **VERIFIED (negative)** |
| ATDD 1.2.0 original app / OBD2 DBs | **NOT FOUND** (unchanged since 2026-11-17 verification) | **VERIFIED (negative)** |
| Real-hardware FIXD / Mode 03 | **UNVERIFIED** | **VERIFIED (claim status)** |

---

## 1. Pull request identity

| Field | PR #16 | PR #17 |
| --- | --- | --- |
| URL | https://github.com/mp720c-star/Netgene/pull/16 | https://github.com/mp720c-star/Netgene/pull/17 |
| Title | ATDD Connect Scanner + platform hub wiring | TestFlight CI — signed ATDD Connect upload (secrets required) |
| State | **OPEN**, not merged | **OPEN**, not merged |
| Head branch | `cursor/complete-platform-atdd-scanner-e3f0` | `cursor/testflight-signing-ci-3af7` |
| Head OID | `8af95e1f921c317daad661fa193029c2aa3fa574` | `0efa0e1307ae7b018886847355dfda4a4a9cb84e` |
| Base branch | `cursor/iphone-sync-file-open-5ec7` | `cursor/complete-platform-atdd-scanner-e3f0` (stacked on #16) |
| Base OID | `afc224c42372d2ca2594686e61f76fc90c2fdb52` | `8af95e1f921c317daad661fa193029c2aa3fa574` |
| Diff size | 303 files · +22593 / −7 | 7 files · +532 / −6 |

### Related lineage (not merged)

| Ref | Head OID | Role |
| --- | --- | --- |
| `main` | `56f5c438581723fb7d86cebf716f8f4fd101842f` | **No `atdd/` tree** |
| PR #10 `cursor/bluetooth-scanner-929d` | `a1016a26c8ba49c42e1c3da0375e997004c482da` | First “parser v3, Connect Scanner” PR |
| PR #13 `cursor/atdd-native-iphone-e3f0` | `49559038b6b20be38dd482c91ac2f9ea1d581d90` | Import gate + unsigned sim CI (no full Capacitor Xcode tree) |

**Stack fact:** PR #17’s base **is** PR #16’s head. Treat **#16** as the scanner/parser/app source of truth; **#17** adds TestFlight CI + status-board answers only.

---

## 2. Exact iOS bundle identifier

### What is real in the buildable tree (PR #16 head)

| Location | Value |
| --- | --- |
| `atdd/ios/ios/App/App.xcodeproj/project.pbxproj` `PRODUCT_BUNDLE_IDENTIFIER` (Debug + Release) | `com.netgene.atdd.ble` |
| `atdd/ios/ios/App/App/Info.plist` `CFBundleIdentifier` | `$(PRODUCT_BUNDLE_IDENTIFIER)` → resolves to above |
| `atdd/ios/capacitor.config.json` `appId` | `com.netgene.atdd.ble` |
| `atdd/ios/android/app/build.gradle` `applicationId` / `namespace` | `com.netgene.atdd.ble` |
| `atdd/ios/CURSOR_HANDOFF.txt` | `appId: com.netgene.atdd.ble` |
| PR #17 `.github/workflows/atdd-ios-testflight.yml` `BUNDLE_ID` | `com.netgene.atdd.ble` |
| PR #17 `docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md` | Documents App ID `com.netgene.atdd.ble` |

**Display name:** `ATDD Connect` (`CFBundleDisplayName`).  
**Xcode marketing version on scaffold:** `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION = 1`.  
**TestFlight workflow default input:** `marketing_version` default `"1.2.0"` (workflow input only; does not change the committed pbxproj until a signed run overrides).

### Mismatch explanation: `com.michaelpaine…` vs `com.netgene.atdd.ble`

| ID | Status in Netgene git (all ATDD-related refs searched) |
| --- | --- |
| `com.netgene.atdd.ble` | **Present** — Capacitor scaffold invented for the Connect app on PR #16 |
| `com.michaelpaine.autotruckdiagnosticsfordummies` | **Absent** — zero hits in `git grep` / `git log -S` across fetched ATDD branches |

**Explanation (labeled):**

1. **VERIFIED:** Every signing-relevant file on PR #16/#17 uses **`com.netgene.atdd.ble`**. TestFlight / App Store Connect setup must match this ID, or signing will fail.
2. **VERIFIED (negative):** The string `com.michaelpaine.autotruckdiagnosticsfordummies` is **not** in this repository. It is **not** the PR #16/#17 bundle ID.
3. **ASSUMPTION (external):** That ID may refer to a **preserved ATDD 1.2.0 original** (Home Screen / signed package) that this environment never recovered. Repo docs repeatedly state ATDD 1.2.0 originals are **NOT FOUND** (`atdd/docs/VERIFICATION-REPORT.md`, `atdd/README.md`). Until Michael drops the original package into `mike-ai/recovery/private/inbox/` (or attaches it), Cursor **cannot** confirm the historical 1.2.0 bundle ID from source.

**Do not** retarget signing to `com.michaelpaine…` without Michael’s explicit approval and the original package in hand — that would diverge from the only ID the current Xcode/Capacitor tree actually builds.

---

## 3. Parser version used by PR #16

### Canonical module

| Item | Value |
| --- | --- |
| Filename | `obd-protocol-v3-frame-aware.js` |
| Canonical path | `atdd/obd/obd-protocol-v3-frame-aware.js` |
| Meta export | `PROTOCOL_V3_META` |
| Meta `name` | `obd-protocol-v3-frame-aware` |
| Meta `version` | **`3.1.0-cloud-continuation`** |
| Meta `fixdClaim` | `UNVERIFIED` |
| SHA-256 (PR #10 = #16 = #17) | `9f4ab2fa79a7825bd17c254d7767393e997ee916117fe5dc7b49680473c223e4` |
| Wired by | `import { parseMode03FrameAware } from "./obd-protocol-v3-frame-aware.js"` in `atdd/ble/scanner-session.js` (and web/ios copies) |
| npm script | `atdd/package.json` → `test:obd` → `node obd/tests/obd-protocol-v3.test.mjs` |

### Copies (same v3 content synced into shells)

```
atdd/obd/obd-protocol-v3-frame-aware.js          # canonical
atdd/web/js/obd-protocol-v3-frame-aware.js
atdd/ios/www/js/obd-protocol-v3-frame-aware.js
atdd/ios/ios/App/App/public/js/obd-protocol-v3-frame-aware.js
atdd/ios/android/app/src/main/assets/public/js/obd-protocol-v3-frame-aware.js
mike-ai/public/apps/atdd/js/obd-protocol-v3-frame-aware.js
```

### v3 / v4 / v7 decision

| Candidate | In PR #16 / #17 trees? |
| --- | --- |
| **v3** (`obd-protocol-v3-frame-aware.js`) | **YES — this is what the app imports** |
| v4 | **NO** file / no import |
| v7 | **NO** file / no import |

**Import note inside the module (verbatim intent):** OneDrive file from `ATDD_BLE_IPHONE_REVIEW_20261117` was **not** present in the Cloud Agent VM; this file is a **cloud continuation** of stated v3 goals, not a claim that the OneDrive original was imported.

### Synthetic tests (this VM, 2026-11-18)

- Ran: `node atdd/obd/tests/obd-protocol-v3.test.mjs` on PR #16 head  
- Result: **`obd-protocol-v3-frame-aware tests passed`** (exit 0)  
- Coverage includes: DTC decode, Mode 03 happy path, `NO DATA`, empty codes, negative response (no DTC emit), incomplete ISO-TP, multi-frame, sequence mismatch, multi-ECU headers  
- **No real adapter / vehicle** was touched

### About “v3 passed only 2 of 4 rejection fixtures” / “v4/v7 passed all”

| Claim | Repo evidence |
| --- | --- |
| Separate 4-fixture “rejection” suite for v3 | **Not found** as a named 4-case harness |
| v4 / v7 candidate modules | **Not found** in git trees above |
| Gemini/board attribution of v4/v7 results | **Not confirmable** from this repository — treat as **external / ASSUMPTION** until those files are dropped into recovery |

**Conclusion for vehicle tests:** PR #16 uses **parser v3** (`3.1.0-cloud-continuation`) only. Do not assume v4/v7 are in the app.

---

## 4. Source paths (review map)

### PR #16 — scanner / BLE / OBD (prefer these)

```
atdd/ble/scanner-session.js
atdd/ble/scanner-ui.js
atdd/ble/fixd-protocol-probe.js
atdd/ble/web-bluetooth-transport.js
atdd/ble/capacitor-ble-transport.js
atdd/ble/IMPORT.md
atdd/obd/obd-protocol-v3-frame-aware.js
atdd/obd/tests/obd-protocol-v3.test.mjs
atdd/web/js/*                         # PWA / browser shell
atdd/ios/                             # Capacitor 6 + bluetooth-le native shell
atdd/ios/capacitor.config.json
atdd/ios/ios/App/App.xcodeproj
atdd/tests/scanner-session.test.mjs
bluetooth-scanner/                    # standalone companion
mike-ai/public/apps/atdd/             # hub-served copy
```

### PR #17 — TestFlight / docs only (no parser change)

```
.github/workflows/atdd-ios-testflight.yml
atdd/ios/scripts/encode-signing-secrets.sh
docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md
docs/status-board/CURSOR-ANSWERS-CLAUDE-QUESTIONS-2026-11-18.md
docs/status-board/AI-STATUS-BOARD.md          # append
docs/status-board/ATDD-NATIVE-IPHONE-VALIDATION.md
atdd/ios/CURSOR_HANDOFF.txt                   # small note append
```

### ATDD 1.2.0 baseline (preserved / missing)

| Artifact | Status |
| --- | --- |
| Original ATDD 1.2.0 app sources | **NOT FOUND** |
| OBD2 repair-code databases | **NOT FOUND** |
| Signed 1.2.0 Home Screen / installer | **NOT FOUND** — docs forbid overwrite |
| Dev placeholders | `atdd/package.json` → `1.2.0-dev+cdi-import`; `atdd/ios/package.json` → `1.2.0-dev+ble` |

`main` still has **no** `atdd/` directory. All ATDD work lives on open PR branches only.

---

## 5. Commit hashes

### PR #16 commits (oldest → newest)

| OID | Headline |
| --- | --- |
| `f4e4ae5a473688e670c0733ffaf943c1a34e0a95` | Add working ATDD Connect Scanner and wire it into the AI platform |
| `2f96e7548304778f21038765b1f3b78fa192f37b` | Ship ATDD Connect Scanner on the Cloudflare static hub |
| `71c79ea6abe2c5ec6889c85e65379b9ff8362875` | Make Connect Scanner always run instead of a disabled dead button |
| `00f2adc601c9916ccd054fb2fc81ad5a3145b041` | Connect real FIXD over Web Bluetooth without silent Demo fallback |
| `85b8ab07538d13470f8636cdcc95dd6d63fd1640` | Add Capacitor iOS ATDD Connect app with native FIXD BLE |
| `51898257056efae07b3f681b6ad40f92c6e9163c` | Fix ATDD iOS simulator CI concurrency canceling builds |
| `18504e24f14f7829ada307b928ac3f1808e3cd90` | Add Ubuntu iOS tree validation; stop canceling simulator builds |
| `798505c875f3d2e684a8475283a4fdcb0bcd5e1b` | Allow iOS CI to pass without macOS runners |
| `43794e82c4108a7363b0d5b3f8fb1134333601b1` | Add Android ATDD Connect APK for FIXD without a Mac |
| `929fbecb96b4200e1bb44036b3cdb436be26e3b9` | Fix Android CI SDK setup without obsolete tools package |
| `dc4f652e4e38385d23c37eaf36a7fa556bff72ba` | Locate sdkmanager on the Actions runner for Android CI |
| `3043727e75b71b12a7b611e2ce39784311d49c3a` | Retry iOS simulator CI on macos-13 |
| `8af95e1f921c317daad661fa193029c2aa3fa574` | iPhone Home Screen PWA: open on Connect Scanner for FIXD (**HEAD**) |

### PR #17 commits

| OID | Headline |
| --- | --- |
| `db85eb6822863a1caab2d9a510a0f4f3b57c5d90` | Add TestFlight signed iOS CI and secrets setup guide |
| `0efa0e1307ae7b018886847355dfda4a4a9cb84e` | Document Cursor answers to Claude team questions (2026-11-18) (**HEAD**) |

---

## 6. CI status (as of reconcile)

### PR #16 (`atdd-ios-simulator` + Workers)

| Check | Result |
| --- | --- |
| Validate iOS project tree | **pass** |
| Build Android debug APK | **pass** |
| Workers Builds: proud-bread-5014 | **pass** |
| Workers Builds: rough-breeze-46d1 | **pass** |
| Inspect + unsigned simulator build | **pending** (macOS runner historically unsupported / queued) |

### PR #17

| Check | Result |
| --- | --- |
| Validate iOS project tree | **pass** |
| Build Android debug APK | **pass** |
| Workers Builds (both) | **pass** |
| Inspect + unsigned simulator build | **pending** |
| `atdd-ios-testflight` signed upload | **Not run** — manual workflow; seven GitHub secrets required; **no signing performed by this reconcile** |

---

## 7. Safety gates vs Claude/Gemini plan (repo facts)

| Gate | Repo fact |
| --- | --- |
| Mode 04 / Clear Codes | **No Mode 04 sender** in `scanner-session.js`. Only `readStoredDtcs()` sends `"03"`. Simulated transport returns `NO DATA` for unknown cmds including `"04"`. |
| AT commands | **Present after connect** in `probeProtocol()` via `ELM_PROBE_SEQUENCE` = `ATZ`, `ATE0`, `ATL0`, `ATH1`, `ATSP0`, `0100`. These are **not** Mode 04, but they **are** adapter configuration writes once GATT is up. |
| Passive advertisement scan | ATDD code uses chooser/`requestDevice` then connect — **not** a continuous advertisement logger. Claude’s **nRF Connect scan-only** remains the correct next human step. |
| GATT connect | Requires Michael’s **explicit** approval; do not bundle into the nRF scan. |
| FIXD compatibility | Remains **UNVERIFIED**. |
| Purchases (e.g. Veepeak) | Not authorized by this report. |

---

## 8. Standing orders (unchanged)

1. **Michael:** nRF Connect **scan only**, FIXD app closed, send screenshots (advertised name + service UUIDs).  
2. **No GATT** until Michael explicitly approves.  
3. **No Mode 04**, no unverified “FIXD-compatible” claims, no purchases.  
4. **No merge / signing / TestFlight / production** without Michael’s approval.  
5. Preserve ATDD 1.2.0 originals wherever they surface; never overwrite the signed Home Screen app from these PR branches without approval.  
6. Signing (when approved) must use **`com.netgene.atdd.ble`** unless Michael supplies a different original App ID and orders a retarget.

---

## 9. Evidence commands used (this run)

```text
gh pr view 16|17 --json …
gh pr checks 16|17
git rev-parse origin/cursor/complete-platform-atdd-scanner-e3f0
git rev-parse origin/cursor/testflight-signing-ci-3af7
git grep PRODUCT_BUNDLE_IDENTIFIER / appId / com.netgene.atdd.ble
git log -S'michaelpaine' / -S'autotruckdiagnosticsfordummies'  # empty
git ls-tree -r … | rg obd-protocol-v   # v3 only
node atdd/obd/tests/obd-protocol-v3.test.mjs  # passed
sha256sum atdd/obd/obd-protocol-v3-frame-aware.js
```
