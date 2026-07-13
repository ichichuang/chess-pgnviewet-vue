import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  annotationColorToken,
  isAnnotationColorId,
  modifierAnnotationColor,
  type AnnotationColorId,
  type AnnotationDrawPayload,
  type AnnotationShapeKind,
  type BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'
import {
  arrowGeometry,
  arrowGeometryFromPoints,
  type AnnotationArrowGeometry,
} from '@/features/annotations/domain/annotationGeometry'
import { squareCenter, squareRect, squareToDisplay } from './domain/boardGeometry'
import { buildBoardCells } from './domain/boardCells'
import { fenToGrid } from './domain/fenBoard'
import { pieceImg } from './domain/pieceAssets'
import type {
  BoardAdvancedCapabilities,
  BoardEditorDraftSnapshot,
  BoardRadialCommand,
} from './domain/boardCapabilities'
import { BOARD_DRAG_THRESHOLD_PX, isAcceptedMoveDecision } from './domain/boardCapabilities'
import {
  BOARD_COLOR_BLACK,
  BOARD_COLOR_WHITE,
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
  type BoardColor,
  type BoardMoveRequest,
  type BoardOrientation,
} from './domain/boardTypes'
import { useBoardAnimationController } from './useBoardAnimationController'
import { useBoardCapabilityOptions } from './useBoardCapabilityOptions'
import { useBoardRadialMenu } from './useBoardRadialMenu'
import { useBoardWheelNavigation } from './useBoardWheelNavigation'
import type { BoardEditorDraft } from './editor/boardEditorDraft'

interface BoardViewRuntimeProps {
  fen: string
  lastMove?: unknown
  orientation?: string
  turnColor?: string
  dests?: unknown
  check?: boolean
  interactive?: boolean
  annotationTool?: string | null
  annotationColor?: string
  annotations?: unknown
  advancedCapabilities?: BoardAdvancedCapabilities
  editorDraft?: unknown
}

type BoardViewEvent =
  | 'move'
  | 'interaction-active'
  | 'annotation-draw'
  | 'radial-command'
  | 'editor-update'
  | 'wheel-navigation'
type BoardViewEmit = (event: BoardViewEvent, ...args: unknown[]) => void

const BOARD_SIDE = 8
const PIECE_UNIT = 1
const QUIET_MOVE_RADIUS = 0.15
const CAPTURE_OUTLINE_RADIUS = 0.43
const CAPTURE_RING_RADIUS = 0.38

