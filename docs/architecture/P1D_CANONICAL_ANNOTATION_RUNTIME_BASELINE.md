# P1D Canonical Annotation Runtime Baseline

Status: `P1D_CANONICAL_ANNOTATION_RUNTIME_IMPLEMENTED_VALIDATED`
Phase: `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`
Target route: `/pgnViewer/`
Current development gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

## Scope

P1D implements the core canonical board annotation runtime over the accepted P1B
board and P1C PGN owner. It covers arrow drawing, square-outline drawing, filled
square highlights, semantic annotation colors, board overlay rendering, pointer
and touch-compatible drawing, PGN-node ownership, variation isolation, YCDW
comment-tag parsing and internal serialization, duplicate toggle behavior, and
cleanup.

P1D does not implement AI overlays, complete workspace toolbars, workspace-panel
completion, authentication, production APIs, persistence, settings, live/replay
import, or later product functionality.

## Canonical Source Files

- `pgnViewer-new/src/domains/annotations/ycdw.ts`
- `pgnViewer-new/src/domains/board/colors.ts`
- `pgnViewer-new/src/domains/board/shapes.ts`
- `pgnViewer-new/src/stores/brushStore.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/features/board/BoardView.vue`
- `pgnViewer-new/src/features/pgn-panel/PgnPanel.vue`
- `pgnViewer-new/src/domains/pgn/parsePgn.ts`
- `pgnViewer-new/src/domains/pgn/serializePgn.ts`
- `pgnViewer-new/src/domains/pgn/types.ts`

## Target Files

