# Chessboard Component API

| Field   | Value                                                |
| ------- | ---------------------------------------------------- |
| Version | 1.1.0                                                |
| Status  | `COMPLETE_ACTIVE_PRODUCT_UI_SPEC_RESIDUE_PURGE_PASS` |

## Imports

Use the project public barrels. Feature-internal files are not consumer entrypoints.

```ts
import { CanonicalChessBoard, PgnChessBoard, meridaPieceResolver } from '@/ui'
import type {
  BoardAnnotation,
  BoardPieceResolver,
  ChessboardCapabilities,
  ChessboardExposed,
  PgnChessBoardExposed,
  PgnChessBoardSource,
} from '@/types'
```

`CanonicalChessBoard` is the position-driven component. `PgnChessBoard` composes
the same renderer with one isolated PGN controller.

## Host sizing

The consumer owns layout size. Give the component a measurable square-capable
host; the board fills that host and never owns page or viewport geometry.

```vue
<div class="board-host">
  <CanonicalChessBoard :position="fen" :capabilities="capabilities" />
</div>

<style scoped>
.board-host {
  width: min(70vw, 720px);
  aspect-ratio: 1;
}
</style>
```

`responsive.fit` controls how the board fits the available host. `minSize` and
`maxSize` add safe per-instance pixel constraints; they do not mutate global
layout tokens.

## `CanonicalChessBoard`

### Props

| Prop           | Type                        | Contract                                                                                             |
| -------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `position`     | `string`                    | FEN input. Omission uses the standard initial position. Later changes replace the instance position. |
| `lastMove`     | `readonly [string, string]` | Optional externally owned last-move highlight.                                                       |
| `annotations`  | `BoardAnnotation`           | Optional controlled annotation model. Omission enables instance-local annotation state.              |
| `capabilities` | `ChessboardCapabilities`    | One typed configuration object for all optional behavior.                                            |

### Events

| Event                | Payload                    | Meaning                                                                                 |
| -------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `move-request`       | `BoardMoveRequest`         | A legal-destination move intent reached the board boundary.                             |
| `move-executed`      | `ExecutedBoardMove`        | The uncontrolled board applied a move locally.                                          |
| `promotion-request`  | `PendingPromotion`         | A move needs an explicit promotion choice.                                              |
| `position-change`    | `string`                   | The normalized FEN changed through a prop update, exposed method, or uncontrolled move. |
| `annotation-draw`    | `AnnotationDrawPayload`    | A completed drawing gesture.                                                            |
| `update:annotations` | `BoardAnnotation`          | Controlled annotation-model update; enabled by default.                                 |
| `radial-command`     | `BoardRadialCommand`       | A typed shape, width, color, or custom radial command.                                  |
| `editor-update`      | `BoardEditorDraftSnapshot` | Editor draft FEN or metadata changed.                                                   |
| `editor-commit`      | `BoardEditorDraftSnapshot` | Editor validation and acceptance succeeded.                                             |
| `editor-error`       | `string`                   | Validation or acceptance rejected the editor draft.                                     |
| `editor-cancel`      | none                       | The editor cancel action completed.                                                     |
| `wheel-navigation`   | `'previous' \| 'next'`     | A permitted wheel intent passed threshold and throttle checks.                          |
| `interaction-active` | `boolean`                  | A move, drawing, radial, or editor pointer interaction became active or inactive.       |

### Exposed instance API

`ChessboardExposed` provides:

- `getPosition()` and `setPosition(fen)`;
- `setOrientation(orientation)` and `flipOrientation()`;
- `resolvePromotion(piece)` and `cancelPromotion()`;
- `undoAnnotations()`, `redoAnnotations()`, and `clearAnnotations()`;
- read-only `interactionActive: boolean`.

Annotation history methods use consumer callbacks when supplied. Without a
controlled model they use the instance-local history. A controlled consumer that
needs history must provide the corresponding callbacks and keep one annotation
owner.

## Capability object

Omitted basic board behavior preserves the existing playable board defaults.
Advanced groups such as move animation, radial menu, editor, and wheel navigation
are opt-in. Set every group explicitly when constructing a disabled or read-only
profile.

