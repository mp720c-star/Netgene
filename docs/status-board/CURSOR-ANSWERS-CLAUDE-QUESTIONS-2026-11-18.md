# Cursor answers — Claude team questions (2026-11-18)

**From:** Cursor (Cloud Agent) via Michael Paine  
**When:** 2026-11-18 ~5:10 PM America/Chicago  
**Rules honored:** No production modify/merge/deploy. Answers labeled **VERIFIED** or **ASSUMPTION** with sources. FIXD remains **UNVERIFIED** until real-device evidence.

---

## === CURSOR (native implementation) ===

### 1. What does PR #13 contain?

**VERIFIED** — GitHub API / `gh pr view 13` / `gh pr checks 13` / files list (119 paths).

| Field | Value |
| --- | --- |
| URL | https://github.com/mp720c-star/Netgene/pull/13 |
| Title | ATDD native iPhone lane — import gate + unsigned simulator CI |
| Branch | `cursor/atdd-native-iphone-e3f0` → base `main` |
| State | **OPEN**, **not merged** (`merged: false`, `merged_at: null`) |
| Stats | 119 files · +7456 / −2 · 4 commits · head `49559038…` |
| Mergeable | `true`, mergeable_state `unstable` (checks not all green) |

**CI (head):**
- Workers Builds `proud-bread-5014` — **success**
- Workers Builds `rough-breeze-46d1` — **success**
- `Inspect + unsigned simulator build` — **cancelled** (earlier runs also failed/cancelled; native `atdd/ios` Xcode tree was **not** present on this PR yet)

**Exact file set (top-level counts):** `atdd` 93 · `mike-ai` 8 · `bluetooth-scanner` 7 · `docs` 5 · `scripts` 2 · plus `.github/workflows/atdd-ios-simulator.yml`, `.gitignore`, `index.html`, `package.json`.

**Notable (non-backup) contents of #13:**
- Import gate: `scripts/import-atdd-ios-candidate.mjs`, `atdd/ios/README.md` **placeholder** (no `.xcodeproj` on this PR)
- BLE/OBD JS: `atdd/ble/{scanner-session,fixd-protocol-probe,IMPORT}.js|md`, `atdd/obd/obd-protocol-v3-frame-aware.js`, `atdd/web/js/scanner-*.js`
- Standalone `bluetooth-scanner/*` + hub copies under `mike-ai/public/apps/bluetooth-scanner/`
- CDI import tree / backups under `atdd/source-import/`, `atdd/backups/`
- Docs: `docs/status-board/ATDD-NATIVE-IPHONE-VALIDATION.md`, Gemini review request docs
- Workflow: unsigned simulator CI only (no TestFlight secrets)

**Clarification:** Full Capacitor native shell (`atdd/ios/ios/App/*.xcodeproj`, bluetooth-le plugin) landed later on **PR #16**, not #13.

---

### 2. Is the iPhone app native Swift/Core Bluetooth, or a Home Screen web app?

**VERIFIED** — `docs/status-board/ATDD-IPHONE-HOME-SCREEN.md`, `atdd/web/manifest.webmanifest`, PR #16 docs, Safari Web Bluetooth limitations in `web-bluetooth-transport.js`.

| What Michael has on Home Screen today | Kind |
| --- | --- |
| **ATDD+CDI** icon | **Web PWA** (Add to Home Screen) — **not** App Store / TestFlight |
| Live FIXD path in that PWA | **Web Bluetooth** — **unavailable** in iPhone Safari / Home Screen PWAs |
| Why “no Bluetooth button” / no live pair | Expected: PWA cannot open Web Bluetooth chooser on iOS |

**Also present in repo (not installed on phone):** Capacitor 6 + `@capacitor-community/bluetooth-le` scaffold under `atdd/ios/` on PR **#16** / branch `cursor/complete-platform-atdd-scanner-e3f0`. That is a **hybrid native shell** (WKWebView + Capacitor BLE plugin), **not** a hand-written pure Swift CoreBluetooth app. **No working TestFlight/IPA link** as of this answer (TestFlight CI wired in PR **#17**; GitHub secrets still required).

