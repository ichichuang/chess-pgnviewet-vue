import { computed, ref, watch } from 'vue'

import {
  applyMove,
  computeDests,
  isCheck,
  needsPromotion,
  normalizeFen,
  turnColor,
  turnFenColor,
} from './domain/chessRules'
import {
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
  type BoardMoveRequest,
  type BoardOrientation,
  type PendingPromotion,
  type PromotionPiece,
} from './domain/boardTypes'

interface CanonicalBoardProps {
  position?: string
  orientation?: string
  lastMove?: unknown
  interactive?: boolean
  controlledMoves?: boolean
}

type CanonicalBoardEvent =
  'move-request' | 'move-executed' | 'promotion-request' | 'position-change'
type CanonicalBoardEmit = (event: CanonicalBoardEvent, ...args: unknown[]) => void

export function useCanonicalChessBoard(props: CanonicalBoardProps, emit: CanonicalBoardEmit) {
  const currentFen = ref(normalizeFen(props.position))
  const orientationState = ref<BoardOrientation>(normalizeOrientation(props.orientation))
  const lastMove = ref<[string, string] | undefined>()
  const pendingPromotion = ref<PendingPromotion | null>(null)
  const interactionActive = ref(false)

  const dests = computed(() => computeDests(currentFen.value))
  const currentTurnColor = computed(() => turnColor(currentFen.value))
  const currentCheck = computed(() => isCheck(currentFen.value))
  const displayedLastMove = computed(() =>
    Array.isArray(props.lastMove) &&
    props.lastMove.length === 2 &&
    typeof props.lastMove[0] === 'string' &&
    typeof props.lastMove[1] === 'string'
      ? ([props.lastMove[0], props.lastMove[1]] as [string, string])
      : lastMove.value
  )

  watch(
    () => props.position,
    (nextPosition) => {
      if (typeof nextPosition !== 'string') {
        return
      }

      setPosition(nextPosition)
    }
  )

  watch(
    () => props.orientation,
    (nextOrientation) => {
      orientationState.value = normalizeOrientation(nextOrientation)
    }
  )

  function normalizeOrientation(value: string | undefined): BoardOrientation {
    return value === BOARD_ORIENTATION_BLACK ? BOARD_ORIENTATION_BLACK : BOARD_ORIENTATION_WHITE
  }

  function setPosition(fen: string): void {
    const normalized = normalizeFen(fen)
    currentFen.value = normalized
    lastMove.value = undefined
    pendingPromotion.value = null
    emit('position-change', normalized)
  }

  function setOrientation(orientation: BoardOrientation): void {
    orientationState.value = orientation
  }

  function flipOrientation(): void {
    orientationState.value =
      orientationState.value === BOARD_ORIENTATION_WHITE
        ? BOARD_ORIENTATION_BLACK
        : BOARD_ORIENTATION_WHITE
  }

  function getPosition(): string {
    return currentFen.value
  }

  function handleMoveRequest(payload: BoardMoveRequest): void {
    if (!payload.promotion && needsPromotion(currentFen.value, payload.from, payload.to)) {
      const pending: PendingPromotion = {
        from: payload.from,
        to: payload.to,
        color: turnFenColor(currentFen.value),
      }
      pendingPromotion.value = pending
      emit('promotion-request', pending)
      return
    }

    emit('move-request', payload)

    if (props.controlledMoves) {
      return
    }

    applyRequestedMove(payload)
  }

  function applyRequestedMove(payload: BoardMoveRequest): void {
    const applied = applyMove(currentFen.value, payload.from, payload.to, payload.promotion)

    if (!applied) {
      return
    }

    currentFen.value = applied.after
    lastMove.value = [applied.from, applied.to]
    pendingPromotion.value = null
    emit('move-executed', applied)
    emit('position-change', applied.after)
  }

  function resolvePromotion(piece: PromotionPiece): void {
    const pending = pendingPromotion.value

    if (!pending) {
      return
    }

    if (props.controlledMoves) {
      pendingPromotion.value = null
      emit('move-request', { from: pending.from, to: pending.to, promotion: piece })
      return
    }

    applyRequestedMove({ from: pending.from, to: pending.to, promotion: piece })
  }

  function cancelPromotion(): void {
    pendingPromotion.value = null
  }

  return {
    cancelPromotion,
    currentCheck,
    currentFen,
    currentTurnColor,
    dests,
    flipOrientation,
    getPosition,
    handleMoveRequest,
    interactionActive,
    lastMove: displayedLastMove,
    orientationState,
    pendingPromotion,
    resolvePromotion,
    setOrientation,
    setPosition,
  }
}
