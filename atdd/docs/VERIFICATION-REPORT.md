# ATDD + CDI Genius — Verification Report

**When:** 2026-11-17 ~06:10 AM America/Chicago  
**Agent:** `bc-01a1e966-14bd-71c7-8df2-3829a9968bcc`  
**Branch:** `cursor/atdd-cdi-integration-8bcc`  
**Machine JSON:** `VERIFICATION-REPORT.json`

## 1. Locate originals

| Target | Located? | Evidence |
| --- | --- | --- |
| ATDD 1.2.0 application | **No** | Not in Netgene (any branch), GitHub user repos, Origin repos, Supabase `files` (0 rows), recovery folder, unauthenticated Drive/OneDrive |
| ATDD OBD2 databases | **No** | Same search set |
| ATDD Diagnose / Listen / Look / Code | **No** | Same search set |
| ATDD signed Windows installer | **No** | Closest unrelated artifact: Ravin Lookup Car/Truck `.exe` (not ATDD) |
| ATDD iPhone Home Screen app | **No** | Same search set |
| CDI Genius source (repo) | **Yes** | `cdi-genius/` on `main` |
| CDI Genius claimed 1.1.0 complete DB (71 profiles) | **Partial** | Only 3 models in `sample-models.json`; package.json version `0.1.0` |

### External probe results (this run)

| URL / source | HTTP / result |
| --- | --- |
| Status Board Doc export | **401** sign-in |
| Drive staging folder | **302** empty / redirect |
| `mike-ai-project-platform.vercel.app/api/projects` | **401** Unauthorized |
| `mike-paine-project-memory.mikepaine.chatgpt.site` | **401** |
| `mike-ai.vercel.app` | **503** DEPLOYMENT_PAUSED |
| OneDrive Graph | No secrets / token in environment |
| Supabase `public.projects` | 11 board-seed rows (names only) |
| Supabase `public.files` | **0** |

## 2. Database counts

| Database | Count |
| --- | --- |
| CDI profiles found | **3** |
| CDI profiles claimed | **71** |
| CDI profiles missing | **68** |
| ATDD OBD2 codes found | **0** |
| Supabase project seed rows | **11** |
| Supabase file blobs | **0** |

### CDI profile IDs recovered

1. `YAMAHA-XV250-1995-OEM`
2. `HONDA-CBR600-2001-OEM`
3. `KAWASAKI-KE100-1976-OEM`

### Key checksums

| File | SHA-256 | Bytes |
| --- | --- | --- |
| `cdi-genius/src/data/sample-models.json` | `7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee` | 2513 |
| `atdd/source-import/.../sample-models.json` | same | 2513 |
| `atdd/web/data/cdi-models.json` | same | 2513 |
| Full tree `cdi-genius/` ↔ `atdd/source-import/cdi-genius/` | **MATCH** (30 files) | — |
| Backup snapshot ↔ source | **MATCH** | — |

## 3. Integration work completed (without fabricating data)

- Created isolated branch `cursor/atdd-cdi-integration-8bcc`
- Imported CDI Genius sources byte-identical into `atdd/source-import/`
- Preserved recoverable backup under `atdd/backups/`
- Built unified web/PWA shell at `atdd/web/` with working CDI DDT for the 3 recovered profiles
- Gated OBD2/ATDD mode until original databases are delivered
- Left original `cdi-genius/` active/unmodified (no retirement yet)
- Added automated verification tests (`npm test`)

## 4. Test builds

| Target | Status |
| --- | --- |
| iPhone Home Screen test build | PWA at `atdd/web/` (`manifest.webmanifest`, `sw.js`, `icon-180.png`) — serve locally; Add to Home Screen pending device verification |
| Windows test build | Browser-served unified shell (same `atdd/web/`). Signed ATDD 1.2.0 installer **not replaced** because original was not recovered |
| Existing signed Windows installers in `downloads/` | Untouched |
| Existing CDI Genius project | Untouched / not removed |

## 5. Unresolved problems / blockers

1. **ATDD 1.2.0 originals inaccessible** — OneDrive/Drive auth missing; no local drop.
2. **68 CDI profiles missing** — cannot claim complete 71-profile transfer.
3. Live Google Status Board Doc append blocked (**401**).
4. Cannot coordinate Gemini/Grok by writing the live Doc; repo Status Board mirror updated instead.
5. CDI Genius retirement deferred until Michael authorizes after full verification.

## 6. Required from Michael (to unblock)

1. Attach ATDD 1.2.0 source + OBD2 DBs + signed installer + iPhone package to this agent chat **or** drop into `mike-ai/recovery/private/inbox/`.
2. Attach full CDI 71-profile database (or grant OneDrive/Drive read secrets).
3. Authorize permanent CDI Genius project retirement only after full verification succeeds.
