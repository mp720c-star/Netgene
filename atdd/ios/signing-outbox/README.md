# Signing outbox (CSR + profile metadata only)

Safe-to-commit Apple **public** artifacts for ATDD Connect (`com.netgene.atdd.ble`).

| File | Purpose |
| --- | --- |
| `ATDD_Connect_Distribution.certSigningRequest` | CSR used for the existing Apple Distribution certificate |
| `PROFILE.md` | App Store profile name, Team ID, UUID (no binary) |

## Rules

- Reuse the existing **Apple Distribution** certificate and matching private key. **Do not** generate new signing credentials.
- Private key / `.p12` / passwords are **never** stored here (and must not appear in chat).
- The App Store `.mobileprovision` binary is **not** committed; CI loads it from GitHub Actions secrets only.

See `PROFILE.md` for Team ID `AJ2FB298SY` and profile UUID `ce2e5ad5-a404-44da-9d64-18e53beb419b`.
