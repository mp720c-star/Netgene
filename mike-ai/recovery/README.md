# Recovery drop folder (test deploy only)

Place **real** exported files here. Do not invent placeholders.

## Expected filename

```text
AI_Platform_Project_Records_<timestamp>.json
```

Example: `AI_Platform_Project_Records_2026-11-15T120000Z.json`

The newest matching file (by timestamp in the name) is loaded by `/api/projects`.

## Where to export from

1. **Google Drive staging** (still has original project folders):  
   https://drive.google.com/drive/folders/1y_-7bD4F6iVT63CB0esv59gqamOIOYcY
2. **OneDrive platform backups** (do not delete or overwrite them — copy out only)
3. Production records folder `1z8LAubkUm-DJ9MZoE9dsNYXGnySMzKQP` returned empty/404 from this environment

## Rules

- Never delete Drive/OneDrive backups
- Never write back into those backup locations from this test deploy
- Production `https://mike-ai.vercel.app` stays untouched

## Private authenticated import (2026-11-16)

Authoritative registry handoffs go to **`private/inbox/`** (gitignored), not into public git.

See the newest `CURSOR_READY_IMPORT_*.md` in this folder for destination + auth method.
Never commit `AI_Platform_Project_Records_*.json` or private inbox payloads.
