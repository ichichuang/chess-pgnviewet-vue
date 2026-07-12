<script setup lang="ts">
import BoardView from './BoardView.vue'
import PromotionChooser from './PromotionChooser.vue'
import { BOARD_ORIENTATION_WHITE } from './domain/boardTypes'
import { useCanonicalChessBoard } from './useCanonicalChessBoard'

const props = defineProps({
  position: { type: String, default: undefined },
  orientation: { type: String, default: BOARD_ORIENTATION_WHITE },
  lastMove: { type: Array, default: undefined },
  interactive: { type: Boolean, default: true },
  controlledMoves: { type: Boolean, default: false },
  annotationTool: { type: String, default: null },
  annotationColor: { type: String, default: 'draw-red' },
  annotations: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'move-request',
  'move-executed',
  'promotion-request',
  'position-change',
  'annotation-draw',
])

const {
  cancelPromotion,
  currentCheck,
  currentFen,
  currentTurnColor,
  dests,
  flipOrientation,
  getPosition,
  handleMoveRequest,
  interactionActive,
  lastMove,
  orientationState,
  pendingPromotion,
  resolvePromotion,
  setOrientation,
  setPosition,
} = useCanonicalChessBoard(props, emit)

defineExpose({
  cancelPromotion,
  flipOrientation,
  getPosition,
  interactionActive,
  resolvePromotion,
  setOrientation,
  setPosition,
})
</script>

<template>
  <section
    class="canonical-board"
    data-p1b-board
    :data-board-orientation="orientationState"
    :data-board-interaction-active="interactionActive"
    :data-board-position="currentFen"
    aria-label="自研交互棋盘"
  >
    <BoardView
      :fen="currentFen"
      :last-move="lastMove ?? []"
      :orientation="orientationState"
      :turn-color="currentTurnColor"
      :dests="dests"
      :check="currentCheck"
      :interactive="interactive"
      :annotation-tool="annotationTool"
      :annotation-color="annotationColor"
      :annotations="annotations"
      @move="handleMoveRequest"
      @interaction-active="interactionActive = $event"
      @annotation-draw="$emit('annotation-draw', $event)"
    />
    <PromotionChooser
      :pending="pendingPromotion ?? {}"
      @resolve="resolvePromotion"
      @cancel="cancelPromotion"
    />
  </section>
</template>

<style scoped>
.canonical-board {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
