# P1 Canonical Product Migration Sequence

Status: `ACTIVE_AUTHORITY`
Gate: `PRODUCT_UI_MIGRATION_READY`
Starts with: `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`

## Source Hierarchy

1. `pgnViewer-new` is the canonical Vue runtime, visual, interaction, layout,
   motion, board, PGN, annotation, and teaching workspace migration authority.
2. `chess-pgnviewer` is the product, UI-governance, API, security, and
   implementation-evidence authority.
3. `pgnViewer` is secondary legacy capability evidence only.
4. The React runtime is not target architecture authority.

All source projects are read-only. Do not write to, format, install into,
delete from, stage, commit, or push from an evidence-source directory.

## Migration Rule

P1 migration is mechanical before refactoring. Each slice must preserve the
canonical layout, interaction, density, board focus, panel geometry, keyboard
behavior, responsive behavior, and motion that belongs to that slice before any
local simplification is considered.

No redesign is allowed during mechanical migration. Token translation may adapt
canonical concrete values into the target semantic token system, but it must not
invent a new visual language or introduce feature-local raw values.

## Real Data Rule

Real production APIs and confirmed contracts are the only product data path.
Mock product data, fixtures, fake games, fake PGNs, fake replay, fake live
messages, fake AI output, sample tournaments, and silent fallback success states
are forbidden.

When a real capability is not yet confirmed, the slice must render a truthful
blocked, unavailable, empty, loading, permission, retry, or error state inside
the owning module. It must not imitate real product data.

## Phase Sequence

1. `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`
2. `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`
3. `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`
4. `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`
5. `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`
6. `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`
7. `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES`
8. `P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_AND_ACCEPTANCE`

## P1A

Expected visible outcome:

- `/pgnViewer/` renders the canonical workspace shell geometry without real
  board, PGN, analysis, auth, API, or product data behavior.
- The shell owns viewport height, body-scroll prevention, top-level grid,
  left navigation/list region, board stage region, right panel region,
  shell-required splitters, panel visibility, board alignment placeholder, and
  responsive shell collapse behavior.
- Unimplemented regions render truthful neutral structural labels only when the
  canonical shell requires that region.

Canonical source areas:

- `pgnViewer-new/src/app/App.vue`
- `pgnViewer-new/src/app/router/index.ts`
- `pgnViewer-new/src/features/workspace-mode/WorkspaceModeController.vue`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeContext.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeQuery.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeTypes.ts`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/stores/layoutStore.ts`

Target ownership:

- route-level workspace shell;
- shell layout state if needed for panel visibility and board alignment;
- semantic-token-backed shell styles;
- route and layout contract documentation;
- no domain, repository, product data, or board runtime ownership.

Forbidden P1A scope:

- self-developed board runtime;
- move interaction;
- PGN parsing, loading, navigation, variation tree, or replay;
- annotation runtime or drawing layer;
- AI analysis and worker migration;
- authentication or production API calls;
- QueryClient, repository frameworks, generalized error framework, broad
  accessibility program, settings pages, persistence frameworks, or product
  records;
- mock data, fake APIs, fake games, fake PGNs, fake replay, fake live transport,
  fake analysis output, or placeholder success states.

Required validation:

- `mise exec -- pnpm run check:deps`
- `mise exec -- pnpm run check:architecture`
- `mise exec -- pnpm run check:tokens`
- `mise exec -- pnpm run check:mocks`
- `mise exec -- pnpm run check:secrets`
- `mise exec -- pnpm run format:check`
- `mise exec -- pnpm run lint`
- `mise exec -- pnpm run lint:style`
- `mise exec -- pnpm run check:unused`
- `mise exec -- pnpm run check:governance`
- `mise exec -- pnpm run typecheck`
- production build with authoritative Vue SFC type checking and a temporary
  output directory outside the repository;
- `mise exec -- pnpm run audit:prod`
- `mise exec -- pnpm audit`
- `mise exec -- pnpm list --depth 0`
- `mise exec -- pnpm run check:static`
- narrow real-browser validation of `/pgnViewer/` from the temporary production
  build.

Git closure:

- stage only files owned by the slice;
- inspect the full staged diff;
- commit with an evidence-backed implementation report;
- push normally to `origin main` or to the owner-approved branch;
- verify final local `HEAD`, upstream, remote, clean tracked worktree, no
  unauthorized untracked files, no temporary output, and no source-project
  modification.

Implementation result:

- Status:
  `P1A_CANONICAL_SHELL_PASS_READY_FOR_BOARD_MIGRATION`.
