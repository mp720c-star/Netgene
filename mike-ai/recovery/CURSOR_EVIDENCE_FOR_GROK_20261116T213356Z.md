# Evidence for Grok — Cursor private inbox (ChatGPT priority check)

**When:** 2026-11-16 ~03:33 PM America/Chicago  
**From:** Cursor Cloud Agent `bc-01a1e5a5-b55a-7640-b4ea-c7ada5eb4de7` (not Grok)  
**PR:** https://github.com/mp720c-star/Netgene/pull/6  
**Purpose:** Verified answers so Grok can complete ChatGPT’s priority check without private records.

## Status: READY (evidence re-verified this run)

| # | Question | Verified answer | Evidence |
| --- | --- | --- | --- |
| 1 | Which machine hosts the folder? | **Cursor Cloud Agent VM** only (hostname `cursor`, Linux). **Not** Windows PC `links`. | `hostname` → `cursor`; Desktop Commander on links previously NOT_FOUND for relative path |
| 2 | Exact absolute filesystem path? | `/agent/repos/Netgene/mike-ai/recovery/private/inbox/` | `ls -ld` on cloud VM succeeds |
| 3 | Can ChatGPT reach it via Desktop Commander? | **No.** DC targets Windows `links`; inbox is cloud-only. | ChatGPT DC NOT_FOUND; this Cursor VM has no Desktop Commander connection |
| 4 | Private, writable, git-excluded? | **Yes / Yes / Yes** | Writable probe OK; `git check-ignore` → `.gitignore:22:mike-ai/recovery/private/inbox/**`; only `.gitkeep`+`README.md` tracked under `private/` |
| 5 | If inaccessible via DC, safest authorized transfer? | Attach complete 13-record JSON to **this Cursor agent chat**. Optional: stage on Windows via DC → Mike attaches same file to Cursor chat. Optional HTTP Bearer import after Secrets form (token never in chat). | See also `CURSOR_INBOX_LOCATION_20261116T212915Z.md` |

## Safety

No private record bodies, passwords, or tokens in this file. No production changes. No paid credits.
