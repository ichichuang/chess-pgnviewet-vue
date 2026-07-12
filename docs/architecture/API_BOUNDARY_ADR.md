# API Boundary ADR

Status: `ACTIVE_AUTHORITY`  
Runtime implementation: `NOT_IN_P0`

## Decision

Browser code talks only to explicit same-origin handlers owned by a server/BFF boundary. Repositories use typed request/response contracts and Zod validation. Upstream credentials, account identifiers, tokens, HMAC keys, signing, and compatibility aliases remain server-side.

## Confirmed read capabilities

| Capability        | Browser method/path                     | Confirmed identifier/request semantics                                                                      |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tournament list   | `POST /api/liveproxy/getactlist`        | body keys `actflag`, `max`, `search`, `start`, `type`                                                       |
| Tournament groups | `POST /api/liveproxy/getactgroups`      | body `{ hdid }`                                                                                             |
| Tournament rounds | `POST /api/award/c-getmatchroundlist`   | body `{ hdid, ticketid }`; round numeric constraints remain unresolved                                      |
| Pairings          | `POST /api/award/c-getmatchpairlist`    | `hdid`, `ticketid`, `round_id`, pagination/type fields; optional discovery fields require contract evidence |
| Finished replay   | `POST /api/gameapi/gamemgr/getgameinfo` | browser sends only `{ gameid }`; pairing row `id` is the high-confidence game identifier                    |

Identifier chain: `hdid` → `ticketid` → `round_id` → pairing `id` → replay `gameid`. Aggregate team-match records are never treated as individual game IDs.

Only confirmed ongoing and completed tournaments may appear. Finished games use real replay data. Ongoing games require a separately confirmed live transport. AI is disabled during ongoing games.

## Auth decision

The only owner-approved browser auth surface is the dedicated same-origin contract:

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`

The browser login body contains only `account` and `password`. The server performs compatibility hashing/signing and stores upstream token/uid in a bounded server vault. Browser responses expose only derived authentication status and a non-personal label. Real production login/session/replay/logout verification remains incomplete, so runtime implementation requires its own gate.

## Required repository behavior

- One typed repository owner per API capability.
- Validate every external response with Zod before mapping it to a domain model.
- Distinguish transport, authentication, contract, empty, stale, and unavailable errors.
- Treat POST-based tournament/replay calls as product reads, not authorization for writes.
- Never add undocumented fields, headers, identifiers, aliases, retries, or side-effect flags.
- Never expose upstream response fields such as credentials or MQTT material to browser state.

## Prohibited

- Generic legacy `/CALL` transport.
- `proxyRequest` restoration or generic tunnels.
- Browser-side HMAC, upstream credentials, signing secrets, bearer tokens, or uid storage.
- Write/admin endpoints without explicit project-owner approval.
- MQTT connect/subscribe/publish until a read-only contract, credential boundary, recovery model, and owner approval exist. MQTT publish remains forbidden.
- Fake API clients, fixture success fallbacks, fake replay/live/AI data, or sample tournament runtime states.

## Unresolved

Live online-game/electronic-board transport, MQTT, hardware history, handoff storage/resolution, match/share/cloud compatibility contracts, exhaustive schemas, round numeric constraints, auth end-to-end verification, replay token lifetime, server hosting/operations, and the side-effect-free guarantee for constrained `getgameinfo` remain blocked.
