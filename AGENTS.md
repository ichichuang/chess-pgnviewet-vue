# AGENTS.md — 开赛了 Vue Chess Workspace

## Product and stage

This repository is the single-runtime Vue implementation of the 开赛了 chess teaching, PGN analysis, tournament commentary, replay, read-only live viewing, and venue-display product. It is not an administration console, generic dashboard, online-game lobby, mini-program replacement, cloud drive, or 3D-first product.

The product-design baseline is `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`; the page-design documentation package has been completed and is now active authority. The active implementation gate is `PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION`. Decisions `OD-01` through `OD-11` remain open and must stay visibly tracked; page implementation may use provisional values only when the owning decision remains explicit.

## Active authority order

Before changing UI, architecture, persistence, API, or product behavior, read:

1. `CLAUDE.md`
2. `.ai/skills/project-ui/SKILL.md`
3. `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`
4. `docs/product/OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md`
5. `docs/design/PRODUCT_UI_DESIGN_INDEX.zh-CN.md`
6. `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md`
7. the relevant target page specification under `docs/design/pages/**` and the global design documents it links
8. `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`
9. the relevant current `docs/product/**`, `docs/ui/**`, `docs/architecture/**`, and other active authorities
10. `docs/migration/SOURCE_PROVENANCE.md` when source evidence is required

`docs/design/**` is the active page-implementation authority for layout, region composition, information hierarchy, action priority, page and module states, interaction behavior, focus and keyboard behavior, touch behavior, scrolling, responsive compositions, component responsibilities, Naive UI mappings, implementation correction dependencies, and page-specific acceptance criteria. It remains subordinate to product, security, API, architecture, persistence, and Token authorities within their respective ownership scopes.

Current repository code and current authorities override older plans. `.ai/reports/**` is immutable implementation evidence, not active authority. Source projects are read-only evidence and cannot override current product, security, API, or architecture contracts.

## Page implementation workflow

Every page slice must:

1. identify the target page family and design-surface IDs from `docs/design/PRODUCT_SCREEN_INVENTORY.zh-CN.md`;
2. read the target page specification under `docs/design/pages/**` and all global design documents it links (`PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md`, `PRODUCT_GLOBAL_LAYOUT_SPEC.zh-CN.md`, `PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md`, `PRODUCT_GLOBAL_STATE_SPEC.zh-CN.md`, `PRODUCT_RESPONSIVE_SPEC.zh-CN.md`, `PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md`, `PRODUCT_NAIVE_UI_MAPPING.zh-CN.md`, `PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md`);
3. identify all affected `COR-*` entries in `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`;
4. classify every capability as one of `CURRENT_IMPLEMENTED`, `APPROVED_TARGET`, `CONTRACT_BLOCKED`, `OPEN_OWNER_DECISION`, or `PROHIBITED`;
5. preserve `OD-01` through `OD-11` as open and mark only provisional values allowed by the owning decision;
6. implement only the selected page slice and required shared prerequisites;
7. avoid unrelated refactors, reformatting, or renaming;
8. run the page-specific static and narrow browser acceptance path; and
9. close a `COR-*` item only with the evidence required by `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md` and `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`.

## Page-by-page product contract

- `/` is the unified board-centric workspace: contextual source navigation on the left, one dominant chessboard in the center, and task context on the right.
- `/competitions` owns anonymous public tournament discovery.
- `/competitions/:hdid` owns anonymous public tournament detail, group, round, pairing, and handoff actions.
- `/competitions/:hdid/display` owns an independent read-only venue display. It reuses the board and tokens but never imports the teaching workspace shell or analysis UI.
- `/login` owns the approved account session and safe return flow.
- Compatibility routes may create a sanitized typed handoff into the unified workspace or show a truthful unavailable state. They never render a second workspace.
- Ongoing live content is read-only and exposes no AI, engine evaluation, editable PGN, editable variations, source annotations, or write-back.
- Cloud, share, protected replay, hardware history/latest snapshot, live credential/subscription, and authoritative clock adapters remain abstract and blocked until real contracts exist.

Every page design must define page responsibility, user and task, current versus target capability, information hierarchy, component ownership, data and error states, responsive behavior, scroll ownership, keyboard/focus behavior, reduced motion, token usage, persistence boundary, and a narrow browser-validation plan.

## Architecture invariants

