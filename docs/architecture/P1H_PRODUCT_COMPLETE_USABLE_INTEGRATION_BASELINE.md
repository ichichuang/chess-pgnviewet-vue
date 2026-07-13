# P1H Product Complete Usable Integration Baseline

Status: `HISTORICAL_UI_ACCEPTANCE_API_SUPERSEDED`

API/auth supersession: `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`

Accepted board, PGN, annotation, AI, workspace, layout, theme, and product UI
evidence remains historical acceptance. API/auth/proxy completion claims are
not active authority.

Result: `P1H_PRODUCT_COMPLETE_USABLE_PASS`

## Scope decision

P1H integrates the already accepted P1A-P1G1 runtime into one usable product.
It does not replace the existing Vue bootstrap, Router, Pinia, QueryClient,
Axios client, board, PGN, annotation, Worker, token, or provider owners. It
does not introduce automated tests, a generalized persistence platform, a new
shell, fake data, or an unconfirmed transport.

## Usable product closure

- `/pgnViewer/` is the single board-centric workspace for PGN creation and
  import, legal move editing, variations, annotations, radial and wheel
  interaction, local AI analysis, replay, and truthful live-source states.
- `/competitions` commits filters explicitly and reads real production data
  through TanStack Vue Query and the typed product API boundary.
- `/competitions/:hdid` separates draft player search from committed server
  state, preserves group and round selection in the URL, and owns independent
  detail and pairing error/retry surfaces.
- `/competitions/:hdid/display` uses the same selected group and round contract
  for the read-only venue surface.
- Compatibility and pairing navigation use sanitized versioned handoffs into
  the workspace. The existing toolbar now exposes tournament and authentication
  navigation so no canonical journey is stranded.
- Protected replay is QueryClient-owned private server state. Authentication
  loss clears private queries, replay handoffs, protected PGN state, and active
  analysis work without deleting unrelated public or local work.
- API DTO mapping removes raw upstream payloads before values enter domain
  results or Query cache.

## Persistence classification

| State                               | Owner                                      | Retention                       | P1H behavior                                                                                                            |
| ----------------------------------- | ------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Theme bootstrap                     | Existing theme persistence owner           | Existing durable policy         | Preserved; no duplicate owner                                                                                           |
| Workspace layout                    | `workspaceLayoutPersistence.ts` with Dexie | Schema v1, 30 days              | Stores only panel, toolbar, board orientation/alignment, active tab, and PGN height; corrupt or expired data is deleted |
| Competition selection               | Vue Router query                           | Current URL/history             | Group and round survive refresh and browser navigation                                                                  |
| Sanitized public handoff            | Existing handoff owner                     | Existing bounded session policy | Preserved when private replay handoffs are cleared                                                                      |
| Public API data                     | TanStack Vue Query                         | Memory cache                    | No raw transport payloads retained                                                                                      |
| Protected replay API data           | TanStack Vue Query with `privacy: private` | Memory cache                    | Removed on logout or authentication failure                                                                             |
| Auth session                        | Existing P1G session owner                 | Existing accepted policy        | No new credential store; invalid login clears stale session state                                                       |
| Live payloads and board annotations | Runtime owners                             | Memory only                     | Never written to the layout record                                                                                      |

The layout schema rejects unknown, corrupt, and expired records. P1H deliberately
does not add cross-tab synchronization, drafts, broad preference storage, or a
general repository abstraction.

## Server-state and transport ownership

`src/api/queryClient.ts` owns versioned product query keys. Public competition
queries and private replay use the same QueryClient and pass existing
cancellation signals to typed API functions. `src/api/client.ts` remains the
only Axios/XHR owner; there is no native `fetch`, direct XHR, exported Axios
instance, dynamic proxy target, generic forwarder, or browser secret.

The local development route `/api/ksl` remains fixed to
`https://wxapi.kaisaile.org`. Production requirements are recorded in
`docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md`.

## Lifecycle and failure closure

- Leaving the workspace disposes analysis Workers; returning initializes the
  pool before reusing a same-position result, preventing an uninitialized
  Worker/cache state.
- Protected replay replacement cancels the previous Query and cannot retain a
  protected PGN after authentication loss.
- Draft filters do not issue requests. Committed list, player, group, and round
  state has one request owner and stable versioned keys.
- Network, timeout, permission, invalid-contract, empty, unavailable, and retry
  states remain distinct. No failure path falls back to mock data.
- Invalid stored handoffs and layout records fail closed and are removed.

## Browser acceptance

Real-browser validation used the real same-origin `/api/ksl` development route
and production data from competition `47347`:

- list: 20 production rows from a total of 18,360; committed search returned
  four matching rows;
- detail: two groups, three rounds, two selected-round pairings; player search
  returned one matching row; URL selection survived reload;
- display: two selected-round rows with the same URL-owned selection;
- workspace: one board, PGN editing, legal mainline and variation moves,
  annotation undo/redo/clear, Worker analysis, cancellation, and route remount;
- compatibility routes: sanitized workspace redirects with truthful unavailable
  messages where the upstream contract is not confirmed;
- protected replay: unauthenticated access was denied before a protected result
  could load;
- responsive profiles: 1440x900, 1920x1080, 768x1024, 1024x768, 390x844,
  and 844x390 without document overflow or duplicate board/Worker ownership;
- keyboard focus, 44px coarse/compact targets, system theme, nonblank DOM,
  absence of Vite overlay, and clean-run absence of console errors were verified.

Malformed replay DTO input was rejected as `contract-mismatch`. A deliberate
network interruption produced the owned error state and recovered after the
same-origin service returned. The accepted P1G1 Axios timeout, cancellation,
permission, and retry evidence remains valid because P1H preserves that client
owner and contract.

Owner credentials were not available. Successful credentialed login,
protected replay success, authenticated logout, and post-logout server denial
are not claimed. MQTT/electronic-board live remains intentionally unavailable
pending an owner-approved read-only contract. Neither boundary is replaced by
fixtures or fabricated credentials.

## Deferred post-product foundations

The following are explicitly post-product reviews, not missing P1H product
paths: comprehensive Query policy and repository consolidation, security-header
hardening, global error/feedback and i18n frameworks, UI adapter expansion,
broad Dexie storage and cross-tab synchronization, draft/preferences platform,
comprehensive accessibility and motion systems, foundation preview, and broad
multi-route integration infrastructure. Any later work must preserve the P1H
runtime owners and start only from real evidence.

## Acceptance

P1H is accepted as `PRODUCT_COMPLETE_USABLE`. The remaining work is
post-product foundation hardening, deployment-environment validation, and
owner-dependent live/auth evidence; it is not another product migration phase.
