<script setup lang="ts">
import { computed } from 'vue'

import BoardView from './BoardView.vue'
import BoardEditorPanel from './editor/BoardEditorPanel.vue'
import PromotionChooser from './PromotionChooser.vue'
import { BOARD_COLOR_BLACK, BOARD_COLOR_WHITE, BOARD_ORIENTATION_WHITE } from './domain/boardTypes'
import { useBoardEditorDraft } from './editor/boardEditorDraft'
import { useBoardCapabilityOptions } from './useBoardCapabilityOptions'
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
  advancedCapabilities: { type: Object, default: undefined },
})

const emit = defineEmits([
  'move-request',
  'move-executed',
  'promotion-request',
  'position-change',
  'annotation-draw',
  'radial-command',
  'editor-update',
  'editor-commit',
  'editor-cancel',
  'wheel-navigation',
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

const capabilities = useBoardCapabilityOptions(() => props.advancedCapabilities)
const boardAdvancedCapabilities = computed(() => ({
  animation: {
    ...capabilities.value.animation,
    move: {
      ...capabilities.value.animation.move,
      requestMove: handleMoveRequest,
    },
  },
  radialMenu: capabilities.value.radialMenu,
  editor: capabilities.value.editor,
  wheelNavigation: capabilities.value.wheelNavigation,
}))
const editorDraft = useBoardEditorDraft(
  computed(() => capabilities.value.editor.active),
  () => capabilities.value.editor.initialFen ?? currentFen.value
)
const boardFen = computed(() =>
  capabilities.value.editor.active ? editorDraft.fen.value : currentFen.value
)
const boardInteractive = computed(() => props.interactive !== false && !capabilities.value.editor.active)
const boardDests = computed(() => (capabilities.value.editor.active ? new Map() : dests.value))
const boardCheck = computed(() => !capabilities.value.editor.active && currentCheck.value)
const boardTurnColor = computed(() =>
  capabilities.value.editor.active
    ? editorDraft.sideToMove.value === 'b'
      ? BOARD_COLOR_BLACK
      : BOARD_COLOR_WHITE
    : currentTurnColor.value
)

defineExpose({
  cancelPromotion,
  flipOrientation,
  getPosition,
  interactionActive,
  resolvePromotion,
  setOrientation,
  setPosition,
})

function onEditorFinish() {
  emit('editor-commit', editorDraft.snapshot.value)
}

function onEditorCancel() {
  emit('editor-cancel')
}

function onEditorUpdate(
  snapshot = {
    fen: '',
    sideToMove: 'w',
    castlingRights: { wK: false, wQ: false, bK: false, bQ: false },
  }
) {
  emit('editor-update', snapshot)
}

function onRadialCommand(command = {}) {
  emit('radial-command', command)
}

function onWheelNavigation(direction = 'next') {
  emit('wheel-navigation', direction)
}
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
      :fen="boardFen"
      :last-move="lastMove ?? []"
      :orientation="orientationState"
      :turn-color="boardTurnColor"
      :dests="boardDests"
      :check="boardCheck"
      :interactive="boardInteractive"
      :annotation-tool="annotationTool"
      :annotation-color="annotationColor"
      :annotations="annotations"
      :advanced-capabilities="boardAdvancedCapabilities"
      :editor-draft="editorDraft"
      @move="handleMoveRequest"
      @interaction-active="interactionActive = $event"
      @annotation-draw="$emit('annotation-draw', $event)"
      @radial-command="onRadialCommand"
      @editor-update="onEditorUpdate"
      @wheel-navigation="onWheelNavigation"
    />
    <aside
      v-if="capabilities.editor.available && capabilities.editor.active"
      class="board-editor-dock"
      aria-label="自由摆谱控制"
    >
      <BoardEditorPanel :draft="editorDraft" @finish="onEditorFinish" @cancel="onEditorCancel" />
    </aside>
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

.board-editor-dock {
  position: absolute;
  top: var(--s-2);
  right: var(--s-2);
  bottom: var(--s-2);
  z-index: var(--board-editor-z);
  width: min(var(--board-editor-panel-w), calc(100% - var(--s-4)));
  min-width: 0;
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

@media (width <= 900px), (height <= 520px) {
  .board-editor-dock {
    inset: auto var(--s-2) var(--s-2) var(--s-2);
    width: auto;
    max-height: var(--board-editor-panel-mobile-h);
  }
}
</style>
