# Web API Source Authority

Status: `ACTIVE_AUTHORITY`

Effective date: `2026-07-14`

## Decision

Only these read-only Web projects may establish API, authentication, request,
environment, transport, and production behavior for this target:

1. `/Users/cc/Work/neobv/Chess/pgnViewer`
2. `/Users/cc/Work/neobv/Chess/chess-main-overseas`

They are co-equal evidence sources. A field, token rule, host, or lifecycle that
appears in only one source may be adopted only when it is internally complete
and compatible with the target security invariants. A conflict remains
`BLOCKED_UNCONFIRMED`; it is not resolved by guessing.

`/Users/cc/Work/neobv/Chess/pgnViewer-new` remains authoritative only for the
board, PGN, annotations, AI, workspace, layout, motion, and visual behavior. It
does not establish Web API facts.

The following are non-authoritative for this scope:

- `/Users/cc/Work/neobv/Chess/chess-pgnviewer`
- Mini Program API documents and derived inventories
- `wx.request`, URL-token, WeChat `openid`, and Mini Program login handoffs
- hosts, payload aliases, gateway rules, or session designs derived from those
  sources

Historical reports may describe earlier decisions. They remain evidence of
what was done, not authority for what the target does now.

## Source transport evidence

### `pgnViewer`

- `src/config/index.js` identifies the chess production base as
  `https://wxapi.kaisaile.org` and the management production base as
  `https://manage.yoursclass.com`.
- `src/api/chessivy.js` routes chess calls through
  `/yike_mgr/v1/chessivy/proxyRequest`. That generic tunnel is
  `REJECTED_OBSOLETE` for this target.
- `src/libs/axios.js` uses an eight-second timeout and unwraps a legacy envelope.
- `src/api/cloudreve.js` owns a separate Cloudreve client with browser bearer
  credentials and credentialed requests. Its reads remain
  `BLOCKED_UNCONFIRMED`; its writes are not authorized.
- `src/router/index.js` and `src/api/UC.js` contain URL-token, refresh-token, and
  WeChat compatibility flows. They are `REMOVE_MINIAPP_ONLY`.

### `chess-main-overseas`

- `src/utils/request.js` selects `VITE_API_URL` in production, `/CALL` in
  development, a fifteen-second timeout, credentialed JSON requests, and a
  browser HMAC header.
- The source contains hard-coded credential-like and signing material. Values
  are deliberately not copied or recorded. Browser HMAC and the `/CALL` tunnel
  are `REJECTED_OBSOLETE`.
- `src/utils/api.js` establishes the endpoint paths and concrete consumer
  payloads used by the Web product.
- `src/view/login/index.vue`, `src/utils/index.js`, and
  `src/layout/Header/Header.vue` establish the password-login, browser restore,
  and local logout behavior. The source has no verified remote logout endpoint.
- `src/utils/userInfoService.js` creates a fingerprint-based guest chess-service
  token and `src/utils/api.js` injects that token into replay request bodies.
  That lifecycle is not the Kaisaile account session and is
  `REJECTED_OBSOLETE` for this target.

## Live no-credential verification

On `2026-07-14`, direct server-side HTTPS probes to
`https://wxapi.kaisaile.org` verified the following public tournament reads:

- `POST /liveproxy/GetActList`
- `POST /award/c-GetActDetail?token=&type=10`
- `POST /liveproxy/GetActGroups`
- `POST /award/c-GetMatchRoundlist`
- `POST /award/c-GetMatchPairlist`

The probes used no account, token, HMAC header, cookie jar, or private data and
retained only status, envelope keys, field names, field types, and row counts.
Each endpoint returned the Web envelopes documented in
`WEB_API_ENDPOINT_INVENTORY.json`.

An `OPTIONS` probe and an actual `POST` carrying a localhost `Origin` both
returned empty `Access-Control-Allow-*` values. Therefore:

