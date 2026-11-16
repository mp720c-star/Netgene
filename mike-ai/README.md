# Mike AI (test deploy)

Separate **test** surface for the Vercel AI / Netgene platform.

- Does **not** modify production `https://mike-ai.vercel.app` (currently paused)
- Does **not** overwrite or delete Google Drive / OneDrive backups
- Project records load only from a real `AI_Platform_Project_Records_<timestamp>.json` in `recovery/`

## Local

```bash
cd mike-ai
npm install
npm run dev
```

Open http://127.0.0.1:3000 — hub apps under `/apps/`.

## Recover records

1. Export a real records JSON from Drive staging or OneDrive (copy only)
2. Save as `mike-ai/recovery/AI_Platform_Project_Records_<timestamp>.json`
3. Reload `/api/projects`

## Deploy

Publish this folder as a **new** test project / Cursor publish — do not reconnect it to the paused production hostname until iPhone + desktop verification passes.