- `src/features/annotations/domain/annotationTypes.ts`
- `src/features/annotations/domain/ycdw.ts`
- `src/features/annotations/domain/annotationGeometry.ts`
- `src/features/pgn/domain/types.ts`
- `src/features/pgn/domain/parsePgn.ts`
- `src/features/pgn/domain/mutations.ts`
- `src/stores/pgn.ts`
- `src/features/board/useBoardView.ts`
- `src/features/board/BoardView.vue`
- `src/features/board/CanonicalChessBoard.vue`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/features/pgn/components/PgnNotationPanel.vue`

## Source To Target Mapping

| Canonical owner                             | Target owner                                                                 | P1D classification                        |
| ------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| YCDW annotation model and parser            | `features/annotations/domain/ycdw.ts`                                        | `REQUIRED_IN_P1D`                         |
| Arrow and square/highlight domain types     | `features/annotations/domain/annotationTypes.ts`                             | `REQUIRED_IN_P1D`                         |
| Orientation-aware square and arrow geometry | `features/annotations/domain/annotationGeometry.ts`, existing board geometry | `REQUIRED_IN_P1D`                         |
| Modifier color mapping and draw palette     | `annotationTypes.ts`, `TeachingWorkspace.vue` board-local controls           | `REQUIRED_IN_P1D`                         |
| Node-owned drawing state                    | `stores/pgn.ts`, `features/pgn/domain/types.ts`                              | `REQUIRED_IN_P1D`                         |
| SVG overlay renderer                        | `BoardView.vue`, `useBoardView.ts`                                           | `REQUIRED_IN_P1D`                         |
| Pointer/touch drawing gesture               | `useBoardView.ts`                                                            | `REQUIRED_IN_P1D`                         |
| Full workspace toolbar                      | not copied                                                                   | `UI_CONTROL_DEFERRED_TO_P1E`              |
| Undo/redo and text/system annotation panels | not copied                                                                   | `UI_CONTROL_DEFERRED_TO_P1E`              |
| AI analysis annotations                     | not copied                                                                   | `DEFERRED_TO_AI_OR_API_PHASE`             |
| Persistence/export UI                       | not copied                                                                   | `DATA_PRESERVATION_ONLY_FOR_LATER_EXPORT` |

## Domain Model And Identity

`BoardAnnotation` is node-owned and contains `arrows`, `squares`,
`systemTexts`, `userTexts`, `unknownFields`, and `plainComments`. P1D committed
drawings distinguish `AnnotationArrow` and `AnnotationSquare`.

Arrow identity is deterministic by `from + to`. Drawing the same arrow on the
same node toggles it off regardless of color. Square identity is deterministic
by `square + kind`; drawing the same square-outline or highlight on the same node
toggles it off. Duplicate equivalent committed annotations are not created.

## Color And Tokens

Runtime state stores semantic `AnnotationColorId` values only:
`draw-red`, `draw-green`, `draw-yellow`, `draw-orange`, `draw-purple`, and
`draw-dark`. Rendering resolves those identifiers through the accepted F3B
annotation tokens:

- `--cg-arrow-red`
- `--cg-arrow-green`
- `--cg-arrow-yellow`
- `--cg-arrow-orange`
- `--cg-arrow-purple`
- `--cg-arrow-black`

P1D adds no new token and changes no accepted token value. Annotation stroke
widths and opacities use the existing `--annotation-*` geometry tokens.

## Overlay Composition And Geometry

The accepted P1B board remains the only board renderer. P1D adds annotation SVG
children inside the existing board SVG:

1. base squares;
2. P1B move and state overlays;
3. filled annotation highlights below pieces;
4. square-outline annotations below pieces;
5. legal move markers;
6. pieces;
7. arrow annotations above pieces;
8. existing transparent interaction overlay.

Square geometry uses the canonical full-square rect with the canonical inset for
outline marks. Arrows begin at the source square center and end at the target
square center with a shortened shaft and polygon head. White and black
orientation use the existing P1B square transform.

## State Ownership

`stores/pgn.ts` remains the single PGN tree, current-node, and committed
annotation owner. `BoardView.vue` owns only temporary drawing preview state.
Navigating to another node renders only that node's annotation model. Returning
to a node restores its annotations from the move tree. Variations are isolated
because each variation node owns its own annotation object.

Replacing the loaded PGN replaces the selected item tree and therefore replaces
annotation state with the newly parsed PGN annotations. There is no orphan
annotation persistence before a PGN is loaded.

## PGN Comment Boundary

Imported comments containing `YCDW:` are parsed into structured annotations.
Plain comments remain in `plainComments` and continue to render in the notation
panel. Unknown YCDW fields are preserved in the model and serialized back by the
internal boundary. Unsupported comment content is not silently removed.

Created annotations update only the internal node comment boundary; P1D does not
add PGN export UI or file saving.

## Gesture Contract

P1D uses a minimal board-local control strip to select arrow, square, or
highlight mode and one of the canonical colors. It is intentionally not the full
workspace toolbar; P1E owns complete toolbar and panel completion.

When an annotation tool is active, annotation drawing owns the pointer and board
move gestures are suppressed. When annotation drawing is inactive, the accepted
P1B/P1C move interaction remains unchanged. Pointer release outside the board
cancels without committing. Pointer cancellation clears the preview. Context menu
prevention is scoped to the board interaction overlay.

Modifier colors follow canonical mapping: Alt green, Ctrl orange, Shift purple,
Alt+Shift red, Ctrl+Alt yellow, and Ctrl+Shift dark. Touch-capable pointer events
use the same active annotation-mode drawing path.

## Cleanup And Resize

The existing board `ResizeObserver` remains the only board sizing observer and
is disconnected on unmount. P1D preview state is cleared on cancellation,
external FEN changes, and unmount. Annotation geometry is recomputed from the
current board orientation and SVG viewBox, so it remains aligned after shell
breakpoint and viewport changes, including mobile landscape `844x390`.

## Deferred Capabilities

Deferred to `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`:
complete annotation toolbar, panel controls, undo/redo UI, clear-all UI, and
workspace splitter/panel completion.

Deferred to later phases: AI overlays, Web Workers, authentication, production
APIs, cloud persistence, settings, live/replay import, complete product
integration, and post-product hardening.

## Completion Gate

P1D is complete only when canonical annotation parity is accepted for this
slice, arrows and square highlights render and interact correctly, semantic
colors and geometry are governed, board interaction arbitration is correct,
PGN-node association and variation isolation are stable, comments and NAGs
remain intact, pointer/touch/orientation/resize/mobile-landscape behavior pass,
singular Vue root/Router/Pinia/theme/provider/board/PGN ownership remains
intact, no fake data or later runtime appears, static checks and production build
pass, real-browser validation passes, implementation and governance commits are
pushed normally, local `HEAD` equals remote `main`, and no evidence source is
modified.

## P1D2 Black-Orientation Contract Validation

P1D does not add a permanent product-facing board flip control. Orientation
control remains deferred to
`P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`, where the
complete workspace toolbar and panel controls are owned. Product-route P1D
therefore remains white-oriented by design, while black orientation is validated
through the accepted P1B board public contract.

Black orientation was validated with an operating-system temporary Vite harness
outside the repository. The harness imported the real target board component,
annotation domain model, annotation overlay/runtime, PGN store and node model,
theme provider composition, semantic tokens, and base styles directly from the
target source. It did not copy or rewrite the board or annotation
implementation. Its only temporary control was an in-memory orientation switch
used outside the product source.

Imported target files and SHA-256 hashes:

| Target file                                             | SHA-256                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/features/board/CanonicalChessBoard.vue`            | `91aeff372da11fd81d2f881f2f45af427494f7f32a3e2d3bdc72e3ae1e29372e` |
| `src/features/board/BoardView.vue`                      | `93c2cafa7692b3e677eddb939a9e838242bcf242fb84f7d11a1699bef7714477` |
| `src/features/board/useBoardView.ts`                    | `08ede7140064d788da95e3587333134ddf80713632b4fb995e82b77245047cbb` |
| `src/features/board/domain/boardGeometry.ts`            | `841b9f465da1c6296f90274866e908ecd40eaf8825c9c3aea7a35d53347607e2` |
| `src/features/annotations/domain/annotationTypes.ts`    | `3873a1ddf8f5b4ebdeaba17e5c73305bbf02a05ed8d5f11df067867504b1ef40` |
| `src/features/annotations/domain/annotationGeometry.ts` | `74cbe766e2ce3b6d5d5728f00aa96d656f63848d9985132286c4a39e9a704e3e` |
| `src/features/annotations/domain/ycdw.ts`               | `c5a437d0d20d5b19c3fef575aaf201c0536e2384b0aa5662e6de95ccca80c714` |
| `src/stores/pgn.ts`                                     | `0f72a68bb474db85a996be4b69a0bd657ddb5428e8aa9e790da8c47ebf7fa9b2` |
| `src/features/pgn/domain/types.ts`                      | `75b59d8cd3461867e5a0364d9ec7a448eff7a1d681c159a1d854af5435e89a7d` |
| `src/features/pgn/domain/parsePgn.ts`                   | `2087f4c432688e112c0b822323d0fa2e24969cd6a5888d1ccc7e6767adef3d71` |
| `src/features/pgn/domain/mutations.ts`                  | `1248abef62dce120bcbdb935261e952d408244aedc1c7cea30a07bbb917ad201` |
| `src/styles/index.css`                                  | `33759c251024ff6b18e2ec3c976c6165dfd6784ac4732070cbada90a0056e384` |
| `src/app/providers/AppProviders.vue`                    | `4600cbf989214b41c6907dcad855eb8877df30575a6858b07ff7b9984af3e105` |

