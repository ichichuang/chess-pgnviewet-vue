<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  cloneAnnotation,
  emptyAnnotation,
  type AnnotationDrawPayload,
  type BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'
import ProductStateBanner from '@/ui/ProductStateBanner.vue'

import CanonicalChessBoard from '../CanonicalChessBoard.vue'
import type {
  BoardEditorDraftSnapshot,
  BoardRadialCommand,
  BoardWheelNavigationDirection,
  ChessboardCapabilities,
  ChessboardExposed,
} from '../domain/boardCapabilities'
import type {
  BoardMoveRequest,
  BoardOrientation,
  ExecutedBoardMove,
  PendingPromotion,
  PromotionPiece,
} from '../domain/boardTypes'
import { STANDARD_START_FEN } from '../domain/boardTypes'
import type {
  PgnChessBoardError,
  PgnChessBoardEvents,
  PgnChessBoardExposed,
  PgnChessBoardProps,
} from './pgnChessBoardTypes'
import { usePgnChessBoard } from './usePgnChessBoard'

const props = withDefaults(defineProps<PgnChessBoardProps>(), {
  preserveOnInvalid: true,
})
const emit = defineEmits<PgnChessBoardEvents>()
const board = ref<ChessboardExposed | null>(null)
const positionAnnotations = ref(cloneAnnotation(props.annotations ?? emptyAnnotation()))
const retainedError = ref<PgnChessBoardError | null>(null)
const pendingInitialEmits: (() => void)[] = []
let mounted = false

function setRetainedError(error: PgnChessBoardError | null): void {
  retainedError.value = error
}

function emitAfterMount(callback: () => void): void {
  if (mounted) callback()
  else pendingInitialEmits.push(callback)
}

const pgn = usePgnChessBoard({
  initialGameIndex: () => props.gameIndex,
  initialNodeId: () => props.nodeId,
  preserveOnInvalid: () => props.preserveOnInvalid,
  onBeforeMove: (payload) => props.capabilities?.position?.onMoveRequest?.(payload),
  onMoveExecuted: (move) => emitAfterMount(() => emit('move-executed', move)),
  onPgnChange: (event) => {
    setRetainedError(null)
    emitAfterMount(() => emit('pgn-change', event))
  },
  onPgnRemove: () => {
    setRetainedError(null)
    positionAnnotations.value = cloneAnnotation(props.annotations ?? emptyAnnotation())
    emitAfterMount(() => emit('pgn-remove'))
  },
  onPgnError: (error) => {
    if (props.preserveOnInvalid) setRetainedError(error)
    emitAfterMount(() => emit('pgn-error', error))
  },
  onGameChange: (game) => emitAfterMount(() => emit('game-change', game)),
  onCurrentNodeChange: (node) => emitAfterMount(() => emit('current-node-change', node)),
  onNavigation: (event) => emitAfterMount(() => emit('navigation', event)),
  onUpdateGameIndex: (index) => emitAfterMount(() => emit('update:gameIndex', index)),
  onUpdateNodeId: (nodeId) => emitAfterMount(() => emit('update:nodeId', nodeId)),
  onAnnotationChange: (annotation) =>
    emitAfterMount(() => emit('update:annotations', annotation)),
})

const boardPosition = computed(() => pgn.currentFen.value ?? props.position ?? STANDARD_START_FEN)
const boardLastMove = computed(() =>
  pgn.hasPgn.value ? pgn.currentLastMove.value : props.lastMove
)
const boardAnnotations = computed(() =>
  pgn.hasPgn.value
    ? (pgn.currentAnnotations.value ?? undefined)
    : (props.annotations ?? positionAnnotations.value)
)
const boardCapabilities = computed<ChessboardCapabilities | undefined>(() => {
  const source = props.capabilities

  if (!pgn.hasPgn.value) return source

  const { onNavigate, ...wheelNavigation } = source?.wheelNavigation ?? {}
  void onNavigate

  return {
    ...source,
    position: {
      ...source?.position,
      controlled: true,
      onMoveRequest: pgn.tryMove,
    },
    annotations: {
      ...source?.annotations,
      canUndo: pgn.canUndoAnnotations.value,
      canRedo: pgn.canRedoAnnotations.value,
      canClear: pgn.canClearAnnotations.value,
      onUndo: () => runAnnotationAction(pgn.undoAnnotations, source?.annotations?.onUndo),
      onRedo: () => runAnnotationAction(pgn.redoAnnotations, source?.annotations?.onRedo),
      onClear: () => runAnnotationAction(pgn.clearAnnotations, source?.annotations?.onClear),
    },
    wheelNavigation,
  }
})

const initialSource = props.pgn === undefined ? props.initialPgn : props.pgn

if (initialSource !== undefined && initialSource !== null) pgn.replacePgn(initialSource)

onMounted(() => {
  mounted = true

  for (const pending of pendingInitialEmits.splice(0)) pending()
})

watch(
  () => props.annotations,
  (annotations) => {
    if (!pgn.hasPgn.value && annotations !== undefined) {
      positionAnnotations.value = cloneAnnotation(annotations)
    }
  }
)

