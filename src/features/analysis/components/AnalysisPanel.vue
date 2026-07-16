<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { formatMoverScore, formatWhiteScore } from '@/features/analysis/domain/formatAnalysis'
import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import { ProductButton, ProductConfirmDialog, ProductStateBanner } from '@/ui'
import { useAnalysisStore, usePgnStore } from '@/stores'
import type { AnalysisLine, AnalysisPositionResult } from '@/stores/analysis'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'

const props = defineProps<{
  permissions: WorkspacePermissions
}>()

const emit = defineEmits<{
  candidateInserted: [nodeId: number]
}>()

const analysis = useAnalysisStore()
const pgn = usePgnStore()

const pendingScope = ref<'current' | 'full' | null>(null)
const showFirstUseNotice = ref(false)

const currentResult = computed(() => analysis.matchingCurrent)
const fullGameResult = computed(() => analysis.matchingFullGame)
const completedScope = computed(() => analysis.completedScope)
const presentation = computed(() => analysis.presentation)
const candidateFeedback = computed(() => analysis.candidatePresentation)
const analysisStartPauseReason = computed(() =>
  pgn.manualDraft ? '请先应用或取消局面编辑，再开始分析。' : ''
)
const canStartFullGame = computed(
  () =>
    props.permissions.canRunAnalysis &&
    pgn.canMutateCurrentSource &&
    !analysisStartPauseReason.value &&
    pgn.currentGameId !== null &&
    Boolean(pgn.selectedItem?.tree)
)

const lifecycleState = computed(() => {
  if (!props.permissions.canRunAnalysis) return 'source-limited'
  if (showFirstUseNotice.value) return 'first-use'
  return presentation.value.kind
})

const statusText = computed(() => {
  if (lifecycleState.value === 'source-limited') {
    return '当前来源不支持 AI 分析'
  }

  return presentation.value.statusText
})

const candidates = computed(() => currentResult.value?.lines ?? [])
const resultRetained = computed(
  () => analysis.hasResult && lifecycleState.value !== 'completed'
)
const fullGameProgressText = computed(() => {
  const progress = analysis.progress

  return progress
    ? `已完成 ${progress.completed} / ${progress.total} 个局面（${progress.percentage}%）`
    : ''
})
const resultAnimationKey = computed(() => {
  if (completedScope.value === 'full') {
    return fullGameResult.value?.requestId ?? null
  }

  if (completedScope.value === 'current') {
    return currentResult.value?.requestId ?? null
  }

  return null
})
const rootEl = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const resultEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null
let reducedMotionQuery: MediaQueryList | null = null
let firstUseReturnScope: 'current' | 'full' | null = null
let analysisOwnsFocus = false
let focusSettlementObserver: MutationObserver | null = null
let focusSettlementFrame: number | null = null
let resultAnimationPending = false

async function syncProgress(): Promise<void> {
  await nextTick()
  const root = rootEl.value
  const progress = progressEl.value

  if (!root || !progress || !analysis.running || analysis.runningScope !== 'current') return

  const duration = motionDuration(root, '--workspace-motion-duration-progress')
  gsap.killTweensOf(progress)

  if (duration === 0) {
    gsap.set(progress, { xPercent: 0 })
    return
  }

  context?.add(() => {
    gsap.fromTo(
      progress,
      { xPercent: -20 },
      {
        xPercent: 160,
        duration,
        ease: motionEase(root, '--workspace-motion-ease-progress'),
        repeat: -1,
        yoyo: true,
        overwrite: true,
      }
    )
  })
}

async function animateResult(expectedKey = resultAnimationKey.value): Promise<void> {
  await nextTick()
  if (expectedKey !== resultAnimationKey.value) return

  const root = rootEl.value
  const result = resultEl.value

  if (!root || !result) {
    resultAnimationPending = false
    settlePrimaryFocusWhenStable()
    return
  }

  const targets = Array.from(result.children)
  const duration = motionDuration(root, '--workspace-motion-duration-panel')
  gsap.killTweensOf(targets)

  if (duration === 0) {
    gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' })
    resultAnimationPending = false
    settlePrimaryFocusWhenStable()
    return
  }

  context?.add(() => {
    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: motionScalar(root, '--workspace-motion-distance-panel') },
      {
        autoAlpha: 1,
        y: 0,
        duration,
        ease: motionEase(root, '--workspace-motion-ease-enter'),
        stagger: motionDuration(root, '--workspace-motion-stagger-panel'),
        overwrite: true,
        clearProps: 'opacity,transform',
        onComplete: () => {
          if (expectedKey !== resultAnimationKey.value) return
          resultAnimationPending = false
          settlePrimaryFocusWhenStable()
        },
      }
    )
  })
}

