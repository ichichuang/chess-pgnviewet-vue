# Web Request Architecture Baseline

Status: `ACTIVE_AUTHORITY`

## Ownership

`src/api/client.ts` owns the only Axios instance. The instance is private to
the API boundary. Features, stores, routes, composables, and Vue components use
typed repositories only; raw Axios responses and transport DTOs never enter
Pinia or TanStack Vue Query.

## Base and endpoints

- The only runtime base is the source-confirmed
  `https://wxapi.kaisaile.org`.
- The production base and eight-second timeout are constants, not environment
  variables. Development uses only the fixed `/__kaisaile_web` Vite proxy.
- `src/api/endpoints.ts` owns the closed set of public and account endpoint
  constants.
- The transport accepts the endpoint union, not an arbitrary string path.
- Absolute URLs, protocol-relative URLs, traversal, backslashes, malformed
  encoding, control characters, dynamic bases, and generic tunnels fail closed.
- Vite owns one development-only, POST-only, fixed-target, allowlisted proxy.
  It adds no preview or production-server behavior.

## Transport

- Confirmed public reads use POST JSON with no cookies or account token.
- `src/api/legacyWebCompatibility.ts` applies the exact tracked browser signing
  algorithm to serialized JSON. Browser-shipped signing inputs are public
  compatibility constants and remain centralized.
- One Axios authentication interceptor adds the account token to JSON bodies
  only when an explicit protected repository opts in. It never modifies public
  requests or URLs.
- Every repository method accepts and forwards an `AbortSignal`.
- Timeouts are bounded from three to thirty seconds; the default is eight
  seconds and no current repository overrides it.
- Cancellation, timeout, network, unavailable, HTTP, authentication,
  permission, rate-limit, upstream-business, invalid-JSON, configuration, and
  contract-mismatch failures stay distinct.
- Errors expose no request configuration, headers, credential values, raw
  payloads, stacks, or sensitive upstream text.

## Contracts and mapping

- Every endpoint owns a strict Zod request schema.
- Every endpoint owns a Zod response-envelope schema.
- Response objects strip unknown fields; required fields and identifiers fail
  closed.
- A nonzero upstream business code is normalized before mapping.
- DTO-to-domain mapping is explicit and endpoint-specific.
- Verified empty arrays are valid only after the full envelope passes.
- Contract failure never becomes empty or synthesized data.

## Query boundary

- Query keys contain normalized primitives or normalized readonly filter
  objects.
- Every query declares public or private metadata.
- Query functions consume the framework-provided `AbortSignal`.
- Only transient network, timeout, service, rate-limit, and upstream failures
  retry, once.
- Authentication loss removes private queries and protected product state only.
- Public tournament data and local non-secret workspace state remain.
- Display polling stops when hidden, unmounted, cancelled, or deterministically
  unavailable.

## Unavailable capabilities

Protected replay, cloud/share, hardware, and live transports remain unavailable
until their separate read contracts are confirmed. Password login and the two
account identity reads are implemented through `authRepository`; they do not
authorize any other protected capability.

## UI states

Remote surfaces distinguish initial loading, background refresh, verified
empty data, permission denial, authentication requirement, deployment
unavailability, retryable failure, and non-retryable contract/configuration
failure. No state substitutes mock, sample, fallback, or synthesized data.
