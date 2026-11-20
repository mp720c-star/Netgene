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

