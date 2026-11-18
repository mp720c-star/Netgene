# ATDD iPhone delivery status — URGENT (2026-11-18)

**Claim status: NOT DELIVERED.** Michael has not seen the Connect Scanner interface on his installed iPhone app. Real FIXD hardware testing is **not** documented. PRs, CI passes, and simulator jobs are **not** delivery.

**Rules:** Preserve existing Home Screen app · preserve databases · preserve signed Windows baseline · no deploy / replace / merge / spend without Michael’s approval.

---

## 1. What Michael has installed today (identification)

| Fact | Evidence | Label |
| --- | --- | --- |
| Michael reports the Home Screen ATDD app is **unchanged** and still has **no Bluetooth scanner button** | Michael confirmation (this order) | **VERIFIED (user)** |
| Production Cloudflare hub = **`main`** | Live `https://proud-bread-5014.mp720c.workers.dev/` SHA-256 matches `origin/main:index.html` (`eef75611…`) | **VERIFIED** |
| Production **`/atdd/`** | HTTP **404** (both `proud-bread-5014` and `rough-breeze-46d1`) | **VERIFIED** |
| Production hub cards | Mike AI, Forma, Vehicle Genius, CDI Genius, Ravin downloads — **no ATDD card** | **VERIFIED** |
| PR #16 Connect Scanner PWA | Exists only on branch `cursor/complete-platform-atdd-scanner-e3f0` (build `16.iphone-pwa.2`); **not** on live production URL | **VERIFIED** |
| ATDD 1.2.0 original package in this VM | **NOT FOUND** | **VERIFIED (negative)** |

### Exact installed-app conclusion

Michael’s current iPhone Home Screen ATDD icon is **not** the PR #16 “ATDD+CDI / Connect Scanner” PWA from production, because that path does not exist live.

**Most likely identities (ordered):**

