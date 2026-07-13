<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  applyAnnotationDraw,
  clearAnnotationDrawings,
  cloneAnnotation,
  emptyAnnotation,
  type AnnotationDrawPayload,
  type BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'

import BoardView from './BoardView.vue'
import {
  BOARD_COLOR_BLACK,
  BOARD_COLOR_WHITE,
  type BoardOrientation,
} from './domain/boardTypes'
import type {
  BoardEditorDraftSnapshot,
  BoardRadialCommand,
  BoardWheelNavigationDirection,
  ChessboardEvents,
  ChessboardExposed,
  ChessboardProps,
} from './domain/boardCapabilities'
import BoardEditorPanel from './editor/BoardEditorPanel.vue'
import { useBoardEditorDraft } from './editor/boardEditorDraft'
import PromotionChooser from './PromotionChooser.vue'
import { useBoardAppearance } from './useBoardAppearance'
import { useBoardCapabilityOptions } from './useBoardCapabilityOptions'
import { useCanonicalChessBoard } from './useCanonicalChessBoard'

const props = defineProps<ChessboardProps>()
const emit = defineEmits<ChessboardEvents>()
const capabilities = useBoardCapabilityOptions(() => props.capabilities)
const instanceStyle = useBoardAppearance(capabilities)
const localAnnotations = ref(cloneAnnotation(props.annotations ?? emptyAnnotation()))
const renderedAnnotations = computed(() => props.annotations ?? localAnnotations.value)
const localAnnotationUndo = ref<BoardAnnotation[]>([])
const localAnnotationRedo = ref<BoardAnnotation[]>([])

watch(
  () => props.annotations,
  (annotations) => {
    if (annotations !== undefined) {
      localAnnotations.value = cloneAnnotation(annotations)
      localAnnotationUndo.value = []
      localAnnotationRedo.value = []
    }
  }
)

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
} = useCanonicalChessBoard(
  {
    position: () => props.position,
    lastMove: () => props.lastMove,
    capabilities,
  },
  {
    onMoveRequest: (payload) => emit('move-request', payload),
    onMoveExecuted: (payload) => emit('move-executed', payload),
    onPromotionRequest: (payload) => emit('promotion-request', payload),
    onPositionChange: (fen) => emit('position-change', fen),
  }
)

const editorDraft = useBoardEditorDraft(
  computed(() => capabilities.value.editor.active),
  () => capabilities.value.editor.initialFen ?? currentFen.value
)
const boardFen = computed(() =>
  capabilities.value.editor.active ? editorDraft.fen.value : currentFen.value
)
const boardDests = computed(() => (capabilities.value.editor.active ? new Map() : dests.value))
const boardCheck = computed(() => !capabilities.value.editor.active && currentCheck.value)
const boardTurnColor = computed(() =>
  capabilities.value.editor.active
    ? editorDraft.sideToMove.value === 'b'
      ? BOARD_COLOR_BLACK
      : BOARD_COLOR_WHITE
    : currentTurnColor.value
)
const componentClass = computed(() => [
  `fit-${capabilities.value.responsive.fit}`,
  {
    'coordinates-hidden': !capabilities.value.coordinates.visible,
    'responsive-disabled': !capabilities.value.responsive.enabled,
  },
])

function onInteractionActive(active: boolean): void {
  interactionActive.value = active
  emit('interaction-active', active)
}

function onAnnotationDraw(payload: AnnotationDrawPayload): void {
  const previous = renderedAnnotations.value
  const next = applyAnnotationDraw(previous, payload)

  if (props.annotations === undefined) {
    localAnnotationUndo.value.push(cloneAnnotation(previous))
    localAnnotationRedo.value = []
    localAnnotations.value = next
  }

  capabilities.value.annotations.onDraw?.(payload)
  capabilities.value.annotations.onChange?.({ previous, next, draw: payload })
  emit('annotation-draw', payload)

  if (capabilities.value.annotations.emitModelUpdates) {
    emit('update:annotations', next)
  }
}

function onEditorFinish(): void {
  const snapshot = editorDraft.snapshot.value
  const validation = capabilities.value.editor.validate?.(snapshot) ?? { valid: true }

  if (!validation.valid) {
    emit('editor-error', validation.message)
    return
  }

  const decision = capabilities.value.editor.onAccept?.(snapshot)

  if (decision === false) {
    emit('editor-error', '局面未被接收')
    return
  }

  if (typeof decision === 'object' && !decision.valid) {
    emit('editor-error', decision.message)
    return
  }

  emit('editor-commit', snapshot)
}

function onEditorCancel(): void {
  capabilities.value.editor.onCancel?.()
  emit('editor-cancel')
}

function onEditorUpdate(snapshot: BoardEditorDraftSnapshot): void {
  emit('editor-update', snapshot)
}

function onRadialCommand(command: BoardRadialCommand): void {
  const context = {
    command,
    position: currentFen.value,
    orientation: orientationState.value,
  }

  if (command.kind === 'custom' && command.item.disabled !== true) {
    command.item.onSelect(context)
  }

  capabilities.value.radialMenu.onSelect?.(context)
  emit('radial-command', command)
}

