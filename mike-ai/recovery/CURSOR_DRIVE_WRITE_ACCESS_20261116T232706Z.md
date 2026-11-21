# CURSOR — EXPORT RECOVERY (authorized write access)

**When:** 2026-11-16 05:27 PM America/Chicago  
**Agent:** `bc-01a1e6a3-c7b2-7403-bdb7-bdc6f8f17fd7`  
**PR:** https://github.com/mp720c-star/Netgene/pull/7  

## Confirmed destination

Google Drive folder ID: **`1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4`**

Acknowledged: ChatGPT independently retrieved all **13** current project records via project-memory. November 5 **11**-record Admin export remains non-authoritative and will not be substituted.

## Immediate task

Establish **authorized write access** to the confirmed destination. No new folders. No overwrites. No merges. No deploys. No request for Mike to reconstruct records.

## RESULT: BLOCKED

Authorized write access was **not** established.

### Exact access blocker

| Item | Status |
| --- | --- |
| `GOOGLE_DRIVE_CLIENT_ID` | **UNSET** in this Cursor Cloud VM |
| `GOOGLE_DRIVE_CLIENT_SECRET` | **UNSET** |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | **UNSET** |
| `GOOGLE_DRIVE_ACCESS_TOKEN` | **UNSET** |
| `DRIVE_FOLDER_ID` | **UNSET** (destination ID is known from orders; not loaded into Secrets) |
| OAuth token exchange | **NOT ATTEMPTED** — missing client id/secret/refresh token |
| Drive API write (`files.create` into `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4`) | **NOT ATTEMPTED** — no authorized credential |
| Unauthenticated / browser Drive write | **REFUSED** — cannot grant write without OAuth |

**Blocker (one line):** Cursor lacks Google OAuth client credentials + refresh token in Cursor Secrets, so it cannot obtain an access token to write into folder `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4`.

### Exact permission needed

Via Cursor **Secrets** UI only (never paste into chat):

1. `GOOGLE_DRIVE_CLIENT_ID`  
2. `GOOGLE_DRIVE_CLIENT_SECRET`  
3. `GOOGLE_DRIVE_REFRESH_TOKEN` (account that already has **write** on folder `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4`)  
4. `DRIVE_FOLDER_ID` = `1Sd9pcqLGtM602BWx7m0iDNtNf5yBvnq4`

After Secrets are set and this agent is restarted/reloaded with them, Cursor will re-test authorized write (metadata-only permission check / NEW file upload of the 13-record export when source bytes are delivered)—without creating extra folders or overwriting existing files.

## Not done (downstream hold)

Gemini and both Grok agents remain on verification hold — no new export uploaded; no readback possible.

## Safety

No Nov 5 substitute · no invented records · no additional Drive folders · no overwrites · no merges · no deploys · no secrets in chat · private inbox unused.
