# Feature & File Reconciliation Report

**Branch:** `cursor/unified-ai-platform-b8a1` (unified development only — not production)  
**Date:** 2026-11-16 (America/Chicago)  
**Rule:** Preserve both originals. No merge to `main` / live deploys until Michael approves.

---

## 1. Platforms compared

| Label | What it is | Authoritative ref |
| --- | --- | --- |
| **A — Cursor hub rebuild** | Netgene static hub + Forma, Vehicle Genius, CDI Genius, Cloudflare Workers, Ravin installers | PR [#2](https://github.com/mp720c-star/Netgene/pull/2) (`cursor/forma-photo-editor-3ad1`) → largely on `main` via #3 |
| **B — Cursor AI platform rebuild** | Secure Next.js AI Project Platform (auth, files, sync, memory, PWA) | PR [#4](https://github.com/mp720c-star/Netgene/pull/4) (`cursor/ai-platform-real-secure-2661` @ `5aef541`) |
| **C — Michael’s original** | Mike AI V2 production + Shared AI Status Board + Drive/OneDrive backups + 11 project records | `https://mike-ai.vercel.app` (paused); board paste `AI_Platform_Grok_Export_2026-10-18_JSON`; Drive/OneDrive |
| **D — Unified (this branch)** | Safe merge of A+B+C features without touching production | `cursor/unified-ai-platform-b8a1` |

**Important:** Orders named “PR #2” for Cursor’s rebuild. In GitHub, **hub apps = PR #2** and **secure platform shell = PR #4**. Both are Cursor rebuild layers; both stay preserved.

---

## 2. Authoritative revision per component

| Component | Authoritative source | Keep as-is? | Notes |
| --- | --- | --- | --- |
| Hub + Cloudflare Workers | `main` / PR #2 | Yes | `index.html`, `wrangler.toml`, `scripts/*` |
| Forma | `forma/` on `main` | Yes | Browser photo editor |
| Vehicle Genius | `vehicle-genius/` on `main` | Yes | Offline symptom helper |
| CDI Genius | `cdi-genius/` on `main` | Yes | Expo DDT prototype |
| Ravin Lookup web + Windows `.exe` | `ravin-lookup/`, `downloads/` | Yes (paused product) | Installers + SHA-256 sums present; **governance: paused** |
| AI platform app code | PR #4 `mike-ai/` | Yes (bring onto D) | WebAuthn, files, sync, memory, PWA |
| 11 project **names** | Status Board export / PR #4 `BOARD_PROJECTS` | Yes | Present in Supabase `projects` (11 rows, `board-seed`) |
| 11 project **histories / files** | Drive staging + OneDrive backups + `AI_Platform_Project_Records_*.json` | **Not in git** | Recovery folder empty; production Drive records folder empty/404 |
| Mike AI conversations / memory | Original V2 + PR #4 `memory_entries` | Partial | DB memory empty (0 rows); model keys fail-closed |
| Auth / Face ID | PR #4 WebAuthn | Code yes / secrets no | 0 WebAuthn credentials in Supabase |
| Cloud sync | PR #4 clients | Code yes / config mismatch | PR #4 treats **iCloud primary**; Michael’s order: **OneDrive primary** |
| Production hostname | `mike-ai.vercel.app` | Untouched | Paused — do not reconnect until approval |
| Original V2 source tree | Commit `c1229a25895d…` | **Missing** | Not in Netgene / `mp720c-star` |

---

## 3. Feature matrix

| Requirement | A Hub (PR2/main) | B Platform (PR4) | C Original | Unified plan |
| --- | --- | --- | --- | --- |
| Preserve all projects/files/backups | Apps on disk | Schema + seed names | Drive/OneDrive | Copy-only imports; never write back to backups |
| Hub + Forma / VG / CDI / Workers | Complete | Apps mirrored under `mike-ai/public/apps/` | N/A | Keep hub; embed under platform dashboard |
| All 11 original projects | Not modeled | Seeded names | Board + records JSON | Seed + import real records when available |
| Unified iPhone-first dashboard | Static hub | Unlock + tabs (files/sync/memory) | Home Screen PWA | Extend PR4 UI; add Status Board + app links |
| Face ID / passkeys | No | WebAuthn + optional unlock code | Unrecovered | Keep PR4; register on device later |
| Mike AI chat + memory + health | Shell chat | Locked chat + memory APIs + `/api/health` | Production paused | Provider-agnostic keys; memory table; health board |
| Cloud sync OneDrive primary | No | iCloud primary; Drive/OneDrive replica | Backups exist | **Flip roles** on D: OneDrive primary; Drive + iCloud backup |
| SHA-256 integrity + versions | Installer sums only | File checksums on upload | Unknown in-repo | Keep checksums; add versioned file rows later |
| iPhone Home Screen / PWA | No | `manifest.webmanifest` + icons | Original experience | Keep; verify Add to Home Screen on device |
| Governance: Ravin paused; Auto Truck active | Ravin downloads live | Both seeded `active` | Board statuses | Correct statuses on D |
| Independence (not ChatGPT/Vercel/Cursor-only) | Static + Workers | OpenAI/Gateway optional; PGlite fallback | Multi-surface | Multi-provider + local PGlite + CF Workers |

---

## 4. File / storage inventory

### On `main` (safe baseline — preserved)

- `forma/`, `vehicle-genius/`, `cdi-genius/`, `ravin-lookup/`, `downloads/*.exe`, `mike-ai/` test shell  
- Cloudflare: `wrangler.toml` → Worker `proud-bread-5014` (and twin `rough-breeze-46d1` via proxy)

### On PR #4 (not yet on this branch until staged merge)

- Auth: `mike-ai/src/app/api/auth/**`, `lib/session.ts`, `lib/webauthn.ts`  
- Data: `lib/db.ts`, `lib/platform-store.ts`, `migrations/001_platform.sql`  
- Files/sync/memory/chat/health routes  
- PWA: `public/manifest.webmanifest`, `icon-180.png`, `apple-touch-icon.png`  
- Cloud: `lib/cloud/{onedrive,google-drive,icloud,sync,status}.ts`

### Supabase `ai-project-platform` (`hiynzonbazdorebekrsl`) — read-only check 2026-11-16

| Table | Rows | Notes |
| --- | --- | --- |
| `projects` | **11** | Board seed only (`tags: board-seed`) |
| `files` | 0 | No binary history yet |
| `memory_entries` | 0 | No chat memory yet |
| `webauthn_credentials` | 0 | Face ID not registered |
| `sync_state` | 0 | No successful sync recorded |

### External storage (do not delete / overwrite)

| Location | Role | Access from this agent |
| --- | --- | --- |
| Drive staging `1y_-7bD4F6iVT63CB0esv59gqamOIOYcY` | Original project folders | Needs authenticated export |
| Drive records `1z8LAubkUm-DJ9MZoE9dsNYXGnySMzKQP` | Expected records JSON | Empty/404 previously |
| Drive delivery `1xDxF2Ea2Lacv3_rBfUPowIGFw48Xk5pR` | Board uploads | Private |
| OneDrive platform backups | Primary backup target per orders | No Graph token here |
| Status Board Doc `1KkCQdfBMGUe4QPG_zFT_GpN66DjFJjdTpPpeZiAIQf4` | Cross-assistant handoff | External |
| `mike-paine-project-memory.mikepaine.chatgpt.site` | Named authoritative memory surface | External |
| `project-memory.vercel.app` | Reports **13** project records (≠ 11 board rows) | Investigate carefully; do not invent |

### Missing / blockers

1. Original Mike AI V2 source (`c1229a25895d…`) not in this repo.  
2. No `AI_Platform_Project_Records_*.json` in **any** git object (confirmed across all branches) — not only empty `recovery/`.  
3. Cloud OAuth / CloudKit secrets not configured in this environment.  
4. Model API keys absent → chat fail-closed (by design).  
5. Paid services/credits require Michael’s permission.  
6. iPhone Face ID + Home Screen verification cannot complete from this VM alone.

### PR #4 implementation gaps (inventory follow-up)

Confirmed by branch inventory (`5aef541`):

| Gap | Detail |
| --- | --- |
| Chat UI | `/api/chat` exists; main dashboard has no conversation UI |
| iCloud bytes | CloudKit upserts metadata only — not full file mirror |
| Sync direction | Drive/OneDrive are upload-only; no pull-from-cloud |
| Serverless auth | WebAuthn challenge + rate-limit Maps are process-local |
| Auto Truck | Board seed name only — no dedicated app/installer tree |
| Docs drift | RESULT handoff still cites `CHATGPT_MEMORY_TOKEN`; runtime is unlock-session only |
| PWA offline | Manifest + icons present; no service worker |

---

## 5. Safest unified build architecture

```
cursor/unified-ai-platform-b8a1   ← development only
├── Preserve main untouched
├── Stage 0  Snapshot pointers (this report + Status Board)
├── Stage 1  Import PR #4 mike-ai onto D without deleting hub apps
├── Stage 2  Governance fixes (Ravin=paused, Auto Truck=priority)
├── Stage 3  Cloud role flip (OneDrive primary; Drive+iCloud backup)
├── Stage 4  Status Board surface inside dashboard (append-only log)
├── Stage 5  Copy-only recovery import when Michael drops records JSON
├── Stage 6  Local/PWA verification (health, auth, memory, downloads)
└── Gate    Michael approval → then consider production (never auto)
```

### Architecture choices (safest)

1. **Base = `main`.** Production Workers + installers + apps stay intact.  
2. **App core = PR #4 `mike-ai`.** Superior auth, DB, files, sync, PWA.  
3. **Embedded apps = PR #2 hub.** Served under `/apps/` and root hub; no deletions.  
4. **Data plane = Supabase Postgres when `DATABASE_URL` set, else PGlite.** Independence from a single host.  
5. **AI plane = optional OpenAI / AI Gateway / future providers.** Fail-closed without keys; no exclusive ChatGPT dependency.  
6. **Sync plane = OneDrive primary (order), Google Drive + iCloud backups**, SHA-256 on every file, prior versions retained.  
7. **Recovery = copy-only.** Never write into Drive/OneDrive backup roots from the app.  
8. **Deploy = separate test publish only.** `mike-ai.vercel.app` stays paused until Michael approves.

### Explicit non-actions (until approval)

- Do **not** merge this branch to `main`.  
- Do **not** change live Cloudflare production Workers content beyond existing PR previews.  
- Do **not** delete PR #1 / #2 / #4 branches or backups.  
- Do **not** invent project histories or spend paid credits.

---

## 6. Next build steps on this branch (after report approval)

1. Merge/cherry-pick PR #4 tree into `cursor/unified-ai-platform-b8a1` with conflict policy: prefer PR4 for `mike-ai/**`, keep `main` for hub/apps/downloads unless PR4 only adds.  
2. Correct project governance statuses.  
3. Flip cloud primary to OneDrive in `lib/cloud/status.ts` + docs.  
4. Add in-app / docs Status Board append log.  
5. Local health smoke (no paid calls).  
6. Wait for Michael: records JSON drop + Face ID register + iPhone test + merge approval.

---

## 7. Evidence anchors

| Evidence | Location |
| --- | --- |
| Unified branch created | `origin/cursor/unified-ai-platform-b8a1` |
| PR4 platform head | `5aef541` |
| Main baseline | `56f5c43` (#3) |
| 11 board projects in code | PR4 `mike-ai/src/app/api/projects/route.ts` `BOARD_PROJECTS` |
| Supabase 11 seed rows | project `hiynzonbazdorebekrsl` table `projects` |
| Empty recovery | `mike-ai/recovery/` (`.gitkeep` only) |
| Ravin SHA-256 | `downloads/SHA256SUMS.txt` |
| This report | `docs/status-board/RECONCILIATION-REPORT.md` |
| Status Board log | `docs/status-board/AI-STATUS-BOARD.md` |
