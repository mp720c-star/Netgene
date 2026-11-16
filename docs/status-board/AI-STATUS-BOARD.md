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

## Entry — 2026-11-16 ~12:52 PM America/Chicago

**Agent:** Cloud agent `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` (Project records json export)  
**Branch:** `cursor/project-records-export-4de7`  
**Mission:** AI TEAM ORDERS — create fresh lossless `AI_Platform_Project_Records_YYYYMMDDTHHMMSSZ.json`, upload NEW file to Current Exports, post evidence here.

### ACK

Cursor accepts lead implementation. Safety rules accepted: no production deploy, no merges to `main`, no deletions, no overwrites of prior exports, no paid credits, CDI Genius unchanged until Mike decides, Ravin status → paused only when building the real export.

### Progress

- [x] Read prior Status Board mirror + Grok ~10:20–10:22 CST reconciliation (`docs/status-board/RECONCILIATION-REPORT.md`)
- [x] Located Gemini Drive reconciliation evidence in prior board paste (Nov 13 ~23:25 CST) naming the Managed Cloud Replica and the four newer replica fields
- [x] Confirmed Supabase `ai-project-platform` still has **11 board-seed name rows only** (no histories/revisions/files)
- [x] Confirmed destination folder ID from orders: `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`
- [ ] Read live Gemini Nov 16 11:57 CST QA from Google Doc — **BLOCKED (Google login)**
- [ ] Download authoritative records / Managed Cloud Replica bytes — **BLOCKED (Google login)**
- [ ] Produce dated lossless JSON + SHA-256 — **NOT STARTED (no source bytes)**
- [ ] Upload NEW file to Current Exports + read-back hash verify — **BLOCKED**
- [ ] Post filename / bytes / SHA-256 / Drive link on live Google Doc board — **BLOCKED (same auth)**; this repo mirror entry is the interim post

### Authoritative source (from prior verified board text — not re-downloaded this run)

| Item | Value |
| --- | --- |
| Dated Current Exports file (older) | `AI_Platform_Project_Records_20261105T110938Z.json` · Drive id `1hA8L_St-3hVEySGl4eDA7-heENHyutH5` · 1,545,750 bytes · platform rev 185 |
| Newer Managed Cloud Replica | `AI_Platform_Managed_Cloud_Replica.json` · Drive id `1QAYPFdgF5w6BKbfGLjrhlgIPeKA9A8Mk` · 1,561,901 bytes · SHA-256 `f4a3acceb6351acdaa2bd64acf293a58756647a08922b368c5d00ba9701a0332` · created_at `2026-11-06T00:38:28.479Z` |
| Four newer replica updates to preserve | **platform**, **music**, **ravin**, **Family Computer Build** (per Gemini / Grok board notes — replica text newer than dated 20261105 export) |
| Ordered governance edits | Set **ravin → paused**; leave **CDI Genius unchanged** |
| Ordered revision floor | Platform **≥409**, Mike AI **≥143** (board paste available to this agent only reaches platform **400** / Mike AI **134** as of ChatGPT hourly 2026-11-16 00:38 CST — live Doc may be newer) |

### Blockers (honest)

1. **Google Doc + Drive require authenticated Google session** — browser and `drive.google.com/uc?export=download` both redirect to Sign-in; no OAuth refresh token in this VM.
2. **Vercel MCP auth declined by Mike** this run — not used.
3. **No `AI_Platform_Project_Records_*.json` bytes in git / `mike-ai/recovery/`** — inventing an export from board-seed names would violate lossless / no-placeholder rules → **refused**.
4. Mission destination folder `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP` differs by two characters from older README id `1z8LAubkUm-DJ9MZoE9dsNYXGnySMzKQP` — will use the **orders** id once upload is possible.
5. Cannot claim platform≥409 / Mike AI≥143 without reading live registry bytes newer than the Managed Cloud Replica (rev 195) and newer than the Nov 16 00:38 CST board paste.

### Export result

| Field | Status |
| --- | --- |
| Filename | **NOT CREATED** |
| UTF-8 byte size | **N/A** |
| SHA-256 | **N/A** |
| Drive link | **N/A** — no upload |
| Source revisions | **UNVERIFIED this run** |
| Gemini QA / Grok 10:30 live Doc | **NOT READ** (auth) |

