# API Boundary ADR

Status: `ACTIVE_AUTHORITY`

## Decision

The browser has one Axios owner and typed, endpoint-specific repositories. API
facts come only from the two Web sources named in
`WEB_API_SOURCE_AUTHORITY.md`.

The confirmed runtime boundary consists of:

- one fixed HTTPS chess origin;
- a closed set of repository-owned endpoint constants;
- strict endpoint request schemas and response-envelope schemas;
- explicit DTO-to-domain mapping;
- AbortSignal propagation and bounded timeout;
- normalized, redacted errors;
- TanStack Vue Query as the sole server-state owner;
- typed stable keys, explicit privacy metadata, deterministic retry, and
  private-only cleanup.

The tournament list, detail, groups, rounds, and pairings are the only
confirmed repository calls. The display repository composes the latter four;
it does not invent a display endpoint.

## Authentication

No complete browser-compatible account or protected replay contract is
confirmed. The application remains anonymous, renders a truthful unavailable
state, persists no credential material, and issues no protected request.

## Read policy

Only independently confirmed read operations may enter runtime repositories.
POST does not imply mutation when the source-confirmed operation is a read, but
the transport exposes no generic POST surface.

## Permanent exclusions

`/api/ksl`, `/CALL`, `proxyRequest`, arbitrary API bases, browser HMAC,
generic browser Bearer injection, URL-token absorption, query-token
authentication, Node/BFF/cookie-session infrastructure, write/admin endpoints,
and publish-capable live transports are forbidden. This paragraph is
prohibition text, not compatibility authority.

## Supporting authorities

- `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- `docs/architecture/WEB_API_READINESS_MATRIX.json`
- `docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md`
