# Product UI Migration Gate Baseline

Status: `PRODUCT_UI_MIGRATION_READY`
Phase: `PRODUCT_UI_MIGRATION_GATE_REVIEW_AFTER_ACTIVE_WRITER_RESOLUTION`
Decision date: `2026-07-12`
Next phase: `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`

## Decision

The active product objective is `PRODUCT_COMPLETE_USABLE`. The former
`FOUNDATION_COMPLETE_READY_FOR_PRODUCT_UI` gate remains superseded by
`docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md`. The replacement gate,
`PRODUCT_UI_MIGRATION_READY`, is granted only for starting the P1 canonical
product UI migration sequence. It does not authorize implementation of any P1
slice inside this gate review.

The gate review verifies that the target has the minimum foundation needed to
start product UI migration without forcing immediate rewrites of the Vue root,
Router, Pinia graph, token registry, theme engine, or Naive UI provider.

## Reviewed Requirements

| Requirement                 | Evidence                                                                                                                                                                         | Result |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Target path safety          | `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue` is the real, non-symlink Git root                                                                                               | Pass   |
| Git and remote safety       | `main`, authorized `origin`, local `HEAD`, `origin/main`, and live remote `main` synchronized before gate changes                                                                | Pass   |
| Active writer resolution    | Target `pnpm dev` parent and Vite child were owned by the current user, rooted at the target, and stopped with `SIGTERM` to the parent                                           | Pass   |
| Vite cache cleanup          | `node_modules/.vite/deps` contained generated Vite dependency-cache artifacts only and was removed; `node_modules/.vite/vitest` was preserved                                    | Pass   |
| F2 prerequisite             | `.ai/reports/F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE_REPORT.json` records `F2_TOOLCHAIN_AND_STATIC_GOVERNANCE_COMPLETE`                                                | Pass   |
| F3A prerequisite            | F3A report records `F3A_TOKEN_THEME_DESIGN_PASS_READY_FOR_TOKEN_REGISTRY_IMPLEMENTATION`                                                                                         | Pass   |
| F3A2 prerequisite           | F3A2 report records `F3A2_TOKEN_THEME_DESIGN_CLOSURE_PASS_READY_FOR_TOKEN_REGISTRY_IMPLEMENTATION`                                                                               | Pass   |
| F3B prerequisite            | F3B report records `F3B_TOKEN_REGISTRY_PASS_READY_FOR_THEME_ENGINE_IMPLEMENTATION` with all 86 accepted inventory entries implemented                                            | Pass   |
| F3C prerequisite            | F3C report records `F3C_THEME_ENGINE_PASS_READY_FOR_NAIVE_UI_PROVIDER_IMPLEMENTATION`                                                                                            | Pass   |
| F3D prerequisite            | F3D report records `F3D_NAIVE_UI_THEME_PROVIDER_PASS_READY_FOR_PRODUCT_UI_GATE_REVIEW`                                                                                           | Pass   |
| Single runtime topology     | One Vite root, one Vue bootstrap, one Router owner, one Pinia owner, one token registry, one provider boundary                                                                   | Pass   |
| Token authority             | `src/styles/tokens.css` is the single global semantic token registry                                                                                                             | Pass   |
| Theme engine                | Light, dark, and system preference runtime with synchronous no-flash bootstrap and one non-sensitive `themeMode` storage boundary                                                | Pass   |
| Listener ownership          | One system preference listener and one cross-tab storage listener, owned by the theme store lifecycle                                                                            | Pass   |
| Naive UI provider           | One `NConfigProvider`, one `NGlobalStyle`, token-derived theme overrides, and neutral provider layout                                                                            | Pass   |
| No product implementation   | No product UI routes, workspace implementation, board runtime, PGN runtime, AI runtime, auth/API implementation, mock data, or fake success state has been started in the target | Pass   |
| No forbidden infrastructure | No React runtime, automated test infrastructure, test script, package-manager fork, tracked secret, environment file, or tracked generated output                                | Pass   |

## Source Hierarchy

1. Target active authorities: `AGENTS.md`, `CLAUDE.md`,
   `.ai/skills/project-ui/SKILL.md`, and active documents under
   `docs/product`, `docs/ui`, `docs/architecture`, and `.ai/reports`.
2. Canonical runtime and visual authority for P1:
   `/Users/cc/Work/neobv/Chess/pgnViewer-new`.
3. Product, UI-governance, API, security, and implementation-evidence authority:
   `/Users/cc/Work/neobv/Chess/chess-pgnviewer`.
4. Legacy capability evidence:
   `/Users/cc/Work/neobv/Chess/pgnViewer`.

The React runtime is not target architecture authority. Evidence-source
directories are permanently read-only and must never be modified, staged,
formatted, cleaned, installed into, or used as write targets.

## Deferred Policy

Comprehensive generalized foundations remain deferred until
`PRODUCT_COMPLETE_USABLE` unless a real product feature cannot operate without a
narrow feature-owned boundary. Deferred domains remain present in
`docs/architecture/FOUNDATION_READINESS_MATRIX.json` with
`DEFERRED_UNTIL_PRODUCT_COMPLETE`.

Deferred domains include comprehensive TanStack Vue Query policy, general
repositories and DTO/domain layering, security runtime and headers, runtime
environment configuration, global error and feedback framework, accessibility
foundation, UI adapters/overlays/icons, Dexie structured persistence, broad
responsive layout, motion, preview, and broad final integration.