| Group             | Options                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `position`        | `visible`, `playable`, `readOnly`, `controlled`, `onMoveRequest`                                                  |
| `interaction`     | `click`, `drag`, `touch`, `keyboard`, ordered `priority`                                                          |
| `coordinates`     | `visible`                                                                                                         |
| `orientation`     | `'white' \| 'black'`                                                                                              |
| `promotion`       | `enabled`, typed `choices` (`q`, `r`, `b`, `n`)                                                                   |
| `animation`       | `move.enabled`, `snapback.enabled`, `reducedMotion`                                                               |
| `annotations`     | enable/drawing state, tools, color, color descriptors, model emission, undo/redo/clear availability and callbacks |
| `radialMenu`      | enablement, active shape, color index, width, colors, typed custom items, selection callback                      |
| `editor`          | availability, active state, initial FEN, free placement, palette, validation, accept, cancel                      |
| `wheelNavigation` | enablement, blocking, directions, threshold, throttle, event consumption, callback                                |
| `responsive`      | enablement, `contain`/`width`/`height` fit, minimum and maximum size                                              |
| `accessibility`   | board/editor/promotion labels, square label function, announcement callback                                       |
| `appearance`      | safe per-instance visual role overrides                                                                           |
| `pieceResolver`   | typed piece descriptor to asset URL resolver                                                                      |

`readOnly: true` always suppresses playable move input. Interaction priority is
deduplicated and completed with the project defaults so no interaction class is
silently lost.

## Position ownership

### Uncontrolled position

The component owns the current FEN after initialization and emits executed moves.

```vue
<CanonicalChessBoard
  :position="initialFen"
  :capabilities="{
    position: { playable: true },
    interaction: { click: true, drag: true, touch: true, keyboard: true },
  }"
  @move-executed="saveMove"
/>
```

### Controlled position

Set `controlled: true`, decide the move in `onMoveRequest`, and update the single
external FEN owner. The board does not also apply the move.

```ts
const capabilities: ChessboardCapabilities = {
  position: {
    playable: true,
    controlled: true,
    onMoveRequest: (move) => {
      const next = applyDomainMove(fen.value, move)
      if (!next) return 'illegal'
      fen.value = next
      return 'applied'
    },
  },
}
```

Do not create a second position store inside a wrapper around this contract.

## Controlled annotations and drawing

```vue
<CanonicalChessBoard
  v-model:annotations="annotations"
  :capabilities="capabilities"
  @annotation-draw="recordDrawIntent"
/>
```

```ts
const capabilities: ChessboardCapabilities = {
  annotations: {
    enabled: true,
    drawing: true,
    tools: ['arrow', 'square', 'highlight'],
    activeTool: 'arrow',
    activeColor: 'draw-purple',
    colors: [{ id: 'draw-purple', name: 'violet', token: '--cg-arrow-purple' }],
    emitModelUpdates: true,
  },
}
```

Pointer/touch gesture capture, outside-release cancellation, orientation mapping,
resize mapping, and the SVG annotation overlay remain inside the reusable board
boundary. The consumer owns only the controlled model and optional history
policy.

## Radial menu customization

Custom entries are typed objects with stable keys and instance-local callbacks.

```ts
const capabilities: ChessboardCapabilities = {
  radialMenu: {
    enabled: true,
    activeShape: 'arrow',
    width: 0.16,
    customItems: [
      {
        key: 'inspect-square',
        label: 'IN',
        title: 'Inspect square',
        onSelect: ({ position, orientation, command }) => {
          inspectPosition({ position, orientation, command })
        },
      },
    ],
  },
}
```

Blank and duplicate custom keys are discarded. Disabled items never invoke their
callback. Commands are also emitted through `radial-command`.

## Editor mode

The editor owns a temporary draft only. The consumer decides when `active` is
true and whether a validated snapshot is accepted.

```ts
const capabilities: ChessboardCapabilities = {
  editor: {
    available: true,
    active: editorOpen.value,
    initialFen: fen.value,
    freePlacement: true,
    validate: (snapshot) =>
      snapshot.fen.includes('K') && snapshot.fen.includes('k')
        ? { valid: true }
        : { valid: false, message: 'Both kings are required' },
    onAccept: (snapshot) => {
      fen.value = snapshot.fen
      editorOpen.value = false
      return true
    },
    onCancel: () => {
      editorOpen.value = false
    },
  },
}
```

`palette` accepts typed `{ color, type }` entries. `freePlacement: false`
disables direct piece placement while preserving the editor control surface.

## Wheel navigation

```ts
const capabilities: ChessboardCapabilities = {
  wheelNavigation: {
    enabled: true,
    directions: ['previous', 'next'],
    threshold: 1,
    throttleMs: 60,
    consume: 'handled',
    onNavigate: (direction) => navigate(direction),
  },
}
```

