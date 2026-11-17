# ATDD + CDI Genius (unified development build)

Branch: `cursor/atdd-cdi-integration-8bcc`

Combines **Auto/Truck Diagnostics for Dummies (ATDD)** with **CDI Genius** into one application shell.

## Current verified state

| Item | Result |
| --- | --- |
| ATDD 1.2.0 original app / OBD2 DBs | **NOT FOUND** in this environment |
| CDI Genius source tree | Located at `cdi-genius/` (preserved) |
| CDI profiles imported | **3** (Yamaha XV250, Honda CBR600, Kawasaki KE100) |
| Claimed complete CDI set | **71** → **68 missing** |
| Import checksum match | **YES** (`atdd/docs/*-SHA256.txt`) |
| Original `cdi-genius/` deleted? | **No** (awaiting Michael authorization) |

## Layout

- `source-import/cdi-genius/` — byte-identical copy of current CDI Genius sources
- `backups/cdi-genius-original-*` — recoverable snapshot of the same tree
- `web/` — unified iPhone/Windows browser + PWA test build
- `tests/` — import checksum + DDT engine verification
- `docs/VERIFICATION-REPORT.json` — machine-readable evidence

## Commands

```bash
cd atdd
npm test
npm run serve   # http://127.0.0.1:8765
```

## Restrictions honored

- No fabricated OBD2/CDI diagnostic codes
- No invented 71-profile database
- No deletion of originals
- No unauthorized production deployment
- No paid Work credits
