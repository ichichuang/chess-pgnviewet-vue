<script setup lang="ts">
import {
  useBoardEditorPanelView,
  type BoardEditorPanelProps,
} from './useBoardEditorPanelView'

const props = defineProps<BoardEditorPanelProps>()

const emit = defineEmits<{
  finish: []
  cancel: []
}>()

const {
  blackPieces,
  editorDraft,
  isSelected,
  panelRoot,
  pieceImage,
  selectPiece,
  setCastlingRight,
  setSideToMove,
  whitePieces,
} = useBoardEditorPanelView(props)
</script>

<template>
  <section ref="panelRoot" class="board-editor-panel" aria-label="自由摆谱">
    <header class="editor-head">
      <div>
        <h2>自由摆谱</h2>
        <p>{{ editorDraft.selectedPiece.value ? '点击棋盘放置当前棋子' : '点击棋盘棋子可拾取' }}</p>
      </div>
      <button class="finish-btn compact" type="button" @click="emit('finish')">完成摆谱</button>
    </header>

    <div class="editor-band piece-band">
      <div class="band-title">棋子</div>
      <div class="piece-row" aria-label="白方棋子">
        <button
          v-for="piece in whitePieces"
          :key="`${piece.color}-${piece.type}`"
          class="piece-chip"
          :class="{ active: isSelected(piece) }"
          type="button"
          :title="`白方 ${piece.type}`"
          :aria-pressed="isSelected(piece)"
          :disabled="!freePlacement"
          @click="selectPiece(piece)"
        >
          <img :src="pieceImage(piece)" alt="" />
        </button>
      </div>
      <div class="piece-row" aria-label="黑方棋子">
        <button
          v-for="piece in blackPieces"
          :key="`${piece.color}-${piece.type}`"
          class="piece-chip"
          :class="{ active: isSelected(piece) }"
          type="button"
          :title="`黑方 ${piece.type}`"
          :aria-pressed="isSelected(piece)"
          :disabled="!freePlacement"
          @click="selectPiece(piece)"
        >
          <img :src="pieceImage(piece)" alt="" />
        </button>
      </div>
    </div>

    <div class="editor-band settings-band">
      <div class="band-title">局面属性</div>
      <div class="side-toggle" aria-label="走子方">
        <button
          type="button"
          :class="{ active: editorDraft.sideToMove.value === 'w' }"
          :aria-pressed="editorDraft.sideToMove.value === 'w'"
          @click="setSideToMove('w')"
        >
          白先
        </button>
        <button
          type="button"
          :class="{ active: editorDraft.sideToMove.value === 'b' }"
          :aria-pressed="editorDraft.sideToMove.value === 'b'"
          @click="setSideToMove('b')"
        >
          黑先
        </button>
      </div>
      <div class="castling-grid" aria-label="王车易位权利">
        <label>
          <input
            :checked="editorDraft.castlingRights.value.wK"
            type="checkbox"
            @change="setCastlingRight('wK', $event)"
          />
          白 O-O
        </label>
        <label>
          <input
            :checked="editorDraft.castlingRights.value.wQ"
            type="checkbox"
            @change="setCastlingRight('wQ', $event)"
          />
          白 O-O-O
        </label>
        <label>
          <input
            :checked="editorDraft.castlingRights.value.bK"
            type="checkbox"
            @change="setCastlingRight('bK', $event)"
          />
          黑 O-O
        </label>
        <label>
          <input
            :checked="editorDraft.castlingRights.value.bQ"
            type="checkbox"
            @change="setCastlingRight('bQ', $event)"
          />
          黑 O-O-O
        </label>
      </div>
    </div>

    <div class="editor-band operation-band">
      <button class="op-btn" type="button" @click="editorDraft.clearBoard()">清空棋盘</button>
      <button class="op-btn" type="button" @click="editorDraft.resetToStartingPosition()">
        标准初始
      </button>
      <button class="op-btn" type="button" @click="emit('cancel')">取消</button>
      <button class="finish-btn" type="button" @click="emit('finish')">完成摆谱</button>
    </div>
  </section>
</template>

<style scoped>
.board-editor-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--board-editor-panel-gap);
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: var(--board-editor-panel-pad);
  overflow: auto;
  background: var(--surface);
  color: var(--text);
  transform-origin: top right;
}

.editor-head {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: var(--s-2);
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.editor-head h2 {
  margin: 0;
  font-size: var(--fs-lg);
  line-height: 1.2;
}

.editor-head p {
  margin: var(--s-1) 0 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.editor-band {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--s-2);
  padding-bottom: var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.band-title {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0;
}

.piece-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--s-2);
}

.piece-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border: var(--workspace-border-w) solid var(--board-editor-palette-border, var(--border));
  border-radius: var(--r-sm);
  aspect-ratio: 1;
  background: var(--board-editor-chip-bg);
  cursor: pointer;
  transition:
    background var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    transform var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    box-shadow var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.piece-chip img {
  display: block;
  width: var(--board-editor-piece-img-size);
  height: var(--board-editor-piece-img-size);
  object-fit: contain;
  pointer-events: none;
}

.piece-chip:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.piece-chip:not(:disabled):hover {
  border-color: var(--accent);
  background: var(--state-hover-bg);
  transform: translateY(var(--board-editor-chip-hover-y));
}

.piece-chip.active {
  border-color: var(--accent);
  background: var(--board-editor-palette-selected, var(--accent-bg));
  box-shadow: inset 0 0 0 var(--workspace-border-w) var(--accent);
}

.side-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-1);
}

.side-toggle button,
.op-btn,
.finish-btn {
  min-height: var(--control-h-sm);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--board-editor-button-bg);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition:
    background var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.side-toggle button.active {
  border-color: var(--accent);
  background: var(--accent-bg);
  color: var(--accent-strong);
  font-weight: 700;
}

.castling-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-2);
}

.castling-grid label {
  display: flex;
  gap: var(--s-1);
  align-items: center;
  min-width: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.castling-grid input {
  accent-color: var(--accent);
}

.operation-band {
  margin-top: var(--board-editor-operation-margin);
  padding-bottom: 0;
  border-bottom: 0;
}

.finish-btn {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--text-on-accent);
  font-weight: 700;
}

.op-btn:hover,
.finish-btn:hover {
  border-color: var(--accent);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}

.finish-btn.compact {
  flex: 0 0 auto;
  min-height: var(--board-editor-compact-button-h);
  padding: 0 var(--s-2);
  white-space: nowrap;
}

@media (width <= 900px) {
  .board-editor-panel {
    padding: var(--board-editor-panel-pad-compact);
  }

  .piece-row {
    grid-template-columns: repeat(6, minmax(var(--board-editor-chip-min), 1fr));
  }
}
</style>
