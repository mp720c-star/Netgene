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