Deferred domains do not block P1A and must not force an immediate broad rewrite
of the Vue root, Router, Pinia graph, semantic token registry, theme engine, or
Naive UI provider.

## Non-Deferrable Controls

- No secrets in the repository or browser persistence.
- No browser ownership of upstream credentials, HMAC secrets, auth tokens, MQTT
  credentials, secret-bearing URLs, or private cookies.
- No direct imports from evidence-source projects.
- No React runtime, duplicate Vue root, duplicate Router, duplicate Pinia graph,
  duplicate board shell, duplicate PGN shell, or parallel token registry.
- No raw visual values outside the approved token authority and evidence
  documents.
- No direct Naive UI imports outside the approved provider boundary or future
  project-owned `src/ui` adapters.
- No mock product data, fixtures, fake replay, fake live messages, fake AI
  output, placeholder success states, invented API contracts, generic `/CALL`,
  `proxyRequest`, MQTT publish, or unauthorized write/admin endpoints.
- No automated test files, automated test infrastructure, snapshots, fixtures,
  coverage, Playwright/Cypress/Jest/Vitest runners, or `test` package script.
- No force push and no source-project modification.

## Browser Validation Policy

Every visible P1 phase must use a temporary production build and a narrow real
browser validation of the intended route. Required evidence is route identity,
nonblank DOM, no Vite error overlay, no console-breaking errors, no failed
runtime assets, token/theme/provider correctness when affected, and a real user
interaction state change when the slice includes interaction.

Browser validation must not create automated test files, fixtures, snapshots,
scripted E2E suites, screenshot loops, or pixel measurements.

## Accepted P1 Sequence

1. `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`
2. `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`
3. `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`
4. `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`
5. `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`
6. `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`
7. `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES`
8. `P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_AND_ACCEPTANCE`

## P1A Scope

P1A exists to migrate only the canonical application shell, workspace container,
top-level geometry, shell panel regions, shell-required splitters, viewport and
scroll ownership, responsive shell behavior required to prevent later rewrite,
and semantic-token-based styling.

Allowed P1A target ownership:

- Router route ownership required to expose the canonical workspace shell.
- Route-level workspace container and layout contract comment.
- Shell-only Pinia state required for panel visibility and board alignment when
  it does not introduce domain, repository, or product data behavior.
- Structural shell regions: evaluation rail, left navigation/list region,
  board-stage placeholder region, right panel stack, vertical split handle,
  viewport/root container, and responsive shell collapse behavior.
- Truthful neutral structural labels only when an unimplemented region is
  required by the canonical shell.

Forbidden P1A scope:

- Board rendering or interaction.
- PGN parsing, loading, replay, move tree, variation, or navigation.
- Annotation runtime, drawing tools, YCDW behavior, coach notes, or move
  comments.
- AI analysis, workers, evaluation output, or analysis controls.
- Authentication, production API calls, QueryClient, repository frameworks,
  generalized error handling, comprehensive accessibility, settings pages,
  persistence frameworks, product records, mock data, fake APIs, fake games, fake
  PGNs, fake replay, fake live transport, and fake analysis output.
- Theme controls, token changes, provider changes, dependency changes, package
  script changes, scanner changes, or broad reusable UI adapter frameworks.

## Canonical Source Inventory For P1A

P1A canonical runtime files:

- `pgnViewer-new/src/app/App.vue`
- `pgnViewer-new/src/app/router/index.ts`
- `pgnViewer-new/src/features/workspace-mode/WorkspaceModeController.vue`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeContext.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeQuery.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeTypes.ts`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/stores/layoutStore.ts`

P1A canonical styles and geometry:

- `TeachingWorkspace.vue` `.workspace`, `.layout`, `.area-eval`,
  `.area-list`, `.list-handle`, `.area-board`, `.board-stage`,
  `.board-align-frame`, `.area-panel`, `.panel-pgn`, `.panel-analysis`,
  `.pp-split-handle-y`, and `max-width: 1200px`, `900px`, and `560px`
  responsive rules.

P1A canonical assets:

- No product/game asset is required for P1A. The first slice may render truthful
  neutral structural labels instead of board pieces, PGN data, analysis output,
  or tournament records.

P1A canonical state dependencies:

- `layoutStore.ts` panel visibility and `boardAlignment` are source evidence for
  shell state only. P1A must not migrate product stores, PGN stores, board
  editor stores, analysis stores, authentication stores, replay stores, online
  game stores, or API service state.

## Validation Requirements

P1A and every later slice must pass the project validation ladder with pnpm and
the repository scripts. For this gate, the required evidence is recorded in
`.ai/reports/PRODUCT_UI_MIGRATION_GATE_REVIEW_REPORT.json`.

## Commit Boundary

This gate may change only gate, governance, migration-sequence, and report
files. It must not change dependencies, lockfiles, runtime source, tokens,
theme engine, provider files, Router, Pinia, scanners, tool configuration,
environment files, product/UI specifications, historical reports, or evidence
sources.

## Milestones

`PRODUCT_UI_MIGRATION_READY` authorizes P1A only. `PRODUCT_COMPLETE_USABLE`
requires the canonical product runtime and user-facing product flows to operate
with real data and real APIs. `POST_PRODUCT_FOUNDATION_HARDENING_COMPLETE`
follows only after product usability and closes or explicitly rejects deferred
comprehensive foundations with evidence.
