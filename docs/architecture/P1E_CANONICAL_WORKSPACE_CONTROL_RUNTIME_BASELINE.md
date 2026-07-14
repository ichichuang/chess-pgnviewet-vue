# P1E Canonical Workspace Control Runtime Baseline

Status: `P1E_CANONICAL_WORKSPACE_CONTROL_IMPLEMENTED_VALIDATED`
Phase: `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`
Target route: `/pgnViewer/`
Current development gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

## Scope

P1E completes the functional workspace control layer over the accepted P1A
shell, P1B board, P1C PGN owner, and P1D annotation runtime.

P1E does not implement AI analysis, Web Workers, authentication, production
APIs, generalized persistence, settings, live/replay import, or final product
integration.

## Canonical Source Files

- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/features/teaching-workspace/WorkspaceToolbar.vue`
- `pgnViewer-new/src/features/teaching-workspace/components/WorkspaceRightPanelAdapter.vue`
- `pgnViewer-new/src/stores/viewStore.ts`
- `pgnViewer-new/src/stores/layoutStore.ts`
- `pgnViewer-new/src/stores/brushStore.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/features/pgn-panel/PgnPanel.vue`

## Target Files

- `src/stores/workspace.ts`
- `src/stores/pgn.ts`
- `src/stores/index.ts`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/features/teaching-workspace/WorkspaceToolbar.vue`
- `src/features/teaching-workspace/WorkspaceRightPanel.vue`
- `src/features/teaching-workspace/WorkspaceSplitter.vue`
- `src/styles/tokens.css`

## Source To Target Mapping

| Canonical owner                                               | Target owner                                                                | P1E classification            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| `viewStore.orientation` and `flipBoard()`                     | `stores/workspace.ts` `boardOrientation` and `flipBoardOrientation()`       | `REQUIRED_IN_P1E`             |
| `viewStore.showViews` and `layoutStore` panel visibility      | `stores/workspace.ts` panel, tab, and toolbar state                         | `REQUIRED_IN_P1E`             |
| `WorkspaceToolbar.vue` board, file, view, and analysis groups | `WorkspaceToolbar.vue` scoped current-runtime controls                      | `REQUIRED_IN_P1E`             |
| `PgnPanel.vue` navigation dock                                | `WorkspaceToolbar.vue` PGN start/back/forward/end commands                  | `REQUIRED_IN_P1E`             |
| `brushStore` shape/color controls                             | `WorkspaceToolbar.vue` annotation mode and six semantic colors              | `REQUIRED_IN_P1E`             |
| `pgnStore` draw undo/redo/clear                               | `stores/pgn.ts` current-node draw history and commands                      | `REQUIRED_IN_P1E`             |
| `WorkspaceRightPanelAdapter.vue` PGN/analysis split           | `WorkspaceRightPanel.vue`, `WorkspaceSplitter.vue`, `TeachingWorkspace.vue` | `REQUIRED_IN_P1E`             |
| `AnalysisPanel` runtime                                       | structural unavailable region only                                          | `STRUCTURAL_ONLY_UNTIL_P1F`   |
| auth, cloud, settings, API, engine, Worker controls           | not copied                                                                  | `DEFERRED_TO_AI_OR_API_PHASE` |

## Workspace Component Hierarchy

`TeachingWorkspace.vue` owns the P1E composition:

1. `WorkspaceToolbar`
2. evaluation rail
3. left PGN list panel
4. board stage with the single `CanonicalChessBoard`
5. right tabbed panel
6. vertical PGN/analysis splitter
7. lower structural analysis region

## Command Ownership

`stores/workspace.ts` is the single P1E owner for board orientation, board
alignment, toolbar collapse, left-panel visibility, active right tab, lower
analysis visibility, splitter drag state, splitter height, annotation mode, and
annotation color.

`stores/pgn.ts` remains the single owner for PGN navigation, current node,
current FEN, current-node annotations, and current-node drawing history.

## Controls

- Board orientation: toolbar `翻转`, mapped to the existing P1B `orientation`
  prop on `CanonicalChessBoard`.
- PGN navigation: start, previous, next, and end call the P1C store commands and
  expose disabled states from P1C getters.
- Annotation mode: arrow, square, and highlight use the P1D board drawing path.
- Annotation colors: the six accepted semantic color ids resolve through
  `annotationColorToken()` and the accepted `--cg-arrow-*` token family.
- Undo: `undoCurrentDrawing()` restores only the selected node's previous
  committed drawing snapshot.
- Redo: `redoCurrentDrawing()` restores only the selected node's last undone
  drawing snapshot.
- Clear: `clearDrawing()` clears only arrows and square/highlight drawings on
  the current node.

Orientation changes do not write PGN state, board FEN, current node, comments,
NAGs, annotations, theme state, Router state, or provider state.

## Panel Hierarchy

The right panel owns four tabs: notation, comments, annotations, and analysis.
Notation renders the accepted P1C move tree. Comments and annotations render
truthful current-node summaries. Analysis is a structural unavailable region
until P1F and does not display scores, depth, principal variations, or fake
engine state.

The lower analysis region is controlled by the P1E workspace store and remains
truthful structural content until P1F.

## Splitter Model

The P1E splitter is a project-owned Vue component. `TeachingWorkspace.vue` owns
the pointer lifecycle:

- pointer down prevents propagation, captures the pointer, marks dragging, and
  applies the first split;
- pointer move updates the PGN panel height within the token-backed panel
  minimum;
- pointer up or pointer cancel releases state and removes global listeners;
- unmount cleanup also stops dragging and removes body cursor state.

The splitter changes only `workspace.rightPgnHeightPx`; it does not modify board,
PGN, annotation, theme, Router, Pinia, or provider state.

Keyboard resizing is not implemented because no directly required canonical
keyboard splitter behavior is in the accepted P1E slice.

## Responsive Behavior

Desktop preserves the accepted P1A board-centric four-column shell. Tablet and
mobile continue to use the accepted P1A collapse/stacking rules. Mobile
landscape keeps board and right panel accessible through the existing
`900px`/height-constrained rule. P1E does not introduce a separate mobile
product experience.

Body scrolling remains disabled. Scroll ownership stays local to the PGN list,
right panel content, and lower analysis panel.

## Tokens

P1E consumes the accepted workspace, control, board, annotation, border, surface,
text, focus, spacing, radius, and motion tokens. P1E adds one semantic control
state token:

- `--workspace-disabled-opacity: 0.5`

No accepted token value is changed.

## Assets And Dependencies

P1E migrates no assets and adds no dependencies.

## Deliberately Deferred

Deferred to `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`: AI analysis panel
runtime, engine controls, Web Workers, evaluation charts, depth, PV, and report
logic.

Deferred to later phases: authentication, production APIs, generalized
persistence, settings, live/replay import, product records, and final product
integration.

## Validation

Required validation for completion remains:

- project governance scanners;
- Prettier, ESLint, Stylelint, Knip, governance aggregate checks;
- Vue SFC typecheck;
- temporary-output production build;
- production and full pnpm audits;
- installed dependency listing;
- aggregate static check;
- real-browser validation of `/pgnViewer/` across desktop, large desktop,
  tablet portrait, tablet landscape, mobile portrait, and `844x390` mobile
  landscape.

## Completion Gate

P1E is complete only when toolbar, orientation, PGN navigation, annotation mode,
annotation colors, current-node undo, current-node redo, current-node clear,
panel tabs, panel visibility, splitter drag/cancel/cleanup, responsive
workspace behavior, state integrity, static checks, production build, browser
validation, normal implementation push, governance closure push, clean final
worktree, and evidence-source immutability all pass.
