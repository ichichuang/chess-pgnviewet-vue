<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import PgnNotationPanel from '@/features/pgn/components/PgnNotationPanel.vue'
import type {
  PgnNavigationIntent,
  PgnWorkspaceAction,
} from '@/features/pgn/pgnWorkspaceTypes'
import type { TeachingDraftScope } from '@/features/pgn/domain/teachingDraft'
import { useAnalysisStore, usePgnStore, useWorkspaceStore } from '@/stores'
import { ProductButton, ProductField, ProductStateBanner, ProductTabs } from '@/ui'
import type { ProductTabPaneDef } from '@/ui/ProductTabs.vue'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'

const props = defineProps<{
  permissions: WorkspacePermissions
}>()

const emit = defineEmits<{
  action: [name: PgnWorkspaceAction]
  navigate: [intent: PgnNavigationIntent]
  openTeachingDraft: [scope: TeachingDraftScope, focusEditor: () => void]
  saveTeachingDraft: [focusEditor: () => void]
  cancelTeachingDraft: [focusTrigger: () => void]
}>()

const pgn = usePgnStore()
const workspace = useWorkspaceStore()
const analysis = useAnalysisStore()
const panelId = useId()
const nodeTitleId = `${panelId}-node-comment-title`
const gameTitleId = `${panelId}-game-note-title`
const nodeEditorId = `${panelId}-node-comment-editor`
const gameEditorId = `${panelId}-game-note-editor`
const nodeEditor = ref<InstanceType<typeof ProductField> | null>(null)
const gameEditor = ref<InstanceType<typeof ProductField> | null>(null)
const nodeEditTrigger = ref<InstanceType<typeof ProductButton> | null>(null)
const gameEditTrigger = ref<InstanceType<typeof ProductButton> | null>(null)

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
const nodeDraftActive = computed(() => pgn.teachingDraft?.scope === 'node-comment')
const gameDraftActive = computed(() => pgn.teachingDraft?.scope === 'game-note')
const teachingDraftError = computed(() =>
  pgn.teachingDraft?.feedbackStatus === 'error'
    ? (pgn.teachingDraft.feedbackMessage ?? undefined)
    : undefined
)
const teachingDraftSuccess = computed(() =>
  pgn.teachingDraft?.feedbackStatus === 'success'
    ? pgn.teachingDraft.feedbackMessage
    : null
)
const saveLabel = computed(() =>
  pgn.teachingDraft?.feedbackStatus === 'error' && pgn.teachingDraft.canRetry
    ? '重试保存'
    : '保存'
)
const annotationSummary = computed(() => ({
  arrows: pgn.currentAnnotation?.arrows.length ?? 0,
  squares: pgn.currentAnnotation?.squares.length ?? 0,
}))
const currentAnalysis = computed(() => analysis.selectedPositionResult)
const analysisPresentation = computed(() => analysis.presentation)
const analysisScore = computed(() => {
  const score = currentAnalysis.value?.score

  if (!score) {
    return '—'
  }

  if (score.kind === 'mate') {
    return `#${score.whiteValue}`
  }

  const pawns = score.whiteValue / 100

  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
})

function updateTeachingDraft(text: string): void {
  const draft = pgn.teachingDraft
  if (draft) pgn.updateTeachingDraft(draft.id, text)
}

function focusNodeEditor(): void {
  nodeEditor.value?.focus()
}

function focusGameEditor(): void {
  gameEditor.value?.focus()
}

function focusNodeEditTrigger(): void {
  nodeEditTrigger.value?.focus()
}

function focusGameEditTrigger(): void {
  gameEditTrigger.value?.focus()
}

function openTeachingDraft(scope: TeachingDraftScope): void {
  emit(
    'openTeachingDraft',
    scope,
    scope === 'node-comment' ? focusNodeEditor : focusGameEditor
  )
}

function saveTeachingDraft(): void {
  emit('saveTeachingDraft', nodeDraftActive.value ? focusNodeEditor : focusGameEditor)
}

