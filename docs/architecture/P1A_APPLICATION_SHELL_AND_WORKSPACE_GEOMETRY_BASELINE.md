# P1A Application Shell And Workspace Geometry Baseline

Status: `P1A_CANONICAL_SHELL_IMPLEMENTED_AND_VALIDATED`
Phase: `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`
Target route: `/pgnViewer/`
Current development gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

## Scope

P1A delivers the real product shell and canonical teaching-workspace geometry.
It does not deliver board rendering, board interaction, PGN loading, PGN
navigation, annotations, AI analysis, authentication, production APIs, settings,
persistence, or later P1 functionality.

The implementation is structural-only where later slices own real runtime
behavior. Structural regions use truthful labels and never imitate a game, PGN,
analysis result, live connection, tournament, user, API result, or completed
feature.

## Canonical Source Files

P1A source authority is the accepted inventory from
`.ai/reports/PRODUCT_UI_MIGRATION_GATE_REVIEW_REPORT.json` and
`docs/architecture/PRODUCT_UI_MIGRATION_GATE_BASELINE.md`:

- `pgnViewer-new/src/app/App.vue`
- `pgnViewer-new/src/app/router/index.ts`
- `pgnViewer-new/src/features/workspace-mode/WorkspaceModeController.vue`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeContext.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeQuery.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeTypes.ts`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/stores/layoutStore.ts`

## Target Files

- `src/App.vue`
- `src/router/index.ts`
- `src/views/HomeView.vue`
- `src/features/workspace-mode/WorkspaceModeController.vue`
- `src/features/workspace-mode/workspaceModeContext.ts`
- `src/features/workspace-mode/workspaceModeQuery.ts`
- `src/features/workspace-mode/workspaceModeTypes.ts`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/styles/tokens.css`
- `docs/architecture/P1A_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_BASELINE.md`

`src/views/HomeView.vue` is retained as a thin route-entry boundary and renders
the workspace controller. It no longer contains the neutral bootstrap marker.

## Source To Target Mapping

| Canonical owner                       | Target owner                                              | P1A classification         |
| ------------------------------------- | --------------------------------------------------------- | -------------------------- |
| `App.vue` provider/root composition   | `src/App.vue`                                             | `REQUIRED_IN_P1A`          |
| Router workspace route                | `src/router/index.ts`                                     | `REQUIRED_IN_P1A`          |
| Route entry boundary                  | `src/views/HomeView.vue`                                  | `STRUCTURAL_ONLY_IN_P1A`   |
| Workspace mode controller             | `src/features/workspace-mode/WorkspaceModeController.vue` | `REQUIRED_IN_P1A`          |
| Workspace context provide/inject      | `src/features/workspace-mode/workspaceModeContext.ts`     | `STRUCTURAL_ONLY_IN_P1A`   |
| Workspace mode/source query parsing   | `src/features/workspace-mode/workspaceModeQuery.ts`       | `STRUCTURAL_ONLY_IN_P1A`   |
| Workspace mode/source contracts       | `src/features/workspace-mode/workspaceModeTypes.ts`       | `STRUCTURAL_ONLY_IN_P1A`   |
| Teaching workspace shell template/CSS | `src/features/teaching-workspace/TeachingWorkspace.vue`   | `REQUIRED_IN_P1A`          |
| Layout visibility/alignment state     | local shell state in `TeachingWorkspace.vue`              | `STRUCTURAL_ONLY_IN_P1A`   |
| Board, PGN, annotation, AI imports    | not copied                                                | `DEFERRED_TO_P1B_OR_LATER` |
| Auth, API, cloud, settings imports    | not copied                                                | `NOT_REQUIRED` for P1A     |

## Route Ownership

`src/router/index.ts` owns the single Vue Router instance. The route path `/`
under Vite base `/pgnViewer/` renders the product workspace at `/pgnViewer/`.
The catch-all route redirects to the same workspace. No compatibility, auth,
competition, API, or later product routes are implemented in P1A.

## Component Hierarchy

`src/main.ts` creates the single Vue root, installs the single Pinia graph,
initializes the accepted theme store, installs the single Router, and mounts.
`src/App.vue` wraps the active route in the accepted `AppProviders` boundary.
`WorkspaceModeController.vue` resolves the structural mode/source context and
renders `TeachingWorkspace.vue`.

## Shell Regions

P1A implements six structural shell regions:

1. evaluation rail;
2. left PGN/source list column;
3. board stage and square alignment frame;
4. right toolbar region;
5. right PGN/move/annotation panel region;
6. optional lower AI-analysis panel region with splitter visual.

## Viewport And Scroll Ownership

The app root and workspace use `--workspace-viewport-h`, backed by canonical
`100dvh`. `html`, `body`, and `#app` keep the accepted no-body-scroll behavior
from `src/styles/base.css`.

