<script setup lang="ts">
import { computed } from 'vue'

import PgnNotationPanel from '@/features/pgn/components/PgnNotationPanel.vue'
import type { PgnWorkspaceAction } from '@/features/pgn/pgnWorkspaceTypes'
import { useAnalysisStore, usePgnStore, useWorkspaceStore } from '@/stores'

const emit = defineEmits<{
  action: [name: PgnWorkspaceAction]
}>()

const pgn = usePgnStore()
const workspace = useWorkspaceStore()
const analysis = useAnalysisStore()

const tabs = [
  { key: 'notation', label: '棋谱' },
  { key: 'comments', label: '批注' },
  { key: 'annotations', label: '标注' },
  { key: 'analysis', label: '分析' },
] as const

const currentComments = computed(() => pgn.currentAnnotation?.plainComments ?? [])
const currentSystemTexts = computed(() => pgn.currentAnnotation?.systemTexts ?? [])
const currentUserTexts = computed(() => pgn.currentAnnotation?.userTexts ?? [])
const annotationSummary = computed(() => ({
  arrows: pgn.currentAnnotation?.arrows.length ?? 0,
  squares: pgn.currentAnnotation?.squares.length ?? 0,
}))
const analysisScore = computed(() => {
  const score = analysis.current?.score

  if (!score) {
    return '—'
  }

  if (score.kind === 'mate') {
    return `#${score.whiteValue}`
  }

  const pawns = score.whiteValue / 100

  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
})
</script>

<template>
  <section class="workspace-right-panel" aria-label="工作区右侧面板">
    <header class="panel-tabs" role="tablist" aria-label="右侧面板">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="panel-tab"
        type="button"
        role="tab"
        :aria-selected="workspace.activeRightTab === tab.key"
        @click="workspace.setActiveRightTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </header>

    <PgnNotationPanel
      v-if="workspace.activeRightTab === 'notation'"
      class="panel-content"
      @action="emit('action', $event)"
    />

    <section
      v-else-if="workspace.activeRightTab === 'comments'"
      class="panel-content panel-scroll"
      aria-label="当前节点批注"
    >
      <h2>当前节点批注</h2>
      <p
        v-if="currentComments.length === 0 && currentSystemTexts.length === 0 && currentUserTexts.length === 0"
      >
        暂无批注
      </p>
      <dl v-else class="panel-list">
        <template v-for="comment in currentComments" :key="`plain-${comment}`">
          <dt>PGN</dt>
          <dd>{{ comment }}</dd>
        </template>
        <template v-for="comment in currentSystemTexts" :key="`system-${comment}`">
          <dt>系统</dt>
          <dd>{{ comment }}</dd>
        </template>
        <template v-for="comment in currentUserTexts" :key="`user-${comment}`">
          <dt>用户</dt>
          <dd>{{ comment }}</dd>
        </template>
      </dl>
    </section>

    <section
      v-else-if="workspace.activeRightTab === 'annotations'"
      class="panel-content panel-scroll"
      aria-label="当前节点标注"
    >
      <h2>当前节点标注</h2>
      <dl class="panel-list">
        <dt>箭头</dt>
        <dd>{{ annotationSummary.arrows }}</dd>
        <dt>方格</dt>
        <dd>{{ annotationSummary.squares }}</dd>
        <dt>工具</dt>
        <dd>{{ workspace.annotationTool ?? '未启用' }}</dd>
      </dl>
    </section>

    <section v-else class="panel-content panel-scroll" aria-label="AI 分析状态">
      <h2>分析面板</h2>
      <dl class="panel-list">
        <dt>状态</dt>
        <dd>{{ analysis.phase }}</dd>
        <dt>评估</dt>
        <dd>{{ analysisScore }}</dd>
        <dt>最佳</dt>
        <dd>{{ analysis.current?.bestMove || '—' }}</dd>
        <dt>Worker</dt>
        <dd>{{ analysis.workerMode }}</dd>
      </dl>
    </section>
  </section>
</template>

<style scoped>
.workspace-right-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--surface);
}

.panel-tabs {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.panel-tab {
  flex: 1 1 0;
  min-width: 0;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-2);
  border: 0;
  border-right: var(--workspace-border-w) solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

.panel-tab:last-child {
  border-right: 0;
}

.panel-tab[aria-selected='true'] {
  background: var(--surface);
  color: var(--accent-strong);
}

.panel-content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.panel-scroll {
  display: grid;
  align-content: start;
  gap: var(--s-3);
  overflow: auto;
  padding: var(--s-4);
  scrollbar-gutter: stable;
}

.panel-scroll h2,
.panel-scroll p,
.panel-list {
  margin: 0;
}

.panel-scroll h2 {
  color: var(--text);
  font-size: var(--fs-md);
}

.panel-scroll p {
  color: var(--text-muted);
}

.panel-list {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--s-2) var(--s-3);
}

.panel-list dt {
  color: var(--text-muted);
}

.panel-list dd {
  min-width: 0;
  margin: 0;
  color: var(--text);
}
</style>
