# AGENTS.md — 开赛了 Vue Chess Workspace

## Project identity

This repository is the single-runtime Vue implementation of the 开赛了 chess teaching, PGN analysis, tournament viewing, replay, live spectator, and big-screen product. It is not an admin console, generic dashboard, mini-program replacement, online-game lobby, or 3D-first product.

## Required pre-reads

Before changing UI, architecture, persistence, API, or migration code, read:

1. `CLAUDE.md`
2. `.ai/skills/project-ui/SKILL.md`
3. relevant `docs/product/**`
4. relevant `docs/ui/**`
5. relevant `docs/architecture/**`
6. the latest applicable implementation-gate report under `.ai/reports/`

## Architecture invariants

- Exactly one Vite root, Vue root, Vue Router foundation, Pinia foundation, global token registry, and application shell.
- Vue 3 + TypeScript strict is the only application runtime. React and framework bridges are forbidden.
- `pgnViewer-new` is the canonical visual, interaction, and active teaching-runtime migration source. P0 copies no runtime feature code.
- The target follows the canonical Vue architecture from `pgnViewer-new`: one Vue bootstrap, one Router owner, one Pinia owner, one style/token entry model, Vite worker-compatible bundling, and Vite asset import handling. The canonical automated-test model is intentionally not adopted under the P0E owner policy.
- One unified board-centric workspace; mode/source differences use typed adapters and conditional composition, not duplicate shells.
- Framework-free chess, PGN, annotation, and analysis domains remain independent of Vue UI.
- Pinia owns client state. TanStack Vue Query is the sole approved server-state boundary.
- Dexie owns later structured persistence; Zod validates persisted and transport data at boundaries.
- Naive UI may appear only behind project-owned Vue UI adapters where canonical behavior requires it. It is not the token or product-component authority.
- `src/styles/tokens.css` is the only global token registry. Feature files must not contain raw colors or parallel token definitions.
- GSAP animation, animated board interaction, and later animated UI work must read and obey `.ai/skills/gsap/SKILL.md` in addition to the project UI authority.
- Browser code never stores upstream credentials, HMAC secrets, auth tokens, MQTT credentials, or secret-bearing URLs.
- Generic `/CALL`, `proxyRequest`, write/admin endpoints, MQTT publish, invented contracts, and mock/fake runtime fallbacks are forbidden.

## Source safety

The following roots are read-only evidence sources and must never be modified:

- `/Users/cc/Work/neobv/Chess/pgnViewer-new`
- `/Users/cc/Work/neobv/Chess/pgnViewer`
- `/Users/cc/Work/neobv/Chess/chess-pgnviewer`

Never inspect or copy environment files, credentials, certificates, keys, databases, browser state, logs, dependency stores, build output, caches, generated Serena caches, or unproven screenshots. Do not follow symlinks outside an approved source root.

## Implementation gates

- P0 is baseline-only: no teaching, board, PGN, AI, tournament, auth, gateway, persistence, or settings feature implementation.
- P1 product UI migration remains blocked until `PRODUCT_UI_MIGRATION_READY` is set by `docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md`; P0E remains accepted but is no longer the only pre-product gate.
- Later feature migration requires an approved closure node, source provenance, architecture compatibility, mandatory typecheck/build validation, narrow real-browser runtime evidence, and a narrow implementation report.
- Canonical runtime feature migration must be mechanical before refactoring: preserve canonical layout, interaction, density, board focus, panel geometry, keyboard behavior, and motion before any refactor.
- Stable latest versions are preferred, but dependency selection is evaluated as one complete compatible architecture graph, not as unrelated package maxima. The newest stable version that passes the required architecture contract is authoritative.
- Exceptions from independent package maxima require upstream evidence, explicit recording, owner, review trigger, and removal condition. Silent or unexplained downgrades remain forbidden.
- The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects.
- `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active project dependency during this compatibility period.
- TypeScript 7 adoption is a future gated upgrade only after the stable TypeScript programmatic API required by Vue tooling exists, stable Vue Language Tools and `vue-tsc` support is released, full typecheck/build/browser validation passes, and the owner accepts the transition.
- Presentational components accept typed props and emit events; they do not import Pinia stores or repositories.
- External DTOs are mapped and Zod-validated inside repository/source adapters before entering domain or UI code.
- Live/replay data is read-only; import into analysis requires explicit user action.
- The project prioritizes visible, user-facing interface delivery through the product-first gate sequence defined in `docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md`.
- No automated test files or automated test infrastructure may be created or retained. This includes unit, component, integration, snapshot, visual-regression, and E2E test files; Vitest, Vue Test Utils, jsdom test environments, Playwright/Cypress/Jest/Testing Library runners; fixtures; snapshots; coverage; test setup; and `test` package scripts.
- UI changes require one narrow real-browser runtime validation of the intended route, nonblank DOM, absence of Vite error overlay, absence of console-breaking errors, and a real user interaction state change when the slice includes interaction. Browser validation must not generate test files, fixtures, snapshots, scripted E2E suites, screenshot loops, or pixel measurements.
- Accessibility, focus, reduced-motion, token, scroll-ownership, real-API, security, and canonical-migration requirements remain mandatory.

## Validation

Use pnpm and the repository scripts:

- `pnpm run typecheck`
- `pnpm run build`

Do not run `pnpm test`; no `test` script is permitted. Production build validation must include authoritative Vue SFC type checking. Visible UI changes additionally require the narrow real-browser runtime validation described above.

pnpm is the sole project package manager. `package-lock.json` is forbidden. npm, Yarn, and Bun are forbidden for project dependency management.

Run the narrowest applicable check first. Do not use Git commands unless the user explicitly requests a Git operation.
