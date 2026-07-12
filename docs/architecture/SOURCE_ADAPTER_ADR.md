# Source Adapter ADR

Status: `ACTIVE_AUTHORITY`  
Runtime implementation: `NOT_IN_P0`

## Decision

One workspace shell consumes framework-free domain objects. Source adapters translate local files, confirmed repositories, handoffs, replay buffers, and later live streams into those objects. Sources do not create their own board, PGN, analysis, state, route shell, or token system.

## Sources

- `manual_pgn`
- `cloud_pgn`
- `backend_handoff_pgn`
- `competition_pairing`
- `electronic_board_live`
- `online_game_live`
- `replay_only`

Modes select chrome and available adapters; source selects data. Lifecycle, permission, and screen profile further gate actions and visibility.

## Contract

Each adapter declares:

- typed input and normalized output;
- repository/domain owners;
- Zod validation and error taxonomy;
- read/write and live/replay classification;
- cancellation and stale-result behavior;
- persistence category and secret exclusions;
- canonical tests, assets, and styles;
- implementation phase and acceptance evidence.

Raw DTOs never reach Vue UI. Presentational components receive typed domain props and emit events. Container components coordinate their feature-owned Pinia state and repository boundary.

## Authority and migration

`pgnViewer-new` is the visual and interaction authority for the teaching workspace and the canonical source for active domain behavior. Its source is inventoried in `docs/migration/CANONICAL_RUNTIME_CLOSURE.json`; P0 copies none of it. Legacy `pgnViewer` supplies only capabilities absent or incomplete in the canonical source and never overrides teaching visuals or interactions.

Tournament pages create a sanitized, versioned handoff and navigate into `/pgnViewer/`. Compatibility routes resolve the same handoff and never render a duplicate workspace. Live and replay buffers are read-only; import into analysis requires explicit user action.

## Rejection rules

Reject adapters that require generic proxying, unconfirmed endpoints, browser credentials, fake data, duplicated domain implementations, unlicensed assets, or a second application/component/token system.