- Report:
  `.ai/reports/P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1A_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_BASELINE.md`.
- Implementation commit:
  `bccfd01054575b9789e0559f4ca1aae897902767`.
- `/pgnViewer/` now renders the canonical application shell and structural
  teaching-workspace geometry.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle browser
  validation passed.
- Board, PGN, annotations, complete panel/splitter behavior, AI analysis,
  authentication, production APIs, settings, persistence, and later P1 runtime
  remain unimplemented.
- Next phase:
  `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`.

## P1B

Expected visible outcome:

- `/pgnViewer/` renders the accepted P1A workspace shell with the real
  self-developed canonical chessboard in the board stage.
- The board renders 64 squares, canonical Merida piece assets, coordinates,
  legal move markers, capture markers, selected/focused/last-move/check states,
  drag ghost state, and the four-choice promotion chooser.
- Board interaction supports click-to-select, click-to-move, drag-to-move,
  keyboard movement, invalid move rejection, legal captures, check display, and
  promotion resolution.

Canonical source areas:

- `pgnViewer-new/src/features/board/BoardView.vue`
- `pgnViewer-new/src/features/board/boardCells.ts`
- `pgnViewer-new/src/features/board/PromotionDialog.vue`
- `pgnViewer-new/src/domains/board/fenBoard.ts`
- `pgnViewer-new/src/domains/board/shapes.ts`
- `pgnViewer-new/src/domains/board/pieces.ts`
- `pgnViewer-new/src/domains/pgn/mutations.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/assets/pieces/merida/*.png`

Target ownership:

- board-local position state until P1C supplies a real PGN owner;
- board rendering and board interaction components;
- framework-free FEN, square geometry, piece asset, and chess-rule helpers;
- semantic-token-backed board geometry, overlay, promotion, and piece visuals;
- public position/orientation contract for the later PGN owner.

Forbidden P1B scope:

- PGN loading, parsing, navigation, variation tree, or replay;
- annotation runtime, arrows, square drawing, board editor, or free setup;
- AI analysis and worker migration;
- authentication, production API calls, QueryClient/repository frameworks,
  settings, persistence, or product records;
- mock data, fake APIs, fake games, fake PGNs, fake replay, fake live transport,
  fake analysis output, or placeholder success states;
- automated test files, automated test infrastructure, dependency changes, or
  package-manager changes.

Implementation result:

- Status:
  `P1B_CANONICAL_BOARD_PASS_READY_FOR_P1C_PGN_MIGRATION`.
- Report:
  `.ai/reports/P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1B_CANONICAL_BOARD_RUNTIME_BASELINE.md`.
- Implementation commit:
  `48c99fd670d476437b17481c523d95a1f8120d42`.
- `/pgnViewer/` now renders the real canonical self-developed board runtime in
  the P1A workspace.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle browser
  validation passed.
- PGN loading/navigation, annotations, complete panels/toolbars/splitters, AI
  analysis, authentication, production APIs, settings, persistence, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`.

## Later Phase Dependencies

P1B depends on the P1A shell. It is implemented and must not be expanded in
place to add PGN navigation, annotation, AI, authentication, or API behavior.

P1C depends on P1B. It owns real PGN loading, parsing, navigation, variation,
and replay behavior using real sources or truthful unavailable states.

P1D depends on P1C and owns canonical annotation runtime only.

P1E completes canonical workspace panels, toolbars, splitters, and directly
required responsive behavior after real board and PGN behavior exist.

P1F owns canonical AI analysis and Web Worker behavior.

P1G owns real authentication and production API product capabilities through
confirmed same-origin boundaries.

P1H integrates the product into `PRODUCT_COMPLETE_USABLE` with real data, real
APIs, and accepted browser evidence.

## Feature-Owned Minimum Safety

If a slice requires data access, persistence, error handling, security, or
accessibility before the comprehensive foundation exists, implement only the
smallest feature-owned boundary needed by that real slice. Record the boundary
and the later consolidation owner. Do not add a generalized framework without
real product evidence.

## Deferred Post-Product Foundations

After `PRODUCT_COMPLETE_USABLE`, review and complete or explicitly reject the
deferred comprehensive foundations: TanStack Vue Query policy, repository and
DTO layering, security runtime and headers, runtime environment configuration,
global error and feedback framework, accessibility foundation, Dexie structured
persistence, UI adapters and overlays, broad responsive/motion systems,
foundation preview, and final broad browser integration.
