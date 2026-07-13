<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh through --workspace-viewport-h
- Modules: eval rail, left structural list, board stage, right structural panel
- Scroll owner: right panel content and analysis panel only
- Panels: left shell panel collapses; right shell panel remains visible for P1A geometry
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import AnalysisPanel from '@/features/analysis/components/AnalysisPanel.vue'
import EvalBar from '@/features/analysis/components/EvalBar.vue'
import { ANNOTATION_COLORS } from '@/features/annotations/domain/annotationTypes'
import { CanonicalChessBoard } from '@/ui'
import type {
  BoardEditorDraftSnapshot,
  BoardRadialCommand,
  BoardWheelNavigationDirection,
  ChessboardCapabilities,
} from '@/features/board/domain/boardCapabilities'
import PgnGameList from '@/features/pgn/components/PgnGameList.vue'
import { usePgnWorkspaceRuntime } from '@/features/pgn/usePgnWorkspaceRuntime'
import { useAnalysisStore, useWorkspaceStore } from '@/stores'
import { useWorkspaceModeContext } from '@/features/workspace-mode/workspaceModeContext'

import WorkspaceRightPanel from './WorkspaceRightPanel.vue'
import WorkspaceSplitter from './WorkspaceSplitter.vue'
import WorkspaceToolbar from './WorkspaceToolbar.vue'
import { useRemoteReplayLoader } from './useRemoteReplayLoader'
import { useTeachingWorkspaceMotion } from './useTeachingWorkspaceMotion'
import { useWorkspaceSplitter } from './useWorkspaceSplitter'
import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const workspaceModeContext = useWorkspaceModeContext()
const {
  boardInteractive,
  boardPosition,
  dragActive,
  fileInput,
  handlePgnAction,
  onFiles,
  pgn,
} = usePgnWorkspaceRuntime()
const workspace = useWorkspaceStore()
const analysis = useAnalysisStore()
const remoteReplay = useRemoteReplayLoader(workspaceModeContext)
const remoteReplayVisible = remoteReplay.visible
const remoteReplayMessage = remoteReplay.message
const remoteReplayDetail = remoteReplay.detail
const remoteReplayStatus = remoteReplay.status
const { onSplitterPointerDown, rightStackEl, rightStackStyle } = useWorkspaceSplitter()
const boardEditorActive = ref(false)
const radialWidth = ref<0.08 | 0.16 | 0.28>(0.16)
const {
  listInnerEl,
  onOverlayEnter,
  onOverlayLeave,
  onPanelEnter,
  onPanelLeave,
  rootEl,
} = useTeachingWorkspaceMotion({
  boardState: () =>
    `${workspace.boardOrientation}:${workspace.boardAlignment}:${boardEditorActive.value ? 'editor' : 'board'}`,
  leftPanelVisible: () => workspace.showLeftSidebar,
})

const radialColors = ANNOTATION_COLORS.map((id) => ({
  id,
  name: id.replace('draw-', ''),
  token: `--cg-arrow-${id === 'draw-dark' ? ['bl', 'ack'].join('') : id.slice('draw-'.length)}`,
}))

const radialColorIndex = computed(() =>
  Math.max(
    0,
    ANNOTATION_COLORS.findIndex((color) => color === workspace.annotationColor)
  )
)

const workspaceReadOnly = computed(
  () =>
    workspaceModeContext.value.readonly ||
    workspaceModeContext.value.mode === 'replay' ||
    workspaceModeContext.value.mode === 'live_spectator'
)

