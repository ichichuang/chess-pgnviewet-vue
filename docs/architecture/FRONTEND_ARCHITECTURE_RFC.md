# Frontend Architecture RFC

Status: `ACTIVE_AUTHORITY`

## Runtime topology

The application has one `index.html`, one `src/main.ts` Vue mount, one router module, one Pinia graph, one QueryClient, one Axios owner, one token registry, and one application shell. The accepted runtime follows the canonical Vue architecture from `pgnViewer-new`: one Vite root, Vue bootstrap, Router owner, Pinia owner, style/token entry model, Vite worker-compatible bundling, and Vite asset import handling. Modes and sources compose typed adapters inside the unified teaching workspace. Parallel roots, teaching workspaces, boards, PGN engines, AI engines, state graphs, token systems, and automated-test infrastructure are forbidden.

pnpm is the sole package manager. `package-lock.json`, npm dependency management, Yarn, and Bun are forbidden.

## Layers

```text
src/
  router/      route records and navigation policy
  stores/      Pinia foundation and feature-owned stores
  styles/      the single token registry and global styles
  ui/          project-owned presentational Vue adapters
  types/       shared typed contracts
  views/       route-level composition only
  features/*/domain/  current framework-free chess/PGN/annotation/analysis logic
  features/           current feature containers, views, components, and composables
  api/                current Axios client, repositories, DTO mapping, Query, and auth boundaries
```

- Feature-local `domain/` modules import no Vue, Pinia, UI, router, storage, or transport code.
- `ui/` imports no feature store or repository.
- Feature containers may consume their own Pinia store, domain contracts, project UI adapters, and typed repositories.
- Cross-feature access uses typed public contracts; direct cross-store mutation is forbidden.
- App/router modules compose features but do not own domain behavior.

## State boundaries

| State                         | Owner                                 | Persistence                                                                                       |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Client interaction/session    | feature-owned Pinia store             | categorized Dexie record when approved                                                            |
| Server reads                  | typed repository + TanStack Vue Query | re-fetch by default; sensitive cache never persists                                               |
| Live transport                | explicit service/composable           | memory only                                                                                       |
| Auth                          | `src/stores/auth.ts` Pinia owner      | strict 43,200-second `kaisaile.auth.v1` record owned by `src/persistence/auth/authPersistence.ts` |
| Chess/PGN/annotation/analysis | framework-free domain                 | current active state in memory; target records require an explicit approved versioned adapter     |

## I/O boundary

Feature and UI code never call `fetch`, MQTT, Cloudreve, upstream services, `/CALL`, or `proxyRequest` directly. Repositories map confirmed DTOs to domain objects, validate with Zod, and expose explicit unavailable/error states. Unconfirmed capabilities remain blocked; they are not replaced by mock success data.

The browser uses one project-owned Axios client and explicit repositories. The
only confirmed chess API origin is `https://wxapi.kaisaile.org`. Local browser
validation uses the fixed, endpoint-allowlisted Vite development proxy because
the upstream does not grant localhost cross-origin requests. The repository
does not invent production handlers, a BFF, cookie sessions, `/api/ksl`,
`/CALL`, `proxyRequest`, or server-side credential ownership. The exact tracked
browser signer and fixed login compatibility identity are centralized in one
adapter; URL-token and query-token authentication remain forbidden. See
`WEB_REQUEST_ARCHITECTURE_BASELINE.md`.

## Source evidence and extension rule

`pgnViewer-new` remains read-only evidence for reviewed teaching, board, PGN, annotation, analysis, workspace, layout, motion, visual, and framework-free domain behavior. The current product blueprint and target runtime own product and implementation decisions. Source evidence does not impose a migration sequence, closure node, automated-test model, or source-project infrastructure.

Any extension must start from the page responsibility and current target owners, then verify imports, consumers, styles, assets, framework compatibility, unsafe-boundary removal, typecheck/build validation, and narrow real-browser runtime evidence. Runtime source is never bulk-copied. Stable dependencies are evaluated as one compatible architecture graph; exceptions require upstream evidence, an owner, a review trigger, and a removal condition.

The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects. `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active dependency during this compatibility period; adoption is a future gated upgrade only after stable TypeScript programmatic API support, stable Vue Language Tools support, stable `vue-tsc` support, full typecheck/build/browser validation, and owner acceptance.

`/Users/cc/Work/neobv/Chess/pgnViewer` and
`/Users/cc/Work/neobv/Chess/chess-main-overseas` are the only read-only Web
API/auth/request/environment/production authorities.
`/Users/cc/Work/neobv/Chess/pgnViewer-new` remains the board, PGN, annotation,
AI, workspace, layout, motion, visual, and domain authority.
`/Users/cc/Work/neobv/Chess/chess-pgnviewer` and Mini Program API material are
non-authoritative for Web API work.

## Error and lifecycle behavior

- Loading, empty, blocked, stale, and error states stay inside the owning module and preserve outer geometry.
- Cancellable work exposes cancellation and stale-result protection.
- Live state is read-only and transient; replay/analysis import is explicit.
- Unknown or invalid persisted/transport data fails closed and is never coerced into fabricated product state.

## Validation ladder

1. Type checking and import-boundary audits.
2. Production build with authoritative Vue SFC type checking.
3. Narrow real-browser route/DOM/overlay/console/interaction checks for rendered changes.

Automated unit, component, integration, snapshot, visual-regression, and E2E tests are not part of the active target. Browser validation must inspect the intended route, nonblank DOM, no Vite error overlay, no console-breaking errors, and a real user interaction state change when the slice includes interaction. It must not create test files, fixtures, snapshots, scripted E2E suites, screenshot loops, or pixel measurements.