function queueResultAnimation(key = resultAnimationKey.value): void {
  resultAnimationPending = key !== null
  void animateResult(key)
}

watch([() => analysis.running, () => analysis.runningScope], () => void syncProgress(), {
  flush: 'post',
})
watch(resultAnimationKey, queueResultAnimation, { flush: 'sync' })

function analysisActionElement(action: string): HTMLElement | null {
  return (
    rootEl.value?.querySelector<HTMLElement>(`[data-analysis-action="${action}"]`) ?? null
  )
}

function focusAnalysisAction(action: string): HTMLElement | null {
  const element = analysisActionElement(action)
  if (!element) return null
  element.focus({ preventScroll: true })
  return document.activeElement === element ? element : null
}

function focusPrimaryAction(): HTMLElement | null {
  return (
    focusAnalysisAction('retry') ??
    focusAnalysisAction('reanalyze') ??
    focusAnalysisAction('start-current')
  )
}

function clearFocusSettlement(): void {
  focusSettlementObserver?.disconnect()
  focusSettlementObserver = null

  if (focusSettlementFrame !== null) {
    window.cancelAnimationFrame(focusSettlementFrame)
    focusSettlementFrame = null
  }
}

function settlePrimaryFocusWhenStable(): void {
  if (analysis.running || !analysisOwnsFocus) {
    clearFocusSettlement()
    return
  }

  if (resultAnimationPending) return

  const root = rootEl.value
  if (!root) return

  if (!focusSettlementObserver) {
    focusSettlementObserver = new MutationObserver(settlePrimaryFocusWhenStable)
    focusSettlementObserver.observe(root, { childList: true, subtree: true })
  }

  const focused = focusPrimaryAction()
  if (!focused) return

  if (focusSettlementFrame !== null) window.cancelAnimationFrame(focusSettlementFrame)
  focusSettlementFrame = window.requestAnimationFrame(() => {
    focusSettlementFrame = null
    if (focused.isConnected && document.activeElement === focused) {
      analysisOwnsFocus = false
      clearFocusSettlement()
      return
    }

    settlePrimaryFocusWhenStable()
  })
}

watch(
  () => analysis.running,
  (running, wasRunning) => {
    if (!running && wasRunning && analysisOwnsFocus) settlePrimaryFocusWhenStable()
  },
  { flush: 'sync' }
)

function onReducedMotionChange(): void {
  void syncProgress()
  queueResultAnimation()
}

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', onReducedMotionChange)
  }

  void syncProgress()
  queueResultAnimation()
})

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener('change', onReducedMotionChange)
  reducedMotionQuery = null
  const targets = rootEl.value ? Array.from(rootEl.value.querySelectorAll('*')) : []
  gsap.killTweensOf(targets)
  context?.revert()
  context = null
  resultAnimationPending = false
  clearFocusSettlement()
})

function onStart(scope: 'current' | 'full'): void {
  if (
    !props.permissions.canRunAnalysis ||
    !pgn.canMutateCurrentSource ||
    !pgn.hasGame ||
    analysisStartPauseReason.value ||
    (scope === 'full' && !canStartFullGame.value)
  ) {
    return
  }

  pendingScope.value = scope
  analysisOwnsFocus = true
  if (!analysis.firstUseAccepted) {
    firstUseReturnScope = scope
    showFirstUseNotice.value = true
    return
  }

  void startPendingScope(true)
}

async function startPendingScope(focusCancel: boolean): Promise<void> {
  const scope = pendingScope.value
  pendingScope.value = null

  if (scope === 'full') {
    void analysis.analyzeFullGame(true)
  } else if (scope === 'current') {
    void analysis.analyzeCurrent(true)
  }

  if (focusCancel) {
    await nextTick()
    focusAnalysisAction('cancel')
  }
}

