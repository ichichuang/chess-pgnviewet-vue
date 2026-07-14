# Board Advanced Capability Architecture Baseline

Status: `ACTIVE_RUNTIME_AUTHORITY`

## Decision

`src/features/board/CanonicalChessBoard.vue` is the single reusable board renderer. Advanced behavior is exposed through the typed `ChessboardCapabilities` contract and public board API documented in `docs/ui/CHESSBOARD_COMPONENT_API.md`; no wrapper may create a second position, annotation, editor, or motion owner.

## Current ownership

- `src/features/board/CanonicalChessBoard.vue` owns rendering and the public position-driven boundary.
- `src/features/board/pgn/PgnChessBoard.vue` composes the same renderer with its isolated PGN controller.
- `src/features/board/useBoardAnimationController.ts` owns GSAP move and snapback animation.
- `src/features/board/radial-menu/BoardRadialMenu.vue` owns the typed radial command presentation.
- `src/features/board/editor` owns temporary editor state and validation handoff.
- `src/features/board/useBoardWheelNavigation.ts` owns thresholded wheel intent.
- `src/features/annotations` owns framework-free annotation data and compatibility behavior.
- `src/features/pgn` owns PGN state and accepted move insertion.
- `src/styles/tokens.css` owns all governed visual and motion values.

Public exports are owned by `src/features/board/index.ts`, `src/ui/index.ts`, and `src/types/index.ts`.

## Rules

1. Basic board behavior remains available when advanced capability groups are omitted; advanced groups are explicit and typed.
2. Controlled position consumers own accepted moves; the board does not apply a second mutation.
3. The editor owns only a temporary draft and emits validation/commit/cancel events. PGN mutation remains with the PGN owner.
4. Annotation gestures, orientation mapping, pointer cancellation, and resize mapping remain inside the board boundary; annotation records remain with the PGN node owner.
5. GSAP core may animate approved board behavior only through the project animation controller and tokenized motion values. Plugins require separate approval.
6. Reduced-motion behavior disables nonessential travel and spring effects.
7. Read-only profiles suppress move, editor, and annotation mutation regardless of consumer labels.
8. Big-screen reuses the canonical renderer in a read-only profile; it does not create a display-specific board runtime.

## Validation contract

Board changes require the relevant governance checks, typecheck, production build, and narrow real-browser validation of the changed interaction, including reduced-motion and cleanup behavior when motion changes.
