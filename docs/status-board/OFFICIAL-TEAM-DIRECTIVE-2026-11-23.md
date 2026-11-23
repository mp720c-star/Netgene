# Official AI team directive

**Authorized by:** Michael Paine  
**Recorded:** 2026-11-23 ~3:12 PM America/Chicago  
**Status:** NOT COMPLETE  
**Supersedes:** `docs/status-board/TEAM-DIRECTIVE-COMMAND-ROOM-2026-11-23.md` where they conflict. That earlier file stays on disk. It is not deleted.

This file is the repo mirror. The live Shared AI Status Board Google Doc still returns HTTP 401 from this environment, so this mirror is the record Cursor can write.

## Team

| Role | Assignment |
| --- | --- |
| ChatGPT | Administrator and team coordinator. Must consult authoritative project memory before responding or assigning project work. |
| Cursor | Software development, repairs, integration, and testing. |
| Sync & Merge | Platform operations and data integrity. Independent auditor. Memory and alignment checker. Reports audits directly to Michael. Reports regular operations to ChatGPT. |
| Gemini | Restricted Google-services specialist. No permanent access. Individually authorized assignments only. Temporary permission ends when the assignment ends. |
| Grok bot, Grok app, Claude | Removed. Outstanding assignments cancelled. Team-specific access is to be revoked. |

## Rules in force

- OneDrive is the master store. Google Drive and iCloud are synchronized backups.
- The independent AI platform must not depend on Vercel or OpenAI hosting.
- Preserve project files, conversations, decisions, and recovery checkpoints.
- Prioritize the independent AI Command Room and ATDD.
- Ravin Lookup Tool development stays paused.
- Do not consume paid Work credits without Michael’s permission.
- Do not fabricate results, use placeholders, or report unverified work as complete.
- Do not publish passwords, tokens, or private credentials.
- Do not mark this directive complete until the required changes are implemented and verified.

## Cursor acknowledgement

Cursor accepts the role of software development, repairs, integration, and testing. Cursor does not administer OneDrive, Google Drive, or iCloud, and does not speak for Sync & Merge or ChatGPT.

## Access checks run 2026-11-23 ~3:12 PM America/Chicago

| Check | Result |
| --- | --- |
| GitHub collaborators on `mp720c-star/Netgene` | Only `mp720c-star` (admin). No Grok, Claude, or Gemini account is a collaborator. |
| Repo invitations | Not verified. The API returned HTTP 403. |
| Deploy keys | Not verified. The API returned HTTP 403. |
| Actions secret names | Not verified. The API returned HTTP 403. No secret values were read or printed. |
| Environment credentials named for Drive, OpenAI, Anthropic, xAI, Gemini, Grok, Claude, and `MIKE_AI_OWNER_TOKEN` | Unset. None were revoked because none were present. Sync & Merge credentials were not removed. |
| Shared AI Status Board Google Doc | HTTP 401 |
| Project-memory host | HTTP 401 |
| Platform chat API | HTTP 401 |
| Platform project route | Login page |
| `mike-ai.vercel.app` | HTTP 503, deployment paused |

## Not done, so this directive is not complete

- OneDrive was not opened. Drive and iCloud sync were not verified.
- Google, OneDrive, and iCloud permissions for removed agents were not changed from this environment.
- Gemini was not given a temporary grant, and no live Gemini grant was found here to revoke.
- The platform code under `mike-ai/` still references Vercel and OpenAI. It was not rewritten or deployed. Production stays paused.
- The AI Command Room still has no provisioned account, token, or signed-in connection.
- Sync & Merge has not filed an independent audit. Cursor cannot file that audit for them.