function onAcceptFirstUse(): void {
  analysis.acceptFirstUse()
  showFirstUseNotice.value = false
  void startPendingScope(false)
}

function onCancelFirstUse(): void {
  analysisOwnsFocus = false
  showFirstUseNotice.value = false
  pendingScope.value = null
}

function firstUseReturnFocus(): HTMLElement | null {
  if (analysis.running) return analysisActionElement('cancel')
  if (analysis.hasResult) return analysisActionElement('reanalyze')
  if (analysis.canRetry) return analysisActionElement('retry')
  if (firstUseReturnScope === 'full') return analysisActionElement('start-full')
  if (firstUseReturnScope === 'current') return analysisActionElement('start-current')
  return null
}

function onFirstUseVisibilityChange(show: boolean): void {
  if (show) {
    showFirstUseNotice.value = true
    return
  }

  onCancelFirstUse()
}

function onCancelAnalysis(): void {
  analysis.cancelActive()
}

function onCancelFocus(): void {
  analysisOwnsFocus = true
}

function onCancelBlur(event: FocusEvent): void {
  if (analysis.running && event.relatedTarget instanceof HTMLElement) {
    analysisOwnsFocus = false
  }
}

function onRetryAnalysis(): void {
  if (!props.permissions.canRunAnalysis || !pgn.hasGame || analysisStartPauseReason.value) return
  analysisOwnsFocus = true
  void analysis.retry()
  void nextTick(() => focusAnalysisAction('cancel'))
}

function onReanalyzeOutcome(): void {
  onStart(presentation.value.scope === 'full' ? 'full' : 'current')
}

function candidateDisabledReason(line: AnalysisLine): string {
  if (analysis.running) {
    return '请先完成或取消当前分析任务，再插入候选变化。'
  }

  if (!props.permissions.canRunAnalysis || !pgn.canMutateCurrentSource) {
    return '当前来源不可编辑，无法插入候选变化。'
  }

  if (!line.pvLegal || !line.pv.trim()) {
    return '这条候选变化未通过完整合法性校验，无法插入。'
  }

  if (pgn.pendingBranch || pgn.pendingPromotion || pgn.manualDraft || pgn.teachingDraft) {
    return '请先完成当前走法或教学编辑，再插入候选变化。'
  }

  return ''
}

function onInsertCandidate(
  result: AnalysisPositionResult,
  line: AnalysisLine,
  event: MouseEvent
): void {
  const trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  const outcome = analysis.insertCandidate({
    requestId: result.requestId,
    scope: result.scope,
    nodeKey: result.nodeKey,
    candidateId: line.id,
    candidateMove: line.move,
    candidatePv: line.pv,
  })

  if (outcome.kind === 'inserted') {
    emit('candidateInserted', outcome.terminalNodeId)
    return
  }

  void nextTick(() => {
    if (trigger?.isConnected) trigger.focus({ preventScroll: true })
  })
}

watch(
  () => analysis.outcome?.sequence,
  async () => {
    const outcome = analysis.outcome

    if (!outcome || (outcome.kind === 'stale' && outcome.origin === 'candidate')) {
      return
    }

    await nextTick()
    analysisOwnsFocus = false
    focusAnalysisAction('reanalyze')
  },
  { flush: 'post' }
)
</script>

