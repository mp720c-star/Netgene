# CURSOR — Phase 2 preview-only repair prep

**When:** 2026-11-16 05:55 PM America/Chicago  
**Agent:** `bc-01a1e6a3-c7b2-7403-bdb7-bdc6f8f17fd7`  
**Branch:** `cursor/preview-repair-13-records-7fd7` (separate from HOLD PR #7)  
**Mode:** Preview-only. **No merge. No deployment.**

## Preserved

- [PR #7](https://github.com/mp720c-star/Netgene/pull/7) and branch `cursor/authenticated-registry-access-7fd7` — **unchanged**
- All originals, private backups, chats, files, history — not deleted/overwritten
- Gemini owns the field-by-field audit of Drive file `1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ`

## Announced export fingerprint (metadata only)

| Field | Value |
| --- | --- |
| Drive file | `1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ` |
| Folder | `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4` |
| Bytes | `2023048` |
| SHA-256 | `42ded3f6468ca76f113fc394e139f1cd658186f1e661e8ccb11b9d91530a5e4f` |
| Records | **13** |

Cursor Cloud **cannot** download this file without Google Sign-in (uc download returned Sign-in HTML). Private record bodies are **not** stored in git.

## Preview repair prepared on this branch

1. `mike-ai/src/lib/registry-validate.ts` — fingerprint + governance checks (Ravin PAUSED/58, CDI 17, Music 79, Family 4, ≥2 archived); **read-only**, no mutations.
2. `mike-ai/src/lib/projects.ts` — when a recovery JSON is present, report `validation` + `fingerprint` alongside records.
3. `GET /api/projects` — exposes `phase2` metadata and announced export ids for preview verification.
4. Recovery README — append-only drop rules after Gemini PASS.

## After Gemini PASS (still no merge/deploy until ordered)

1. Copy the verified export into `mike-ai/recovery/AI_Platform_Project_Records_<newUTC>.json` (**new file only**).
2. Confirm `/api/projects` shows `count: 13`, `fingerprint.matchesAnnouncedExport: true`, governance PASS.
3. ChatGPT reconciles discrepancies; Grok Sync / Regular Grok proceed per Phase-2 sequence.

## Safety

No deletion · no overwrite of backups · no merge · no deployment · no credentials in chat · no paid credits · no Nov 5/6 substitution.
