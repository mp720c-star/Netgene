# Safest unified build architecture

Target branch: **`cursor/unified-ai-platform-b8a1`** only.  
Production (`main`, `mike-ai.vercel.app`, backup drives) stays frozen until Michael approves.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  Clients: iPhone PWA · Windows · Android · browsers     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  AI Project Platform (PR #4 mike-ai Next.js)            │
│  Auth (passkey/Face ID + optional unlock) · Dashboard   │
│  Status Board · Projects · Files · Memory · Mike AI     │
└───────┬─────────────────┬───────────────────┬───────────┘
        │                 │                   │
   ┌────▼────┐     ┌──────▼──────┐     ┌──────▼──────┐
   │ Hub apps│     │ Data plane  │     │ Sync plane  │
   │ Forma   │     │ Postgres    │     │ OneDrive ★  │
   │ Vehicle │     │ (Supabase)  │     │ Google Drive│
   │ CDI     │     │ or PGlite   │     │ iCloud      │
   │ Ravin*  │     │ SHA-256     │     │ versioned   │
   └─────────┘     └─────────────┘     └─────────────┘
   * Ravin paused (governance)
```

## Merge policy on the unified branch

| Path | Prefer |
| --- | --- |
| `mike-ai/**` | PR #4 |
| `forma/`, `vehicle-genius/`, `cdi-genius/`, `ravin-lookup/`, `downloads/` | `main` (already complete) |
| Root hub / `wrangler.toml` / `scripts/` | `main` |
| Docs under `docs/status-board/` | This branch (append-only) |

## Governance defaults to apply on D

| Project | Status |
| --- | --- |
| Auto Truck Diagnostics for Dummies | **active development priority** |
| Ravin Lookup Tool / TITAN | **paused** |
| Mike Paine CD Album | archived |
| Others | active (until board says otherwise) |

## Safety rails

1. Never delete PR branches #1/#2/#4.  
2. Never write into Drive/OneDrive backup roots.  
3. Never invent project records.  
4. Never spend paid AI/cloud credits without permission.  
5. Never merge to `main` or reattach production hostname without Michael’s written approval after tests.