<template>
  <section ref="rootEl" class="analysis-panel" aria-labelledby="workspace-analysis-title">
    <header class="analysis-header">
      <div>
        <h2 id="workspace-analysis-title">AI 分析</h2>
        <p
          :role="
            candidateFeedback ||
            lifecycleState === 'failed' ||
            lifecycleState === 'cancelled' ||
            lifecycleState === 'stale'
              ? undefined
              : 'status'
          "
        >
          {{ statusText }}
        </p>
      </div>
    </header>

    <div
      v-if="candidateFeedback"
      class="analysis-feedback"
      :role="candidateFeedback.role"
      :aria-live="candidateFeedback.role === 'alert' ? 'assertive' : 'polite'"
    >
      <ProductStateBanner :status="candidateFeedback.tone" :show-icon="false">
        {{ candidateFeedback.message }}
      </ProductStateBanner>
    </div>

    <section v-if="lifecycleState === 'off' || lifecycleState === 'first-use'" class="analysis-off">
      <p>分析默认关闭，不会占用额外计算资源。</p>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="start-current"
          size="small"
          variant="primary"
          :disabled="!pgn.hasGame || Boolean(analysisStartPauseReason)"
          :title="analysisStartPauseReason"
          @click="onStart('current')"
        >
          分析当前局面
        </ProductButton>
        <ProductButton
          data-analysis-action="start-full"
          size="small"
          :disabled="!canStartFullGame"
          :title="analysisStartPauseReason"
          @click="onStart('full')"
        >
          分析整局
        </ProductButton>
      </div>
      <p v-if="analysisStartPauseReason" class="analysis-start-reason">
        {{ analysisStartPauseReason }}
      </p>
    </section>

    <section v-else-if="lifecycleState === 'source-limited'" class="analysis-state">
      <ProductStateBanner status="info" title="当前来源不支持 AI 分析">
        只读实时内容不提供 AI、引擎评估或候选变化写入。
      </ProductStateBanner>
    </section>

    <section
      v-else-if="lifecycleState === 'preparing' || lifecycleState === 'running'"
      class="analysis-running"
    >
      <div
        v-if="analysis.runningScope === 'full' && analysis.progress"
        class="analysis-progress-block"
      >
        <p class="analysis-progress-copy" aria-live="polite">
          {{ fullGameProgressText }}
        </p>
        <progress
          class="analysis-native-progress"
          :max="analysis.progress.total"
          :value="analysis.progress.completed"
          role="progressbar"
          aria-label="整局分析进度"
          aria-valuemin="0"
          :aria-valuemax="analysis.progress.total"
          :aria-valuenow="analysis.progress.completed"
          :aria-valuetext="`${analysis.progress.completed} / ${analysis.progress.total}，${analysis.progress.percentage}%`"
        />
        <p class="analysis-current-position" aria-live="polite">
          当前：{{ analysis.progress.currentLabel }}（{{ analysis.progress.currentIndex }} /
          {{ analysis.progress.total }}）
        </p>
      </div>
      <div v-else class="analysis-progress" aria-hidden="true">
        <span ref="progressEl" />
      </div>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="cancel"
          size="small"
          variant="danger"
          @blur="onCancelBlur"
          @click="onCancelAnalysis"
          @focus="onCancelFocus"
        >
          取消分析
        </ProductButton>
      </div>
    </section>

    <section v-else-if="lifecycleState === 'failed'" class="analysis-state" role="alert">
      <ProductStateBanner status="error" :title="presentation.title">
        {{ presentation.description }}
      </ProductStateBanner>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="retry"
          size="small"
          variant="primary"
          :disabled="Boolean(analysisStartPauseReason)"
          :title="analysisStartPauseReason"
          @click="onRetryAnalysis"
        >
          重试分析
        </ProductButton>
      </div>
      <p v-if="analysisStartPauseReason" class="analysis-start-reason">
        {{ analysisStartPauseReason }}
      </p>
    </section>

    <section
      v-else-if="lifecycleState === 'cancelled' || lifecycleState === 'stale'"
      class="analysis-state"
      :role="presentation.role"
      aria-live="polite"
    >
      <ProductStateBanner status="info" :title="presentation.title">
        {{ presentation.description }}
      </ProductStateBanner>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="reanalyze"
          size="small"
          variant="primary"
          :disabled="Boolean(analysisStartPauseReason)"
          :title="analysisStartPauseReason"
          @click="onReanalyzeOutcome"
        >
          {{ presentation.actionLabel }}
        </ProductButton>
      </div>
      <p v-if="analysisStartPauseReason" class="analysis-start-reason">
        {{ analysisStartPauseReason }}
      </p>
    </section>

    <div v-if="analysis.hasResult" ref="resultEl" class="analysis-result">
      <p v-if="resultRetained" class="analysis-retained" role="status">
        此前完成结果仍与当前来源、对局和局面一致，已保留供参考。
      </p>

      <template v-if="completedScope === 'full' && fullGameResult">
        <section class="analysis-summary" aria-label="整局分析摘要">
          <div>
            <span>已分析局面</span>
            <strong>{{ fullGameResult.results.length }} / {{ fullGameResult.total }}</strong>
          </div>
          <div>
            <span>完成度</span>
            <strong>100%</strong>
          </div>
          <div>
            <span>范围</span>
            <strong>初始局面与主线</strong>
          </div>
        </section>

        <section class="analysis-section" aria-label="整局主线局面结果">
          <h3>主线局面结果</h3>
          <ol class="full-game-list">
            <li v-for="result in fullGameResult.results" :key="result.nodeKey">
              <div class="full-game-position">
                <strong>{{ result.label }}</strong>
                <span>{{ formatWhiteScore(result.score) }}</span>
                <span>最佳着法：{{ result.bestMoveSan || '—' }}</span>
              </div>

              <details v-if="result.lines.length > 0" class="candidate-details">
                <summary :aria-label="`${result.label}的候选变化`">查看候选变化</summary>
                <ol class="candidate-list">
                  <li v-for="line in result.lines" :key="line.id">
                    <div class="candidate-copy">
                      <strong>{{ line.san || '不可用' }}</strong>
                      <span>{{ formatMoverScore(line.score) }}</span>
                      <span>{{ line.pv || '无可用变化' }}</span>
                    </div>
                    <ProductButton
                      size="small"
                      :disabled="Boolean(candidateDisabledReason(line))"
                      :title="candidateDisabledReason(line)"
                      :aria-label="`将 ${line.san || '当前'} 候选变化插入 ${result.label}`"
                      @click="onInsertCandidate(result, line, $event)"
                    >
                      插入变化
                    </ProductButton>
                    <small v-if="candidateDisabledReason(line)" class="candidate-reason">
                      {{ candidateDisabledReason(line) }}
                    </small>
                  </li>
                </ol>
              </details>
            </li>
          </ol>
        </section>
      </template>

      <template v-else-if="currentResult">
        <section class="analysis-summary" aria-label="当前局面评估">
          <div>
            <span>白方视角</span>
            <strong>{{ formatWhiteScore(currentResult.score) }}</strong>
          </div>
          <div>
            <span>行棋方视角</span>
            <strong>{{ formatMoverScore(currentResult.score) }}</strong>
          </div>
          <div>
            <span>最佳着法</span>
            <strong>{{ currentResult.bestMoveSan || '—' }}</strong>
          </div>
        </section>

        <section class="analysis-section" aria-label="主要变化">
          <h3>主要变化</h3>
          <p v-if="currentResult.pv">{{ currentResult.pv }}</p>
          <p v-else>当前局面没有可显示变化。</p>
          <small v-if="!currentResult.pvLegal">变化未通过当前局面合法性校验，已隐藏。</small>
        </section>

        <section class="analysis-section" aria-label="候选变化">
          <h3>候选变化</h3>
          <ol v-if="candidates.length > 0" class="candidate-list">
            <li v-for="line in candidates" :key="line.id">
              <div class="candidate-copy">
                <strong>{{ line.san || '不可用' }}</strong>
                <span>{{ formatMoverScore(line.score) }}</span>
                <span>{{ line.pv || '无可用变化' }}</span>
              </div>
              <ProductButton
                size="small"
                :disabled="Boolean(candidateDisabledReason(line))"
                :title="candidateDisabledReason(line)"
                :aria-label="`将 ${line.san || '当前'} 候选变化插入本地棋谱`"
                @click="onInsertCandidate(currentResult, line, $event)"
              >
                插入变化
              </ProductButton>
              <small v-if="candidateDisabledReason(line)" class="candidate-reason">
                {{ candidateDisabledReason(line) }}
              </small>
            </li>
          </ol>
          <p v-else>当前局面没有候选变化。</p>
        </section>
      </template>

      <div v-if="lifecycleState === 'completed'" class="analysis-actions">
        <ProductButton
          data-analysis-action="reanalyze"
          size="small"
          variant="primary"
          :disabled="Boolean(analysisStartPauseReason)"
          :title="analysisStartPauseReason"
          @click="onStart(completedScope === 'full' ? 'full' : 'current')"
        >
          {{ completedScope === 'full' ? '重新分析整局' : '重新分析当前局面' }}
        </ProductButton>
      </div>
      <p v-if="analysisStartPauseReason" class="analysis-start-reason">
        {{ analysisStartPauseReason }}
      </p>
    </div>

    <ProductConfirmDialog
      :show="showFirstUseNotice"
      title="开启 AI 分析"
      body="AI 分析会使用设备的处理器和电量，也可能影响课堂中的操作流畅度。只有你确认后才会开始。"
      confirm-text="了解并开启"
      cancel-text="暂不开启"
      :return-focus="firstUseReturnFocus"
      @update:show="onFirstUseVisibilityChange"
      @confirm="onAcceptFirstUse"
      @cancel="onCancelFirstUse"
    />
  </section>
