# AI Project Platform — Shared Status Board (repo mirror)

Append-only handoff log for Cursor agents.  
**Does not replace** the Google Doc board or `mike-paine-project-memory` — it mirrors progress for this repo.

Rules: append only · never delete originals · never merge to production without Michael’s approval · no paid credits without permission.

---

## Entry — 2026-11-16 ~10:20 AM America/Chicago

**Agent:** Cloud agent `bc-01a1e4ea-f284-7154-a1df-9ec4c9a5b8a1`  
**Branch:** `cursor/unified-ai-platform-b8a1` (created from `main` @ `56f5c43`)  
**Action:** First ordered deliverable — full feature/file reconciliation + safest unified architecture.

### Progress

- [x] Created separate unified branch so `main`, PR #2, PR #4, and backups stay intact if merge work fails  
- [x] Compared hub rebuild (PR #2 / `main`), secure platform (PR #4), and original Mike AI V2 / Status Board sources  
- [x] Identified authoritative revision per component  
- [x] Verified Supabase `ai-project-platform`: **11** project name rows (`board-seed`); **0** files, memory, WebAuthn, sync rows  
- [x] Posted reconciliation report: `docs/status-board/RECONCILIATION-REPORT.md`  
- [ ] Import PR #4 onto unified branch (next)  
- [ ] Governance status corrections (Ravin paused; Auto Truck priority)  
- [ ] OneDrive-primary sync role flip  
- [ ] Real records JSON import (blocked — file not in recovery)  
- [ ] iPhone Face ID / PWA / download verification  
- [ ] Michael approval for any production merge

### Blockers

1. Original V2 source commit `c1229a25895d…` not in Netgene  
2. No `AI_Platform_Project_Records_*.json` in `mike-ai/recovery/`  
3. Drive staging / OneDrive / CloudKit credentials not available in this VM (copy-only required)  
4. Model API keys absent — chat correctly fail-closed  
5. Cannot complete real iPhone auth/Home Screen tests from this environment alone  
6. Cloud primary mismatch: PR #4 code = iCloud primary; Michael’s order = OneDrive primary

### Evidence

| Item | Result |
| --- | --- |
| Unified branch pushed | `origin/cursor/unified-ai-platform-b8a1` |
| Production `mike-ai.vercel.app` | Untouched (still paused) |
| `main` | Untouched |
| Supabase projects count | 11 board-seed names |
| Recovery folder | Empty (no records JSON) |
| Ravin installers on disk | 3× `.exe` + `SHA256SUMS.txt` |

### Decision (architecture)

Safest path: keep `main` frozen · build on `cursor/unified-ai-platform-b8a1` · bring PR #4 `mike-ai` as app core · keep PR #2 hub apps embedded · OneDrive primary sync · copy-only recovery · no production merge until tests + Michael approval.

### Ask for Michael (when ready)

1. Drop a real `AI_Platform_Project_Records_<timestamp>.json` into recovery (or paste path to OneDrive copy).  
2. Confirm OneDrive OAuth may be configured (no paid spend beyond existing free tiers without say-so).  
3. Approve proceeding to Stage 1 (import PR #4 onto unified branch only).

---

## Entry — 2026-11-16 ~10:22 AM America/Chicago

**Agent:** same run · inventory follow-up from [Inventory PR4 AI platform](bc-2c288f49-66a1-5abd-92ec-2197edc93be5) + [Inventory main and originals](bc-8386983e-d104-5fbb-9287-76b3bb7b9baf)

### Refinements added to the record

| Finding | Implication for unified build |
| --- | --- |
| Original `AI_Platform_Project_Records_*.json` **absent from all git objects** | Recovery remains external (Drive staging / OneDrive) — confirmed, not just missing on `main` |
| PR #4 has `/api/chat` but **no in-app chat UI** | Unified UI must restore Mike AI conversations surface |
| iCloud sync is **metadata-only** (no binary upload) | Supports flipping **OneDrive → primary** for real file bytes; keep iCloud as backup metadata |
| WebAuthn challenges + rate limits are **in-process Maps** | Need durable store before multi-instance publish |
| Auto Truck Diagnostics = **board name only** (no app tree) | Closest artifact is Ravin Car/Truck installer; Auto Truck remains priority to build, not something to “merge from disk” |
| PR #1 Ravin layout ≠ `main` (`ravin-lookup/`) | Prefer `main` Ravin paths; leave PR #1 branch intact as archive |
| PR #4 RESULT still mentions `CHATGPT_MEMORY_TOKEN` | Code is session-cookie only — treat RESULT token note as stale |
| `main` tree == restore branch tree | No extra original files hiding on `cursor/vercel-ai-platform-restore-2661` |

### Progress

- [x] Folded inventory into Status Board (this entry)  
- [x] Updated reconciliation gaps section  
- [ ] Stage 1 still waiting on Michael go-ahead

---

## Entry — 2026-11-18 ~2:45 AM America/Chicago

**Agent:** Cloud agent completing platform request  
**Branch:** `cursor/complete-ai-platform-e3f0`  
**Action:** Make AI platform complete with all projects available (no production reconnect).

### Progress

- [x] Imported PR #4 secure platform onto branch from `main` (+ Next 16 lint fix)
- [x] Seeded **13** projects (11 board + Forma + Vehicle Genius); Supabase catalog updated
- [x] Governance: Ravin **paused**; Auto Truck marked priority; Mike Paine CD archived
- [x] OneDrive primary + Drive/iCloud replicas (status + sync order + copy)
- [x] Dashboard tabs: Projects, Apps, Files, Chat, Sync, Memory, ChatGPT memory
- [x] Hub apps `/apps/*` and downloads verified locally (200)
- [x] Local smoke: `/api/projects` → count 13, catalog.complete true, ravinPaused true
- [ ] Deep history JSON still external (recovery drop when Michael provides verified export)
- [ ] Secrets / model keys / cloud OAuth for published app (user secure form)
- [ ] iPhone Face ID / PWA verification
- [ ] Michael approval before production `mike-ai.vercel.app` reconnect

### Evidence

- Branch `cursor/complete-ai-platform-e3f0`
- Supabase `ai-project-platform` now has 13 project rows
- `mike-ai/src/lib/board-projects.ts` catalog

---

## Entry — 2026-11-18 ~5:15 PM America/Chicago

**Agent:** Cursor Cloud `bc-01a1f092-96b9-7054-b08f-d34e73853af7`  
**Action:** Answer Claude’s team questions (Cursor section + Sync items Cursor can verify). No production merge/deploy.

### Progress

- [x] Posted answers: `docs/status-board/CURSOR-ANSWERS-CLAUDE-QUESTIONS-2026-11-18.md`
- [x] Canvas: Cursor answers — Claude questions Nov 18
- [x] Confirmed PR #13 OPEN/unmerged; Home Screen ATDD = PWA (no Web Bluetooth); zero real-iPhone BLE tests
- [x] Recorded: nothing FIXD-compatible without real-device evidence
- [ ] ChatGPT: mirror this entry + answers file to Google Doc Status Board
- [ ] Michael: nRF Connect scan screenshots (Claude); TestFlight secrets when ready

### Evidence

| Item | Result |
| --- | --- |
| PR #13 | OPEN · `cursor/atdd-native-iphone-e3f0` · 119 files · sim CI cancelled |
| Current scanner integration | PR #16 (diverged ahead of #13) |
| TestFlight CI | PR #17 (secrets pending) |
| Open PR count | 15 |
| Project catalog target | 13 (11 board + Forma + Vehicle Genius) |

---

## Entry — 2026-11-18 ~5:28 PM America/Chicago

**Agent:** Cursor Cloud (ATDD development-order reconcile)  
**Branch:** `cursor/atdd-reconcile-pr16-pr17-nov18` (docs only; stacked from PR #17 head)  
**Action:** Reconcile PR #16 / #17 against preserved ATDD 1.2.0 baseline — bundle ID, parser revision, paths, commits, CI. No merge / signing / deploy / GATT.

### Progress

- [x] Confirmed iOS bundle ID in code: **`com.netgene.atdd.ble`**
- [x] Confirmed `com.michaelpaine.autotruckdiagnosticsfordummies` **absent** from Netgene git
- [x] Confirmed PR #16 parser = **v3** (`3.1.0-cloud-continuation`); **no v4/v7** in tree
- [x] Reconfirmed ATDD 1.2.0 originals **NOT FOUND**; `main` still has no `atdd/`
- [x] Ran synthetic `obd-protocol-v3` tests — **passed** (no hardware)
- [x] Posted report: `docs/status-board/ATDD-PR16-PR17-RECONCILIATION-2026-11-18.md`
- [ ] Michael: nRF Connect **scan only** screenshots (FIXD app closed)
- [ ] Michael: explicit approval before any GATT connect / TestFlight secrets / merge

### Evidence

| Item | Result |
| --- | --- |
| PR #16 head | `8af95e1f921c317daad661fa193029c2aa3fa574` |
| PR #17 head | `0efa0e1307ae7b018886847355dfda4a4a9cb84e` |
| Parser SHA-256 | `9f4ab2fa79a7825bd17c254d7767393e997ee916117fe5dc7b49680473c223e4` |
| CI (both PRs) | Ubuntu tree + Android APK + Workers **pass**; macOS simulator **pending** |
| Mode 04 | Not implemented (Mode 03 read only) |

---

## Entry — 2026-11-18 ~5:32 PM America/Chicago

**Agent:** Cursor Cloud (urgent iPhone delivery assessment)  
**Branch:** `cursor/atdd-reconcile-pr16-pr17-nov18`  
**Action:** Identify installed Home Screen app; web-update vs native; authorized TestFlight path. **No deploy / merge / spend.**

### Progress

- [x] Proved live production = `main`; `/atdd/` **404** — PR #16 PWA not what Michael’s phone is running
- [x] Ruled out “CI / PR = delivery”
- [x] Decision: **live FIXD on iPhone = separate native `com.netgene.atdd.ble`**, not a web update of the existing icon
- [x] Posted `docs/status-board/ATDD-IPHONE-DELIVERY-STATUS-2026-11-18.md`
- [ ] Michael approval for TestFlight secrets + workflow run
- [ ] Michael sees Connect Scanner on iPhone (**success gate**)
- [ ] Real FIXD hardware evidence

### Evidence

| Item | Result |
| --- | --- |
| Delivery claim | **NOT DELIVERED** |
| Live hub SHA | matches `origin/main:index.html` |
| Existing app | Unchanged; no Bluetooth scanner button (Michael) |
| Authorized path | TestFlight → ATDD Connect `com.netgene.atdd.ble` beside old app |

## Entry — 2026-11-20 ~8:00 AM America/Chicago

**Agent:** Cursor Cloud `bc-01a1f93c-c1b0-711e-9205-ce71f64bd374`  
**Branch:** `cursor/atdd-fixd-scanner-integration-check-d374`  
**Action:** Import live ATDD 1.2.0 from Michael’s Workers link; add top-bar **Bluetooth** button. No production merge.

### Source

`https://cursor-kathy-health-app-cfb3-noisy-pond-2dc8.michaelepaine.workers.dev/index.html`  
Mirrored to `atdd/classic/` (+ `SOURCE.txt`).

### Progress

- [x] Imported ATDD v1.2.0 (Diagnose / Listen / Look / Code + offline DTC DB)
- [x] Added top-bar **Bluetooth** → Connect FIXD panel (live Web Bluetooth; Demo separate / labeled SIMULATED; no silent Demo fallback)
- [x] Read codes writes Mode 03 DTCs into the scanner field for Diagnose
- [x] Hub `/atdd/` serves classic; Connect Scanner moved to `/atdd/connect/`
- [x] Mike AI `/apps/atdd` = classic + Bluetooth; prior scanner shell at `/apps/atdd-connect`
- [x] `npm --prefix atdd test` + classic bluetooth-parse tests
- [ ] Live FIXD hardware acceptance (still UNVERIFIED)
- [ ] iPhone Web Bluetooth (still blocked — native/`com.netgene.atdd.ble` path)
- [ ] Redeploy Michael’s Workers hostname with this build (needs explicit publish)

### Evidence

| Item | Result |
| --- | --- |
| Bluetooth top-bar control | `btnBluetoothTop` in `atdd/classic/index.html` |
| Bridge | `atdd/classic/bluetooth.js` (FIXD claim `UNVERIFIED`) |
| Site prepare | `site/atdd/` classic; `site/atdd/connect/` scanner |
| Workers URL used as source | Yes (import only; hostname not auto-updated) |

## Entry — 2026-11-20 ~10:16 AM America/Chicago

**Agent:** Cursor Cloud `bc-01a1f93c-c1b0-711e-9205-ce71f64bd374`  
**Branch:** `cursor/atdd-fixd-scanner-integration-check-d374`  
**Action:** iPhone-only live FIXD path — bring TestFlight CI onto this branch. **No secret values in chat.**

### Facts

- Home Screen ATDD icon = classic web PWA → **no Web Bluetooth on iPhone**
- Live FIXD on iPhone = **TestFlight** app `com.netgene.atdd.ble` only
- Agent **cannot** create Apple Distribution cert / ASC API key / set GitHub secret values (API 403)
- Workflow ready: `.github/workflows/atdd-ios-testflight.yml` (manual Run workflow)

### Michael unblock (required)

Add **all seven** secrets at  
https://github.com/mp720c-star/Netgene/settings/secrets/actions  

Names: `ASC_ISSUER_ID` · `ASC_KEY_ID` · `ASC_PRIVATE_KEY` · `IOS_TEAM_ID` · `IOS_DISTRIBUTION_P12_BASE64` · `IOS_DISTRIBUTION_P12_PASSWORD` · `IOS_PROVISION_PROFILE_BASE64`  

Guide: `docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md`  
Then say **secrets added** — agent runs TestFlight upload workflow.

## Entry — 2026-11-23 ~10:50 AM America/Chicago

**Agent:** Cursor Cloud, ATDD TestFlight DTC read  
**Branch:** `cursor/atdd-testflight-dtc-read-40b5`  
**PR:** [#33](https://github.com/mp720c-star/Netgene/pull/33)  
**Action:** Append the scanner-read work that landed after the 2026-11-20 entry. The live Google Doc was checked again and still returns HTTP 401. No Drive credential is configured in this environment, so this repo mirror is the board write that landed.

### Progress

- [x] The seven TestFlight signing secrets are present. Builds uploaded. Secret values are not recorded here.
- [x] Build 19 — iPhone BLE notification callbacks use the same UUID key the reply handler looks up, so a connected scanner can return Mode 03. [Run 45182859837](https://github.com/mp720c-star/Netgene/actions/runs/45182859837) succeeded. PR #33 records Apple processing **VALID** at 7:24 AM America/Chicago.
- [x] Build 20 — a multiline ELM reply stays open until the declared byte count arrives, instead of stopping at the first `>`. [Run 45185002279](https://github.com/mp720c-star/Netgene/actions/runs/45185002279) succeeded. PR #33 records Apple **VALID** at 7:39 AM America/Chicago.
- [x] Build 21 — a `SEARCHING...` reply that already includes the prompt is closed, so the scan does not freeze. [Run 45188267042](https://github.com/mp720c-star/Netgene/actions/runs/45188267042) succeeded. PR #33 records Apple **VALID** at 7:57 AM America/Chicago.
- [x] Build 22 — a short Mode 03 row list decodes the code pairs that arrived. Connect OBD-II Scanner sits above the scanner code field. [Run 45217128366](https://github.com/mp720c-star/Netgene/actions/runs/45217128366) succeeded. Apple processing state re-read from that job log: **VALID**. Marketing version **1.2.0**, build **22**, uploaded 10:40 AM America/Chicago.
- [x] Mode 04 clear-codes stays blocked. The vehicle read is Mode 03 only.
- [x] One-shot `push` trigger removed in this commit. The board update does not upload another build.
- [ ] Live Google Doc append. HTTP 401. Drive OAuth names are unset on this VM.
- [ ] FIXD compatibility is still **UNVERIFIED** until a real-device capture is on the record.

### Evidence

| Item | Result |
| --- | --- |
| Build 18 | [Run 45180210655](https://github.com/mp720c-star/Netgene/actions/runs/45180210655) conclusion failure. No upload. |
| Build 22 Apple state | `APPLE_PROCESSING_STATE=VALID`, `APPLE_BUILD_NUMBER=22`, `MARKETING_VERSION=1.2.0` |
| Google Doc | `1KkCQdfBMGUe4QPG_zFT_GpN66DjFJjdTpPpeZiAIQf4` — edit, export, and published URLs return 401 |
| Tests recorded on PR #33 | `npm test` in `atdd/` passed before these uploads, including the BLE callback, multiline, SEARCHING, and short-row cases |

## Entry — 2026-11-23 ~11:00 AM America/Chicago

**Agent:** Cursor Cloud  
**Branch:** `cursor/atdd-testflight-dtc-read-40b5`  
**PR:** [#33](https://github.com/mp720c-star/Netgene/pull/33)  
**Action:** Record Michael’s Command Room authorization. Checked the known room hosts again. No account, token, or signed-in session exists here.

### Team directive

Cursor is authorized for full AI Command Room access: messaging, project coordination, shared records, and testing.

That authorization covers the Command Room. It does not cover Michael’s entire computer, personal accounts, or passwords.

Full text: `docs/status-board/TEAM-DIRECTIVE-COMMAND-ROOM-2026-11-23.md`

### Not yet completed

- [ ] Account provisioning
- [ ] Token issuance (none created or shown)
- [ ] Authentication
- [ ] Successful connection

### Evidence

| Surface | Result |
| --- | --- |
| Google Doc Status Board | HTTP 401 |
| Project memory host | HTTP 401 |
| Platform project route | Login page |
| Drive OAuth in this environment | Unset |

## Entry — 2026-11-23 ~12:55 PM America/Chicago

**Agent:** Cursor Cloud, ATDD TestFlight DTC read  
**Branch:** `cursor/atdd-testflight-dtc-read-40b5`  
**PR:** [#33](https://github.com/mp720c-star/Netgene/pull/33)  
**Action:** Build 22 stopped after one reply it could not parse. Mode 03 now repeats until the reply parses or the scanner is disconnected. Mode 04 stays blocked.

### Progress

- [x] Parse failure and an unfinished Mode 03 send both request Mode 03 again
- [x] A parsed reply, including no stored codes, stops the retries
- [x] Disconnect stops the retries
- [x] `npm test` in `atdd/` passed, including `read-until-parsed.test.mjs`
- [x] [Run 23](https://github.com/mp720c-star/Netgene/actions/runs/45242271494) uploaded. Apple processing state **VALID**. Marketing version **1.2.0**, build **23**, uploaded 12:52 PM America/Chicago
- [ ] FIXD compatibility remains **UNVERIFIED** until a real-device capture is on the record

### Evidence

| Item | Result |
| --- | --- |
| Build 23 Apple state | `APPLE_PROCESSING_STATE=VALID`, `APPLE_BUILD_NUMBER=23`, `MARKETING_VERSION=1.2.0` |
| One-shot push trigger | Removed after the Mac runner started, so this board entry did not upload another build |

## Entry — 2026-11-23 ~3:12 PM America/Chicago

**Agent:** Cursor  
**Branch:** `cursor/atdd-testflight-dtc-read-40b5`  
**PR:** [#33](https://github.com/mp720c-star/Netgene/pull/33)  
**Action:** Record Michael Paine’s official team directive and run the access checks Cursor can actually perform. **Directive status: NOT COMPLETE.**

Full text: `docs/status-board/OFFICIAL-TEAM-DIRECTIVE-2026-11-23.md`

### Accepted

- ChatGPT: administrator and coordinator.
- Cursor: development, repairs, integration, and testing.
- Sync & Merge: platform operations, data integrity, and independent audit to Michael.
- Gemini: temporary, task-scoped Google work only.
- Grok bot, Grok app, and Claude: removed. Their outstanding team assignments are cancelled. Prior board history is kept.

### Verified this turn

- GitHub access to this repo is only `mp720c-star`. No removed-agent collaborator was present to remove.
- No Drive, OpenAI, Anthropic, xAI, Gemini, Grok, Claude, or owner-token credential is set in this environment. Nothing was printed. Sync & Merge access was not removed.
- The Google Doc, project-memory host, and platform chat API return 401. The platform route shows the login page. `mike-ai.vercel.app` returns 503 and stays paused.
- Ravin Lookup work was not started. No paid Work credits were used.

### Still open

- OneDrive master storage and Drive/iCloud backup sync were not reachable, so they were not verified.
- Invitation, deploy-key, and Actions-secret lists returned HTTP 403.
- No Google, OneDrive, or iCloud permission for a removed agent was changed.
- `mike-ai/` still references Vercel and OpenAI. It was not migrated.
- Command Room account, token, and connection are still missing.
- Sync & Merge’s independent audit is not Cursor’s report and is not done.

## Entry — 2026-11-23 ~10:36 PM America/Chicago

**Agent:** Cursor cloud agent  
**Branch:** `cursor/atdd-live-readings-3db1` (continues `05ddaad`, which is after TestFlight build 23)  
**Action:** Administrator directive. ATDD Connect is the only code repair in this turn. Success on a physical iPhone is not claimed.

### Completed

- [x] Inspected TestFlight build 17 (`main` `79d4ca855`, workflow run 17, success) and builds 18–23 on `cursor/atdd-testflight-dtc-read-40b5`. Build 18 failed. Builds 19–23 succeeded. Build 23 is Apple build 23, marketing version 1.2.0, processing state VALID.
- [x] Build 23 still requested only Mode 03. Live Mode 01 data was never sent, so the readout stayed empty even after a stored-code read.
- [x] Added a Mode 01 live readout. The app asks `0100`, then only PIDs that map marks supported, then `0140` when PID `20` is supported. SAE J1979 formulas decode load, coolant, rpm, speed, intake temperature, throttle, and control-module voltage. A short frame, `NO DATA`, or a rejected PID produces no number.
- [x] Documented compatible BLE ELM UART profiles (FFF0, FFE0, 18F0, Nordic UART) and unsupported paths: unverified FIXD proprietary protocol, classic Bluetooth serial, Wi-Fi ELM, and iPhone Safari / Home Screen web Bluetooth.
- [x] Bundle id in the Xcode project is `com.netgene.atdd.ble` for Debug and Release. Packaged DTC database SHA-256 remains `ed75aeb0a429ae920969bf65d324b2b006a252a4c15da42a1f2c75778070a923` (4783 rows). CDI pinout database remains 69 profiles. Vehicle index remains 438 entries.
- [x] `npm test` in `atdd/` passed, including the new live-readings test and `verify-ios-content`.
- [x] Ravin Lookup Windows 1.0.0 installers on disk match `downloads/SHA256SUMS.txt`. `npm test` in `ravin-lookup/` passed. Those files were not modified.
- [x] Checksums for Sync & Merge: `docs/status-board/SYNC-SOURCE-CHECKSUMS-2026-11-23.json`.

### Not done — do not treat as success

- [ ] No signed IPA and no TestFlight upload. This machine has no Xcode, and the upload was not started. A real iPhone plus a scanner still has to confirm FIXD or ELM live data.
- [ ] FIXD compatibility remains `UNVERIFIED`. A device name is not a protocol proof.
- [ ] No Ravin Lookup iPhone edition, URL, or version is in this repo. The Windows source has no parts search, manuals, diagrams, pricing, specials, or recall data, so none of that was invented.
- [ ] Vercel authentication was declined. `mike-ai.vercel.app` was left paused. No paid hosting and no OpenAI call.
- [ ] Windows D:, OneDrive, Google Drive, iCloud, Apple Developer, and App Store Connect are not mounted here. OneDrive was not written. D: synchronization was not touched.
- [ ] Supabase `ai-project-platform` still has the existing 13 project rows. Files, memory, and sync rows were not replaced. Platform, Command Room, and cross-device auth were not repaired in this turn.