`consume` is `always`, `handled`, or `never`. `PgnChessBoard` emits and calls the
consumer callback only when the requested direction actually navigates, so PGN
boundaries do not generate duplicate success events.

## Appearance and piece sets

Appearance values are validated with `CSS.supports`, reject declaration-breaking
characters, and are applied as styles on that component root only. They do not
change `document`, theme state, or `src/styles/tokens.css`.

```ts
import blackKnight from './pieces/black-knight.svg'
import whiteKnight from './pieces/white-knight.svg'

const pieces: BoardPieceResolver = (piece) => {
  if (piece.type === 'knight') {
    return piece.color === 'white' ? whiteKnight : blackKnight
  }
  return meridaPieceResolver(piece)
}

const capabilities: ChessboardCapabilities = {
  appearance: {
    lightSquare: '#f1e4bf',
    darkSquare: '#8b5e3c',
    coordinates: '#2457a6',
    selected: 'color-mix(in srgb, #2457a6 30%, transparent)',
    legalTarget: '#2457a6',
    legalCapture: '#a62424',
    lastMove: '#d8ae32',
    check: '#b42318',
    hover: '#2457a6',
    focus: '#2457a6',
    annotations: { 'draw-purple': '#d12acb' },
    border: '#2457a6',
    radius: '10px',
    shadow: '0 12px 36px rgb(0 0 0 / 20%)',
    radialMenu: { selected: '#2457a6' },
    editorPalette: { selected: '#2457a6' },
  },
  pieceResolver: pieces,
}
```

Merida remains the default resolver. A resolver receives color, semantic piece
type, source letter, and square when available, and returns one asset URL.

## `PgnChessBoard`

### Source and fallback modes

`pgn` accepts PGN text, one parsed `PgnItem`, an array of parsed items, or `null`.
`initialPgn` is used only when `pgn` is initially undefined. Parsed items and
their move trees are cloned per instance.

- Valid replacement selects the requested or first game and emits one
  `pgn-change` plus navigation events.
- `pgn = null` or `removePgn()` removes the instance PGN and falls back to the
  `position`, `lastMove`, and `annotations` props.
- Invalid input emits `pgn-error`. `preserveOnInvalid` defaults to `true`, keeping
  the last valid PGN, node, FEN, and annotations.
- `gameIndex` and `nodeId` are optional controlled selection inputs with
  `update:gameIndex` and `update:nodeId` events.

### PGN events and exposed API

The wrapper adds `pgn-change`, `pgn-remove`, `pgn-error`, `game-change`,
`current-node-change`, and `navigation`. Navigation events include the typed
reason, game index, previous node, current immutable snapshot, and path IDs.

`PgnChessBoardExposed` adds:

- `getGames()` and `getCurrentNode()`;
- `replacePgn(source)` and `removePgn()`;
- `selectGame(index)`, `selectNode(id)`, and `selectVariation(index)`;
- `goToStart()`, `goToEnd()`, `previous()`, and `next()`.

```vue
<PgnChessBoard
  ref="board"
  v-model:game-index="gameIndex"
  v-model:node-id="nodeId"
  :pgn="source"
  :position="fallbackFen"
  :capabilities="capabilities"
  @navigation="onNavigation"
  @pgn-error="showPgnError"
/>
```

## Multiple instances

Create separate refs, capability objects, PGN sources, and annotation models.
No board component imports the teaching workspace store or creates global board,
PGN, annotation, GSAP, listener, or DOM ownership.

```vue
<div class="comparison">
  <PgnChessBoard
    ref="whiteBoard"
    :pgn="whitePgn"
    :capabilities="whiteCapabilities"
  />
  <PgnChessBoard
    ref="blackBoard"
    :pgn="blackPgn"
    :capabilities="blackCapabilities"
  />
</div>
```

Unmounting an instance releases pointer listeners, media-query listeners, GSAP
contexts/tweens, resize observers, focus state, and transient radial/editor/
promotion state. Consumers must release only resources they created in their own
callbacks.

## Accessibility and motion

- Keyboard input uses the board grid only when enabled and playable; otherwise
  the grid is removed from the tab sequence.
- Promotion focus is trapped inside its chooser and restored on close.
- Labels and announcements are consumer-overridable through typed callbacks.
- GSAP owns presentation only. Move, snapback, overlays, promotion, radial,
  editor, toolbar, panel, and analysis motion use scoped lifecycle cleanup.
- `reducedMotion: 'system'` obeys the media query; `reduce` always resolves to
  final visual state without active tweens or stale transforms.
