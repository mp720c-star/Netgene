# Recovery drop folder (test / preview only)

Place **real** exported files here. Do not invent placeholders.  
**Append-only:** never overwrite an existing `AI_Platform_Project_Records_*.json` in this folder. Never write back to Drive/OneDrive backups.

## Expected filename

```text
AI_Platform_Project_Records_<timestamp>.json
```

Example: `AI_Platform_Project_Records_20261116T235000Z.json`

The newest matching file (by timestamp in the name) is loaded by `/api/projects`.

## Phase-2 announced export (await Gemini PASS)

| Field | Value |
| --- | --- |
| Drive file | https://drive.google.com/file/d/1ql5Jne7vuAc1D02igRVq6ADgMca2PKsQ/view |
| Destination folder | `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4` |
| Bytes | `2023048` |
| SHA-256 | `42ded3f6468ca76f113fc394e139f1cd658186f1e661e8ccb11b9d91530a5e4f` |
| Record count | **13** |

After Gemini’s independent audit **PASS**, drop a **copy** of that verified file here under a **new** timestamped name. Preview repair validates fingerprint + governance (Ravin PAUSED, archived preserved) without mutating records.

## Other sources (copy-only)

1. Google Drive staging: https://drive.google.com/drive/folders/1y_-7bD4F6iVT63CB0esv59gqamOIOYcY  
2. OneDrive platform backups (do not delete or overwrite — copy out only)

## Rules

- Never delete Drive/OneDrive backups
- Never write back into those backup locations from this preview
- Production `https://mike-ai.vercel.app` stays untouched
- No merge/deployment from preview repair without Michael approval