function onWheelNavigation(direction: BoardWheelNavigationDirection): void {
  capabilities.value.wheelNavigation.onNavigate?.(direction)
  emit('wheel-navigation', direction)
}

function undoAnnotations(): boolean {
  if (!capabilities.value.annotations.canUndo) return false

  const callback = capabilities.value.annotations.onUndo

  if (callback) return callback() !== false
  if (props.annotations !== undefined) return false

  const previous = localAnnotationUndo.value.pop()

  if (!previous) return false

  localAnnotationRedo.value.push(cloneAnnotation(localAnnotations.value))
  localAnnotations.value = cloneAnnotation(previous)
  emit('update:annotations', cloneAnnotation(previous))

  return true
}

function redoAnnotations(): boolean {
  if (!capabilities.value.annotations.canRedo) return false

  const callback = capabilities.value.annotations.onRedo

  if (callback) return callback() !== false
  if (props.annotations !== undefined) return false

  const next = localAnnotationRedo.value.pop()

  if (!next) return false

  localAnnotationUndo.value.push(cloneAnnotation(localAnnotations.value))
  localAnnotations.value = cloneAnnotation(next)
  emit('update:annotations', cloneAnnotation(next))

  return true
}

function clearAnnotations(): boolean {
  if (!capabilities.value.annotations.canClear) return false

  const callback = capabilities.value.annotations.onClear

  if (callback) return callback() !== false

  const current = renderedAnnotations.value
  const next = clearAnnotationDrawings(current)

  if (current.arrows.length === 0 && current.squares.length === 0) return false

  if (props.annotations === undefined) {
    localAnnotationUndo.value.push(cloneAnnotation(current))
    localAnnotationRedo.value = []
    localAnnotations.value = next
  }

  emit('update:annotations', cloneAnnotation(next))

  return true
}

const exposed: ChessboardExposed = {
  cancelPromotion,
  clearAnnotations,
  flipOrientation,
  getPosition,
  get interactionActive() {
    return interactionActive.value
  },
  redoAnnotations,
  resolvePromotion,
  setOrientation: (orientation: BoardOrientation) => setOrientation(orientation),
  setPosition,
  undoAnnotations,
}

defineExpose(exposed)
</script>

<template>
  <section
    class="canonical-board"
    :class="componentClass"
    :style="instanceStyle"
    data-p1b-board
    :data-board-orientation="orientationState"
    :data-board-interaction-active="interactionActive"
    :data-board-position="currentFen"
    :aria-label="capabilities.accessibility.labels.board"
  >
    <BoardView
      :fen="boardFen"
      :last-move="lastMove"
      :orientation="orientationState"
      :turn-color="boardTurnColor"
      :dests="boardDests"
      :check="boardCheck"
      :annotations="renderedAnnotations"
      :capabilities="capabilities"
      :editor-draft="editorDraft"
      :request-move="handleMoveRequest"
      @interaction-active="onInteractionActive"
      @annotation-draw="onAnnotationDraw"
      @radial-command="onRadialCommand"
      @editor-update="onEditorUpdate"
      @wheel-navigation="onWheelNavigation"
    />
    <aside
      v-if="capabilities.editor.available && capabilities.editor.active"
      class="board-editor-dock"
      :aria-label="capabilities.accessibility.labels.editor"
    >
      <BoardEditorPanel
        :draft="editorDraft"
        :palette="capabilities.editor.palette"
        :piece-resolver="capabilities.pieceResolver"
        :reduced-motion="capabilities.animation.reducedMotion"
        :free-placement="capabilities.editor.freePlacement"
        @finish="onEditorFinish"
        @cancel="onEditorCancel"
      />
    </aside>
    <PromotionChooser
      :pending="pendingPromotion"
      :choices="capabilities.promotion.choices"
      :piece-resolver="capabilities.pieceResolver"
      :reduced-motion="capabilities.animation.reducedMotion"
      :dialog-label="capabilities.accessibility.labels.promotionDialog"
      :group-label="capabilities.accessibility.labels.promotionGroup"
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

.canonical-board.responsive-disabled {
  container-type: normal;
}

.board-editor-dock {
  position: absolute;
  top: var(--s-2);
  right: var(--s-2);
  bottom: var(--s-2);
  z-index: var(--board-editor-z);
  width: min(var(--board-editor-panel-w), calc(100% - var(--s-4)));
  min-width: 0;
  border: var(--workspace-border-w) solid var(--board-editor-palette-border, var(--border));
  border-radius: var(--r-md);
  overflow: hidden;
  box-shadow: var(--board-editor-palette-shadow, var(--shadow-lg));
}

@media (width <= 900px), (height <= 520px) {
  .board-editor-dock {
    inset: auto var(--s-2) var(--s-2) var(--s-2);
    width: auto;
    max-height: var(--board-editor-panel-mobile-h);
  }
}
</style>