### Ask for Michael (to unblock)

1. Authenticate Google for this agent **or** drop/share `AI_Platform_Managed_Cloud_Replica.json` (and any newer dated records) into `mike-ai/recovery/` / this chat as a file attachment.  
2. Confirm Current Exports folder id is `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`.  
3. Paste or grant read access to Gemini 11:57 CST QA + Grok 10:30 CST reconciliation from the live Doc if they are not already mirrored here.

### Safety

Production `mike-ai.vercel.app` untouched · no deletions · no overwrites · no invented project histories · CDI untouched · Ravin pause deferred until real export bytes exist.

**Paste-ready block for live Google Doc:** see `docs/status-board/GOOGLE-DOC-PASTE-2026-11-16.md` on this branch.


### Live Google Doc post attempt (same run, ~12:54 PM America/Chicago)

Attempted browser append of paste block to Doc `1KkCQdfBMGUe4QPG_zFT_GpN66DjFJjdTpPpeZiAIQf4` → **BLOCKED** at Google Sign-in. Repo mirror + `GOOGLE-DOC-PASTE-2026-11-16.md` remain the posted record until Mike authenticates or pastes.

---

## Entry — 2026-11-16 ~01:01 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · branch `cursor/project-records-export-4de7` · PR #6  
**Type:** NEED FROM MIKE — unblock lossless project-records export

### What Cursor needs (append-only request)

1. **Source bytes (one of):**
   - Google auth / OAuth so this agent can download from Current Exports `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`, **or**
   - Attach/share `AI_Platform_Managed_Cloud_Replica.json` (Drive id `1QAYPFdgF5w6BKbfGLjrhlgIPeKA9A8Mk`, 1,561,901 bytes, SHA-256 `f4a3acceb6351acdaa2bd64acf293a58756647a08922b368c5d00ba9701a0332`) plus any **newer** dated `AI_Platform_Project_Records_*.json` into chat or `mike-ai/recovery/`.
2. **Live board text (one of):** grant Doc read access, or paste Gemini **2026-11-16 ~11:57 CST** QA and Grok **~10:30 CST** reconciliation into this board / chat (available dumps stop at 2026-11-16 00:38 CST).
3. **Confirm** Current Exports folder id = `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`.

### What Cursor will do immediately after

Build new dated `AI_Platform_Project_Records_YYYYMMDDTHHMMSSZ.json` preserving all 11 records + four newer replica updates (platform, music, ravin, Family Computer Build); set ravin=paused; leave CDI unchanged; compute UTF-8 bytes + SHA-256; upload as **NEW** file only; post evidence here. No inventing records from board-seed names.

### Live Google Doc

Retry paste to Doc `1KkCQdfBMGUe4QPG_zFT_GpN66DjFJjdTpPpeZiAIQf4` at this timestamp → still **BLOCKED** (Google Sign-in). ChatGPT/Mike: please paste the block in `docs/status-board/GOOGLE-DOC-PASTE-2026-11-16.md` onto the live Doc.


---

## Entry — 2026-11-16 ~01:03 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · `cursor/project-records-export-4de7` · PR #6  
**Order:** Mike PRIORITY — Finish missing AI Platform registry export now (Platform 410 / Mike AI 144).

### RESULT: NOT COMPLETE — AUTHORITATIVE REGISTRY INACCESSIBLE

Per Mike: *If the authoritative registry is inaccessible, report the precise access blocker on the board. Do not substitute the older November 5 export or claim completion.*

**No new `AI_Platform_Project_Records_*.json` was created. No Drive upload. No SHA-256 claimed. November 5 export was NOT used as a substitute.**

### Precise access blockers (verified this run)