function cancelTeachingDraft(): void {
  emit(
    'cancelTeachingDraft',
    nodeDraftActive.value ? focusNodeEditTrigger : focusGameEditTrigger
  )
}
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
        <PgnNotationPanel
          class="panel-content"
          :can-open-local-pgn-as-new-source="permissions.canOpenLocalPgnAsNewSource"
          @action="emit('action', $event)"
          @navigate="emit('navigate', $event)"
        />
      </template>

      <template #comments>
        <section class="panel-content panel-scroll" aria-label="批注与对局教学笔记">
          <section class="teaching-section" :aria-labelledby="nodeTitleId">
            <header class="teaching-section-head">
              <div>
                <h2 :id="nodeTitleId">当前节点批注</h2>
                <p>跟随当前棋步保存到本地棋谱节点。</p>
              </div>
              <ProductButton
                v-if="permissions.canEditComments && !nodeDraftActive"
                ref="nodeEditTrigger"
                size="small"
                :disabled="Boolean(pgn.pendingBranch || pgn.pendingPromotion)"
                :title="pgn.pendingBranch || pgn.pendingPromotion ? '请先完成当前走法选择' : ''"
                @click="openTeachingDraft('node-comment')"
              >
                编辑节点批注
              </ProductButton>
            </header>

            <div v-if="nodeDraftActive" class="teaching-editor">
              <ProductField
                :id="nodeEditorId"
                ref="nodeEditor"
                :model-value="pgn.teachingDraft?.currentText ?? ''"
                label="节点批注内容"
                description="空行分隔的段落会作为独立 PGN 批注保存；系统批注、用户批注、标注、变例和 NAG 不会被改动。"
                multiline
                :rows="6"
                :error="teachingDraftError"
                :spellcheck="true"
                @update:model-value="updateTeachingDraft"
              />
              <div v-if="teachingDraftSuccess" aria-live="polite">
                <ProductStateBanner status="success" :show-icon="false">
                  {{ teachingDraftSuccess }}
                </ProductStateBanner>
              </div>
              <div class="teaching-editor-actions">
                <ProductButton size="small" variant="primary" @click="saveTeachingDraft">
                  {{ saveLabel }}
                </ProductButton>
                <ProductButton size="small" @click="cancelTeachingDraft">取消</ProductButton>
              </div>
            </div>

            <p
              v-if="
                currentComments.length === 0 &&
                currentSystemTexts.length === 0 &&
                currentUserTexts.length === 0
              "
              class="teaching-empty"
            >
              暂无节点批注
            </p>
            <dl v-else class="panel-list">
              <template v-for="(comment, index) in currentComments" :key="`plain-${index}`">
                <dt>PGN</dt>
                <dd>{{ comment }}</dd>
              </template>
              <template v-for="(comment, index) in currentSystemTexts" :key="`system-${index}`">
                <dt>系统</dt>
                <dd>{{ comment }}</dd>
              </template>
              <template v-for="(comment, index) in currentUserTexts" :key="`user-${index}`">
                <dt>用户</dt>
                <dd>{{ comment }}</dd>
              </template>
            </dl>
          </section>

          <section class="teaching-section" :aria-labelledby="gameTitleId">
            <header class="teaching-section-head">
              <div>
                <h2 :id="gameTitleId">整盘对局教学笔记</h2>
                <p>独立于节点批注，跟随当前整盘棋局。</p>
              </div>
              <ProductButton
                v-if="permissions.canEditComments && !gameDraftActive"
                ref="gameEditTrigger"
                size="small"
                :disabled="Boolean(pgn.pendingBranch || pgn.pendingPromotion)"
                :title="pgn.pendingBranch || pgn.pendingPromotion ? '请先完成当前走法选择' : ''"
                @click="openTeachingDraft('game-note')"
              >
                编辑对局笔记
              </ProductButton>
            </header>

            <div v-if="gameDraftActive" class="teaching-editor">
              <ProductField
                :id="gameEditorId"
                ref="gameEditor"
                :model-value="pgn.teachingDraft?.currentText ?? ''"
                label="整盘对局教学笔记内容"
                description="这份笔记只在本次工作区会话中保留，不属于 PGN 头信息，也不会写入文件或云端。"
                multiline
                :rows="7"
                :error="teachingDraftError"
                :spellcheck="true"
                @update:model-value="updateTeachingDraft"
              />
              <div v-if="teachingDraftSuccess" aria-live="polite">
                <ProductStateBanner status="success" :show-icon="false">
                  {{ teachingDraftSuccess }}
                </ProductStateBanner>
              </div>
              <div class="teaching-editor-actions">
                <ProductButton size="small" variant="primary" @click="saveTeachingDraft">
                  {{ saveLabel }}
                </ProductButton>
                <ProductButton size="small" @click="cancelTeachingDraft">取消</ProductButton>
              </div>
            </div>

            <p v-if="pgn.currentGameTeachingNote" class="teaching-note-copy">
              {{ pgn.currentGameTeachingNote }}
            </p>
            <p v-else class="teaching-empty">暂无整盘对局教学笔记</p>
            <p v-if="permissions.canEditComments" class="teaching-memory-boundary">
              仅在本次工作区会话中保留，不会自动保存或同步。
            </p>
            <p v-else class="teaching-memory-boundary">
              当前来源为只读；批注仅供查看，且不会创建对局教学笔记草稿。
            </p>
          </section>
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
            <dd>{{ analysisPresentation.statusText }}</dd>
            <template v-if="analysis.resultFreshness === 'retained'">
              <dt>结果</dt>
              <dd>此前完成结果</dd>
            </template>
            <dt>评估</dt>
            <dd>{{ analysisScore }}</dd>
            <dt>最佳着法</dt>
            <dd>{{ currentAnalysis?.bestMoveSan || '—' }}</dd>
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

.teaching-section {
  display: grid;
  gap: var(--s-3);
  padding-bottom: var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.teaching-section:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.teaching-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
}

.teaching-section-head > div {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.teaching-section-head p,
.teaching-empty,
.teaching-memory-boundary {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.teaching-editor {
  display: grid;
  gap: var(--s-3);
}

.teaching-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.teaching-note-copy {
  color: var(--text);
  white-space: pre-wrap;
}
</style>