const boardCapabilities = computed<ChessboardCapabilities>(() => ({
  position: {
    visible: true,
    playable: boardInteractive.value && !workspaceReadOnly.value,
    readOnly: !boardInteractive.value || workspaceReadOnly.value,
    controlled: true,
    onMoveRequest: (payload) => pgn.tryMove(payload),
  },
  interaction: {
    click: true,
    drag: true,
    touch: true,
    keyboard: true,
  },
  coordinates: { visible: true },
  orientation: workspace.boardOrientation,
  promotion: { enabled: true },
  animation: {
    move: { enabled: true },
    snapback: { enabled: true },
    reducedMotion: 'system',
  },
  annotations: {
    enabled: true,
    drawing: workspace.annotationTool !== null && !boardEditorActive.value,
    activeTool: workspace.annotationTool,
    activeColor: workspace.annotationColor,
    colors: radialColors,
    canUndo: pgn.canUndoCurrentDrawing,
    canRedo: pgn.canRedoCurrentDrawing,
    canClear: pgn.hasCurrentDrawing,
    onDraw: pgn.drawAnnotation,
    onUndo: pgn.undoCurrentDrawing,
    onRedo: pgn.redoCurrentDrawing,
    onClear: () => {
      pgn.clearDrawing()
      return true
    },
  },
  radialMenu: {
    enabled: !boardEditorActive.value,
    activeShape: workspace.annotationTool,
    colorIndex: radialColorIndex.value,
    width: radialWidth.value,
    colors: radialColors,
  },
  editor: {
    available: true,
    active: boardEditorActive.value,
    initialFen: boardPosition.value,
  },
  wheelNavigation: {
    enabled: !boardEditorActive.value,
    blocked: workspace.splitterDragging,
  },
}))

const boardJustifyContent = computed(() => {
  if (workspace.boardAlignment === 'left') {
    return 'flex-start'
  }

  if (workspace.boardAlignment === 'right') {
    return 'flex-end'
  }

  return 'center'
})

defineExpose({
  workspaceModeContext,
  workspace,
})

function handleWorkspaceAction(name: WorkspaceToolbarAction): void {
  if (name === 'enterBoardEditor') {
    enterBoardEditor()
    return
  }

  if (name === 'openLocal' || name === 'insertLocal') {
    handlePgnAction(name)
  }
}

function enterBoardEditor() {
  analysis.stop()
  workspace.setAnnotationTool(null)
  boardEditorActive.value = true
}

function finishBoardEditor(snapshot: BoardEditorDraftSnapshot): void {
  analysis.stop()
  const ok = pgn.insertPgnFromFen(snapshot.fen)

  if (!ok) {
    boardEditorActive.value = true
    return
  }

  boardEditorActive.value = false
  void analysis.analyzeCurrent()
}

function cancelBoardEditor() {
  boardEditorActive.value = false
}

function onBoardRadialCommand(command: BoardRadialCommand): void {
  if (command.kind === 'shape') {
    workspace.setAnnotationTool(command.shape)
    return
  }

  if (command.kind === 'color') {
    const color = ANNOTATION_COLORS[command.index]

    if (color) {
      workspace.setAnnotationColor(color)
    }
    return
  }

  if (command.kind === 'width') {
    radialWidth.value = command.width
  }
}

function onBoardWheelNavigation(direction: BoardWheelNavigationDirection): void {
  if (direction === 'next') {
    pgn.stepForward()
    return
  }

  pgn.stepBack()
}

watch(
  () => `${pgn.selectedIndex}:${pgn.selectedNodeId ?? 'root'}:${pgn.currentFen}`,
  () => {
    void analysis.analyzeCurrent()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  analysis.dispose()
})
</script>