</template>

<style scoped>
.analysis-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: var(--s-3);
  overflow: hidden;
  background: var(--surface);
  color: var(--text);
}

.analysis-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
}

.analysis-header h2,
.analysis-header p,
.analysis-section h3,
.analysis-section p,
.analysis-off p,
.analysis-running p,
.analysis-empty p,
.analysis-error {
  margin: 0;
}

.analysis-header h2 {
  font-size: var(--fs-md);
}

.analysis-header p,
.analysis-off p,
.analysis-running p,
.analysis-section small,
.analysis-empty {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.analysis-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.analysis-state,
.analysis-feedback {
  display: grid;
  gap: var(--s-2);
}

.analysis-retained {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.analysis-start-reason {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.analysis-progress-block {
  display: grid;
  gap: var(--s-2);
}

.analysis-progress-copy,
.analysis-current-position {
  margin: 0;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.analysis-native-progress {
  width: 100%;
  accent-color: var(--accent);
}

.analysis-button {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-2);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.analysis-button.primary {
  border-color: var(--accent-line);
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.analysis-button:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.analysis-progress {
  position: relative;
  flex: 0 0 var(--s-2);
  overflow: hidden;
  border-radius: var(--r-full);
  background: var(--surface-2);
}

.analysis-progress span {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: var(--r-full);
  background: var(--accent);
}

.analysis-error {
  color: var(--warning);
}

.analysis-result {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: var(--s-3);
  overflow: auto;
  scrollbar-gutter: stable;
}

.analysis-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-2);
}

.analysis-summary div {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
}

.analysis-summary span,
.candidate-list span,
.full-game-list span {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.analysis-summary strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: var(--fs-md);
  font-variant-numeric: tabular-nums;
}

.analysis-section {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.analysis-section h3 {
  color: var(--text-2);
  font-size: var(--fs-sm);
}

.analysis-section p {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text);
}

.candidate-list,
.full-game-list {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.candidate-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: var(--s-2);
  align-items: center;
  min-width: 0;
  padding: var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-2);
}

.candidate-copy,
.full-game-position {
  display: grid;
  grid-template-columns: minmax(var(--board-touch-target-min), max-content) minmax(var(--board-touch-target-min), max-content) minmax(0, 1fr);
  gap: var(--s-2);
  align-items: baseline;
  min-width: 0;
}

.candidate-copy span:last-child,
.full-game-position span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text);
}

.candidate-copy strong,
.full-game-position strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.candidate-reason {
  grid-column: 1 / -1;
}

.full-game-list > li {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
  padding: var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-2);
}

.candidate-details {
  min-width: 0;
}

.candidate-details summary {
  display: flex;
  align-items: center;
  min-block-size: var(--board-touch-target-min);
  color: var(--accent-strong);
  cursor: pointer;
  font-size: var(--fs-xs);
}

.candidate-list :deep(button) {
  min-block-size: var(--board-touch-target-min);
}

.candidate-details .candidate-list {
  margin-top: var(--s-2);
}

.candidate-details .candidate-list li {
  border: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.analysis-empty {
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-height: 0;
  text-align: center;
}

@media (width <= 560px) {
  .analysis-header,
  .analysis-summary {
    grid-template-columns: 1fr;
  }

  .analysis-header {
    display: grid;
  }

  .candidate-list li,
  .candidate-copy,
  .full-game-position {
    grid-template-columns: 1fr;
  }

  .candidate-list li :deep(button) {
    justify-self: stretch;
  }
}
</style>