watch(
  () => props.pgn,
  (source, previous) => {
    if (source === previous) return
    if (source === null) pgn.removePgn()
    else if (source !== undefined) pgn.replacePgn(source)
  }
)

watch(
  () => props.gameIndex,
  (index) => {
    if (index !== undefined && index !== pgn.selectedGameIndex.value) pgn.selectGame(index)
  }
)

watch(
  () => props.nodeId,
  (nodeId) => {
    if (nodeId === null) pgn.goToStart()
    else if (nodeId !== undefined && nodeId !== pgn.selectedNodeId.value) pgn.selectNode(nodeId)
  }
)

function runAnnotationAction(
  localAction: () => boolean,
  consumerAction: (() => boolean | void) | undefined
): boolean {
  const changed = localAction()

  if (changed) consumerAction?.()

  return changed
}

function onAnnotationsUpdate(annotation: BoardAnnotation): void {
  if (pgn.hasPgn.value) pgn.updateAnnotations(annotation)
  else {
    if (props.annotations === undefined) positionAnnotations.value = cloneAnnotation(annotation)
    emit('update:annotations', annotation)
  }
}

function onMoveRequest(payload: BoardMoveRequest): void {
  emit('move-request', payload)
}

function onMoveExecuted(move: ExecutedBoardMove): void {
  if (!pgn.hasPgn.value) emit('move-executed', move)
}

function onPromotionRequest(payload: PendingPromotion): void {
  emit('promotion-request', payload)
}

function onPositionChange(fen: string): void {
  emit('position-change', fen)
}

function onAnnotationDraw(payload: AnnotationDrawPayload): void {
  emit('annotation-draw', payload)
}

function onRadialCommand(command: BoardRadialCommand): void {
  emit('radial-command', command)
}

function onEditorUpdate(snapshot: BoardEditorDraftSnapshot): void {
  emit('editor-update', snapshot)
}

function onEditorCommit(snapshot: BoardEditorDraftSnapshot): void {
  emit('editor-commit', snapshot)
}

function onEditorError(message: string): void {
  emit('editor-error', message)
}

function onWheelNavigation(direction: BoardWheelNavigationDirection): void {
  const navigated = direction === 'previous' ? pgn.previous() : pgn.next()

  if (!pgn.hasPgn.value || navigated) {
    props.capabilities?.wheelNavigation?.onNavigate?.(direction)
    emit('wheel-navigation', direction)
  }
}

function cancelPromotion(): void {
  board.value?.cancelPromotion()
}

function flipOrientation(): void {
  board.value?.flipOrientation()
}

function getPosition(): string {
  return board.value?.getPosition() ?? boardPosition.value ?? ''
}

function resolvePromotion(piece: PromotionPiece): void {
  board.value?.resolvePromotion(piece)
}

function setOrientation(orientation: BoardOrientation): void {
  board.value?.setOrientation(orientation)
}

const exposed: PgnChessBoardExposed = {
  cancelPromotion,
  clearAnnotations: pgn.clearAnnotations,
  flipOrientation,
  getCurrentNode: pgn.getCurrentNode,
  getGames: () => pgn.games.value,
  getPosition,
  goToEnd: pgn.goToEnd,
  goToStart: pgn.goToStart,
  next: pgn.next,
  previous: pgn.previous,
  redoAnnotations: pgn.redoAnnotations,
  removePgn: pgn.removePgn,
  replacePgn: pgn.replacePgn,
  resolvePromotion,
  selectGame: pgn.selectGame,
  selectNode: pgn.selectNode,
  selectVariation: pgn.selectVariation,
  setOrientation,
  undoAnnotations: pgn.undoAnnotations,
}

defineExpose(exposed)
</script>

<template>
  <div class="pgn-chessboard-wrap">
    <ProductStateBanner
      v-if="retainedError"
      status="warning"
      title="仍显示上一次有效棋谱"
      class="pgn-retained-banner"
    >
      {{ retainedError.message }}
    </ProductStateBanner>
    <CanonicalChessBoard
      ref="board"
      class="pgn-chessboard"
      :position="boardPosition"
      :last-move="boardLastMove"
      :annotations="boardAnnotations"
      :capabilities="boardCapabilities"
      data-p1b4-pgn-board
      @move-request="onMoveRequest"
      @move-executed="onMoveExecuted"
      @promotion-request="onPromotionRequest"
      @position-change="onPositionChange"
      @annotation-draw="onAnnotationDraw"
      @update:annotations="onAnnotationsUpdate"
      @radial-command="onRadialCommand"
      @editor-update="onEditorUpdate"
      @editor-commit="onEditorCommit"
      @editor-error="onEditorError"
      @editor-cancel="emit('editor-cancel')"
      @wheel-navigation="onWheelNavigation"
      @interaction-active="emit('interaction-active', $event)"
    />
  </div>
</template>

<style scoped>
.pgn-chessboard-wrap {
  display: grid;
  gap: var(--s-3);
}

.pgn-retained-banner {
  margin: 0 var(--s-2);
}
</style>
