# P1B Canonical Board Runtime Baseline

Status: `P1B_CANONICAL_BOARD_RUNTIME_IMPLEMENTED_VALIDATED`
Phase: `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`
Target route: `/pgnViewer/`
Current development gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

## Scope

P1B implements the real self-developed board renderer and board-local chess
interaction inside the accepted P1A shell. It does not implement PGN loading,
move-tree navigation, annotations, AI analysis, authentication, APIs, settings,
persistence, or later workspace functionality.

## Canonical Source Files

- `pgnViewer-new/src/features/board/BoardView.vue`
- `pgnViewer-new/src/features/board/boardCells.ts`
- `pgnViewer-new/src/features/board/PromotionDialog.vue`
- `pgnViewer-new/src/domains/board/fenBoard.ts`
- `pgnViewer-new/src/domains/board/shapes.ts`
- `pgnViewer-new/src/domains/board/pieces.ts`
- `pgnViewer-new/src/domains/pgn/mutations.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/assets/pieces/merida/*.png`
- `pgnViewer-new/src/stores/viewStore.ts`
- `pgnViewer-new/src/features/teaching-workspace/WorkspaceToolbar.vue`

## Target Files

- `src/features/board/CanonicalChessBoard.vue`
- `src/features/board/BoardView.vue`
- `src/features/board/PromotionChooser.vue`
- `src/features/board/domain/boardTypes.ts`
- `src/features/board/domain/fenBoard.ts`
- `src/features/board/domain/boardGeometry.ts`
- `src/features/board/domain/boardCells.ts`
- `src/features/board/domain/pieceAssets.ts`
- `src/features/board/domain/chessRules.ts`
- `src/assets/chess/pieces/merida/*.png`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/styles/tokens.css`

## Source To Target Mapping

| Canonical owner                                | Target owner                                              | P1B classification             |
| ---------------------------------------------- | --------------------------------------------------------- | ------------------------------ |
| SVG board root, square and piece layers        | `BoardView.vue`                                           | `REQUIRED_IN_P1B`              |
| Board square ordering                          | `domain/boardCells.ts`                                    | `REQUIRED_IN_P1B`              |
| Display-square transforms                      | `domain/boardGeometry.ts`                                 | `REQUIRED_IN_P1B`              |
| FEN grid parsing                               | `domain/fenBoard.ts`                                      | `REQUIRED_IN_P1B`              |
| Merida piece resolver and assets               | `domain/pieceAssets.ts`, `src/assets/chess/pieces/merida` | `REQUIRED_IN_P1B`              |
| Legal destination, promotion, move application | `domain/chessRules.ts`                                    | `REQUIRED_IN_P1B`              |
| Board props/emits contract                     | `CanonicalChessBoard.vue`, `BoardView.vue`                | `REQUIRED_IN_P1B`              |
| Promotion chooser                              | `PromotionChooser.vue`                                    | `REQUIRED_IN_P1B`              |
| Board orientation state                        | `CanonicalChessBoard.vue`                                 | `REQUIRED_IN_P1B`              |
| Toolbar flip button                            | exposed board contract only                               | `BOARD_INTERFACE_ONLY_FOR_P1C` |
| PGN move tree and branching                    | not copied                                                | `DEFERRED_TO_P1C_OR_LATER`     |
| YCDW annotations and brush layer               | not copied                                                | `DEFERRED_TO_P1D_OR_LATER`     |
| Board editor/free placement                    | not copied                                                | `DEFERRED_TO_P1E_OR_LATER`     |
| AI, APIs, auth, live, settings                 | not copied                                                | `NOT_REQUIRED`                 |

## Runtime Contract

`CanonicalChessBoard.vue` owns the board-local position until P1C supplies a real
PGN source. Its public contract accepts `position`, `orientation`, and
`interactive`, and emits `move-request`, `promotion-request`, `move-executed`,
and `position-change`. It exposes `setPosition`, `getPosition`,
`setOrientation`, `flipOrientation`, `resolvePromotion`, and `cancelPromotion`
for the later PGN owner without adding PGN-specific properties.

## Behavior

- Position ownership: singular board-local `currentFen` in
  `CanonicalChessBoard.vue`.
- Chess-rule ownership: `chess.js` through `domain/chessRules.ts`, matching the
  canonical legal-move boundary from `domains/pgn/mutations.ts`.
- Initial state: standard chess start position, allowed as a domain constant.
- Rendering: self-developed SVG board with 64 squares and Merida piece images.
- Coordinates: rendered outside the board and transformed by white or black
  orientation.
- Interaction: pointer drag, click-to-select, click-to-move, keyboard focus,
  touch-compatible pointer events, cancellation cleanup, and invalid move
  rejection.
- Move state: legal destinations, legal captures, selected square, last move,
  drop target, focus square, and check square use semantic tokens.
- Promotion: real four-piece promotion chooser; no silent queen promotion.
- Sizing: square board frame fills the available P1A board region using
  container units and canonical coordinate gutters.
- ResizeObserver: owned by `BoardView.vue`, disconnected on unmount.
- Cleanup: pointer/drag state clears on cancellation, position changes, and
  unmount.

## P1A Shell Corrections

The board placeholder in `TeachingWorkspace.vue` is replaced by
`CanonicalChessBoard.vue`. No router, Pinia, theme, provider, dependency,
scanner, or package configuration change is authorized by P1B.

## Tokens

P1B consumes accepted semantic tokens for board squares, overlays, hint markers,
selection, surfaces, text, borders, focus, spacing, radii, shadows, z-index, and
motion. Added tokens are limited to board coordinate geometry, board frame
geometry, move marker stroke widths, promotion overlay geometry, and canonical
piece/ghost filters derived from `BoardView.vue`.

## Deliberately Excluded

PGN loading, move-tree navigation, variations, annotations, arrows, square
drawing, free setup, board editor, AI analysis, Web Workers, authentication,
APIs, QueryClient/repository framework, settings, mock product data, sample PGNs,
and fake live/replay state remain unimplemented.

## Completion Gate

P1B is complete only when canonical board parity is accepted for this slice, the
real board renders and interacts correctly, legal and invalid moves behave
correctly, pointer and touch behavior pass, orientation and move-state visuals
pass, sizing and mobile landscape behavior pass, singular Vue root/Router/Pinia
theme/provider ownership remains intact, static checks and build pass, real
browser validation passes, implementation and governance commits are pushed,
local `HEAD` equals remote `main`, and no evidence source is modified.