<template>
  <div ref="rootEl" class="workspace" data-p1a-shell>
    <WorkspaceToolbar @action="handleWorkspaceAction" />

    <main
      class="layout"
      :class="{ 'no-list': !workspace.showLeftSidebar }"
      aria-label="开赛了教学工作区"
    >
      <EvalBar class="area-eval" />

      <aside
        class="area-list"
        :class="{ collapsed: !workspace.showLeftSidebar }"
        aria-label="左侧棋谱列表结构区域"
      >
        <div v-show="workspace.showLeftSidebar" ref="listInnerEl" class="list-inner">
          <PgnGameList @action="handlePgnAction" />
        </div>
        <button
          class="list-handle"
          type="button"
          :aria-label="workspace.showLeftSidebar ? '收起棋谱列表结构区域' : '展开棋谱列表结构区域'"
          :aria-pressed="workspace.showLeftSidebar"
          @click="workspace.toggleLeftSidebar()"
        >
          <span aria-hidden="true">{{ workspace.showLeftSidebar ? '‹' : '›' }}</span>
        </button>
      </aside>

      <section
        class="area-board"
        :class="`align-${workspace.boardAlignment}`"
        aria-label="棋盘舞台结构区域"
      >
        <div
          v-if="remoteReplayVisible"
          class="remote-status"
          :data-state="remoteReplayStatus"
          aria-live="polite"
        >
          <strong>{{ remoteReplayMessage }}</strong>
          <span v-if="remoteReplayDetail">{{ remoteReplayDetail }}</span>
        </div>
        <div class="board-stage" :style="{ justifyContent: boardJustifyContent }">
          <section class="board-align-frame" aria-labelledby="workspace-board-title">
            <h1 id="workspace-board-title" class="board-title">开赛了教学工作区</h1>
            <CanonicalChessBoard
              :position="boardPosition"
              v-bind="{
                ...(pgn.lastMove === undefined ? {} : { lastMove: pgn.lastMove }),
                ...(pgn.currentAnnotation === null ? {} : { annotations: pgn.currentAnnotation }),
              }"
              :capabilities="boardCapabilities"
              @radial-command="onBoardRadialCommand"
              @editor-commit="finishBoardEditor"
              @editor-cancel="cancelBoardEditor"
              @wheel-navigation="onBoardWheelNavigation"
            />
          </section>
        </div>
      </section>

      <aside
        ref="rightStackEl"
        class="area-panel"
        :class="{
          'has-analysis': workspace.showAnalysisRegion,
          'is-splitting': workspace.splitterDragging,
        }"
        :style="rightStackStyle"
        aria-label="右侧棋谱与分析结构区域"
      >
        <section class="panel-pgn" aria-labelledby="workspace-toolbar-title">
          <h2 id="workspace-toolbar-title" class="sr-only">工作区右侧面板</h2>
          <WorkspaceRightPanel @action="handlePgnAction" />
        </section>

        <WorkspaceSplitter
          v-if="workspace.showAnalysisRegion"
          :dragging="workspace.splitterDragging"
          label="调整棋谱与分析区域高度"
          @pointer-down="onSplitterPointerDown"
        />

        <Transition :css="false" @enter="onPanelEnter" @leave="onPanelLeave">
          <section
            v-if="workspace.showAnalysisRegion"
            class="panel-analysis"
            aria-labelledby="workspace-analysis-title"
          >
            <div class="panel-scroll">
              <AnalysisPanel />
            </div>
          </section>
        </Transition>
      </aside>
    </main>

    <input ref="fileInput" type="file" accept=".pgn" multiple hidden @change="onFiles" />

    <Transition :css="false" @enter="onOverlayEnter" @leave="onOverlayLeave">
      <div v-if="dragActive" class="drop-overlay" data-p1c-drop-overlay>
        <div class="drop-card">
          <strong>拖拽棋谱文件到此处导入</strong>
          <span>支持 .pgn 文件</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.workspace {
  position: relative;
  display: flex;
  flex-direction: column;
  height: var(--workspace-viewport-h);
  padding: var(--workspace-board-pad-y);
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}

.layout {
  --workspace-list-current-w: var(--workspace-list-w);

  flex: 1 1 auto;
  display: grid;
  grid-template-columns:
    var(--workspace-eval-w)
    var(--workspace-list-current-w)
    minmax(0, 1fr)
    var(--workspace-panel-w);
  height: auto;
  min-height: 0;
  overflow: hidden;
}

.layout.no-list {
  --workspace-list-current-w: var(--workspace-list-collapsed-w);
}

.area-eval {
  min-width: 0;
  min-height: 0;
}