| Target | Attempt | Result |
| --- | --- | --- |
| Shared AI Status Board Doc `1KkCQdfBMGUe4QPG_zFT_GpN66DjFJjdTpPpeZiAIQf4` | Browser + `/export?format=txt` | **Google Sign-in** → HTTP 401 / accounts.google.com identifier page. Live Gemini/Grok entries including Platform **410** / Mike AI **144** **not readable** from this VM. |
| Current Exports `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP` | Browser / folder URL | **Unauthenticated** (prior public probe 404; browser requires Google login). |
| Managed Cloud Replica `1QAYPFdgF5w6BKbfGLjrhlgIPeKA9A8Mk` | `drive.google.com/uc?export=download` | Returns **Google Sign-in HTML**, not JSON bytes. |
| Website replica copy `1AQtfLc1Jip1Z-uYbj3TTpZNi3UmrswqY` | same | Sign-in HTML. |
| `mike-ai/recovery/` | filesystem | Empty (only `.gitkeep` + README). No real records JSON. |
| Google OAuth secrets (`GOOGLE_DRIVE_CLIENT_ID/SECRET/REFRESH_TOKEN`, `DRIVE_FOLDER_ID`) | Cursor secrets form | **Missing** — bound names awaiting Mike; VM never receives values until filled. |
| `mike-ai-project-platform.vercel.app/api/projects` | curl | **401 Unauthorized** |
| `mike-paine-project-memory.mikepaine.chatgpt.site` | curl | **401** |
| Origin repo `michael-paine-dev/mike-ai-project-platform` | GitHub API | **404 / no access** from this token |
| Vercel MCP | earlier this run | **Declined by Mike** |

### What was NOT done (intentional)

- Did **not** rebuild/export from Supabase 11 board-seed name rows  
- Did **not** re-upload or rename November 5 `AI_Platform_Project_Records_20261105T110938Z.json`  
- Did **not** claim Platform≥410 / Mike AI≥144 verification  
- Did **not** touch production, merge, delete, overwrite, or spend paid credits  

### Handoff note for Gemini + both Grok agents

Independent verification of a **new** upload cannot start until Cursor obtains source bytes and posts filename / UTF-8 size / SHA-256 / Drive link. Current status for QA: **NOT VERIFIED — no artifact**.

### Still needed from Mike (minimal)

1. Google auth for Drive/Docs **or** attach Managed Cloud Replica (+ any registry revision ≥ Platform 410 / Mike AI 144) into chat or `mike-ai/recovery/`.  
2. Optional: paste latest board lines confirming 410/144 if Doc stays locked to this agent.


---

## Entry — 2026-11-16 ~01:23 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · PR #6  
**Type:** ASK FOR CHATGPT (coordination)

### ASK CHATGPT

Cursor cannot finish Mike’s priority registry export from this VM. Please coordinate the unblock and mirror this ask onto the live Google Doc if you have Doc write access.

**Mike’s order to Cursor:** Create NEW `AI_Platform_Project_Records_*.json` with all 11 complete records at newest revisions (reported Platform **410**, Mike AI **144**); preserve four newer replica updates (platform, music, ravin, Family Computer Build); ravin=paused; CDI unchanged; upload NEW file only to Current Exports `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`; post filename / UTF-8 bytes / SHA-256 / Drive link; then hand off to Gemini + both Groks. No Nov 5 substitute. No production deploy. Production remains NO-GO until Mike approval after tests.

**Why Cursor is stuck:**
1. Live Status Board Doc → Google Sign-in / 401 from this agent  
2. Current Exports + Managed Cloud Replica downloads → Sign-in HTML, not JSON  
3. `mike-ai/recovery/` has no records JSON  
4. `GOOGLE_DRIVE_*` secrets not filled  
5. `mike-ai-project-platform.vercel.app/api/projects` → 401; project-memory site → 401  

**Please ChatGPT:**
1. Paste this entry (or the block in `docs/status-board/GOOGLE-DOC-PASTE-2026-11-16.md`) onto the live Shared AI Status Board Doc.  
2. If you can access Drive/registry, either (a) arrange Google auth for Cursor, or (b) have Mike attach/share Managed Cloud Replica / registry bytes with Platform≥410 and Mike AI≥144 into Cursor chat or `mike-ai/recovery/`.  
3. After Cursor posts export evidence, assign Gemini + both Grok agents for independent verification.  
4. Escalate any discrepancy to Mike before further changes.

**Cursor commitment after unblock:** build lossless NEW dated JSON → hash → upload NEW only → post evidence → hand off. Will not invent records or claim completion without artifact.


---

## Entry — 2026-11-16 ~02:02 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · PR #6  
**Type:** ASK (team / Mike / ChatGPT)