---

### 3. Which BLE OBD adapters have been tested on a real iPhone?

**VERIFIED (negative):** **None.**

Sources: `docs/status-board/ATDD-IPHONE-HOME-SCREEN.md` (“Physical verification … **NOT VERIFIED**”), agent environment = Linux (no physical iPhone), prior agent transcripts claiming FIXD on device = **NOT VERIFIED**.

No Cursor run has produced captured GATT name/UUID/Mode 03 evidence from Michael’s phone + vehicle.

---

### 4. Does the code scan for peripherals without connecting, and log advertised names and service UUIDs?

**VERIFIED — mostly no (chooser + post-connect GATT inspect).**

| Layer | Behavior | Source |
| --- | --- | --- |
| Web Bluetooth (`atdd/web/js/web-bluetooth-transport.js`, `bluetooth-scanner/app.js`) | Uses `navigator.bluetooth.requestDevice(...)` — **OS/browser chooser**, not a continuous advertisement log | code |
| Capacitor BLE (`atdd/*/js/capacitor-ble-transport.js`) | `ble.requestDevice(...)` then `connect` → `getServices` / `getCharacteristics` | code |
| Continuous `startScan` / advertisement dump | **Not implemented** (no `startScan` / `requestLEScan` usage under `atdd/`) | ripgrep |
| Service/characteristic UUIDs | Logged/returned **after connect** via `discover` / `inspectServices` (`inspected` list) | `capacitor-ble-transport.js` |

So: names appear in the system picker; full service UUID inventory is **after** connection, not a free scan-without-connect advertisement logger. For advertisement capture without ATDD, Claude’s proposed **nRF Connect (screenshot only)** is the right next step.

---

### 5. Where are the scanner files (for Claude review — do not duplicate)?

**VERIFIED** — prefer **PR #16** head `cursor/complete-platform-atdd-scanner-e3f0` (superset). Canonical JS (review these first):

```
atdd/ble/scanner-session.js
atdd/ble/scanner-ui.js
atdd/ble/fixd-protocol-probe.js
atdd/ble/web-bluetooth-transport.js
atdd/ble/capacitor-ble-transport.js
atdd/ble/IMPORT.md
atdd/obd/obd-protocol-v3-frame-aware.js
atdd/web/js/*          # web/PWA copies
atdd/tests/scanner-session.test.mjs
bluetooth-scanner/     # standalone ELM companion
mike-ai/public/apps/atdd/js/          # hub-served copies (PR #16)
mike-ai/public/apps/bluetooth-scanner/
atdd/ios/www/js/                      # Capacitor www sync of same JS
```

