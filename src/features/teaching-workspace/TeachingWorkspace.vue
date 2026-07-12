<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh through --workspace-viewport-h
- Modules: eval rail, left structural list, board stage, right structural panel
- Scroll owner: right panel content and analysis panel only
- Panels: left shell panel collapses; right shell panel remains visible for P1A geometry
-->
<script setup lang="ts">
import { computed, ref } from 'vue'

import { useWorkspaceModeContext } from '@/features/workspace-mode/workspaceModeContext'

const workspaceModeContext = useWorkspaceModeContext()
const showLeftSidebar = ref(true)
const showAnalysisRegion = ref(false)
const boardAlignment = ref('center')

const boardJustifyContent = computed(() => {
  if (boardAlignment.value === 'left') {
    return 'flex-start'
  }

  if (boardAlignment.value === 'right') {
    return 'flex-end'
  }

  return 'center'
})

const modeLabel = computed(() => workspaceModeContext.value.mode.replaceAll('_', ' '))
const sourceLabel = computed(() => workspaceModeContext.value.source.replaceAll('_', ' '))

function toggleLeftSidebar() {
  showLeftSidebar.value = !showLeftSidebar.value
}

function toggleAnalysisRegion() {
  showAnalysisRegion.value = !showAnalysisRegion.value
}

function setBoardAlignment(nextAlignment = 'center') {
  if (nextAlignment !== 'left' && nextAlignment !== 'center' && nextAlignment !== 'right') {
    return
  }

  boardAlignment.value = nextAlignment
}

defineExpose({
  workspaceModeContext,
  showLeftSidebar,
  showAnalysisRegion,
  boardAlignment,
})
</script>

<template>
  <div class="workspace" data-p1a-shell>
    <main class="layout" :class="{ 'no-list': !showLeftSidebar }" aria-label="开赛了教学工作区">
      <aside class="area-eval" aria-label="评估栏结构区域">
        <span>评估</span>
        <small>结构</small>
      </aside>

      <aside
        class="area-list"
        :class="{ collapsed: !showLeftSidebar }"
        aria-label="左侧棋谱列表结构区域"
      >
        <div v-show="showLeftSidebar" class="list-inner">
          <section class="shell-region" aria-labelledby="workspace-list-title">
            <p class="region-kicker">结构区域</p>
            <h2 id="workspace-list-title">棋谱与来源列表</h2>
          </section>
        </div>
        <button
          class="list-handle"
          type="button"
          :aria-label="showLeftSidebar ? '收起棋谱列表结构区域' : '展开棋谱列表结构区域'"
          :aria-pressed="showLeftSidebar"
          @click="toggleLeftSidebar"
        >
          <span aria-hidden="true">{{ showLeftSidebar ? '‹' : '›' }}</span>
        </button>
      </aside>

      <section class="area-board" :class="`align-${boardAlignment}`" aria-label="棋盘舞台结构区域">
        <div class="board-stage" :style="{ justifyContent: boardJustifyContent }">
          <section class="board-align-frame" aria-labelledby="workspace-board-title">
            <div class="board-structural-label">
              <p class="region-kicker">规范棋盘舞台</p>
              <h1 id="workspace-board-title">开赛了教学工作区</h1>
              <dl class="context-list" aria-label="当前结构上下文">
                <div>
                  <dt>模式</dt>
                  <dd>{{ modeLabel }}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>{{ sourceLabel }}</dd>
                </div>
              </dl>
              <div class="alignment-controls" role="group" aria-label="棋盘区域对齐方式">
                <button
                  type="button"
                  :aria-pressed="boardAlignment === 'left'"
                  @click="setBoardAlignment('left')"
                >
                  左
                </button>
                <button
                  type="button"
                  :aria-pressed="boardAlignment === 'center'"
                  @click="setBoardAlignment('center')"
                >
                  中
                </button>
                <button
                  type="button"
                  :aria-pressed="boardAlignment === 'right'"
                  @click="setBoardAlignment('right')"
                >
                  右
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>

      <aside
        class="area-panel"
        :class="{ 'has-analysis': showAnalysisRegion }"
        aria-label="右侧棋谱与分析结构区域"
      >
        <section class="panel-pgn" aria-labelledby="workspace-toolbar-title">
          <header class="shell-toolbar" role="toolbar" aria-labelledby="workspace-toolbar-title">
            <h2 id="workspace-toolbar-title">工作区工具栏</h2>
            <button type="button" :aria-pressed="showLeftSidebar" @click="toggleLeftSidebar">
              {{ showLeftSidebar ? '隐藏左栏' : '显示左栏' }}
            </button>
            <button type="button" :aria-pressed="showAnalysisRegion" @click="toggleAnalysisRegion">
              {{ showAnalysisRegion ? '隐藏分析区' : '显示分析区' }}
            </button>
          </header>
          <div class="panel-scroll">
            <section class="shell-region" aria-labelledby="workspace-pgn-title">
              <p class="region-kicker">结构区域</p>
              <h2 id="workspace-pgn-title">棋谱、走法与注释面板</h2>
            </section>
          </div>
        </section>

        <button
          v-if="showAnalysisRegion"
          class="pp-split-handle-y"
          type="button"
          aria-label="棋谱与分析区域分割线结构位"
        >
          <span aria-hidden="true" />
        </button>

        <section
          v-if="showAnalysisRegion"
          class="panel-analysis"
          aria-labelledby="workspace-analysis-title"
        >
          <div class="panel-scroll">
            <section class="shell-region">
              <p class="region-kicker">结构区域</p>
              <h2 id="workspace-analysis-title">分析面板</h2>
            </section>
          </div>
        </section>
      </aside>
    </main>
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
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.layout.no-list {
  --workspace-list-current-w: var(--workspace-list-collapsed-w);
}

