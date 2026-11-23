# Mike AI — AI Project Platform

Secure Next.js test surface for the Netgene AI Project Platform. Uses **Supabase Postgres** when `DATABASE_URL` is set; otherwise local in-memory PGlite.

**Production warning:** Do **not** modify or reconnect to paused production `https://mike-ai.vercel.app`. Do **not** overwrite Google Drive / OneDrive backups.

## Supabase project

| | |
|---|---|
| **Name** | `ai-project-platform` |
| **Ref** | `hiynzonbazdorebekrsl` |
| **URL** | https://hiynzonbazdorebekrsl.supabase.co |

Schema + RLS live in `migrations/001_platform.sql`. The app connects with the server-side `DATABASE_URL` (postgres role). RLS is enabled with no anon/authenticated policies so the Data API cannot read rows.

## DATABASE_URL setup

1. Open [Project Settings → Database](https://supabase.com/dashboard/project/hiynzonbazdorebekrsl/settings/database).
2. Copy the **Connection string (URI)**. Prefer the **Transaction** pooler URI for serverless / Cursor publish.
3. Set it as `DATABASE_URL` in local `.env.local` or Cursor publish secrets.
4. Optionally set `NEXT_PUBLIC_SUPABASE_URL=https://hiynzonbazdorebekrsl.supabase.co` (public URL only; used by `/api/health`).

See `.env.example` for the full secret list. Auth requires `PLATFORM_UNLOCK_CODE` and `SESSION_SECRET`.

## Local run

```bash
cd mike-ai
cp .env.example .env.local   # fill secrets; leave DATABASE_URL empty for PGlite
npm install
npm run migrate              # optional when using hosted Postgres
npm run dev
```

Open http://127.0.0.1:3000 — hub apps under `/apps/`. Health: `/api/health` reports `database`, `supabase`, and `supabaseHost` (never credentials).

## Recover records

1. Export a real records JSON from Drive staging or OneDrive (**copy only**).
2. Save as `mike-ai/recovery/AI_Platform_Project_Records_<timestamp>.json`, or paste into `AI_PLATFORM_PROJECT_RECORDS_JSON`.
3. Reload `/api/projects`.

## Deploy notes

- Publish this folder as a **new** test project / Cursor publish (`ai-project-platform`, Private).
- Set at least `PLATFORM_UNLOCK_CODE`, `SESSION_SECRET`, `DATABASE_URL`, and (for ChatGPT memory) `CHATGPT_MEMORY_TOKEN`.
- Leave production `mike-ai.vercel.app` untouched until iPhone + desktop verification passes.
- Chat and cloud sync stay fail-closed until their optional secrets are filled.
