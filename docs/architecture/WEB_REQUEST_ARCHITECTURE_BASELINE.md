# Web Request Architecture Baseline

Status: `ACTIVE_AUTHORITY`

## Boundary

The browser runtime has one Axios owner: `src/api/client.ts`. The instance is
private. Features, views, stores, routes, and composables call typed project
repositories only; raw Axios responses never enter Pinia, TanStack Vue Query,
or Vue components.

## Base and path governance

- The only confirmed chess Web API origin is
  `https://wxapi.kaisaile.org`.
- A runtime base must equal a source-confirmed HTTPS base. Arbitrary HTTPS
  hosts and arbitrary same-origin `/api/*` prefixes are invalid.
- Endpoint paths are repository-owned constants. Callers cannot supply a
  dynamic path or base.
- Absolute paths, protocol-relative paths, traversal, backslashes, malformed
  encoding, control characters, `/CALL`, and generic tunnels fail closed.
- Vite owns no API proxy. Production hosting behavior is not inferred from a
  development server.

## Transport

- JSON request and response handling is centralized.
- Default timeout is eight seconds, matching the `pgnViewer` Web request owner;
  endpoint overrides require recorded evidence and may not exceed thirty
  seconds.
- Every repository method accepts an `AbortSignal` and forwards it to Axios.
- Cancellation, timeout, network, CORS/unavailable, HTTP, permission, auth,
  rate-limit, upstream-business, invalid-JSON, configuration, and
  contract-mismatch failures remain distinct.
- Errors expose no request config, headers, credential values, raw payloads,
  stacks, or sensitive upstream text.
- Public tournament requests send no browser HMAC, bearer token, query token,
  account ID, cookie requirement, or invented compatibility fields.

## DTO and repository rules

- Each endpoint owns a Zod request schema and a Zod response-envelope schema.
- Schemas name source-confirmed fields and types; recursive generic envelope
  searches and speculative alias lists are forbidden.
- Unknown upstream fields are stripped at the boundary. Required identifiers
  and envelope structures fail closed.
- DTO-to-domain mapping is explicit and endpoint-specific.
- UI and Query caches contain domain models only.
- A business `resp.err` other than zero is normalized before mapping.
- Empty arrays are valid empty results only after the endpoint envelope passes
  validation. Contract failure is never converted to an empty list.

## Authentication

- URL-token absorption and token-bearing route cleanup are removed, not
  retained as compatibility behavior.
- Passwords and password digests exist only in the submitting call stack and
  are never persisted, logged, cached, reported, or placed in a URL.
- Browser HMAC, signing material, upstream shared credentials, guest
  fingerprints, and hard-coded identity values are forbidden.
- No cookie/BFF/session endpoint is invented.
- Until the non-`openid`, non-HMAC Web login contract is verified, login and
  protected replay expose an unavailable state and issue no protected request.
- A later accepted session owner must centralize minimum state, validate
  restoration, honor a source/server expiry when present, clear on HTTP 401,
  distinguish HTTP 403 without escalating privileges, and provide local logout
  when no remote logout exists.
- Logout/auth loss clears only private Query entries, protected replay,
  protected handoffs, and active analysis. Public local PGN work, themes, and
  public tournament state remain.

## TanStack Vue Query

- Query keys contain normalized primitives or readonly normalized filter
  objects; `unknown` key parameters are forbidden.
- Public and private cache metadata is explicit.
- Query functions consume the framework-provided `AbortSignal`.
- Retry excludes cancellation, contract/configuration errors, authentication,
  permission, and other deterministic 4xx failures.
- Logout/auth loss removes private entries only. Public tournament reads are
  not erased.
- Display polling is read-only and stops while unavailable, hidden, or
  unmounted through Query lifecycle/cancellation.

## UI state contract

Every remote surface distinguishes:

- initial loading;
- refresh without discarding current data;
- verified empty result;
- permission denied;
- authentication required;
- source-confirmed capability unavailable in this deployment;
- retryable network/service failure;
- non-retryable contract/configuration failure.

No state may render mock, sample, fallback, or synthesized success data.

## Current production limit

The five public tournament endpoint contracts are verified, but the confirmed
upstream currently supplies no usable cross-origin browser CORS grant. A build
hosted on a different origin must render the unavailable/error contract. The
repository does not create a proxy to make that limitation disappear.
