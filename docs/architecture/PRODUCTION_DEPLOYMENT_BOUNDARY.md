# Production Deployment Boundary

Status: `ACTIVE_AUTHORITY`

## Confirmed facts

- The production chess origin is `https://wxapi.kaisaile.org`.
- Five public tournament reads respond to direct no-credential HTTPS.
- A `2026-07-14` preflight and POST with a localhost Origin returned no
  usable cross-origin grant.
- Vite development and preview servers are validation tools, not production
  servers.

## Repository output

The repository builds static Vue assets. It contains no application server,
proxy, edge handler, credential bridge, dynamic upstream target, or public API
configuration variable. The browser bundle owns no secret.

The obsolete `/api/ksl`, `/CALL`, `proxyRequest`, Node/BFF,
cookie-session, CSRF/session-vault, browser HMAC, generic Bearer, URL-token, and
query-token designs are permanently forbidden. This is explicit prohibition
text only.

## Browser readiness

A production browser deployment may claim API availability only when:

1. the application is served from the exact confirmed API origin; or
2. the API owner grants the exact deployed origin, method, headers, and
   credential mode and a real browser validates them.

No such browser contract is currently recorded. Other origins must render the
documented unavailable state without sending a request or substituting data.

## Validation

Production acceptance requires:

- a fresh production build;
- the intended route rendered with a nonblank DOM;
- no Vite error overlay or console-breaking error;
- a real interaction state change when the slice is interactive;
- actual browser network evidence for any claimed available remote capability;
- no secret values in source, assets, URLs, reports, logs, or browser storage;
- truthful loading, refresh, empty, unavailable, permission, retry, and
  contract-error states;
- formatting, lint, Stylelint, Knip, governance, JSON parsing, dependency
  audit, typecheck, and production build success.