Global body scrolling remains forbidden. The only P1A local scroll owners are
the left structural list, right PGN panel content, and optional analysis panel
content. Header, eval rail, board stage, and splitter do not scroll.

## Geometry

Desktop geometry follows the canonical four-column shell:

- evaluation rail;
- left list column;
- board stage;
- right panel stack.

Compact desktop uses the canonical `1200px` threshold and narrower list/panel
columns. Tablet uses the canonical `900px` threshold, hides the left list column,
and stacks board over the right panel while preserving the eval rail. Mobile
uses the canonical `560px` threshold, narrower eval rail, tighter board padding,
and a single-column context summary.

Large-screen behavior is the canonical clamp-based growth of rail, list, panel,
and board-stage geometry. No separate big-screen display route is implemented in
P1A.

No source safe-area behavior exists in the accepted P1A canonical source. P1A
therefore does not introduce a separate safe-area token or behavior.

## Panel And Splitter Scope

The left panel has the minimal canonical collapse interaction required to prove
shell geometry. The right panel remains visible. The lower analysis panel can be
shown or hidden to validate the canonical panel stack and splitter visual.

P1A does not implement advanced resizing, persisted panel sizes, keyboard
resizing, drag persistence, drawers, overlays, or the full P1E splitter program.

## State Ownership

Canonical `layoutStore.ts` is used only as evidence for left panel visibility,
AI panel visibility, and board alignment. P1A keeps these as local shell state
because no cross-route, persisted, product, or domain state is required yet. No
new Pinia store is created.

## Semantic Tokens Consumed

The shell consumes existing semantic tokens for background, surface, border,
text, accent, spacing, radius, shadows, control height, focus, and hover states.

## Semantic Tokens Added

P1A adds only shell-geometry and shell-motion tokens to
`src/styles/tokens.css`. The values are mechanically translated from
`TeachingWorkspace.vue`: eval rail widths, list widths, right panel widths,
board padding, panel row heights, splitter sizes, handle sizes, border width,
z-index, motion timing, and canonical responsive thresholds. Existing accepted
F3B token values are not changed.

## Assets Migrated

No assets are required or migrated in P1A.

## Deferred Responsibilities

Deferred to later P1 phases:

- `P1B`: board rendering, pieces, interaction, coordinates, legal moves, and
  board runtime;
- `P1C`: real PGN loading, parsing, move navigation, variation, replay, and
  PGN panel content;
- `P1D`: annotations and drawing runtime;
- `P1E`: complete workspace panels, toolbars, splitters, drawers, persistence,
  and responsive panel behavior;
- `P1F`: AI analysis and worker runtime;
- production API-backed product capabilities;
- `P1H`: complete product integration and acceptance.

## Validation

Static validation, production build validation, browser validation, and push
evidence are recorded in
`.ai/reports/P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION_REPORT.json`
after the implementation commit is pushed.

Required validation:

- project scanners;
- Prettier, ESLint, Stylelint, Knip, and governance aggregate checks;
- Vue SFC typecheck;
- temporary-output production build;
- production and full pnpm audits;
- installed dependency listing;
- aggregate static check;
- real Chromium-family browser validation of `/pgnViewer/` across desktop,
  large desktop, tablet portrait, tablet landscape, mobile portrait, and mobile
  landscape.

Validated viewport representatives:

- desktop teaching baseline: `1440x900`;
- large desktop: `1920x1080`;
- tablet portrait: `768x1024`;
- tablet landscape: `1024x768`;
- mobile portrait: `390x844`;
- mobile landscape: `844x390`.

Validated theme cases:

- light;
- dark;
- system-light;
- system-dark on the desktop teaching baseline.

## Git Boundaries

The first implementation commit may include only P1A runtime files, shell
styles/tokens, route changes, and this baseline. Governance reports and roadmap
updates are committed only after the implementation push succeeds.

## Completion Gate

P1A is complete only when canonical shell parity is accepted for this slice, the
real product route is visible, viewport and scroll ownership pass, responsive
geometry passes, Vue root/Router/Pinia/theme/provider integrity remains singular,
no fake product data or later runtime exists, static/build/browser validation
passes, both normal pushes succeed, local `HEAD` equals remote `main`, the
tracked worktree is clean, and no evidence source is modified.
