# Technology Stack Decision

Status: `ACTIVE_AUTHORITY`  
Phase: `P0E_UI_FIRST_DELIVERY_AND_NO_AUTOMATED_TEST_GOVERNANCE_CLOSURE`

## Decision

The target is one Vue 3 application runtime. This decision supersedes the React-primary source decision at `/Users/cc/Work/neobv/Chess/chess-pgnviewer/docs/architecture/TECH_STACK_DECISION.md`, which is classified `DEPRECATED` for this target.

| Layer | Selected technology | P0 status |
| --- | --- | --- |
| Language | TypeScript strict | configured |
| Runtime | Vue 3 | one root |
| Build | Vite | one root |
| Routing | Vue Router | one foundation |
| Client state | Pinia | one foundation |
| Server state | TanStack Vue Query | sole approved boundary; not initialized in P0 |
| UI adapters | Project-owned Vue components; Naive UI only where canonical behavior requires it | empty adapter boundary |
| Motion | Vue transitions and GSAP | dependency only; no P0 motion |
| Chess domain | chess.js plus reviewed canonical framework-free logic | dependency only |
| Persistence | Dexie | dependency only |
| Runtime validation | Zod | dependency only |
| Automated tests | Not adopted | forbidden by P0E owner policy |
| Browser runtime validation | Real browser load/reload smoke for rendered changes | narrow validation only; no test files |

## Package manager

Use pnpm as the sole project package manager. `package-lock.json` is forbidden, and npm, Yarn, and Bun are forbidden for project dependency management. The previous npm baseline is historical and superseded by owner decision.

The project-local toolchain is pinned in `.mise.toml`:

- Node `26.5.0`
- pnpm `11.11.0`

The target is one Vue application and must not be converted into an artificial monorepo. `pnpm-workspace.yaml` may exist only as pnpm 11 project-local build-policy evidence and must not declare workspace packages.

## Owner delivery policy

The project prioritizes visible, user-facing interface delivery after P0E governance closure. No automated test files or automated test infrastructure may be created or retained. This includes Vitest, Vue Test Utils, jsdom as a test environment, Playwright, Cypress, Jest, Testing Library, test setup files, test fixtures, snapshots, coverage, automated E2E suites, and `test` package scripts.

The canonical source contains automated-test infrastructure, but the target intentionally does not adopt it under explicit owner policy. This difference does not change the Vue runtime architecture. The absence of automated tests does not permit weakening type checking, production build validation, API contracts, security boundaries, real-browser runtime validation, accessibility, token, focus, reduced-motion, scroll-ownership, or canonical-migration requirements.

## Dependency version policy

Stable latest versions are preferred, but dependency selection is evaluated as one complete compatible architecture graph, not as unrelated package maxima. The newest stable version that passes the required architecture contract is authoritative. Exceptions from independent package maxima require upstream evidence, explicit recording, owner, review trigger, and removal condition. Silent or unexplained downgrades remain forbidden.

The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects. `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active dependency during this compatibility period; adoption is a future gated upgrade only after stable TypeScript programmatic API support, stable Vue Language Tools support, stable `vue-tsc` support, full typecheck/build/browser validation, and owner acceptance.

The current ecosystem-compatible baseline is recorded in `docs/migration/DEPENDENCY_VERSION_BASELINE.json`, including:

- `vue 3.5.39`
- `vue-router 5.1.0`
- `pinia 3.0.4`
- `naive-ui 2.44.1`
- `gsap 3.15.0`
- `chess.js 1.4.0`
- `dexie 4.4.4`
- `zod 4.4.3`
- `@tanstack/vue-query 5.101.2`
- `vite 8.1.4`
- `@vitejs/plugin-vue 6.0.7`
- `typescript 6.0.3` as the real official TypeScript package for Vue SFC tooling
- `vue-tsc 3.3.7`
- `@vue/tsconfig 0.9.1`
- `@types/node 26.1.1`

The P0B independent-latest set blocked on `vue-tsc 3.3.7` requiring `typescript/lib/tsc` while `typescript 7.0.2` does not export that subpath. P0C configured the official Microsoft TypeScript 6 compatibility package under the `typescript` package name and retained TypeScript 7 under `typescript-7`, but `@volar/typescript 2.4.28` could not transform the compatibility package's `typescript/lib/tsc.js` shim and reported `Failed to locate tsc module path from shim`. P0D rejects that bridge for the current toolchain and adopts real official `typescript 6.0.3` with `vue-tsc 3.3.7`. Do not resolve future TypeScript 7 adoption by patching package exports, editing `node_modules`, bypassing `vue-tsc`, or adding a custom compiler wrapper.

## Constraints

- No React, React Router, TanStack Router, Zustand, XState, React Aria, Radix React, micro-frontends, iframes, or Web Component framework bridges.
- No Tailwind or second token system. CSS custom properties in `src/styles/tokens.css` are authoritative.
- Naive UI is never the product token authority and is consumed only through project adapters.
- No runtime mocks, product fixtures, fake APIs, sample tournaments, sample replay, fake live messages, fake AI output, or silent fallback success states.
- Dependencies present only for future architecture are not initialized until their feature gate passes.

## Validation authority

The minimum completion commands are `pnpm run typecheck` and `pnpm run build`, followed by one narrow real-browser runtime check for rendered changes. `pnpm test` must not exist and must not be run. Browser validation must inspect the intended route, nonblank DOM, no Vite error overlay, no console-breaking errors, and a real user interaction state change when the slice includes interaction.