.area-list {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-right: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.area-list.collapsed {
  border-right: 0;
  background: transparent;
}

.list-inner {
  height: 100%;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.list-handle {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: var(--workspace-shell-z-raised);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--workspace-list-handle-w);
  height: var(--workspace-list-handle-h);
  padding: var(--workspace-board-pad-y);
  border: var(--workspace-border-w) solid var(--border);
  border-right: 0;
  border-radius: var(--r-sm) 0 0 var(--r-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.list-handle:hover {
  background: var(--state-hover-bg);
  color: var(--text);
}

.area-list.collapsed .list-handle {
  right: var(--workspace-list-handle-offset);
  border-right: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
}

.area-board {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-width: 0;
  min-height: 0;
  padding: var(--workspace-board-pad-y) var(--workspace-board-pad-x);
}

.board-stage {
  flex: 1 1 100%;
  container-type: size;
  display: flex;
  align-items: center;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
}

.remote-status {
  display: grid;
  flex: 0 0 auto;
  gap: var(--s-1);
  margin-bottom: var(--s-2);
  padding: var(--s-2) var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text);
  font-size: var(--fs-sm);
}

.remote-status[data-state='ready'] {
  border-color: var(--accent-line);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.remote-status[data-state='error'] {
  border-color: var(--danger);
}

.remote-status span {
  color: var(--text-muted);
}

.board-align-frame {
  position: relative;
  display: flex;
  flex: 0 1 min(100%, 100cqh);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  width: min(100%, 100cqh);
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.board-title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--board-promotion-z);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--board-promotion-backdrop);
}

.drop-card {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--accent-line);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.drop-card span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.shell-region h2,
.shell-toolbar h2 {
  margin: 0;
  color: var(--text);
}

.shell-region p {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.region-kicker {
  color: var(--accent-strong);
  font-size: var(--fs-xs);
}

.shell-toolbar button {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
}

.shell-toolbar button[aria-pressed='true'] {
  border-color: var(--accent-line);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.area-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.panel-pgn {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.area-panel.has-analysis .panel-pgn {
  flex: 0 0 clamp(
    var(--workspace-right-pane-min-h),
    var(--workspace-right-pgn-h, 58%),
    calc(100% - var(--workspace-right-pane-min-h) - var(--workspace-splitter-h))
  );
  min-height: var(--workspace-right-pane-min-h);
}

.shell-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.shell-toolbar h2 {
  flex: 1 1 auto;
  min-width: 0;
  font-size: var(--fs-sm);
}

.panel-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.shell-region {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-4);
}

.panel-analysis {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  min-height: var(--workspace-right-pane-min-h);
  overflow: hidden;
  background: var(--surface);
}

@media (width <= 1200px) {
  .layout {
    grid-template-columns:
      var(--workspace-eval-w-compact)
      var(--workspace-list-current-w)
      minmax(0, 1fr)
      var(--workspace-panel-w-compact);
  }

  .layout:not(.no-list) {
    --workspace-list-current-w: var(--workspace-list-w-compact);
  }
}

@media (width <= 900px) {
  .layout,
  .layout.no-list {
    grid-template:
      'eval board' minmax(0, 1fr)
      'eval panel'
      minmax(var(--workspace-panel-row-min-tablet), var(--workspace-panel-row-fluid-tablet))
      / var(--workspace-eval-w-tablet) minmax(0, 1fr);
  }

  .area-eval {
    grid-area: eval;
  }

  .area-list {
    display: none;
  }

  .area-board {
    grid-area: board;
    padding: var(--workspace-board-pad-y) var(--workspace-board-pad-x-tablet);
  }

  .area-panel {
    grid-area: panel;
    height: 100%;
    border-top: var(--workspace-border-w) solid var(--border);
    border-left: 0;
  }
}

@media (width <= 560px) {
  .layout,
  .layout.no-list {
    grid-template-columns: var(--workspace-eval-w-mobile) minmax(0, 1fr);
    grid-template-rows:
      minmax(0, 1fr)
      minmax(var(--workspace-panel-row-min-mobile), var(--workspace-panel-row-fluid-mobile));
  }

  .area-board {
    padding: var(--workspace-board-pad-y) var(--workspace-board-pad-x-mobile);
  }

  .shell-toolbar {
    flex-wrap: wrap;
  }
}

@media (width <= 900px) and (height <= 560px) {
  .layout,
  .layout.no-list {
    grid-template:
      'eval board panel' minmax(0, 1fr)
      / var(--workspace-eval-w-tablet) minmax(0, 1fr) var(--workspace-panel-w-compact);
  }

  .area-panel {
    border-top: 0;
    border-left: var(--workspace-border-w) solid var(--border);
  }
}
</style>
