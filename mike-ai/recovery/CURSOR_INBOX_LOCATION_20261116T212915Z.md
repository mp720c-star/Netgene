# Inbox location report — Desktop Commander NOT_FOUND explained

**When:** 2026-11-16 ~03:29 PM America/Chicago  
**Agent:** bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7  
**PR:** https://github.com/mp720c-star/Netgene/pull/6  
**Order:** Unblock 13-project registry transfer (Desktop Commander NOT_FOUND on `mike-ai/recovery/private/inbox/`)

## Status: READY (cloud inbox) — Windows Desktop Commander cannot see it

### 1–3. Where the folder exists

| Machine | Exists? | Absolute path |
| --- | --- | --- |
| **Cursor Cloud Agent VM** (hostname `cursor`, Linux) | **YES** | `/agent/repos/Netgene/mike-ai/recovery/private/inbox/` |
| Connected Windows PC **links** (Desktop Commander) | **NO** (matches ChatGPT NOT_FOUND) | N/A — this relative path is not on the Windows workspace root ChatGPT probed |

**Cloud VM checks (executed):**
- Folder exists
- Writable by agent user `ubuntu` (write probe succeeded)
- Private intent: gitignored payload dir; not for public GitHub
- Git exclusion verified: `git check-ignore` → `.gitignore:22:mike-ai/recovery/private/inbox/**`
- Tracked under `private/` only: `.gitkeep` + `README.md` (no inbox payloads tracked)

### 4. Can ChatGPT access it via Desktop Commander?

**No.** Desktop Commander on **links** talks to the Windows filesystem. The inbox was created only on the **Cursor cloud VM**. Relative path `mike-ai/recovery/private/inbox/` on links correctly returns NOT_FOUND.

This Cursor VM has **no Desktop Commander / links connection** in its toolset, so Cursor also cannot pull from the Windows PC here.

### 5. Secure alternatives (no passwords/tokens in chat)

**A — Preferred (authorized, private):** Attach the complete 13-record JSON file to **this Cursor Cloud Agent chat** (`bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7`). Cursor will copy bytes only into `/agent/repos/Netgene/mike-ai/recovery/private/inbox/` (append-only; gitignored). Do not paste record bodies into PR comments or public board mirrors.

**B — Windows staging then attach:** If ChatGPT must write via Desktop Commander, create/write on **links** under a Windows path Mike controls (for example a private folder under the user’s documents/OneDrive — ChatGPT/Mike choose the path). Then **Mike attaches that same file** to this Cursor agent chat. Cursor still never needs a password in chat.

**C — HTTP Bearer import (optional):** `POST /api/recovery/registry-import` with `Authorization: Bearer <REGISTRY_IMPORT_TOKEN>` once Mike has set the token in Cursor Secrets and a reachable mike-ai host exists. **Do not paste the token into chat.**

### 6–7. Safety

No passwords/API tokens requested in chat. No deploy, merge, delete, overwrite, or modification of existing project records. No paid credits. No Google Docs wait.

## Required response summary

- **Machine hosting the inbox:** Cursor Cloud Agent VM (hostname `cursor`)
- **Absolute filesystem path:** `/agent/repos/Netgene/mike-ai/recovery/private/inbox/`
- **Access method available to ChatGPT:** Not Desktop Commander. Use **file attachment to this Cursor agent chat** (or Windows staging → Mike attaches). Optional HTTP Bearer after Secrets form.
- **Git exclusion verification:** PASS (`mike-ai/recovery/private/inbox/**` ignored)
- **Status:** **READY**
