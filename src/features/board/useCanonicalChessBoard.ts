import { computed, ref, watch, type ComputedRef } from 'vue'

import {
  applyMove,
  computeDests,
  isCheck,
  needsPromotion,
  normalizeFen,
  turnColor,
  turnFenColor,
} from './domain/chessRules'
import type {
  BoardMoveRequestDecision,
  NormalizedChessboardCapabilities,
} from './domain/boardCapabilities'
import {
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
  type BoardMoveRequest,
  type BoardOrientation,
  type ExecutedBoardMove,
  type PendingPromotion,
  type PromotionPiece,
} from './domain/boardTypes'

interface CanonicalBoardRuntimeOptions {
  position: () => string | undefined
  lastMove: () => readonly [string, string] | undefined
  capabilities: ComputedRef<NormalizedChessboardCapabilities>
}

interface CanonicalBoardHandlers {
  onMoveRequest: (payload: BoardMoveRequest) => void
  onMoveExecuted: (payload: ExecutedBoardMove) => void
  onPromotionRequest: (payload: PendingPromotion) => void
  onPositionChange: (fen: string) => void
}

export function useCanonicalChessBoard(
  options: CanonicalBoardRuntimeOptions,
  handlers: CanonicalBoardHandlers
) {
  const currentFen = ref(normalizeFen(options.position()))
  const orientationState = ref<BoardOrientation>(options.capabilities.value.orientation)
  const lastMove = ref<readonly [string, string] | undefined>()
  const pendingPromotion = ref<PendingPromotion | null>(null)
  const interactionActive = ref(false)

  const dests = computed(() => computeDests(currentFen.value))
  const currentTurnColor = computed(() => turnColor(currentFen.value))
  const currentCheck = computed(() => isCheck(currentFen.value))
  const displayedLastMove = computed(() => options.lastMove() ?? lastMove.value)

  watch(options.position, (nextPosition) => {
    if (nextPosition !== undefined) setPosition(nextPosition)
  })

  watch(
    () => options.capabilities.value.orientation,
    (nextOrientation) => {
      orientationState.value = nextOrientation
    }
  )

  function setPosition(fen: string): void {
    const normalized = normalizeFen(fen)
    currentFen.value = normalized
    lastMove.value = undefined
    pendingPromotion.value = null
    handlers.onPositionChange(normalized)
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

  function handleMoveRequest(payload: BoardMoveRequest): BoardMoveRequestDecision {
    const capabilities = options.capabilities.value

    if (!payload.promotion && needsPromotion(currentFen.value, payload.from, payload.to)) {
      if (!capabilities.promotion.enabled) {
        return 'illegal'
      }

      const pending: PendingPromotion = {
        from: payload.from,
        to: payload.to,
        color: turnFenColor(currentFen.value),
      }
      pendingPromotion.value = pending
      handlers.onPromotionRequest(pending)
      return 'promotion'
    }

    handlers.onMoveRequest(payload)
    const decision = capabilities.position.onMoveRequest?.(payload)

    if (decision === false || decision === 'illegal') {
      return decision
    }

    if (capabilities.position.controlled) {
      return decision
    }

    return applyRequestedMove(payload) ? 'applied' : 'illegal'
  }

  function applyRequestedMove(payload: BoardMoveRequest): ExecutedBoardMove | null {
    const applied = applyMove(currentFen.value, payload.from, payload.to, payload.promotion)

    if (!applied) {
      return null
    }

    currentFen.value = applied.after
    lastMove.value = [applied.from, applied.to]
    pendingPromotion.value = null
    handlers.onMoveExecuted(applied)
    handlers.onPositionChange(applied.after)

    return applied
  }

  function resolvePromotion(piece: PromotionPiece): void {
    const pending = pendingPromotion.value

    if (!pending || !options.capabilities.value.promotion.choices.includes(piece)) {
      return
    }

    pendingPromotion.value = null
    handleMoveRequest({ from: pending.from, to: pending.to, promotion: piece })
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
