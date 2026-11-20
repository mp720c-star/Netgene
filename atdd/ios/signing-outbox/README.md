# Signing outbox (CSR only)

Contains **only** the Apple Distribution `.certSigningRequest` for ATDD Connect.

- Private key is **not** here (encrypted on the Cloud Agent host only; outside Git and OneDrive).
- Safe to download on iPhone → Save to Files → OneDrive.
- After Apple issues the `.cer`, upload that certificate back in chat (or inbox) so the agent can build the `.p12`.
