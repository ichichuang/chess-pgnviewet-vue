# Source Adapter ADR

Status: `ACTIVE_AUTHORITY`

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
- asset/style provenance where relevant;
- static, typecheck, build, contract, and narrow browser acceptance evidence.

Raw DTOs never reach Vue UI. Presentational components receive typed domain props and emit events. Container components coordinate their feature-owned Pinia state and repository boundary.

## Authority and source evidence

`pgnViewer-new` is read-only visual and interaction evidence for the teaching
workspace, board, PGN, annotation, AI, layout, motion, and domain behavior. The
current product blueprint and target runtime own present decisions. The source
does not establish Web API contracts or require a migration sequence.

`pgnViewer` and `chess-main-overseas` are the only read-only Web API,
authentication, request, environment, and production authorities. Their
field-level decisions are reconciled by
`docs/architecture/WEB_API_SOURCE_AUTHORITY.md`. `chess-pgnviewer`, Mini
Program documents, `wx.request`, `openid` flows, and derived API inventories
are non-authoritative for adapters.

Tournament pages create a sanitized, versioned handoff and navigate into `/pgnViewer/`. Compatibility routes resolve the same handoff and never render a duplicate workspace. Live and replay buffers are read-only; import into analysis requires explicit user action.

## Rejection rules

Reject adapters that require generic proxying, unconfirmed endpoints, upstream
shared credentials, URL/query-token auth, fake data, duplicated domain
implementations, unlicensed assets, or a second application/component/token
system. `src/api/legacyWebCompatibility.ts` is the sole approved owner of the
tracked browser compatibility signer; no other adapter may duplicate its
constants or algorithm. A source-confirmed but unavailable capability renders
an unavailable state; it is not coerced into an empty or synthetic success.