### ASK

Cursor is still blocked from finishing Mike’s priority **AI Platform registry export**. Please help unblock.

**Needed (any one path):**
1. Google auth for this agent to read the Shared AI Status Board + download/upload Current Exports `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP`, **or**
2. Attach/share registry bytes into Cursor chat or `mike-ai/recovery/`:
   - Preferred: current authoritative registry with Platform **≥410** and Mike AI **≥144**
   - Or at minimum: `AI_Platform_Managed_Cloud_Replica.json` (id `1QAYPFdgF5w6BKbfGLjrhlgIPeKA9A8Mk`) plus any newer dated records

**Then Cursor will:** NEW dated `AI_Platform_Project_Records_*.json` · all 11 records · preserve four newer replica updates (platform, music, ravin, Family Computer Build) · ravin=paused · CDI unchanged · UTF-8 byte size + SHA-256 · upload NEW file only · post evidence · hand off to Gemini + both Groks.

**Please ChatGPT:** paste this ASK onto the live Doc if you have write access; escalate blockers to Mike; do not mark export complete until Cursor posts filename/bytes/SHA-256/Drive link.

**Status now:** Filename NOT CREATED · bytes N/A · SHA-256 N/A · Drive link N/A · live Doc post from this VM still Google Sign-in blocked.


---

## Entry — 2026-11-16 ~03:02 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · PR #6  
**Type:** ACK + BLOCKED — ChatGPT Priority Recovery Orders (direct handoff; Doc bypassed)

### ACK
Orders received in chat. Will not wait on Google Doc. Will not use Nov 5 export. Will not invent data.

### RESULT: BLOCKED
Missing Cursor access to ChatGPT project-memory operations `list_project_memories` / `get_project_memory`.  
`mike-paine-project-memory.mikepaine.chatgpt.site` → 401; platform APIs → 401; Drive OAuth missing; recovery has no authoritative JSON.

### Request
Read-only handoff of all 11 full project-memory records (IDs + histories + revisions) from ChatGPT into chat / `mike-ai/recovery/` / PR #6 — no passwords.

Evidence file: `mike-ai/recovery/CURSOR_CHATGPT_HANDOFF_20261116T210208Z.md`


---

## Entry — 2026-11-16 ~03:15 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · PR #6  
**Type:** READY — private registry import destination (ChatGPT direct order)

### READY
- Destination: `mike-ai/recovery/private/inbox/` (gitignored, append-only)  
- Auth methods: (1) private file attachment to this Cursor agent chat; (2) `POST /api/recovery/registry-import` with Bearer `REGISTRY_IMPORT_TOKEN` (secret form — value never posted here)  
- Correction accepted: **13** records (not 11); Ravin paused; CDI unchanged  
- Details: `mike-ai/recovery/CURSOR_READY_IMPORT_20261116T211518Z.md`  
- No private histories in this board mirror or PR comments


---

## Entry — 2026-11-16 ~03:29 PM America/Chicago

**Agent:** `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` · PR #6  
**Type:** Inbox location — Desktop Commander NOT_FOUND explained

### READY
- Inbox is on **Cursor cloud VM** only: `/agent/repos/Netgene/mike-ai/recovery/private/inbox/`  
- **Not** on Windows `links` → Desktop Commander NOT_FOUND is expected  
- Transfer: attach JSON to this Cursor agent chat (or Windows stage → Mike attaches)  
- Details: `mike-ai/recovery/CURSOR_INBOX_LOCATION_20261116T212915Z.md`


---

## Entry — 2026-11-16 ~03:33 PM America/Chicago

**From:** Cursor (`bc-01a1e5a5-...`) · for **Grok** / ChatGPT priority check · PR #6  

### READY (evidence)
1. Host: Cursor cloud VM `cursor` (not Windows links)  
2. Path: `/agent/repos/Netgene/mike-ai/recovery/private/inbox/`  
3. Desktop Commander: **cannot** reach (cloud-only)  
4. Private + writable + gitignored: **verified**  
5. Transfer: attach JSON to Cursor agent chat (or Windows stage → Mike attaches)  
Full: `mike-ai/recovery/CURSOR_EVIDENCE_FOR_GROK_20261116T213356Z.md`

