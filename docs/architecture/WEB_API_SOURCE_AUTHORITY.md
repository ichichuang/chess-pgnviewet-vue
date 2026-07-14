# Web API Source Authority

Status: `ACTIVE_AUTHORITY`

Effective date: `2026-07-14`

## Authority

Only these read-only Web projects establish API bases, endpoint paths, request
payloads, response envelopes, authentication, request behavior, and production
evidence:

1. `/Users/cc/Work/neobv/Chess/pgnViewer`
2. `/Users/cc/Work/neobv/Chess/chess-main-overseas`

`/Users/cc/Work/neobv/Chess/pgnViewer-new` is authoritative only for board,
PGN, annotation, AI, workspace, layout, motion, and UI behavior. The target
repository owns the reconciled implementation.

A contract may enter runtime only when the Web sources establish the complete
browser behavior or an approved no-credential production probe establishes a
compatible public read. Browser-shipped constants and algorithms are public
compatibility inputs, not secrets; they must remain centralized and exact.

## Confirmed public reads

The confirmed chess origin is `https://wxapi.kaisaile.org`. No other runtime
base is authorized.

| Repository method   | Method and path                             |
| ------------------- | ------------------------------------------- |
| Tournament list     | `POST /liveproxy/GetActList`                |
| Tournament detail   | `POST /award/c-GetActDetail?token=&type=10` |
| Tournament groups   | `POST /liveproxy/GetActGroups`              |
| Tournament rounds   | `POST /award/c-GetMatchRoundlist`           |
| Tournament pairings | `POST /award/c-GetMatchPairlist`            |

On `2026-07-14`, direct no-credential HTTPS probes confirmed these five
request/response contracts. The fixed empty `token` parameter in the detail
path is part of the verified public path; it does not authorize dynamic
query-token authentication.

The big-screen display has no independent endpoint. It composes the confirmed
detail, group, round, and pairing repositories.

## Confirmed account lifecycle

`chess-main-overseas` establishes the browser password flow at the confirmed
chess origin:

- `POST /liveproxy/PostLoginByPhone` receives the account in `mobile` and
  `tel`, the hexadecimal MD5 password digest in `code` and `pwd`, both numeric
  type fields, and the tracked fixed `login_func` compatibility object.
- The same tracked browser request interceptor signs serialized JSON with
  `Digest`, `x-date`, and HMAC `Authorization` headers.
- Login success is `content.token` plus `content.uid`; failure text is read from
  `resp.msg`.
- `POST /ucenter/GetUserDetail` receives `showall`, `uid`, and the account token
  in the JSON body. `POST /ucenter/GetUserCenterInfo` receives the account token
  in the JSON body.
- The target persists only the strict Zod version 1 `kaisaile.auth.v1` record
  owned by `src/persistence/auth/authPersistence.ts`. Its data fields are
  `token`, `uid`, `accountLabel`, and `expiresAt`, with a maximum
  source-proven 43,200-second lifetime. Passwords and digests are
  submission-only. There is no refresh or remote logout call.
- HTTP 401 clears the local session and private state. HTTP 403 reports a
  permission failure without clearing a valid session. Logout is local.

The project owner validated the real-account login, both identity reads, and a
subsequent tournament read in a real browser against implementation commit
`95446fbc219e62e1e5eff715a23b9b67e379a009`. The current validation authority is
`.ai/reports/WEB_LOGIN_TOKEN_AUTH_FLOW_OWNER_REAL_ACCOUNT_VALIDATION_REPORT.json`.
No sensitive value is recorded there.

The exact tracked browser constants live only in
`src/api/legacyWebCompatibility.ts`. They are not environment credentials and
must not be duplicated.

## Browser deployment status

The production probes retained only status, envelope keys, field names, field
types, and row counts. They used no account, credential, signing material, or
cookie jar.

An upstream preflight and a POST carrying a localhost Origin returned no usable
cross-origin grant. Local browser validation therefore uses the development-only
Vite prefix `/__kaisaile_web`, a fixed upstream target, POST-only enforcement,
and the closed endpoint allowlist. Production output remains static and uses
the confirmed HTTPS origin directly.

Local development authentication transport and public tournament reads are
validated. The production browser origin remains unvalidated.

## Blocked capabilities

The following remain unavailable and issue no protected request:

- finished-game replay;
- cloud and shared-storage reads;
- hardware-board history and latest-position reads;
- live credential issuance and subscriptions;
- course, quiz, chessbook, score, personal-signup, and configuration reads.

Their observed source paths are not sufficient because authentication,
side-effect, exhaustive response, origin, or browser transport behavior is
incomplete. A later implementation requires new compatible evidence from both
Web authority scope and a real-browser deployment validation.

## Explicit prohibitions

The target must not contain or recreate:

- `/api/ksl`, `/CALL`, or `proxyRequest`;
- a Node API server, reverse proxy, BFF, edge handler, or invented production
  gateway;
- cookie-session, HttpOnly-session, CSRF-server, or session-vault designs;
- browser signing or fixed compatibility identity outside
  `src/api/legacyWebCompatibility.ts`, or generic browser Bearer injection;
- URL-token absorption, dynamic query-token authentication, or
  fingerprint-derived guest credentials;
- Mini Program API authority, write/admin calls, MQTT publish, mocks, fixtures,
  or synthetic success data.

These names appear here only to define permanent prohibitions. Historical
phase documents and rejected-source inventories do not remain in the
repository.

## Consumers

- Endpoint and field inventory:
  `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- Field coverage:
  `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- Request architecture:
  `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- Readiness:
  `docs/architecture/WEB_API_READINESS_MATRIX.json`
- Deployment:
  `docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md`
