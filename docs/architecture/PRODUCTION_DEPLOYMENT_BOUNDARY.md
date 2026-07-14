# Production Deployment Boundary

Status: `ACTIVE_AUTHORITY`

## Confirmed facts

- The production chess origin is `https://wxapi.kaisaile.org`.
- Five public tournament reads respond to direct no-credential HTTPS.
- A `2026-07-14` preflight and POST with a localhost Origin returned no usable
  cross-origin grant, so localhost validation requires the fixed Vite proxy.
- Vite development and preview servers are validation tools, not production
  servers.

## Repository output

The repository builds static Vue assets. It contains no application server,
edge handler, credential bridge, dynamic upstream target, or public API
configuration variable. The browser bundle owns no secret.

`vite.config.ts` owns one development-only proxy at `/__kaisaile_web`. It has a
fixed `https://wxapi.kaisaile.org` target, accepts POST only, and rejects paths
outside the eight confirmed public/account endpoints. It is absent from the
production output and is not a production server.

The obsolete `/api/ksl`, `/CALL`, `proxyRequest`, Node/BFF,
cookie-session, CSRF/session-vault, generic Bearer, URL-token, and query-token
designs are permanently forbidden. The tracked browser signer is confined to
the centralized compatibility adapter.

## Browser readiness

A production browser deployment may claim API availability only when:

1. the application is served from the exact confirmed API origin; or
2. the API owner grants the exact deployed origin, method, headers, and
   credential mode and a real browser validates them.

Production deployments use the exact confirmed HTTPS origin. The owner has
validated real-account login, identity reads, and a post-login tournament read
through the local development transport. The production browser origin remains
unvalidated and cannot claim availability until its exact origin and transport
pass a real-browser check.

## Validation

Production acceptance requires:

- a fresh production build;
- the intended route rendered with a nonblank DOM;
- no Vite error overlay or console-breaking error;
- a real interaction state change when the slice is interactive;
- actual browser network evidence for any claimed available remote capability;
- no sensitive values in source, assets, URLs, reports, or logs, and no browser-storage authentication data except the strict 43,200-second `kaisaile.auth.v1` record owned by `src/persistence/auth/authPersistence.ts`;
- truthful loading, refresh, empty, unavailable, permission, retry, and
  contract-error states;
- formatting, lint, Stylelint, Knip, governance, JSON parsing, dependency
  audit, typecheck, and production build success.
