# Authenticated read-only access — live 13-record registry

**When:** 2026-11-16 05:16 PM America/Chicago  
**Agent:** `bc-01a1e6a3-c7b2-7403-bdb7-bdc6f8f17fd7`  
**Branch:** `cursor/authenticated-registry-access-7fd7`  
**Mode:** Diagnose + report only. No deploy, merge, overwrite, delete, or invented records.

## Rejected as non-authoritative

ChatGPT independently used the **AI Platform Admin** connection and returned **11** records from:

`AI_Platform_Project_Records_20261105T110938Z.json`

That file is a **November 5 snapshot**, not the required **live 13-record** registry. Cursor will **not** treat it as authoritative export source.

## Authoritative live registry (13 records)

Source of truth remains the **AI Project Platform / project-memory registry**, accessed on the ChatGPT side via:

- `list_project_memories`
- `get_project_memory`

Expected live shape (from prior coordinator orders; not re-fetched here): **13** complete records (including two archived), with reported revisions such as Platform ~412, Mike AI ~146, Ravin Lookup ~58 **paused**, CDI Genius ~17 **active**.

Cursor does **not** have `list_project_memories` / `get_project_memory` tools in this VM.

## Re-verified read probes (this run)

| Target | Result | Usable as live 13-record bytes? |
| --- | --- | --- |
| Local `mike-ai/recovery/AI_Platform_Project_Records_*.json` | **Missing** | No |
| `https://mike-paine-project-memory.mikepaine.chatgpt.site/` | **HTTP 401** (auth-gated ChatGPT Sites) | No |
| `https://mike-ai-project-platform.vercel.app/api/projects` | **HTTP 401** `Unauthorized` | No |
| Supabase `ai-project-platform` `public.projects` | **11** board-seed name rows only | No (not lossless registry) |
| Drive Managed Cloud Replica `1QAYPFdgF5w6BKbfGLjrhlgIPeKA9A8Mk` | Unauthenticated download → redirect / non-JSON | No |
| Cursor env `GOOGLE_DRIVE_*` / `DRIVE_FOLDER_ID` / `REGISTRY_IMPORT_TOKEN` / `PLATFORM_UNLOCK_CODE` / `SESSION_SECRET` | **Unset** in this VM | No |
| ChatGPT **AI Platform Admin** connection (as used for Nov 5 JSON) | Returned **11**-record snapshot | **No** — wrong artifact |

Existing records were not modified. Google Drive **upload** to Current Exports remains **separately blocked** until Drive OAuth is authorized (out of scope for this read-only step).

## Exact authentication mechanisms required

### 1) Preferred for Cursor — ChatGPT project-memory handoff (read-only)

**Mechanism:** ChatGPT (already authorized for live project-memory) runs `list_project_memories` + `get_project_memory` for **all 13** live records and delivers the complete JSON as a **file attachment to this Cursor Cloud Agent chat** (`bc-01a1e6a3-c7b2-7403-bdb7-bdc6f8f17fd7`).

- No passwords or tokens in chat  
- Do **not** attach `AI_Platform_Project_Records_20261105T110938Z.json`  
- Do **not** use Desktop Commander against the cloud inbox path  

This is the only path that currently works without new Cursor credentials.

### 2) Platform host session (Cursor pulling HTTP itself)

**Mechanism (from PR #4 `mike-ai/src/lib/session.ts`):**

1. Host must have auth configured: `PLATFORM_UNLOCK_CODE` + `SESSION_SECRET` (Cursor Secrets form only — never paste into chat), **or** the published private app must accept a verified Cursor person identity.  
2. Unlock: `POST /api/auth/unlock` with the unlock code → sets HttpOnly cookie `ai_platform_session` (HMAC session; 14-day max age), **or** Face ID / WebAuthn login, **or** Cursor identity on the private published app.  
3. Read: authenticated `GET /api/projects` and/or `GET /api/memory/chatgpt` with that session cookie.

**Current state:** Anonymous GETs return **401**. This VM has no unlock session and no Secrets values. Cursor will not request or accept unlock codes/passwords in chat.

**Note:** Even after unlock, Supabase-backed board rows are **11 seed names** unless the live project-memory payloads have been imported — so platform session alone may still not equal the lossless 13-record registry. Prefer mechanism (1) unless ChatGPT confirms the platform host holds all 13 full histories.

### 3) Google Drive OAuth read of the *live* registry object (optional)

**Mechanism:** Google OAuth 2.0 **refresh-token** client in Cursor Secrets:

- `GOOGLE_DRIVE_CLIENT_ID`  
- `GOOGLE_DRIVE_CLIENT_SECRET`  
- `GOOGLE_DRIVE_REFRESH_TOKEN`  

Then Drive API read of the **current live** registry file/folder — **not** the Nov 5 snapshot ID, and **not** anonymous `uc?export=download` (returns Sign-in HTML).

**Current state:** All `GOOGLE_DRIVE_*` unset → token exchange skipped; Drive API list previously **403**. Drive **upload** stays blocked separately until the same (or write-scoped) authorization is restored.

### 4) HTTP Bearer import into Cursor (delivery channel, not live read)

**Mechanism:** After Mike sets `REGISTRY_IMPORT_TOKEN` in Cursor Secrets (≥24 chars), authorized infrastructure may `POST /api/recovery/registry-import` with `Authorization: Bearer <token>` and a raw JSON body. Token never in chat. This receives a handoff; it does not by itself open project-memory.

## Can an authorized existing connection supply the live bytes?

| Connection | Authorized today? | Supplies **live 13-record** bytes? |
| --- | --- | --- |
| ChatGPT **project-memory** (`list_project_memories` / `get_project_memory`) | **Yes** (ChatGPT-side) | **Yes — this is the connection that can** |
| ChatGPT **AI Platform Admin** (as used for Nov 5 Drive JSON) | Appears connected | **No** for this mission — returned stale **11**-record snapshot |
| Cursor Cloud VM → project-memory / platform / Drive | **No** credentials present | **No** |
| Supabase `ai-project-platform` | Cursor MCP can read SQL | **No** — 11 board-seed rows only |

**Verdict:** An authorized existing connection **can** supply the live bytes — ChatGPT’s **project-memory** access — but Cursor cannot call it. The **AI Platform Admin** Drive path ChatGPT used for the Nov 5 file **cannot** be treated as the live registry. No Cursor-held connection currently yields the 13-record live bytes.

## Next reversible action (no secrets in chat)

1. ChatGPT: export **live** 13 records via project-memory ops and **attach the JSON file** to this agent chat.  
2. Optionally (Mike, Secrets UI only): set platform session and/or Google Drive OAuth secrets if Cursor should pull HTTP/Drive itself later.  
3. Drive Current Exports **upload** remains blocked until Drive write authorization is restored — separate from this read-only gate.

## Safety

- Existing records untouched  
- Nov 5 / Nov 6 backups not modified  
- No deploy, merge, overwrite, delete  
- No passwords/tokens requested or accepted in chat  
- No invented registry contents  