External black-orientation validation result:

- Browser: installed Google Chrome `149.0.7827.197`.
- Route: temporary harness route served from `/tmp`.
- Result: `PASS`, 27 checks.
- Visual corners: black orientation mapped top-left to `h1`, top-right to
  `a1`, bottom-left to `h8`, and bottom-right to `a8`.
- Coordinate labels: files rendered `hgfedcba`; ranks rendered `12345678`.
- Piece placement: `h1` and `a8` pieces appeared in the expected opposite
  visual corners.
- Geometry: board bounds and overlay bounds matched; arrow endpoints and square
  rects used the same orientation transform as board squares and coordinates.
- Gestures: arrow, square, and highlight drawing passed through the real board
  overlay; outside release cancelled; context menu prevention stayed scoped to
  the board overlay; touch drawing committed when supported.
- Colors: all six semantic colors rendered through the `--cg-arrow-*` token
  family.
- State: committed annotations belonged to the intended PGN node, disappeared
  on another node, restored when returning, and remained isolated between
  mainline and side-variation nodes.
- Comments: plain comments, NAG values, supported imported YCDW tags, and
  unknown YCDW fields remained preserved.
- Movement: legal board movement still worked after annotation mode was
  inactive; invalid moves remained rejected; promotion still opened the
  four-piece chooser.
- Resize and cleanup: desktop, tablet portrait, tablet landscape, mobile
  portrait, and `844x390` mobile landscape passed; repeated mount/unmount and
  orientation changes did not leave stale overlays or duplicate active
  observers.
- `844x390` measurements: viewport `844x390`; board bounds
  `left=362.296875 top=63 width=119.40625 height=119.40625`; square size
  `14.92578125`; overlay bounds matched board bounds; body scroll size matched
  client size with hidden overflow.
- Console and network: no page errors, failed requests, or app-breaking console
  entries.

After validation, every temporary harness file, build output, browser profile,
script, result file, and server/browser process was removed. The target
`node_modules/.vite/deps` directory was not created or modified; only the
pre-existing `node_modules/.vite/vitest` cache directory remained.

## Product Route White-Orientation Validation

The product route `/pgnViewer/` was validated from a temporary production Vite
build outside the repository. It intentionally remained white-oriented because
the user-facing orientation control is deferred to P1E.

Product-route validation result:

- Browser: installed Google Chrome `149.0.7827.197`.
- Route: `/pgnViewer/` served from temporary production build output in `/tmp`.
- Result: `PASS`, 22 checks.
- PGN import: real local-file drop path loaded a PGN and preserved plain
  comments while hiding structured `YCDW:` payloads from notation text.
- Annotation behavior: arrow, square, and highlight drawing passed; duplicate
  arrow removal passed; all six semantic colors rendered; outside release
  cancellation passed; context-menu handling did not break the route; touch
  drawing passed.
- State ownership: annotations disappeared on another node, restored on return,
  and imported side-variation annotations remained isolated from the mainline.
- Board arbitration: invalid move rejection and legal move selection still
  worked after annotation use.
- Promotion: a FEN-start promotion position still opened the four-piece
  promotion chooser.
- Themes: light, dark, and system theme reloads passed.
- Viewports: desktop, tablet portrait, tablet landscape, mobile portrait, and
  mobile landscape `844x390` passed with hidden body overflow.
- `844x390` measurements: board bounds `left=145 top=51 width=288 height=288`;
  square size `36`; body scroll size matched client size with hidden overflow.
- Console and network: no page errors, failed app requests, or bad app
  responses.
- Later phases: no AI, authentication, production API, persistence, settings,
  complete-toolbar, fake-data, or later-runtime exposure was introduced.

## Final P1D Status

P1D annotation runtime is accepted as
`P1D_CANONICAL_ANNOTATION_RUNTIME_PASS_READY_FOR_WORKSPACE_COMPLETION`. The next
required phase is
`P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`.
