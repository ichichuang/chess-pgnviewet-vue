# P1C Real PGN Runtime Baseline

Status: `P1C_REAL_PGN_RUNTIME_IMPLEMENTED_BROWSER_VALIDATED_PENDING_GOVERNANCE`
Phase: `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`
Target route: `/pgnViewer/`
Next phase: `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`

## Scope

P1C implements real local PGN loading, strict PGN parsing, move-tree navigation,
board replay synchronization, FEN-start handling, comments, NAGs, and variation
branching inside the accepted P1A shell and P1B board runtime.

P1C does not implement annotation drawing, AI analysis, production APIs,
authentication, settings, structured persistence, live spectator transport,
tournament data, replay imports, board editor/free setup, or any mock product
data.

## Canonical Source Files

- `pgnViewer-new/src/domains/pgn/types.ts`
- `pgnViewer-new/src/domains/pgn/parsePgn.ts`
- `pgnViewer-new/src/domains/pgn/moveRows.ts`
- `pgnViewer-new/src/domains/pgn/mutations.ts`
- `pgnViewer-new/src/domains/pgn/pgnStorage.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/features/pgn-panel/PgnPanel.vue`
- `pgnViewer-new/src/features/pgn-library/PgnList.vue`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`

## Target Files

- `src/features/pgn/domain/types.ts`
- `src/features/pgn/domain/parsePgn.ts`
- `src/features/pgn/domain/moveRows.ts`
- `src/features/pgn/domain/mutations.ts`
- `src/features/pgn/domain/pgnStorage.ts`
- `src/features/pgn/usePgnWorkspaceRuntime.ts`
- `src/features/pgn/components/PgnGameList.vue`
- `src/features/pgn/components/PgnNotationPanel.vue`
- `src/stores/pgn.ts`
- `src/stores/index.ts`
- `src/features/board/CanonicalChessBoard.vue`
- `src/features/board/useCanonicalChessBoard.ts`
- `src/features/teaching-workspace/TeachingWorkspace.vue`

## Source To Target Mapping

| Canonical owner                   | Target owner                               | P1C classification |
| --------------------------------- | ------------------------------------------ | ------------------ |
| PGN item, tree, node types        | `features/pgn/domain/types.ts`             | `REQUIRED_IN_P1C`  |
| PGN tokenization and parsing      | `features/pgn/domain/parsePgn.ts`          | `REQUIRED_IN_P1C`  |
| PGN list filtering and pagination | `features/pgn/domain/pgnStorage.ts`        | `REQUIRED_IN_P1C`  |
| Move-row projection               | `features/pgn/domain/moveRows.ts`          | `REQUIRED_IN_P1C`  |
| Legal move and branch mutation    | `features/pgn/domain/mutations.ts`         | `REQUIRED_IN_P1C`  |
| Current game and node ownership   | `stores/pgn.ts`                            | `REQUIRED_IN_P1C`  |
| PGN library panel                 | `components/PgnGameList.vue`               | `REQUIRED_IN_P1C`  |
| PGN notation/navigation panel     | `components/PgnNotationPanel.vue`          | `REQUIRED_IN_P1C`  |
| Workspace board and PGN wiring    | `usePgnWorkspaceRuntime.ts`, workspace Vue | `REQUIRED_IN_P1C`  |
| Board controlled-move handoff     | board wrapper and composable               | `REQUIRED_IN_P1C`  |
| Annotation runtime                | not copied                                 | `DEFERRED_TO_P1D`  |
| Full toolbar/splitter completion  | not copied                                 | `DEFERRED_TO_P1E`  |
| AI analysis and workers           | not copied                                 | `DEFERRED_TO_P1F`  |
| Auth and production APIs          | not copied                                 | `DEFERRED_TO_P1G`  |

## Runtime Contract

`stores/pgn.ts` is the sole P1C owner for PGN collection state, selected game,
selected node, current FEN, last move, legal destinations, parse errors,
promotion requests, and pending branch decisions.

`CanonicalChessBoard.vue` remains the P1B board renderer. In P1C it accepts
`position`, `lastMove`, `interactive`, and `controlledMoves`. Controlled moves
emit move requests to the PGN store; the board does not mutate its own position
until the PGN owner publishes the next FEN back through props.

## Behavior

- Local loading: hidden file input and drag/drop accept real `.pgn` files; `.txt`
  is tolerated by the import guard for canonical local-file compatibility.
- Strict parse gate: a PGN batch replaces or inserts only when every parsed game
  is legal. Illegal sequences leave the previous valid state intact and surface
  a truthful error.
- Header support: standard tag pairs are preserved and rendered, including FEN.
- Start position: a valid `[FEN "..."]` header seeds the root node and board.
- Move tree: root node owns stable numeric node ids, `children[0]` is mainline,
  and later children are variations.
- Comments and NAGs: brace comments, semicolon comments, `$n` NAGs, and common
  glyph NAGs are preserved on move nodes and rendered in notation.
- Navigation: start, back, forward, and end controls select nodes from the PGN
  tree and keep board FEN synchronized with the active notation node.
- Variation display: mainline moves expose branch toggles; selecting or creating
  a hidden variation expands the active path so the current node remains visible.
- Board move integration: a legal board move follows an existing child when SAN
  matches, creates a continuation at leaf nodes, and asks the user to choose
  mainline or variation when the current node already has continuations.
- Duplicate prevention: resolving a pending branch to a SAN that already exists
  under the parent selects the existing child instead of creating a duplicate.
- Promotion: promotion remains explicit through the existing four-choice board
  promotion contract; there is no silent queen fallback.

## P1A And P1B Integration

The P1A shell remains the single workspace shell, router destination, viewport
owner, and structural layout. The P1B board remains the only board renderer.
P1C adds the PGN owner and controlled board handoff without adding another Vue
root, Router, Pinia owner, provider, token registry, package manager, or runtime
bridge.

## Tokens

P1C uses the accepted semantic token registry for PGN list, notation, toolbar,
error, branch-choice, and drag/drop surfaces. It does not add feature-local raw
colors or parallel token definitions.

## Deliberately Excluded

Annotations, arrows, square drawing, free setup, board editor, AI analysis, Web
Workers, authentication, production APIs, TanStack Query/repository framework,
settings, Dexie persistence, live/replay transport, fake PGNs, mock product
records, automated tests, dependency changes, package-manager changes, and
source-project writes remain outside P1C.

## Completion Gate

P1C is complete only when real PGN loading, navigation, FEN replay, move-tree
display, variation expansion, board-controlled move branching, illegal PGN
rejection, invalid board move rejection, duplicate branch prevention, responsive
runtime checks, static checks, production build, implementation and governance
commits, normal push, remote verification, temp cleanup, and evidence-source
immutability all pass.
