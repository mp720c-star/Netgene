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

## Entry — 2026-11-17 ~06:12 AM America/Chicago

**Agent:** Cloud agent `bc-01a1e966-14bd-71c7-8df2-3829a9968bcc`  
**Branch:** `cursor/atdd-cdi-integration-8bcc` (from `main` @ `56f5c43`)  
**Order:** Combine CDI Genius + Auto/Truck Diagnostics for Dummies into one application (HIGH)

### Progress

- [x] Located CDI Genius source on disk (`cdi-genius/`, 30 files)
- [x] Created separate integration branch
- [x] Byte-identical CDI import into `atdd/source-import/` + recoverable backup
- [x] Unified web/PWA shell with working CDI DDT for recovered profiles
- [x] Checksum manifests + automated tests (`atdd/npm test`)
- [x] Repo Status Board mirror updated (this entry)
- [ ] Recover ATDD 1.2.0 originals (OBD2 DB, Diagnose/Listen/Look/Code, signed installer, iPhone app)
- [ ] Recover remaining **68** CDI profiles (3/71 present)
- [ ] Gemini + Grok independent testing (blocked on missing originals + live Doc write)
- [ ] Retire CDI Genius as separate active app (deferred — originals incomplete; Michael authorization required)

### Database counts (exact)

| Item | Count |
| --- | --- |
| CDI profiles found | **3** |
| CDI profiles claimed | **71** |
| CDI profiles missing | **68** |
| ATDD OBD2 codes found | **0** |
| Supabase `projects` seed rows | **11** |
| Supabase `files` rows | **0** |

### Key checksum

`sample-models.json` / `atdd/web/data/cdi-models.json` SHA-256:  
`7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee` (2513 bytes) — import MATCH

### Blockers

1. OneDrive / Google Drive credentials absent — cannot pull ATDD 1.2.0 or full CDI DB from backups
2. Live Status Board Google Doc append **401** (repo mirror used instead)
3. No fabricated codes permitted — OBD2 mode intentionally gated
4. Gemini/Grok coordination waiting on recoverable originals + Doc access

### Next action

Michael (or coordinator) delivers ATDD 1.2.0 + full 71-profile CDI database via chat attachment or `mike-ai/recovery/private/inbox/`, and/or enables Drive/OneDrive read secrets. Cursor will then complete transfer verification, test builds, and only then request authorization to retire standalone CDI Genius.

### Evidence paths

- `atdd/docs/VERIFICATION-REPORT.md`
- `atdd/docs/VERIFICATION-REPORT.json`
- `atdd/docs/CDI-GENIUS-SOURCE-SHA256.txt`
- `atdd/web/` (iPhone/Windows browser test build)
- Browser smoke (2026-11-17): Yamaha full pass → `D-Final-Pass`; Verify tab shows 3/71 + OBD2 NOT FOUND
- Gemini/Grok handoff: `docs/status-board/GEMINI-GROK-HANDOFF.md`
