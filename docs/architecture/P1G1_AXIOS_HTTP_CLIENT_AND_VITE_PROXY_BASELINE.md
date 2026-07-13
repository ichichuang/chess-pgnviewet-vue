# P1G1 Axios HTTP Client and Vite Proxy Baseline

Status: `HISTORICAL_SUPERSEDED`

Superseded by: `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`

This file preserves P1G1 execution history. `/api/ksl`, generic browser Bearer
injection, and inferred production proxy behavior are not active authority.

## Owner decision

P1G1 corrects the completed P1G transport boundary before P1H starts. Auth,
tournament, replay, compatibility, board, PGN, Router, Pinia, Zod, and TanStack
Vue Query behavior remain owned by their existing P1G modules. Native `fetch`
is no longer an approved production browser transport.

## Dependency decision

- Axios `1.18.1` is the exact stable release selected by `axios@latest` on
  2026-07-13.
- `package.json` and `pnpm-lock.yaml` resolve one Axios version.
- Axios is the only direct HTTP-client dependency.
- The browser adapter is explicitly `xhr`; Axios' optional fetch adapter is not
  selected.

## Transport architecture

`src/api/client.ts` owns one private Axios instance. Its defaults are:

- `baseURL: productionApiConfig.chessApiBase`;
- `withCredentials: true`;
- JSON `Accept` and `Content-Type` headers;
- `productionApiConfig.requestTimeoutMs`;
- `responseType: json` with strict JSON parsing;
- absolute URL rejection and explicit XHR adapter selection.

`requestJson` remains the only public generic request function. It accepts
typed method, body, signal, timeout, auth mode, and exact configured-base input.
The raw Axios instance is not exported. Feature views, Pinia stores, replay
loading, Router integration, and Vue Query do not import Axios.

## Interceptor ownership

The request interceptor:

- accepts only safe relative paths;
- rejects path traversal, malformed encoding, protocol-relative paths,
  backslashes, control characters, and dynamic bases;
- attaches only the documented JSON headers and optional Bearer header;
- treats requests as public by default;
- reads the current session token at request time from
  `src/persistence/auth/sessionPersistence.ts` only for `session` or
  `session-required` requests;
- supports a narrow explicit token override without persisting or logging it;
- rejects authentication on explicitly public requests.

The response interceptor returns `response.data` without applying endpoint
envelope rules. It maps failures to `ApiClientError` and never exposes Axios
request config, headers, cookies, passwords, token values, complete payloads,
or internal stacks. Endpoint-specific envelope handling remains in
`src/api/auth.ts` and `src/api/productMappers.ts`.

Both interceptor identifiers are ejected during Vite hot-module disposal, so
re-evaluation cannot accumulate handlers. No automatic token refresh, request
replay, or retry behavior was added to the HTTP client.

## Authentication, cancellation, timeout, and errors

- Public auth, tournament, and compatibility requests carry no Bearer header.
- Protected replay uses `auth: session-required`; it reads the current session
  through the existing auth persistence owner.
- Axios receives the existing `AbortSignal` from Vue Query or the replay loader.
- `ERR_CANCELED` maps to `cancelled`; it is not reported as timeout or network.
- `ECONNABORTED` and `ETIMEDOUT` alone map to `timeout`.
- HTTP mapping distinguishes authentication required, permission denied, rate
  limited, service unavailable, upstream failure, and other HTTP failure.
- Malformed JSON, network, configuration, contract mismatch, and endpoint
  upstream errors keep distinct taxonomy entries.
- Upstream messages are length-limited, control-character stripped, and
  rejected when they contain sensitive-field vocabulary.

## Zod and Vue Query boundaries

The generic client validates only the transport-level unknown JSON value. Zod
schemas and DTO/domain mapping remain in the existing auth and product API
boundaries. TanStack Vue Query remains the server-state owner and continues to
call typed functions from `src/api/productApi.ts` with its cancellation signal.

## Vite local-development proxy

`vite.config.ts` owns one fixed development proxy:

- browser prefix: `/api/ksl`;
- upstream: `https://wxapi.kaisaile.org`;
- `changeOrigin: true`;
- `secure: true`;
- rewrite: remove only the leading `/api/ksl` prefix.

Therefore `/api/ksl/liveproxy/GetActList` maps exactly to
`https://wxapi.kaisaile.org/liveproxy/GetActList`. The proxy has no dynamic
target, wildcard upstream, generic `/CALL`, `proxyRequest`, credential
forwarder, request-body logger, or secret logger. Axios owns the documented
8-second default request timeout, so no duplicate proxy timeout is configured.

The Vite proxy is development-only. Deployed production hosting must provide
the same restricted same-origin `/api/ksl` route, or
`VITE_KSL_CHESS_API_BASE` must select an approved browser-readable HTTPS API
base. `VITE_KSL_MAIN_API_BASE` and `VITE_KSL_REQUEST_TIMEOUT_MS` validation is
unchanged. Production must not assume Vite's development proxy exists.

## Governance

The architecture scanner now blocks:

- any authored native `fetch` call;
- any authored `XMLHttpRequest` use;
- any direct Axios import outside `src/api/client.ts`;
- generic `/CALL` and `proxyRequest` patterns even inside `src/api`.

The exact implementation allowlist contains only `src/api/client.ts` for Axios
and auth-header ownership. An external negative probe confirmed all three raw
transport rules fail closed.

## Affected consumers

- `src/api/auth.ts`: unchanged public `requestJson` login contract.
- `src/api/productApi.ts`: public tournament calls remain public; protected
  replay now declares `session-required` and no longer reads auth state itself.
- Product API views: unchanged typed Vue Query functions and scoped states.
- `src/features/teaching-workspace/useRemoteReplayLoader.ts`: unchanged explicit
  AbortController and route-change cancellation.
- `src/stores/auth.ts`, `src/router/index.ts`, and
  `src/persistence/auth/sessionPersistence.ts`: contracts preserved.

## Validation evidence

- Dependency, architecture, and Vue SFC type checks passed after correction.
- Local `pnpm dev` proxied a real production `GetActList` response through
  same-origin `/api/ksl`; the browser loaded 20 production rows.
- Local browser validation covered unauthenticated workspace startup,
  competition filtering, detail groups/rounds/pairings, compatibility handoff,
  deliberately invalid non-secret login, cancellation, timeout, permission,
  unavailable, and rapid replacement states with no Vite overlay or console
  error.
- The production bundle was built outside the repository and served behind an
  external restricted same-origin proxy.
- System Chrome DevTools evidence recorded five production API requests as
  resource type `XHR`, all same-origin under `/api/ksl`, all HTTP 200, with no
  browser request to an uncontrolled target.
- Production browser validation covered `/pgnViewer/`, `/competitions`,
  `/competitions/47347`, replay handoff, and compatibility handoff; light,
  dark, and system themes; reduced motion; desktop, tablet, 390x844 mobile, and
  844x390 landscape. Vite overlay, console error, runtime exception, document
  overflow, request loop, and stale-response evidence were zero.
- Successful authenticated login and protected replay remain unclaimed because
  owner credentials were unavailable.

## Next phase

The next required phase remains
`P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_AND_ACCEPTANCE`. P1H has not started.