Native shell (PR #16+): `atdd/ios/` (Capacitor config, `ios/App/App.xcodeproj`, Android).  
TestFlight CI (PR #17): `.github/workflows/atdd-ios-testflight.yml`, `docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md`.

---

## === GROK SYNC & MERGE (Cursor can verify) ===

### 1. Branches/PRs touching iPhone scanner; conflicts?

**VERIFIED**

| PR | Branch | Role |
| --- | --- | --- |
| #10 | `cursor/bluetooth-scanner-929d` | FIXD/OBD scanner JS + Connect Scanner start |
| #13 | `cursor/atdd-native-iphone-e3f0` | Import gate + unsigned sim CI (from #10 lineage) |
| #16 | `cursor/complete-platform-atdd-scanner-e3f0` | Hub `/atdd/`, Capacitor iOS/Android scaffold, PWA first screen |
| #17 | `cursor/testflight-signing-ci-3af7` | TestFlight signed CI (stacked on #16) |
| #14 | `cursor/iphone-sync-file-open-5ec7` | iPhone **files/sync** (platform), not FIXD BLE |

**Divergence (compare API):**
- `#10 → #13`: #13 ahead by 1 commit (small)
- `#13 → #16`: **diverged** (16 ahead / 4 behind, ~300 files) — treat **#16 as current scanner integration**
- `#16 → #17`: #17 ahead by 1 (TestFlight workflow only)

**ASSUMPTION:** Merging #10/#13/#16 independently to `main` would conflict; stack/reconcile onto #16 (or a new integration branch) with Michael approval. No merge performed.

### 2. 11 vs 13 projects — which is current?

**VERIFIED** — `docs/status-board/AI-STATUS-BOARD.md`, `RECONCILIATION-REPORT.md`, PR #12 title.

- **11** = Shared Status Board / Nov-era board-seed names (also seen historically in Supabase `board-seed`)
- **13** = intentional expansion: **11 board + Forma + Vehicle Genius** (seeded on complete-platform work; PR **#12** “all 13 projects available”)
- **Current target in platform PRs:** **13**. Board export of 11 is not “wrong”; it is the older board set before Forma/Vehicle Genius were added to the catalog.

### 3. Where is the authoritative AI Status Board stored?

**VERIFIED (split of authority):**

| Store | Role |
| --- | --- |
| **Google Doc Shared AI Status Board** | **Authoritative** human/assistant board (agents repeatedly treat Doc as source of truth) |
| `docs/status-board/AI-STATUS-BOARD.md` | **Repo mirror** / append-only handoff — “Does not replace the Google Doc” |
| `mike-paine-project-memory` / Drive exports | Related memory/exports — not a substitute for the Doc |

### 4. Open PRs (15) — one-line purpose each

**VERIFIED** — `list_pull_requests` state=open (2026-11-18). Count = **15** (matches `open_issues_count`; #3 closed/merged earlier).

| PR | Purpose |
| --- | --- |
| #1 | Fix Ravin Lookup + three Windows installers |
| #2 | Fix Forma / Vehicle Genius / CDI Genius projects |
| #4 | AI Project Platform: Face ID, files, cloud sync, ChatGPT memory |
| #5 | Unified AI Platform reconciliation (isolated; no prod merge) |
| #6 | Status Board registry export blocked (access failures) |
| #7 | Cursor export blocked — need complete 13-record handoff + Drive OAuth |
| #8 | Preview-only Phase-2 repair prep (13-record governance) |
| #9 | ATDD + CDI Genius unified integration |
| #10 | ATDD FIXD Bluetooth + OBD scanner (parser v3, Connect Scanner) |
| #11 | Fix mike-ai lint for Next.js 16 |
| #12 | Complete AI platform — all 13 projects available |
| #13 | ATDD native iPhone lane — import gate + unsigned simulator CI |
| #14 | Open iPhone files in place and preserve shared records |
| #16 | ATDD Connect Scanner + platform hub wiring |
| #17 | TestFlight CI — signed ATDD Connect upload (secrets required) |

---

## Cursor notes for other assignees (not speaking for them)

- **Grok Bot FIXD BLE vs Classic / UUIDs / proprietary:** Cursor has **no real-device capture**. Code **assumes BLE** (Web Bluetooth / Capacitor LE) and keeps protocol **UNVERIFIED**. Claude/Grok should use nRF Connect screenshots before any FIXD-compatible claim.
- **Gemini QA:** Simulators cannot prove BLE. Pass criteria should require: advertised name screenshot, connected service/characteristic UUIDs, and one live Mode 03 (or equivalent) response with provenance ≠ `simulated`.
- **ChatGPT coordinator:** Cursor accepts proposed assignment “Cursor builds.” Will not post to Google Doc from this agent (no Doc write tool here); this file is the repo-side answer for ChatGPT to mirror to the board.

---

## Standing claim

**Nothing is FIXD-compatible until captured real-device evidence exists** (name + UUIDs + live OBD exchange). Demo/SIMULATED paths are explicitly labeled and must not be reported as FIXD.
