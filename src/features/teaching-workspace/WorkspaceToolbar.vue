<script setup lang="ts">
import {
  ANNOTATION_COLORS,
  annotationColorToken,
} from '@/features/annotations/domain/annotationTypes'
import { BOARD_ORIENTATION_BLACK } from '@/features/board/domain/boardTypes'
import { usePgnStore, useWorkspaceStore } from '@/stores'

const emit = defineEmits(['action'])

const pgn = usePgnStore()
const workspace = useWorkspaceStore()

const annotationTools = [
  { key: 'arrow', label: '箭头' },
  { key: 'square', label: '方框' },
  { key: 'highlight', label: '高亮' },
]

const alignments = [
  { key: 'left', label: '左' },
  { key: 'center', label: '中' },
  { key: 'right', label: '右' },
]

function setAnnotationColor(color = '') {
  workspace.setAnnotationColor(color)
}
</script>

<template>
  <header class="workspace-toolbar" role="toolbar" aria-label="工作区工具栏">
    <button
      class="toolbar-collapse"
      type="button"
      :aria-label="workspace.toolbarCollapsed ? '展开工作区工具栏' : '收起工作区工具栏'"
      :aria-expanded="!workspace.toolbarCollapsed"
      @click="workspace.toggleToolbar()"
    >
      {{ workspace.toolbarCollapsed ? '展开' : '收起' }}
    </button>

    <div v-show="!workspace.toolbarCollapsed" class="toolbar-groups">
      <section class="toolbar-group" aria-label="棋谱文件">
        <button class="toolbar-button" type="button" @click="emit('action', 'openLocal')">
          打开
        </button>
        <button class="toolbar-button" type="button" @click="emit('action', 'insertLocal')">
          插入
        </button>
      </section>

      <section class="toolbar-group" aria-label="棋盘控制">
        <button
          class="toolbar-button"
          type="button"
          :aria-pressed="workspace.boardOrientation === BOARD_ORIENTATION_BLACK"
          @click="workspace.flipBoardOrientation()"
        >
          翻转
        </button>
        <button
          v-for="alignment in alignments"
          :key="alignment.key"
          class="toolbar-button compact"
          type="button"
          :aria-pressed="workspace.boardAlignment === alignment.key"
          @click="workspace.setBoardAlignment(alignment.key)"
        >
          {{ alignment.label }}
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          @click="emit('action', 'enterBoardEditor')"
        >
          摆谱
        </button>
      </section>

      <section class="toolbar-group" aria-label="棋谱导航">
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canGoStart"
          @click="pgn.goToStart()"
        >
          起始
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canStepBack"
          @click="pgn.stepBack()"
        >
          上步
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canStepForward"
          @click="pgn.stepForward()"
        >
          下步
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canGoEnd"
          @click="pgn.goToEnd()"
        >
          末尾
        </button>
      </section>

      <section class="toolbar-group" aria-label="标注工具">
        <button
          v-for="tool in annotationTools"
          :key="tool.key"
          class="toolbar-button compact"
          type="button"
          :aria-pressed="workspace.annotationTool === tool.key"
          :disabled="!pgn.hasGame"
          @click="workspace.setAnnotationTool(tool.key)"
        >
          {{ tool.label }}
        </button>
        <button
          v-for="color in ANNOTATION_COLORS"
          :key="color"
          class="toolbar-swatch"
          type="button"
          :style="{ background: annotationColorToken(color) }"
          :aria-label="`标注颜色 ${color}`"
          :aria-pressed="workspace.annotationColor === color"
          :disabled="!pgn.hasGame"
          @click="setAnnotationColor(color)"
        />
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canUndoCurrentDrawing"
          @click="pgn.undoCurrentDrawing()"
        >
          撤销
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.canRedoCurrentDrawing"
          @click="pgn.redoCurrentDrawing()"
        >
          重做
        </button>
        <button
          class="toolbar-button compact"
          type="button"
          :disabled="!pgn.hasCurrentDrawing"
          @click="pgn.clearDrawing()"
        >
          清除
        </button>
      </section>

      <section class="toolbar-group" aria-label="面板控制">
        <button
          class="toolbar-button"
          type="button"
          :aria-pressed="workspace.showLeftSidebar"
          @click="workspace.toggleLeftSidebar()"
        >
          列表
        </button>
        <button
          class="toolbar-button"
          type="button"
          :aria-pressed="workspace.showAnalysisRegion"
          @click="workspace.toggleAnalysisRegion()"
        >
          分析
        </button>
      </section>
    </div>
  </header>
</template>

<style scoped>
.workspace-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  padding: var(--s-2);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.toolbar-groups {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-width: 0;
  padding: var(--s-1);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.toolbar-button,
.toolbar-collapse,
.toolbar-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--control-h-sm);
  min-height: var(--control-h-sm);
  padding: 0 var(--s-2);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.toolbar-button.compact {
  padding: 0 var(--s-1);
}

.toolbar-swatch {
  width: var(--control-h-sm);
  min-width: var(--control-h-sm);
  padding: 0;
}

.toolbar-button:disabled,
.toolbar-swatch:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.toolbar-button[aria-pressed='true'],
.toolbar-swatch[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

@media (width <= 560px) {
  .workspace-toolbar {
    align-items: flex-start;
  }

  .toolbar-groups {
    overflow: auto;
    scrollbar-gutter: stable;
  }
}
</style>
