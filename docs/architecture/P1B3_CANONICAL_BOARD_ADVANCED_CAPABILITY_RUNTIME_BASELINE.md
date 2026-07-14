# P1B3 Canonical Board Advanced Capability Runtime Baseline

Status: `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTED_PENDING_GOVERNANCE_CLOSURE`
Phase: `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTATION_AND_GSAP_SKILL`
Target route: `/pgnViewer/`
Previous authority: `docs/architecture/BOARD_ADVANCED_CAPABILITY_ARCHITECTURE_BASELINE.md`

## Scope

P1B3 turns the accepted P1B board into a parameter-controlled advanced board
runtime. The slice implements GSAP move animation, GSAP snapback/settle
animation, the canonical radial annotation menu, free-placement/editor mode, and
wheel navigation. It does not implement authentication, production APIs,
tournament/live sources, persistence, settings, new AI capabilities, new
package ownership, or automated test infrastructure.

## Target Files

- `.ai/skills/gsap/SKILL.md`
- `src/features/board/domain/boardCapabilities.ts`
- `src/features/board/domain/moveDiff.ts`
- `src/features/board/useBoardCapabilityOptions.ts`
- `src/features/board/useBoardAnimationController.ts`
- `src/features/board/useBoardRadialMenu.ts`
- `src/features/board/useBoardWheelNavigation.ts`
- `src/features/board/useBoardView.ts`
- `src/features/board/BoardView.vue`
- `src/features/board/CanonicalChessBoard.vue`
- `src/features/board/editor/boardEditorDraft.ts`
- `src/features/board/editor/BoardEditorPanel.vue`
- `src/features/board/editor/useBoardEditorPanelView.ts`
- `src/features/board/radial-menu/BoardRadialMenu.vue`
- `src/features/board/radial-menu/useBoardRadialMenuView.ts`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/features/teaching-workspace/WorkspaceToolbar.vue`
- `src/stores/pgn.ts`
- `src/styles/tokens.css`

## Runtime Contract

Advanced behavior is controlled by one object:

```ts
interface BoardAdvancedCapabilities {
  animation?: {
    move?: BoardMoveAnimationOptions
    snapback?: BoardSnapbackAnimationOptions
  }
  radialMenu?: BoardRadialMenuOptions
  editor?: BoardEditorCapabilityOptions
  wheelNavigation?: BoardWheelNavigationOptions
}
```

`useBoardCapabilityOptions` normalizes all omitted groups to off. Existing board
consumers that omit `advancedCapabilities` keep the P1B behavior. The canonical
`/pgnViewer/` workspace explicitly enables move animation, snapback, radial
menu, editor availability, and wheel navigation, while disabling radial and
wheel behavior during editor mode.

## Ownership

- Board animation observes FEN transitions and DOM targets only. It never owns
  chess state.
- Move requests still cross the existing board move boundary before state
  mutation. Accepted requests may animate; rejected requests snap back.
- `src/stores/pgn.ts` remains the PGN collection, current-node, FEN, branch,
  promotion, annotation, and navigation owner.
- `src/stores/workspace.ts` remains the orientation, toolbar, annotation-mode,
  panel, splitter, and display-state owner.
- Editor mode owns only a temporary board draft until the user commits the
  generated FEN through `insertPgnFromFen`.
- Radial menu owns only transient pointer, open, and selected-command state.
- Wheel navigation owns only throttling and emits a navigation request.

## Interaction Priority

The implemented pointer priority is:

1. editor pointer mode;
2. radial menu;
3. annotation gesture;
4. normal move drag;
5. click movement;
6. wheel navigation;
7. keyboard navigation.

Workspace splitter dragging blocks wheel navigation through the capability
contract. Editor mode suppresses radial menu, annotations, move dragging, and
wheel navigation.

## Animation

`useBoardAnimationController` uses GSAP core only. It ports canonical move
detection through `domain/moveDiff.ts`, animates single-ply SVG piece movement
with `attr.x` and `attr.y`, suppresses move slides after successful drag settle,
and animates invalid/cancelled drag ghosts back to the source square. It kills
active tweens on interruption and unmount.

Motion durations and easings are semantic tokens in `src/styles/tokens.css`.
Reduced-motion preference resolves durations to zero without changing final FEN,
selected node, branch state, promotion state, annotation state, or analysis
state.

## Radial Menu

`BoardRadialMenu.vue` is store-free. Geometry and canonical widths live in
`boardCapabilities.ts`; visual values are tokens. `useBoardRadialMenu` owns
board-level pointer capture and command selection, while
`useBoardRadialMenuView` owns menu rendering animation and active indicators.
Commands are emitted to `TeachingWorkspace.vue`, which maps them to the existing
workspace annotation tool, annotation color, and radial width state.

## Editor Mode

`boardEditorDraft.ts` owns a temporary editable grid, selected piece, side to
move, castling rights, generated FEN, clear/reset actions, placement, pickup,
replacement, right-click removal, and drag-outside removal. `BoardEditorPanel`
is a store-free control surface. Finishing editor mode calls `pgn.insertPgnFromFen`;
cancel discards the draft.

`insertPgnFromFen` validates the committed FEN with `chess.js`, inserts a manual
FEN-backed PGN item through the PGN parser boundary, selects it, and clears
pending branch, promotion, and draw-history state.

## Wheel Navigation

`useBoardWheelNavigation` attaches the wheel listener only when enabled and not
blocked. It throttles with the token-backed canonical `60ms` interval and emits
`previous` or `next` navigation based on wheel direction. It does not own PGN
state.

## Skill Contract

`.ai/skills/gsap/SKILL.md` is the local GSAP guidance for this project. It
requires the project UI skill and this baseline before future GSAP work, scopes
animation ownership to Vue lifecycle, requires kill/revert cleanup, keeps
durations/easings in tokens, forbids unmanaged global selectors and plugin use
without evidence, and requires narrow real-browser validation for UI animation
changes.

## Validation Gate

P1B3 implementation is complete only when:

- `pnpm run typecheck` passes;
- `pnpm run build` passes;
- static governance relevant to the touched files passes;
- the `/pgnViewer/` route is validated in a real Chrome/Chromium browser from a
  temporary production build;
- browser evidence confirms nonblank DOM, no Vite overlay, no breaking console
  errors, advanced interactions, invalid snapback, radial command changes,
  editor commit/cancel behavior, and wheel navigation;
- no read-only evidence source is modified;
- implementation and governance closure commits are pushed to `origin/main`;
- local `HEAD`, `origin/main`, and live remote `refs/heads/main` match after
  push.

## Boundary

P1B3 closes the advanced-board runtime slice. Production API authority is
defined separately by the current Web API architecture documents.