- the upstream endpoint contracts are confirmed for server-to-server HTTPS;
- direct cross-origin browser deployment is not confirmed;
- the previous `/api/ksl` Vite proxy proves only a development experiment;
- no production proxy, BFF, cookie session, Node server, or same-origin gateway
  may be invented in this repository.

## Authentication decision

`POST /liveproxy/PostLoginByPhone` and its password-digest payload are visible
in the authoritative Web source. The same source also sends a hard-coded
`login_func.openid`, uses browser HMAC signing, and has incomplete logout-token
cleanup. Those parts are explicitly disallowed or internally inconsistent.

The target therefore classifies password login as `BLOCKED_UNCONFIRMED` until a
Web-only request accepted without `openid` and browser signing is verified.
The endpoint path and non-secret field names may remain inventoried, but the
runtime must not claim a working account session from this evidence alone.

No remote logout, refresh, revocation, or stable expiry contract is verified.
The target must remove URL-token absorption immediately. Any later accepted
browser session must be centralized, must never persist a password or digest,
must use only the minimum token/identity fields required by a confirmed
repository method, and must fail closed on expiry or HTTP 401.

## Capability decisions

| Capability                                                | Classification        | Decision                                                                                                                           |
| --------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Public tournament list/detail/groups/rounds/pairings      | `MERGE`               | Endpoint and response envelopes verified; browser transport remains unavailable when cross-origin.                                 |
| Account password login                                    | `BLOCKED_UNCONFIRMED` | Path exists, but the authoritative Web request depends on disallowed `openid` compatibility and browser signing.                   |
| Finished-game replay                                      | `BLOCKED_UNCONFIRMED` | Path and game object are visible; usable request auth depends on a separate fingerprint guest token and forbidden browser signing. |
| Hardware-board history/live                               | `BLOCKED_UNCONFIRMED` | Read paths exist, but token, credential, and live lifecycle are incomplete.                                                        |
| MQTT subscription                                         | `BLOCKED_UNCONFIRMED` | No safe credential-issuance and subscribe-only contract is confirmed.                                                              |
| MQTT publish                                              | `REJECTED_OBSOLETE`   | Product is read-only and browser publish is forbidden.                                                                             |
| Cloudreve reads                                           | `BLOCKED_UNCONFIRMED` | Paths exist; credential, CORS, response, and production ownership are incomplete.                                                  |
| Cloudreve writes and directory creation                   | `REJECTED_OBSOLETE`   | No approved write contract.                                                                                                        |
| Personal/org remote-storage reads                         | `BLOCKED_UNCONFIRMED` | Explicit paths exist behind the rejected management transport.                                                                     |
| Personal/org remote-storage writes                        | `REJECTED_OBSOLETE`   | Generic persistence writes are not approved.                                                                                       |
| Share/match compatibility resolution                      | `BLOCKED_UNCONFIRMED` | Legacy keys exist, but no independent safe Web resolver contract is confirmed.                                                     |
| Game create/join/quick-start/start and quiz-result writes | `REJECTED_OBSOLETE`   | Outside the read-heavy product and explicitly forbidden.                                                                           |
| Score list                                                | `REJECTED_OBSOLETE`   | Retired by the active product definition.                                                                                          |
| WeChat, `openid`, URL token, refresh-token handoffs       | `REMOVE_MINIAPP_ONLY` | Mini Program compatibility is not Web authority.                                                                                   |
| `/CALL`, `proxyRequest`, browser HMAC, query-token auth   | `REJECTED_OBSOLETE`   | Generic or secret-bearing transports are forbidden.                                                                                |

## Required consumers

- Endpoint and field authority:
  `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- Field-by-field coverage:
  `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- Request implementation rules:
  `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- Migration and target audit:
  `docs/migration/WEB_API_MIGRATION_BASELINE.json`
- Readiness:
  `docs/architecture/WEB_API_READINESS_MATRIX.json`