export function useBoardView(props: BoardViewRuntimeProps, emit: BoardViewEmit) {
  const wrap = ref<HTMLElement | null>(null)
  const svg = ref<SVGSVGElement | null>(null)
  const ghostEl = ref<HTMLImageElement | null>(null)
  const squarePx = ref(60)
  const selected = ref<string | null>(null)
  const focusedSquare = ref('e2')
  const hoverSquare = ref<string | null>(null)
  const dragStart = ref<string | null>(null)
  const draggingFrom = ref<string | null>(null)
  const dragOverSquare = ref<string | null>(null)
  const dragging = ref(false)
  const downX = ref(0)
  const downY = ref(0)
  const ghost = ref<{ letter: string; x: number; y: number } | null>(null)
  const annotationStart = ref<string | null>(null)
  const annotationPreview = ref<AnnotationDrawPayload | null>(null)
  const annotationPointer = ref<[number, number] | null>(null)
  const editorDownSquare = ref<string | null>(null)
  const editorDragged = ref(false)
  const suppressNextMoveAnimation = ref(false)
  const pendingDragSettle = ref<string | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let editorLastFen = ''

  const orientation = computed<BoardOrientation>(() =>
    props.orientation === BOARD_ORIENTATION_BLACK
      ? BOARD_ORIENTATION_BLACK
      : BOARD_ORIENTATION_WHITE
  )
  const turnColor = computed<BoardColor>(() =>
    props.turnColor === BOARD_COLOR_BLACK ? BOARD_COLOR_BLACK : BOARD_COLOR_WHITE
  )
  const legalDests = computed(() => normalizeDests(props.dests))
  const interactive = computed(() => props.interactive !== false)
  const capabilities = useBoardCapabilityOptions(() => props.advancedCapabilities)
  const editorDraft = computed(() => props.editorDraft as BoardEditorDraft | null | undefined)
  const editorActive = computed(
    () => capabilities.value.editor.active && editorDraft.value?.editing.value === true
  )
  const annotationTool = computed<AnnotationShapeKind | null>(() => {
    if (editorActive.value) {
      return null
    }

    return props.annotationTool === 'arrow' ||
      props.annotationTool === 'square' ||
      props.annotationTool === 'highlight'
      ? props.annotationTool
      : null
  })
  const annotationColor = computed<AnnotationColorId>(() =>
    props.annotationColor && isAnnotationColorId(props.annotationColor)
      ? props.annotationColor
      : 'draw-red'
  )

  const files = computed(() => {
    const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    return orientation.value === BOARD_ORIENTATION_BLACK ? values.slice().reverse() : values
  })

  const ranks = computed(() => {
    const values = [8, 7, 6, 5, 4, 3, 2, 1]

    return orientation.value === BOARD_ORIENTATION_BLACK ? values.slice().reverse() : values
  })

  const grid = computed(() => fenToGrid(props.fen))
  const cells = computed(() => buildBoardCells(props.fen, orientation.value))
  const pieces = computed(() => cells.value.filter((cell) => cell.letter))
  const lastMoveSet = computed(() => new Set(Array.isArray(props.lastMove) ? props.lastMove : []))
  const overlayOn = computed(
    () =>
      editorActive.value ||
      interactive.value ||
      annotationTool.value !== null ||
      capabilities.value.radialMenu.enabled ||
      capabilities.value.wheelNavigation.enabled
  )

  const radial = useBoardRadialMenu({
    enabled: () => capabilities.value.radialMenu.enabled,
    isBlocked: () => editorActive.value || annotationStart.value !== null || dragging.value,
    emitCommand: (command) => emit('radial-command', command),
  })

  const wheel = useBoardWheelNavigation({
    enabled: () => capabilities.value.wheelNavigation.enabled,
    blocked: () =>
      capabilities.value.wheelNavigation.blocked ||
      editorActive.value ||
      radial.active.value ||
      annotationStart.value !== null ||
      dragStart.value !== null ||
      dragging.value,
    emitNavigate: (direction) => emit('wheel-navigation', direction),
  })

  const animation = useBoardAnimationController({
    svg,
    ghostEl,
    squarePx,
    orientation,
    moveEnabled: computed(() => capabilities.value.animation.move.enabled),
    snapbackEnabled: computed(() => capabilities.value.animation.snapback.enabled),
    clearMoveDrag,
  })

  const radialState = {
    activeShape: computed(() => capabilities.value.radialMenu.activeShape),
    colorIndex: computed(() => capabilities.value.radialMenu.colorIndex),
    colors: computed(() => capabilities.value.radialMenu.colors),
    mounted: radial.mounted,
    open: radial.open,
    pointerX: radial.pointerX,
    pointerY: radial.pointerY,
    width: computed(() => capabilities.value.radialMenu.width),
    x: radial.x,
    y: radial.y,
  }

  const interactionActive = computed(
    () =>
      editorDownSquare.value !== null ||
      radial.active.value ||
      dragging.value ||
      ghost.value !== null ||
      dragStart.value !== null ||
      annotationStart.value !== null
  )

  watch(interactionActive, (active) => emit('interaction-active', active), { immediate: true })

  const kingSquare = computed<string | null>(() => {
    if (!props.check) {
      return null
    }

    const king = turnColor.value === BOARD_COLOR_WHITE ? 'K' : 'k'

    for (let row = 0; row < BOARD_SIDE; row += 1) {
      for (let col = 0; col < BOARD_SIDE; col += 1) {
        if (grid.value[row]?.[col] === king) {
          return String.fromCharCode(97 + col) + (BOARD_SIDE - row)
        }
      }
    }

    return null
  })

  const dragTarget = computed(() => {
    const from = dragStart.value
    const target = dragOverSquare.value

    if (!dragging.value || !from || !target || target === from) {
      return null
    }

    return { square: target, legal: canMoveTo(from, target) }
  })

  const stateOverlays = computed(() =>
    cells.value.flatMap((cell) => {
      const overlays: { key: string; kind: string; row: number; col: number }[] = []

      if (lastMoveSet.value.has(cell.square)) {
        overlays.push({
          key: `last-${cell.square}`,
          kind: 'last-move',
          row: cell.row,
          col: cell.col,
        })
      }

      if (dragTarget.value?.square === cell.square) {
        overlays.push({
          key: `drop-${cell.square}`,
          kind: dragTarget.value.legal ? 'drop-ok' : 'drop-bad',
          row: cell.row,
          col: cell.col,
        })
      }

      return overlays
    })
  )

  const selectedMarker = computed(() =>
    selected.value ? squareRect(selected.value, orientation.value) : null
  )
  const focusedMarker = computed(() => squareRect(focusedSquare.value, orientation.value))
  const checkMarker = computed(() =>
    kingSquare.value ? squareRect(kingSquare.value, orientation.value) : null
  )

  const activeDestMarkers = computed(() => {
    const from = selected.value ?? draggingFrom.value ?? dragStart.value ?? hoverSquare.value

    if (!from || !interactive.value) {
      return []
    }

    return Array.from(new Set(legalDests.value.get(from) ?? [])).flatMap((square) => {
      const center = squareCenter(square, orientation.value)

      if (!center) {
        return []
      }

      return [
        {
          key: `${square}-${pieceAt(square) ? 'capture' : 'quiet'}`,
          square,
          capture: Boolean(pieceAt(square)),
          cx: center[0],
          cy: center[1],
        },
      ]
    })
  })

  const annotationHighlights = computed(() =>
    annotationModel.value.squares
      .filter((mark) => mark.kind === 'highlight')
      .flatMap((mark, index) => {
        const rect = squareRect(mark.square, orientation.value)

        return rect
          ? [
              {
                key: `${mark.square}-highlight-${index}`,
                rect,
                color: annotationColorToken(mark.color),
              },
            ]
          : []
      })
  )

  const annotationSquares = computed(() =>
    annotationModel.value.squares
      .filter((mark) => mark.kind === 'square')
      .flatMap((mark, index) => {
        const rect = squareRect(mark.square, orientation.value)

        return rect
          ? [
              {
                key: `${mark.square}-square-${index}`,
                rect,
                color: annotationColorToken(mark.color),
              },
            ]
          : []
      })
  )

  const annotationArrows = computed(() =>
    annotationModel.value.arrows.flatMap((mark, index) => {
      const geometry = arrowGeometry(mark.from, mark.to, orientation.value)

      return geometry
        ? [
            {
              key: `${mark.from}-${mark.to}-${index}`,
              geometry,
              color: annotationColorToken(mark.color),
            },
          ]
        : []
    })
  )

  const annotationPreviewHighlight = computed(() => {
    const preview = annotationPreview.value

    if (preview?.kind !== 'highlight') {
      return null
    }

    const rect = squareRect(preview.from, orientation.value)

    return rect ? { rect, color: annotationColorToken(preview.color) } : null
  })

  const annotationPreviewSquare = computed(() => {
    const preview = annotationPreview.value

    if (preview?.kind !== 'square') {
      return null
    }

    const rect = squareRect(preview.from, orientation.value)

    return rect ? { rect, color: annotationColorToken(preview.color) } : null
  })

  const annotationPreviewArrow = computed(
    (): {
      geometry: AnnotationArrowGeometry
      color: string
    } | null => {
      const preview = annotationPreview.value

      if (preview?.kind !== 'arrow' || !annotationPointer.value) {
        return null
      }

      const start = squareCenter(preview.from, orientation.value)
      const geometry = start ? arrowGeometryFromPoints(start, annotationPointer.value) : null

      return geometry ? { geometry, color: annotationColorToken(preview.color) } : null
    }
  )

  const ariaLabel = computed(() => {
    const piece = pieceAt(focusedSquare.value)
    const occupant = piece ? pieceLabel(piece) : '空格'

    return `棋盘，当前焦点 ${focusedSquare.value}，${occupant}`
  })

  const annotationModel = computed<BoardAnnotation>(() => {
    const value = props.annotations

    if (!value || typeof value !== 'object') {
      return {
        arrows: [],
        squares: [],
        systemTexts: [],
        userTexts: [],
        unknownFields: [],
        plainComments: [],
      }
    }

    const candidate = value as Partial<BoardAnnotation>

    return {
      arrows: Array.isArray(candidate.arrows) ? candidate.arrows : [],
      squares: Array.isArray(candidate.squares) ? candidate.squares : [],
      systemTexts: Array.isArray(candidate.systemTexts) ? candidate.systemTexts : [],
      userTexts: Array.isArray(candidate.userTexts) ? candidate.userTexts : [],
      unknownFields: Array.isArray(candidate.unknownFields) ? candidate.unknownFields : [],
      plainComments: Array.isArray(candidate.plainComments) ? candidate.plainComments : [],
    }
  })

  function pieceAt(square: string): string {
    const file = square.charCodeAt(0) - 97
    const rank = Number(square[1])

    return grid.value[BOARD_SIDE - rank]?.[file] ?? ''
  }

  function normalizeDests(value: unknown): Map<string, string[]> {
    const dests = new Map<string, string[]>()

    if (!(value instanceof Map)) {
      return dests
    }

    for (const [from, targets] of value.entries()) {
      if (typeof from !== 'string' || !Array.isArray(targets)) {
        continue
      }

      const legalTargets = targets.filter((target): target is string => typeof target === 'string')

      if (legalTargets.length > 0) {
        dests.set(from, legalTargets)
      }
    }

    return dests
  }

  function pieceLabel(letter: string): string {
    const labels: Record<string, string> = {
      B: '白象',
      K: '白王',
      N: '白马',
      P: '白兵',
      Q: '白后',
      R: '白车',
      b: '黑象',
      k: '黑王',
      n: '黑马',
      p: '黑兵',
      q: '黑后',
      r: '黑车',
    }

    return labels[letter] ?? '棋子'
  }

  function isMovable(square: string): boolean {
    if (!interactive.value) {
      return false
    }

    const letter = pieceAt(square)

    if (!letter) {
      return false
    }

    const color = letter === letter.toUpperCase() ? BOARD_COLOR_WHITE : BOARD_COLOR_BLACK

    return color === turnColor.value
  }

  function canMoveTo(from: string, to: string | null): to is string {
    if (!to || to === from || !interactive.value) {
      return false
    }

    return legalDests.value.get(from)?.includes(to) ?? false
  }

  function squareAt(clientX: number, clientY: number): string | null {
    const rect = wrap.value?.getBoundingClientRect()

    if (!rect || rect.width === 0) {
      return null
    }

    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height

    if (x < 0 || x >= 1 || y < 0 || y >= 1) {
      return null
    }

    const displayCol = Math.floor(x * BOARD_SIDE)
    const displayRow = Math.floor(y * BOARD_SIDE)

    if (orientation.value === BOARD_ORIENTATION_WHITE) {
      return String.fromCharCode(97 + displayCol) + (BOARD_SIDE - displayRow)
    }

    return String.fromCharCode(97 + (BOARD_SIDE - 1 - displayCol)) + (displayRow + 1)
  }

  function pointerToBoardPoint(clientX: number, clientY: number): [number, number] | null {
    const rect = wrap.value?.getBoundingClientRect()

    if (!rect || rect.width === 0) {
      return null
    }

    return [
      ((clientX - rect.left) / rect.width) * BOARD_SIDE,
      ((clientY - rect.top) / rect.height) * BOARD_SIDE,
    ]
  }

  function clearMoveDrag(): void {
    dragStart.value = null
    draggingFrom.value = null
    dragOverSquare.value = null
    dragging.value = false
    ghost.value = null
  }

  function clearAnnotationGesture(): void {
    annotationStart.value = null
    annotationPreview.value = null
    annotationPointer.value = null
  }

  function clearEditorPointer(): void {
    editorDownSquare.value = null
    editorDragged.value = false
  }

  function emitEditorUpdate(): void {
    const snapshot = editorDraft.value?.snapshot.value

    if (snapshot) {
      emit('editor-update', snapshot satisfies BoardEditorDraftSnapshot)
    }
  }

  function editorPieceAt(square: string): string {
    return editorDraft.value?.pieceAt(square) ?? ''
  }

  function requestMove(payload: BoardMoveRequest): boolean {
    const request = capabilities.value.animation.move.requestMove

    if (!request) {
      emit('move', payload)
      return true
    }

    const decision = request(payload)

    return isAcceptedMoveDecision(decision)
  }

  function colorForAnnotation(event: PointerEvent): AnnotationColorId {
    return modifierAnnotationColor(event) ?? annotationColor.value
  }

  function armMovePointer(event: PointerEvent, square: string): void {
    dragStart.value = square
    draggingFrom.value = null
    dragOverSquare.value = null
    dragging.value = false
    downX.value = event.clientX
    downY.value = event.clientY
    ghost.value = null

    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    } catch {
      return
    }
  }

  function startMoveDrag(event: PointerEvent): void {
    const from = dragStart.value
    const letter = from ? pieceAt(from) : ''

    if (!from || !letter) {
      return
    }

    selected.value = null
    dragging.value = true
    draggingFrom.value = from
    ghost.value = { letter, x: event.clientX, y: event.clientY }
  }

  function commitSquare(square: string): void {
    if (selected.value && square !== selected.value) {
      if (canMoveTo(selected.value, square)) {
        requestMove({ from: selected.value, to: square } satisfies BoardMoveRequest)
      } else if (isMovable(square)) {
        selected.value = square
        focusedSquare.value = square
        return
      }

      selected.value = null
      return
    }

    selected.value = isMovable(square) ? square : null
    focusedSquare.value = square
  }

  function onDown(event: PointerEvent): void {
    if (editorActive.value) {
      if (event.button === 2) {
        event.preventDefault()
        event.stopPropagation()
        const square = squareAt(event.clientX, event.clientY)

        if (square) {
          editorDraft.value?.removePieceAt(square)
          emitEditorUpdate()
        }

        clearEditorPointer()
        return
      }

      if (radial.active.value || event.button !== 0) {
        return
      }

      const square = squareAt(event.clientX, event.clientY)

      if (!square) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      selected.value = null
      hoverSquare.value = null
      clearMoveDrag()
      clearAnnotationGesture()
      editorDownSquare.value = square
      editorDragged.value = false
      downX.value = event.clientX
      downY.value = event.clientY

      try {
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional in embedded browser contexts.
      }

      return
    }

    if (radial.onPointerDown(event)) {
      return
    }

    if (annotationTool.value) {
      if (event.button !== 0) {
        return
      }

      const square = squareAt(event.clientX, event.clientY)

      if (!square) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      selected.value = null
      clearMoveDrag()
      annotationStart.value = square
      annotationPreview.value = {
        kind: annotationTool.value,
        from: square,
        color: colorForAnnotation(event),
      }
      annotationPointer.value = pointerToBoardPoint(event.clientX, event.clientY)

      try {
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional in some embedded browser contexts.
      }
      return
    }

    if (!interactive.value || event.button !== 0) {
      return
    }

    const square = squareAt(event.clientX, event.clientY)

    if (!square) {
      return
    }

    event.preventDefault()
    hoverSquare.value = null
    focusedSquare.value = square

    if (selected.value && square !== selected.value) {
      commitSquare(square)
      return
    }

    if (isMovable(square)) {
      armMovePointer(event, square)
    } else {
      selected.value = null
    }
  }

  function onMove(event: PointerEvent): void {
    if (editorActive.value) {
      if (!editorDownSquare.value) {
        return
      }

      if (
        Math.hypot(event.clientX - downX.value, event.clientY - downY.value) >
        BOARD_DRAG_THRESHOLD_PX
      ) {
        editorDragged.value = true
      }

      return
    }

    if (radial.onPointerMove(event)) {
      return
    }

    if (annotationTool.value && annotationStart.value) {
      const square = squareAt(event.clientX, event.clientY)
      const color = colorForAnnotation(event)

      annotationPointer.value = pointerToBoardPoint(event.clientX, event.clientY)

      if (square) {
        const preview: AnnotationDrawPayload = {
          kind: annotationTool.value,
          from: annotationTool.value === 'arrow' ? annotationStart.value : square,
          color,
        }

        if (annotationTool.value === 'arrow' && square !== annotationStart.value) {
          preview.to = square
        }

        annotationPreview.value = preview
      }

      return
    }

    if (!interactive.value) {
      return
    }

    if (!dragStart.value) {
      const square = squareAt(event.clientX, event.clientY)
      const next = square && isMovable(square) ? square : null

      if (hoverSquare.value !== next) {
        hoverSquare.value = next
      }

      return
    }

    hoverSquare.value = null
    dragOverSquare.value = squareAt(event.clientX, event.clientY)

    if (
      !dragging.value &&
      Math.hypot(event.clientX - downX.value, event.clientY - downY.value) > BOARD_DRAG_THRESHOLD_PX
    ) {
      startMoveDrag(event)
    }

    if (dragging.value && ghost.value) {
      ghost.value = { ...ghost.value, x: event.clientX, y: event.clientY }
    }
  }

  function onUp(event: PointerEvent): void {
    if (editorActive.value) {
      event.preventDefault()
      event.stopPropagation()

      try {
        ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional in embedded browser contexts.
      }

      const start = editorDownSquare.value
      const target = squareAt(event.clientX, event.clientY)

      if (start && editorDragged.value) {
        if (!target && editorPieceAt(start)) {
          editorDraft.value?.removePieceAt(start)
          emitEditorUpdate()
        }
      } else if (target) {
        editorDraft.value?.handleSquareClick(target)
        emitEditorUpdate()
      }

      clearEditorPointer()
      return
    }

    if (radial.onPointerUp(event)) {
      return
    }

    if (annotationTool.value) {
      if (!annotationStart.value) {
        clearAnnotationGesture()
        return
      }

      try {
        ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional in some embedded browser contexts.
      }

      const end = squareAt(event.clientX, event.clientY)
      const color = colorForAnnotation(event)

      if (end) {
        if (annotationTool.value === 'arrow') {
          const payload: AnnotationDrawPayload = {
            kind: end === annotationStart.value ? 'square' : 'arrow',
            from: annotationStart.value,
            color,
          }

          if (end !== annotationStart.value) {
            payload.to = end
          }

          emit('annotation-draw', payload)
        } else {
          emit('annotation-draw', {
            kind: annotationTool.value,
            from: end,
            color,
          } satisfies AnnotationDrawPayload)
        }
      }

      clearAnnotationGesture()
      return
    }

    if (!interactive.value || !dragStart.value) {
      return
    }

    try {
      ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture is optional in some embedded browser contexts.
    }

    const target = squareAt(event.clientX, event.clientY)

    if (dragging.value && canMoveTo(dragStart.value, target)) {
      const from = dragStart.value
      const accepted = requestMove({ from, to: target } satisfies BoardMoveRequest)
      selected.value = null
      dragStart.value = null
      dragging.value = false
      dragOverSquare.value = null

      if (accepted) {
        pendingDragSettle.value = target
        suppressNextMoveAnimation.value = true
        animation.settleGhostTo(target, () => {
          clearMoveDrag()
          pendingDragSettle.value = null
          suppressNextMoveAnimation.value = false
        })
      } else {
        snapBackMoveDrag(from)
      }

      return
    } else if (!dragging.value && target === dragStart.value) {
      selected.value = dragStart.value
      clearMoveDrag()
      return
    } else if (dragging.value && dragStart.value) {
      snapBackMoveDrag(dragStart.value)
      return
    }

    clearMoveDrag()
  }

  function onCancel(): void {
    if (dragStart.value && dragging.value) {
      snapBackMoveDrag(dragStart.value)
    } else {
      clearMoveDrag()
    }
    radial.close(false)
    clearEditorPointer()
    clearAnnotationGesture()
    hoverSquare.value = null
  }

  function onLeave(): void {
    if (!dragStart.value) {
      hoverSquare.value = null
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!interactive.value || editorActive.value || radial.active.value) {
      return
    }

    const display = squareToDisplay(focusedSquare.value, orientation.value)

    if (!display) {
      return
    }

    const [row, col] = display
    const keyDelta: Partial<Record<string, [number, number]>> = {
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
    }
    const delta = keyDelta[event.key]

    if (delta) {
      event.preventDefault()
      const nextRow = Math.max(0, Math.min(BOARD_SIDE - 1, row + delta[0]))
      const nextCol = Math.max(0, Math.min(BOARD_SIDE - 1, col + delta[1]))
      focusedSquare.value =
        orientation.value === BOARD_ORIENTATION_WHITE
          ? String.fromCharCode(97 + nextCol) + (BOARD_SIDE - nextRow)
          : String.fromCharCode(97 + (BOARD_SIDE - 1 - nextCol)) + (nextRow + 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commitSquare(focusedSquare.value)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      selected.value = null
      clearMoveDrag()
      radial.close(false)
    }
  }

  function onContextMenu(event: MouseEvent): void {
    if (radial.onContextMenu(event)) {
      return
    }

    event.preventDefault()
  }

  function onRadialSelect(command: BoardRadialCommand | null): void {
    radial.onSelect(command)
  }

  function snapBackMoveDrag(from: string): void {
    animation.snapBackGhost(from)
  }

  function measureSquare(): void {
    if (wrap.value) {
      squarePx.value = wrap.value.clientWidth / BOARD_SIDE
      animation.killBoardTweens()
    }
  }

  watch(
    () => props.fen,
    async (nextFen, prevFen) => {
      selected.value = null
      hoverSquare.value = null
      clearAnnotationGesture()

      if (editorActive.value) {
        editorLastFen = nextFen
        return
      }

      await animation.animateFenChange(prevFen, nextFen, suppressNextMoveAnimation.value)

      if (pendingDragSettle.value) {
        await animation.settlePiece(pendingDragSettle.value)
        pendingDragSettle.value = null
        suppressNextMoveAnimation.value = false
      } else {
        clearMoveDrag()
      }
    }
  )

  watch(
    () => orientation.value,
    () => {
      animation.killBoardTweens()
    }
  )

  watch(
    () => capabilities.value.editor.active,
    (active) => {
      if (active) {
        editorLastFen = props.fen
      } else {
        clearEditorPointer()
      }
    }
  )

  watch(
    () => editorDraft.value?.fen.value,
    (fen) => {
      if (!editorActive.value || !fen || fen === editorLastFen) {
        return
      }

      editorLastFen = fen
      emitEditorUpdate()
    }
  )

  onMounted(() => {
    measureSquare()

    if (wrap.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureSquare)
      resizeObserver.observe(wrap.value)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    animation.killBoardTweens()
    radial.close(false)
    clearMoveDrag()
    clearAnnotationGesture()
    clearEditorPointer()
  })

  return {
    annotationArrows,
    annotationHighlights,
    annotationPreviewArrow,
    annotationPreviewHighlight,
    annotationPreviewSquare,
    annotationSquares,
    activeDestMarkers,
    ariaLabel,
    CAPTURE_OUTLINE_RADIUS,
    CAPTURE_RING_RADIUS,
    cells,
    checkMarker,
    files,
    focusedMarker,
    draggingFrom,
    ghost,
    ghostEl,
    hoverSquare,
    lastMoveSet,
    onCancel,
    onContextMenu,
    onDown,
    onKeydown,
    onLeave,
    onMove,
    onRadialSelect,
    onUp,
    overlayOn,
    pieces,
    PIECE_UNIT,
    pieceImg,
    QUIET_MOVE_RADIUS,
    radial: radialState,
    ranks,
    selectedMarker,
    squarePx,
    stateOverlays,
    svg,
    wrap,
    wheelBindings: wheel.wheelBindings,
  }
}
