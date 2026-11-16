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
