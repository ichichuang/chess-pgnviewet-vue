<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { formatMoverScore, formatWhiteScore } from '@/features/analysis/domain/formatAnalysis'
import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import { ProductButton, ProductConfirmDialog } from '@/ui'
import { useAnalysisStore, usePgnStore } from '@/stores'
import type { WorkspacePermissions } from '@/features/workspace-mode/useWorkspacePermissionAdapter'

const props = defineProps<{
  permissions: WorkspacePermissions
}>()

const analysis = useAnalysisStore()
const pgn = usePgnStore()

const pendingScope = ref<'current' | 'full' | null>(null)
const showFirstUseNotice = ref(false)

const currentResult = computed(() => analysis.matchingCurrent)
const fullGameResult = computed(() => analysis.matchingFullGame)
const completedScope = computed(() => analysis.completedScope)
const canStartFullGame = computed(
  () =>
    props.permissions.canRunAnalysis &&
    pgn.canMutateCurrentSource &&
    pgn.currentGameId !== null &&
    Boolean(pgn.selectedItem?.tree)
)

const lifecycleState = computed(() => {
  if (!props.permissions.canRunAnalysis) return 'blocked'
  if (showFirstUseNotice.value) return 'first-use'
  if (analysis.running) return 'running'
  if (analysis.phase === 'error' || analysis.phase === 'unavailable') return 'failed'
  if (analysis.hasResult) return 'completed'
  return 'off'
})

const statusText = computed(() => {
  if (lifecycleState.value === 'blocked') {
    return '当前来源不支持 AI 分析'
  }

  if (lifecycleState.value === 'off') {
    return 'AI 分析未开启'
  }

  if (lifecycleState.value === 'running') {
    return analysis.runningScope === 'full' ? '正在分析整局' : '正在分析当前局面'
  }

  if (lifecycleState.value === 'failed') {
    return analysis.phase === 'unavailable'
      ? (analysis.unavailableReason ?? '本地分析不可用')
      : (analysis.error ?? 'AI 分析失败')
  }

  if (lifecycleState.value === 'completed') {
    return completedScope.value === 'full' ? '整局分析完成' : '当前局面分析完成'
  }

  return ''
})

const candidates = computed(() => currentResult.value?.lines ?? [])
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
  analysis.stop()
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
  if (!props.permissions.canRunAnalysis || !pgn.hasGame) return
  analysisOwnsFocus = true
  void analysis.retry()
  void nextTick(() => focusAnalysisAction('cancel'))
}
</script>

<template>
  <section ref="rootEl" class="analysis-panel" aria-labelledby="workspace-analysis-title">
    <header class="analysis-header">
      <div>
        <h2 id="workspace-analysis-title">AI 分析</h2>
        <p role="status">{{ statusText }}</p>
      </div>
    </header>

    <section v-if="lifecycleState === 'off' || lifecycleState === 'first-use'" class="analysis-off">
      <p>分析默认关闭，不会占用额外计算资源。</p>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="start-current"
          size="small"
          variant="primary"
          :disabled="!pgn.hasGame"
          @click="onStart('current')"
        >
          分析当前局面
        </ProductButton>
        <ProductButton
          data-analysis-action="start-full"
          size="small"
          :disabled="!canStartFullGame"
          @click="onStart('full')"
        >
          分析整局
        </ProductButton>
      </div>
    </section>

    <section v-else-if="lifecycleState === 'running'" class="analysis-running">
      <div
        v-if="analysis.runningScope === 'full' && analysis.progress"
        class="analysis-progress-block"
        :data-analysis-request-id="analysis.progress.requestId"
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

    <section v-else-if="lifecycleState === 'failed'" class="analysis-failed">
      <p role="alert">{{ statusText }}</p>
      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="retry"
          size="small"
          variant="primary"
          @click="onRetryAnalysis"
        >
          重试分析
        </ProductButton>
      </div>
    </section>

    <div
      v-else-if="lifecycleState === 'completed'"
      ref="resultEl"
      class="analysis-result"
      :data-analysis-request-id="resultAnimationKey ?? undefined"
    >
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
            <li
              v-for="result in fullGameResult.results"
              :key="result.nodeKey"
              :data-analysis-node-key="result.nodeKey"
            >
              <strong>{{ result.label }}</strong>
              <span>{{ formatWhiteScore(result.score) }}</span>
              <span>{{ result.bestMove || '—' }}</span>
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
            <strong>{{ currentResult.bestMove || '—' }}</strong>
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
            <li v-for="line in candidates" :key="line.move">
              <strong>{{ line.move }}</strong>
              <span>{{ formatMoverScore(line.score) }}</span>
              <span>{{ line.pv || '—' }}</span>
            </li>
          </ol>
          <p v-else>当前局面没有候选变化。</p>
        </section>
      </template>

      <div class="analysis-actions">
        <ProductButton
          data-analysis-action="reanalyze"
          size="small"
          variant="primary"
          @click="onStart(completedScope === 'full' ? 'full' : 'current')"
        >
          {{ completedScope === 'full' ? '重新分析整局' : '重新分析' }}
        </ProductButton>
      </div>
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
.analysis-failed p,
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
.analysis-failed p,
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

.candidate-list li,
.full-game-list li {
  display: grid;
  grid-template-columns: minmax(var(--board-touch-target-min), max-content) minmax(var(--board-touch-target-min), max-content) minmax(0, 1fr);
  gap: var(--s-2);
  align-items: baseline;
  min-width: 0;
  padding: var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-2);
}

.candidate-list li span:last-child,
.full-game-list li span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text);
}

.full-game-list strong {
  min-width: 0;
  overflow-wrap: anywhere;
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
}
</style>