- Exactly one Vite root, Vue root, Vue Router owner, Pinia graph, TanStack Vue Query client, Axios owner, global token registry, and application shell.
- Vue 3 with strict TypeScript is the only application runtime. React and framework bridges are forbidden.
- One unified workspace and one framework-free chess, PGN, annotation, and analysis domain graph; modes and sources use typed adapters and conditional composition.
- Presentational components accept typed props and emit events. They do not import stores, repositories, or persistence adapters.
- External DTOs are mapped and Zod-validated inside repositories or source adapters before entering domain or UI code.
- Pinia owns client state. TanStack Vue Query is the sole server-read state boundary.
- Project-owned persistence adapters own only implemented, versioned records. Dexie owns approved structured non-secret persistence.
- `src/styles/tokens.css` is the only global token registry. Product and feature code contains no raw governed visual values or parallel token definitions.
- Naive UI appears only behind project-owned providers/adapters. It is not the product-component or token authority.
- GSAP and animated UI work must also obey `.ai/skills/gsap/SKILL.md`.

`pgnViewer-new` remains read-only evidence for reviewed board, PGN, annotation, analysis, workspace, layout, motion, visual, and domain behavior. It is not a current implementation gate, does not require mechanical migration, and does not authorize copying source-project infrastructure or automated tests.

## API, authentication, and security

- Only real confirmed production contracts may feed product surfaces. Mock, fixture, fake, sample, synthesized, and fallback success data are forbidden.
- Generic `/CALL`, `proxyRequest`, dynamic proxying, write/admin endpoints, MQTT publish, invented contracts, and silent fallback success are forbidden.
- `src/api/legacyWebCompatibility.ts` is the only approved owner of the tracked browser compatibility signer and fixed compatibility identity. No other browser file may duplicate signing constants or algorithms.
- Browser authentication state may persist only the strict 43,200-second `kaisaile.auth.v1` account-session record owned by `src/persistence/auth/authPersistence.ts`. Verified non-auth persistence remains limited to the current theme bootstrap, workspace-layout record, and sanitized workspace handoff owners documented in `docs/architecture/PERSISTENCE_ADR.md`.
- Passwords, password digests, signing secrets, duplicated auth records, auth values in URLs/router state/Dexie/persisted Query/workspace handoffs/PGN/annotations/AI, shared upstream credentials, MQTT credentials, secret-bearing URLs, and complete sensitive responses are forbidden.
- Live and protected remote data stays read-only. Import into local analysis requires an explicit user action and creates a distinct local copy.

## Source safety

The following roots are read-only evidence sources and must never be modified:

- `/Users/cc/Work/neobv/Chess/pgnViewer-new`
- `/Users/cc/Work/neobv/Chess/pgnViewer`
- `/Users/cc/Work/neobv/Chess/chess-main-overseas`
- `/Users/cc/Work/neobv/Chess/chess-pgnviewer`

Never inspect or copy environment files, credentials, certificates, keys, databases, browser state, logs, dependency stores, build output, generated tool caches, or unproven screenshots. Do not follow symlinks outside an approved source root.

## Validation and package policy

- No automated test files or automated test infrastructure may be created or retained. This includes unit, component, integration, snapshot, visual-regression, and E2E test files; Vitest, Vue Test Utils, jsdom test environments, Playwright/Cypress/Jest/Testing Library runners; fixtures; snapshots; coverage; test setup; and `test` package scripts.
- Run the repository governance checks appropriate to the change, then formatting, lint, Stylelint, Knip, `check:static`, `pnpm run typecheck`, and a production build. Do not run `pnpm test`.
- Visible UI changes additionally require one narrow real-browser validation of the intended route, nonblank DOM, absence of a Vite error overlay, absence of console-breaking errors, keyboard/focus behavior when affected, and a real interaction state change when applicable. Browser validation must not generate test artifacts, scripted suites, screenshot loops, or pixel measurements.
- pnpm is the sole package manager. `package-lock.json`, npm dependency management, Yarn, and Bun are forbidden.
- Stable dependency selection is evaluated as one compatible graph. Exceptions require current upstream evidence, an owner, a review trigger, and a removal condition.
- The current Vue toolchain uses official TypeScript 6.x until stable TypeScript programmatic API, Vue Language Tools, `vue-tsc`, and ESLint integration support TypeScript 7 and the full validation contract passes.

Accessibility, focus, reduced motion, token governance, scroll ownership, real-API truthfulness, security, and browser validation remain mandatory for every page slice.
