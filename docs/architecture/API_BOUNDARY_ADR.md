# API Boundary ADR

Status: `ACTIVE_AUTHORITY`

Supersedes: the P1G/P1G1 same-origin `/api/ksl`, BFF, cookie-session, and
browser-Bearer assumptions.

## Decision

The target has one browser HTTP owner and explicit project repositories. API
facts come only from the two Web authorities named in
`WEB_API_SOURCE_AUTHORITY.md`.

The browser does not own a generic gateway. `/CALL`, `proxyRequest`, `/api/ksl`,
arbitrary `/api/*` prefixes, arbitrary HTTPS bases, browser HMAC, secret-bearing
URLs, and invented BFF/cookie-session handlers are forbidden.

## Confirmed boundary

- One private Axios instance: `src/api/client.ts`.
- One source-confirmed chess origin: `https://wxapi.kaisaile.org`.
- Repository-owned constant endpoint paths.
- Endpoint-specific request and response Zod schemas.
- DTO-to-domain mapping before Query or UI state.
- AbortSignal, bounded timeout, normalized errors, and no raw response caching.
- TanStack Vue Query is the sole server-state owner.
- Public/private Query metadata and private-only cleanup.

The confirmed public tournament endpoints and exact fields are recorded in
`WEB_API_ENDPOINT_INVENTORY.json`. Direct no-credential HTTPS verification
confirmed the endpoints but did not confirm cross-origin browser CORS. The
browser must therefore expose an unavailable/error state when deployed on a
different origin; this repository does not invent infrastructure to bypass it.

## Authentication boundary

The authoritative Web password-login source combines a real endpoint with a
disallowed `openid` compatibility field and rejected browser HMAC transport.
Password login is therefore `BLOCKED_UNCONFIRMED`.

- Remove URL-token absorption.
- Never persist a password or password digest.
- Do not create browser HMAC or a generic Bearer interceptor.
- Do not treat the account token as the chess-service replay token.
- Do not invent login/session/logout/refresh endpoints.
- Preserve local logout and scoped private-state cleanup.
- Keep protected replay unavailable until its separate guest/session token
  lifecycle is replaced by a verified Web contract.

## Read/write policy

Only confirmed read operations may enter runtime repositories. POST is not
treated as a write when the source-confirmed endpoint is a read, but generic
POST access is not exposed.

Game creation/join/start, quiz-result writes, Cloudreve writes, remote-storage
writes, hardware match mutation, admin, role, organization, survey, logging,
MQTT publish, and token-query chessbook calls are `REJECTED_OBSOLETE`.

## Supporting authorities

- `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- `docs/architecture/WEB_API_READINESS_MATRIX.json`
- `docs/migration/WEB_API_MIGRATION_BASELINE.json`
