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

A contract may enter runtime only when the Web sources or an approved
no-credential production probe establish a complete compatible read. Conflicts
and incomplete credential lifecycles remain blocked.

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

## Browser deployment status

The production probes retained only status, envelope keys, field names, field
types, and row counts. They used no account, credential, signing material, or
cookie jar.

An upstream preflight and a POST carrying a localhost Origin returned no usable
cross-origin grant. Direct browser deployment from a different origin is
therefore unavailable. Server-to-server success is contract evidence, not
browser-deployment evidence.

## Blocked capabilities

The following remain unavailable and issue no protected request:

- password login and account detail;
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
- browser HMAC, browser-owned shared credentials, or generic browser Bearer
  injection;
- URL-token absorption, dynamic query-token authentication, hard-coded
  compatibility identities, or fingerprint-derived guest credentials;
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