.area-eval {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  gap: var(--s-2);
  border-right: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  writing-mode: vertical-rl;
}

.area-eval span,
.area-eval small {
  font-size: var(--fs-xs);
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

.board-align-frame {
  position: relative;
  display: flex;
  flex: 0 1 min(100%, 100cqh);
  align-items: center;
  justify-content: center;
  width: min(100%, 100cqh);
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.board-structural-label {
  display: grid;
  align-content: center;
  justify-items: center;
  width: 100%;
  aspect-ratio: 1;
  padding: var(--s-6);
  gap: var(--s-4);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  text-align: center;
}

.board-structural-label h1,
.shell-region h2,
.shell-toolbar h2 {
  margin: 0;
  color: var(--text);
}

.board-structural-label h1 {
  font-size: var(--fs-xl);
}

.board-structural-label p,
.shell-region p {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.region-kicker {
  color: var(--accent-strong);
  font-size: var(--fs-xs);
}

.context-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  margin: 0;
  gap: var(--s-2);
}

.context-list div {
  min-width: 0;
  padding: var(--s-2);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
}

.context-list dt,
.context-list dd {
  margin: 0;
}

.context-list dt {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.context-list dd {
  overflow-wrap: anywhere;
  color: var(--text);
  font-size: var(--fs-sm);
}

.alignment-controls {
  display: inline-flex;
  gap: var(--s-2);
}

.alignment-controls button,
.shell-toolbar button {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
}

.alignment-controls button[aria-pressed='true'],
.shell-toolbar button[aria-pressed='true'] {
  border-color: var(--accent-line);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.area-panel {
  display: flex;
  flex-direction: column;
  height: var(--workspace-viewport-h);
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
    58%,
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

.pp-split-handle-y {
  position: relative;
  flex: 0 0 var(--workspace-splitter-h);
  width: 100%;
  min-height: var(--workspace-splitter-h);
  padding: var(--workspace-board-pad-y);
  border: 0;
  border-top: var(--workspace-border-w) solid var(--border);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
  cursor: row-resize;
  touch-action: none;
}

.pp-split-handle-y::before {
  position: absolute;
  inset: var(--workspace-splitter-hit-offset) 0;
  content: '';
}

.pp-split-handle-y span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--workspace-splitter-grip-w);
  height: var(--workspace-splitter-grip-h);
  border-radius: var(--r-full);
  background: var(--text-muted);
  transform: translate(-50%, -50%);
  transition:
    background var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard),
    width var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard);
}

.pp-split-handle-y:hover span {
  width: var(--workspace-splitter-grip-w-active);
  background: var(--accent);
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

  .board-structural-label {
    padding: var(--s-4);
  }

  .context-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .shell-toolbar {
    flex-wrap: wrap;
  }
}
</style>
