# Production Deployment Boundary

Status: `ACTIVE_AUTHORITY`

## Confirmed facts

- The Web source identifies `https://wxapi.kaisaile.org` as the production
  chess API origin.
- The five public tournament reads respond to direct server-side HTTPS without
  credentials.
- On `2026-07-14`, upstream `OPTIONS` and `POST` responses for a localhost
  `Origin` supplied empty `Access-Control-Allow-Origin`,
  `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, and
  `Access-Control-Allow-Headers` values.
- Vite's development server is not a production server or deployment contract.

## Repository behavior

The repository ships static Vue assets and no production API server. It does
not define or assume:

- `/api/ksl`;
- `/CALL`;
- `proxyRequest`;
- a reverse proxy, BFF, edge function, or Node server;
- cookie-session login/session/logout handlers;
- upstream HMAC or shared credentials;
- a dynamic target or arbitrary HTTPS base.

`src/runtime/config/productionApi.ts` may expose only public, non-secret
configuration. A Vite-exposed variable is always browser-readable. It must
never contain an API secret, HMAC material, account token, MQTT credential,
cookie, or secret-bearing URL.

## Browser readiness

A browser deployment is API-ready only when one of these source-backed facts is
true and runtime evidence is recorded:

1. The application is served from the exact confirmed API origin; or
2. the API owner changes the upstream CORS policy and a real browser validates
   the exact target origin, methods, headers, and credential mode.

No such production browser contract is currently confirmed. Cross-origin
deployments must render the documented unavailable/error state and must not
substitute mock records or silent empty success.

## Authentication and credentials

Account login, replay token issuance, Cloudreve credentials, and MQTT
credentials are separate unresolved contracts. Production configuration must
not conflate them. Browser HMAC, hard-coded identity values, fingerprint guest
login, URL tokens, query-token auth, and MQTT publish are forbidden.

## Required production validation

- production build served as static assets, never Vite dev/preview;
- nonblank intended route with no Vite overlay or console-breaking error;
- actual browser network evidence for any capability claimed available;
- CORS and credential behavior observed from the real deployment origin;
- no secret values in source, built assets, URLs, logs, reports, or browser
  storage;
- loading, empty, unavailable, permission, retry, and error states remain
  truthful;
- typecheck, production build, governance, secret/mock scans, lint, formatting,
  Knip, JSON parsing, and dependency audits pass.

Until the browser boundary is independently confirmed, server-side endpoint
probes establish contract evidence only; they do not establish a usable browser
deployment.