1. **Original preserved ATDD 1.2.0 Home Screen / signed app** (possible bundle id `com.michaelpaine.autotruckdiagnosticsfordummies` — **not present in Netgene git**; cannot confirm from this VM). Matches “no Bluetooth scanner button” and “unchanged.”
2. **Older gated web shell** (e.g. PR #9 lineage): nav label `OBD2 / ATDD` with **gated** copy and **no** Connect Scanner / FIXD button.
3. **Some other saved URL / icon** not served from current production `/atdd/`.

**Ask Michael (one screenshot):** Home Screen icon long-press → Share / App info, or open the app and note the **exact title + URL bar / build stamp**. That pins (1) vs (2) vs (3) without guessing.

**Preserve:** Do **not** overwrite, replace, or re-point that existing icon until Michael explicitly authorizes it.

---

## 2. Can the scanner UI be a web update of the existing app?

### Short answer

| Goal | Web update of existing Home Screen app? | Separate native iOS install required? |
| --- | --- | --- |
| Show a “Connect Scanner” button on iPhone | Only if the installed app is a **PWA pointing at a URL we are allowed to update** — **and** Michael authorizes publishing that URL. Today production has no `/atdd/`. | Not required just to *see* UI |
| **Live FIXD Bluetooth** on iPhone | **NO** — iPhone Safari / Home Screen PWAs have **no Web Bluetooth** | **YES** — Capacitor native shell `com.netgene.atdd.ble` (TestFlight / Xcode) |
| Keep existing ATDD 1.2.0 app + DBs untouched | Yes — leave it alone | New app installs **beside** it under a different bundle id |

### Why a PWA web update cannot finish iPhone FIXD delivery

PR #16 `atdd/web/js/scanner-ui.js` intentionally gates iPhone:

- Detects iPhone/iPad → shows **“iPhone Home Screen app = web shell (no Bluetooth)”**
- Does **not** open a live FIXD chooser on iOS web
- Points to native `atdd/ios` for real BLE

So even if Michael approved publishing PR #16’s `/atdd/` and re-added a **new** Home Screen icon, he would see Connect Scanner UI + the no-Bluetooth gate — **not** a working FIXD link. That is still **not** delivery of iPhone FIXD.

---

## 3. PR #16 / #17 / bundle IDs / parser (reconcile)

| Item | Exact value |
| --- | --- |
| PR #16 head | `8af95e1f921c317daad661fa193029c2aa3fa574` — scanner + PWA + Capacitor source |
| PR #17 head | `0efa0e1307ae7b018886847355dfda4a4a9cb84e` — TestFlight workflow + docs (stacked on #16) |
| Buildable iOS bundle id | **`com.netgene.atdd.ble`** (Xcode / Capacitor / TestFlight `BUNDLE_ID`) |
| `com.michaelpaine.autotruckdiagnosticsfordummies` | **Absent** from Netgene git — may be original 1.2.0; **do not** retarget without Michael + original package |
| Integrated OBD parser | **v3 only** — `atdd/obd/obd-protocol-v3-frame-aware.js` meta **`3.1.0-cloud-continuation`** |
| v4 / v7 in app trees | **None** |
| Parser SHA-256 | `9f4ab2fa79a7825bd17c254d7767393e997ee916117fe5dc7b49680473c223e4` |
| FIXD claim | **UNVERIFIED** |
| Mode 04 | Not implemented |

Details: `docs/status-board/ATDD-PR16-PR17-RECONCILIATION-2026-11-18.md`

---

## 4. What is prepared vs what is delivered

| Artifact | Status | Is delivery? |
| --- | --- | --- |
| PR #16 Capacitor iOS source (`atdd/ios/`) | Ready on branch | **No** — source ≠ installed |
| PR #17 TestFlight workflow | Ready; **manual**; needs 7 secrets | **No** — not run / not signed |
| Ubuntu “Validate iOS project tree” | Pass | **No** |
| macOS unsigned simulator job | Pending / historically flaky (`continue-on-error`) | **No** |
| Android debug APK | Built on PR #16; raw GitHub URL returns 200 | **Not iPhone delivery** |
| Live production `/atdd/` PWA | **404** | **No** |
| TestFlight / IPA install link | **`null`** (`ATDD_BUILD.iphoneInstallLink`) | **No** |
| Michael sees Connect Scanner on his iPhone | **No** (his report) | **No** |
| Real FIXD + truck evidence | **NOT VERIFIED** | **No** |

---

## 5. Exact authorized installation path (real iPhone test build)

This is the **only** path that can put a **working Bluetooth scanner UI** on Michael’s iPhone without replacing the existing ATDD app.

### Product to install

| Field | Value |
| --- | --- |
| App name | **ATDD Connect** |
| Bundle ID | **`com.netgene.atdd.ble`** |
| Kind | Capacitor 6 + `@capacitor-community/bluetooth-le` (hybrid native) |
| Parser | OBD protocol **v3** (`3.1.0-cloud-continuation`) |
| Relationship to existing Home Screen ATDD | **Separate app** — leave original icon untouched |
| Branch / PR | Source: PR **#16**; signing workflow: PR **#17** |

### Step A — Michael approvals required (before any spend / Apple action)

Reply with explicit yes/no:

1. **Approve** creating Apple App ID + App Store Connect record for **`com.netgene.atdd.ble`** (may use existing Apple Developer membership — no new “purchase” assumed; confirm if any paid seat/cert cost appears).  
2. **Approve** adding the seven GitHub Actions secret **values** (via GitHub Settings only — never paste into chat).  
3. **Approve** running workflow **`atdd-ios-testflight`** once secrets exist.  
4. Confirm existing Home Screen ATDD must stay installed as-is (**preserve**).

### Step B — Apple + GitHub (Michael or designated Mac; Cursor cannot set secret values)

Follow `docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md`:

1. Certificates, Identifiers & Profiles → App ID **`com.netgene.atdd.ble`** + Bluetooth.  
2. Apple Distribution certificate → `.p12`.  
3. App Store provisioning profile for that App ID.  
4. App Store Connect app record: **ATDD Connect** / `com.netgene.atdd.ble`.  
5. App Store Connect API key (`.p8` + Key ID + Issuer ID).  
6. On a Mac, run:

```bash
bash atdd/ios/scripts/encode-signing-secrets.sh \
  /path/to/distribution.p12 \
  /path/to/ATDD_Connect_AppStore.mobileprovision \
  /path/to/AuthKey_XXXXXXXXXX.p8
```

7. Add secrets (names only documented):  
   `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_PRIVATE_KEY`, `IOS_TEAM_ID`,  
   `IOS_DISTRIBUTION_P12_BASE64`, `IOS_DISTRIBUTION_P12_PASSWORD`,  
   `IOS_PROVISION_PROFILE_BASE64`  
   → https://github.com/mp720c-star/Netgene/settings/secrets/actions

### Step C — Build + install (after Step A/B)

1. GitHub → **Actions** → **atdd-ios-testflight** → **Run workflow**  
   - Branch: `cursor/testflight-signing-ci-3af7` (PR #17) **or** the branch Michael authorizes that contains `atdd/ios` + the workflow  
   - Upload IPA to TestFlight: **checked**  
   - Marketing version default: `1.2.0` (test build label — does **not** replace ATDD 1.2.0 original)  
2. Wait for App Store Connect processing.  
3. On iPhone: install **TestFlight** → install **ATDD Connect** (`com.netgene.atdd.ble`).  
4. **Leave** the old Home Screen ATDD icon alone.  
5. Open **ATDD Connect** → confirm Connect Scanner UI is visible.  
6. Only after Michael explicitly approves GATT: power FIXD → Connect → document name/UUIDs/Mode 03 (no Mode 04).

### Step D — Success criteria (do not claim before these)

| # | Criterion | Met? |
| --- | --- | --- |
| 1 | Michael screenshots **ATDD Connect** on iPhone showing Connect Scanner UI | **No** |
| 2 | Build stamp / bundle id confirmed as `com.netgene.atdd.ble` (not the old app) | **No** |
| 3 | Existing ATDD Home Screen app still present / unchanged | Pending Michael |
| 4 | Real FIXD session documented (or explicitly deferred after UI proof) | **No** |

Until #1–#2 are true, status remains **NOT DELIVERED**.

---

## 6. Optional parallel paths (not substitutes for iPhone FIXD)

### A. Separate web preview (UI only — needs Michael deploy approval)

- Publish PR #16 `atdd/web` to a **new** URL (not replacing production blindly without approval).  
- Michael Add to Home Screen as a **second** icon (e.g. “ATDD+CDI test”).  
- Expectation: sees Connect Scanner + **no Bluetooth** gate.  
- **Does not** satisfy FIXD-on-iPhone delivery.

### B. Android debug APK (Bluetooth possible on Android; not iPhone)

```text
https://raw.githubusercontent.com/mp720c-star/Netgene/cursor/complete-platform-atdd-scanner-e3f0/downloads/atdd-connect-debug.apk
```

Sideload only if Michael wants an Android interim test. Bundle/application id: `com.netgene.atdd.ble`.

### C. Local Mac Xcode (if TestFlight blocked)

```bash
cd atdd/ios && npm ci && npm run sync:ios
# open ios/App/App.xcworkspace — sign with Michael’s team — Run on device
```

Still requires Michael’s Apple team + physical device cable/network; Cursor Linux agent cannot complete this.

---

## 7. Explicit non-actions this run

- No production deploy  
- No merge to `main`  
- No replacement of existing Home Screen ATDD  
- No TestFlight upload (secrets not usable from this agent; approval pending)  
- No Mode 04 / clear codes  
- No purchases  
- No “success” claim  

---

## 8. Next message Michael should send

Pick one:

1. **“Approve TestFlight path for com.netgene.atdd.ble; keep old Home Screen app.”** → Michael completes Apple secrets (Step B); then authorize **Run workflow**.  
2. **“Approve temporary separate web preview only (UI, no BLE).”** → Cursor can publish a **non-replacing** preview URL after that explicit yes.  
3. **Screenshot of current Home Screen ATDD title/URL/build** → locks identity of the installed app.
