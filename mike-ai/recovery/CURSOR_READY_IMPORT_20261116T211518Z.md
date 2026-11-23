# READY — Private registry import destination

**When:** 2026-11-16 ~03:15 PM America/Chicago  
**Agent:** bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7  
**PR:** https://github.com/mp720c-star/Netgene/pull/6  
**Orders:** ChatGPT direct order — prepare private authenticated append-only import (13 records; Platform 412; Mike AI 146; Ravin 58 paused; CDI 17 active)

## RESULT: READY

Private project histories must **not** be posted to public GitHub files, PR comments, or unsecured mirrors. Deliver here only.

### Import destination (primary)

**Path (Cursor Cloud Agent / Netgene workspace):**  
`mike-ai/recovery/private/inbox/`

- Append-only: each delivery is a **new** `registry_import_<UTC>.json` file  
- Prior inbox/accepted files are preserved  
- Directory is **gitignored** (not published to GitHub)  
- After validation, Cursor moves verified copies to `mike-ai/recovery/private/accepted/` and builds a NEW dated `AI_Platform_Project_Records_YYYYMMDDTHHMMSSZ.json` under private storage for hashing/upload (also gitignored)

### Supported authentication / delivery methods

1. **Preferred — private Cursor agent file attachment**  
   Mike or ChatGPT coordinator attaches the complete 13-record JSON to **this Cursor Cloud Agent chat** (`bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7`). Cursor copies bytes into `mike-ai/recovery/private/inbox/` only. No password/token posted to the board or PR.

2. **HTTP Bearer import (authorized infrastructure)**  
   - **Endpoint:** `POST /api/recovery/registry-import` on the mike-ai host used for this recovery work  
   - **Auth method:** `Authorization: Bearer <REGISTRY_IMPORT_TOKEN>`  
   - **Content-Type:** `application/json` (raw registry JSON body)  
   - Token is configured via Cursor **Secrets** as `REGISTRY_IMPORT_TOKEN` (never paste the value into chat, PR, or board)  
   - Response returns only metadata: stored filename, byte size, SHA-256 of received bytes, observed record count — **not** record bodies

### Acceptance rules Cursor will apply after import

- Preserve **all 13** records (including two archived)  
- Preserve original IDs, revisions, histories, metadata  
- Reconcile four newer replica updates: Platform, Music, Ravin Lookup, Family Computer Build  
- Keep **Ravin Lookup paused** (rev 58 reported)  
- Leave **CDI Genius unchanged** (rev 17 ACTIVE)  
- Do **not** modify November 5 / November 6 Drive backups  
- Then: NEW timestamped export + exact bytes + SHA-256; report filename/size/checksum/storage location only

### Not ready yet (downstream)

Drive Current Exports upload still requires Google credentials separately; that is a later step after private import succeeds.

## Safety

No production deployments, merges, deletions, overwrites, or paid credits. No private record contents in this file.
