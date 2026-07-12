import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { squareCenter, squareRect, squareToDisplay } from './domain/boardGeometry'
import { buildBoardCells } from './domain/boardCells'
import { fenToGrid } from './domain/fenBoard'
import { pieceImg } from './domain/pieceAssets'
import {
  BOARD_COLOR_BLACK,
  BOARD_COLOR_WHITE,
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
  type BoardColor,
  type BoardMoveRequest,
  type BoardOrientation,
} from './domain/boardTypes'

interface BoardViewRuntimeProps {
  fen: string
  lastMove?: unknown
  orientation?: string
  turnColor?: string
  dests?: unknown
  check?: boolean
  interactive?: boolean
}

type BoardViewEvent = 'move' | 'interaction-active'
type BoardViewEmit = (event: BoardViewEvent, ...args: unknown[]) => void

const BOARD_SIDE = 8
const PIECE_UNIT = 1
const QUIET_MOVE_RADIUS = 0.15
const CAPTURE_OUTLINE_RADIUS = 0.43
const CAPTURE_RING_RADIUS = 0.38
const DRAG_THRESHOLD_PX = 5

export function useBoardView(props: BoardViewRuntimeProps, emit: BoardViewEmit) {
  const wrap = ref<HTMLElement | null>(null)
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
  let resizeObserver: ResizeObserver | null = null

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
  const overlayOn = computed(() => interactive.value)

  const interactionActive = computed(
    () => dragging.value || ghost.value !== null || dragStart.value !== null
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

  const ariaLabel = computed(() => {
    const piece = pieceAt(focusedSquare.value)
    const occupant = piece ? pieceLabel(piece) : '空格'

    return `棋盘，当前焦点 ${focusedSquare.value}，${occupant}`
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

  function clearMoveDrag(): void {
    dragStart.value = null
    draggingFrom.value = null
    dragOverSquare.value = null
    dragging.value = false
    ghost.value = null
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
        emit('move', { from: selected.value, to: square } satisfies BoardMoveRequest)
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
      Math.hypot(event.clientX - downX.value, event.clientY - downY.value) > DRAG_THRESHOLD_PX
    ) {
      startMoveDrag(event)
    }

    if (dragging.value && ghost.value) {
      ghost.value = { ...ghost.value, x: event.clientX, y: event.clientY }
    }
  }

  function onUp(event: PointerEvent): void {
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
      emit('move', { from: dragStart.value, to: target } satisfies BoardMoveRequest)
      selected.value = null
    } else if (!dragging.value && target === dragStart.value) {
      selected.value = dragStart.value
    }

    clearMoveDrag()
  }

  function onCancel(): void {
    clearMoveDrag()
    hoverSquare.value = null
  }

  function onLeave(): void {
    if (!dragStart.value) {
      hoverSquare.value = null
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!interactive.value) {
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
    }
  }

  function measureSquare(): void {
    if (wrap.value) {
      squarePx.value = wrap.value.clientWidth / BOARD_SIDE
    }
  }

  watch(
    () => props.fen,
    () => {
      selected.value = null
      hoverSquare.value = null
      clearMoveDrag()
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
    clearMoveDrag()
  })

  return {
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
    hoverSquare,
    lastMoveSet,
    onCancel,
    onDown,
    onKeydown,
    onLeave,
    onMove,
    onUp,
    overlayOn,
    pieces,
    PIECE_UNIT,
    pieceImg,
    QUIET_MOVE_RADIUS,
    ranks,
    selectedMarker,
    squarePx,
    stateOverlays,
    wrap,
  }
}
