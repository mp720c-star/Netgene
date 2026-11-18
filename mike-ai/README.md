# AI Project Platform (Mike AI)

Secure Netgene AI platform shell with **all 14 projects available**, hub apps (including ATDD Connect Scanner), Face ID / unlock, files, memory, and OneDrive-primary cloud sync.

- Does **not** modify production `https://mike-ai.vercel.app` until you approve a reconnect
- Does **not** overwrite or delete Google Drive / OneDrive backups
- Catalog seeds from the Shared AI Status Board + Forma / Vehicle Genius hub apps
- Deep project histories load only from a real `AI_Platform_Project_Records_<timestamp>.json` in `recovery/`

## Local

```bash
cd mike-ai
npm install
env -u DATABASE_URL npm run dev
```

Open http://127.0.0.1:3000 — local Cursor identity unlocks the dashboard. Hub apps under `/apps/`.

## Projects (13)

Board: AI Project Platform, REVO + Roku, MIKE AI, Family Computer Build, Operation Keep Sara Working, Auto Truck Diagnostics (priority), CDI Genius, Kathy's Health App, Ravin Lookup (**paused**), Dead End Road, Mike Paine CD Album (**archived**).

Hub apps also listed: Forma, Vehicle Genius (plus CDI / Ravin downloads under Apps).

## Recover deep histories

1. Export a real records JSON from Drive staging or OneDrive (copy only)
2. Save as `mike-ai/recovery/AI_Platform_Project_Records_<timestamp>.json`
3. Unlock the app → Projects → import via `POST /api/projects` `{ "importRecovery": true }`

## Deploy

Publish this folder as a **new** test project / Cursor publish — do not reconnect it to the paused production hostname until iPhone + desktop verification passes. Declares Postgres via `cursor-app.json` + `migrations/`.
