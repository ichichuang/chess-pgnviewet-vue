<script setup lang="ts">
import { computed } from 'vue'

import PgnNotationPanel from '@/features/pgn/components/PgnNotationPanel.vue'
import type { PgnWorkspaceAction } from '@/features/pgn/pgnWorkspaceTypes'
import { useAnalysisStore, usePgnStore, useWorkspaceStore } from '@/stores'
import { ProductTabs } from '@/ui'
import type { ProductTabPaneDef } from '@/ui/ProductTabs.vue'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'

const props = defineProps<{
  permissions: WorkspacePermissions
}>()

const emit = defineEmits<{
  action: [name: PgnWorkspaceAction]
}>()

const pgn = usePgnStore()
const workspace = useWorkspaceStore()
const analysis = useAnalysisStore()

const panes = computed<ProductTabPaneDef[]>(() => {
  const result: ProductTabPaneDef[] = [{ name: 'notation', tab: '棋谱' }]
  if (props.permissions.canShowComments) {
    result.push({ name: 'comments', tab: '批注' })
  }
  if (props.permissions.canShowAnnotations) {
    result.push({ name: 'annotations', tab: '标注' })
  }
  if (props.permissions.canShowAnalysisPanel) {
    result.push({ name: 'analysis', tab: '分析' })
  }
  return result
})

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
    <ProductTabs
      v-model="workspace.activeRightTab"
      type="segment"
      class="panel-tabs"
      :panes="panes"
    >
      <template #notation>
        <PgnNotationPanel class="panel-content" @action="emit('action', $event)" />
      </template>

      <template #comments>
        <section class="panel-content panel-scroll" aria-label="当前节点批注">
          <h2>当前节点批注</h2>
          <p
            v-if="
              currentComments.length === 0 &&
              currentSystemTexts.length === 0 &&
              currentUserTexts.length === 0
            "
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
      </template>

      <template #annotations>
        <section class="panel-content panel-scroll" aria-label="当前节点标注">
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
      </template>

      <template #analysis>
        <section class="panel-content panel-scroll" aria-label="AI 分析状态">
          <h2>分析面板</h2>
          <dl class="panel-list">
            <dt>状态</dt>
            <dd>{{ analysis.phase }}</dd>
            <dt>评估</dt>
            <dd>{{ analysisScore }}</dd>
            <dt>最佳着法</dt>
            <dd>{{ analysis.current?.bestMove || '—' }}</dd>
          </dl>
        </section>
      </template>
    </ProductTabs>
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
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.n-tabs-nav) {
  flex: 0 0 auto;
}

.panel-tabs :deep(.n-tab-pane) {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.panel-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
