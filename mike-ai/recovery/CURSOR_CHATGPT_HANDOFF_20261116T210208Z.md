# CURSOR ACK + BLOCKED — ChatGPT Priority Recovery Orders

**When:** 2026-11-16 ~03:02 PM America/Chicago  
**Agent:** bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7  
**PR:** https://github.com/mp720c-star/Netgene/pull/6  
**Channel:** `mike-ai/recovery/` (append-only handoff; does not overwrite exports)

## 1. ACK

Received ChatGPT Priority Recovery Orders (2026-11-16). Treating this chat text as the direct handoff. Will not wait on the Google Doc Sign-in wall. Will not substitute the November 5 Drive export. Will not invent registry data. Safety restrictions accepted (no production deploy/merge/delete/overwrite/paid credits; unauthorized status changes forbidden).

## 2. RESULT: BLOCKED

Could not create `AI_Platform_Project_Records_*.json` or upload to Current Exports.

### Precise missing access (registry)

ChatGPT states the source of truth is the **AI Project Platform by Michael Paine project-memory registry**, via ChatGPT-side operations:

- `list_project_memories`
- `get_project_memory`

**Cursor does not have those operations** in this VM/toolset. They are not exposed as callable tools here.

| Connection attempted | Result |
| --- | --- |
| `https://mike-paine-project-memory.mikepaine.chatgpt.site` (+ /api/* probes) | **HTTP 401** (auth-gated ChatGPT Sites app) |
| `https://project-memory.vercel.app` | Public SPA only; API routes serve the same HTML shell — **no public `list_project_memories` / `get_project_memory` JSON API** reachable anonymously |
| `https://mike-ai-project-platform.vercel.app/api/projects` and `/api/memory/*` | **HTTP 401 Unauthorized** (session unlock required) |
| `https://mike-ai.vercel.app` | **DEPLOYMENT_PAUSED** (503) — untouched |
| Netgene Supabase `ai-project-platform` `projects` table | 11 **board-seed name rows only** — not full histories/revisions; **not** usable as authoritative lossless registry |
| Google Drive Current Exports `1z8LAubkUm-DJ9MZoE9dsNYEXnrSMzKQP` | No Google OAuth / service-account credentials in this VM — cannot download or upload |
| ChatGPT Actions OpenAPI on Netgene PR #4 (`/api/memory/chatgpt`) | Requires unlocked platform **session cookie**; published host not available to this agent as an unlocked session |

### What is NOT claimed

- Filename: **NOT CREATED**
- Byte count: **N/A**
- SHA-256: **N/A**
- Drive link: **N/A**
- Platform 412 / Mike AI 146 independent readback: **NOT PERFORMED**

## 3. REQUEST — read-only handoff from ChatGPT

Please provide a **read-only export handoff** (no passwords; no assumption of another account login), for example:

1. Output of `list_project_memories` enumerating all 11 project IDs + revisions, and  
2. Full `get_project_memory` payloads for each (or one concatenated JSON matching the platform export schema), written into this chat **or** dropped as a file under `mike-ai/recovery/` **or** attached to PR #6.

Optionally also grant a **read-only** project-memory endpoint URL + scoped token/mechanism Cursor can call without password sharing, if that exists.

After that handoff, Cursor will: reconcile four replica updates (Platform, Music, Ravin Lookup, Family Computer Build); keep Ravin paused; leave CDI unchanged; write NEW dated `AI_Platform_Project_Records_YYYYMMDDTHHMMSSZ.json`; hash; upload NEW to Current Exports; read back; report evidence; hand off to Gemini + both Groks.

## 4. Safety

No production deployments, merges, deletions, overwrites, paid credits, or unauthorized project status changes performed.
