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

const aiScope = ref<'current' | 'full'>('current')
const firstUseAccepted = ref(false)
const showFirstUseNotice = ref(false)

const lifecycleState = computed(() => {
  if (!props.permissions.canRunAnalysis) return 'blocked'
  if (showFirstUseNotice.value) return 'first-use'
  if (analysis.running) return 'running'
  if (analysis.phase === 'error' || analysis.phase === 'unavailable') return 'failed'
  if (analysis.current) return 'completed'
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
    return aiScope.value === 'full' ? '正在分析整局' : '正在分析当前局面'
  }

  if (lifecycleState.value === 'failed') {
    return analysis.phase === 'unavailable'
      ? (analysis.unavailableReason ?? '本地分析不可用')
      : (analysis.error ?? 'AI 分析失败')
  }

  if (lifecycleState.value === 'completed') {
    return aiScope.value === 'full' ? '整局分析完成' : '当前局面分析完成'
  }

  return ''
})

const candidates = computed(() => analysis.current?.lines ?? [])
const rootEl = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const resultEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null
let reducedMotionQuery: MediaQueryList | null = null

async function syncProgress(): Promise<void> {
  await nextTick()
  const root = rootEl.value
  const progress = progressEl.value

  if (!root || !progress || !analysis.running) return

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

async function animateResult(): Promise<void> {
  await nextTick()
  const root = rootEl.value
  const result = resultEl.value

  if (!root || !result) return

  const targets = Array.from(result.children)
  gsap.killTweensOf(targets)
  context?.add(() => {
    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: motionScalar(root, '--workspace-motion-distance-panel') },
      {
        autoAlpha: 1,
        y: 0,
        duration: motionDuration(root, '--workspace-motion-duration-panel'),
        ease: motionEase(root, '--workspace-motion-ease-enter'),
        stagger: motionDuration(root, '--workspace-motion-stagger-panel'),
        overwrite: true,
        clearProps: 'opacity,transform',
      }
    )
  })
}

watch(() => analysis.running, () => void syncProgress(), { flush: 'post' })
watch(() => analysis.current?.requestId, () => void animateResult(), { flush: 'post' })

function onReducedMotionChange(): void {
  void syncProgress()
  void animateResult()
}

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', onReducedMotionChange)
  }

  void syncProgress()
  void animateResult()
})

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener('change', onReducedMotionChange)
  reducedMotionQuery = null
  const targets = rootEl.value ? Array.from(rootEl.value.querySelectorAll('*')) : []
  gsap.killTweensOf(targets)
  context?.revert()
  context = null
})

function onStart(scope: 'current' | 'full'): void {
  if (!props.permissions.canRunAnalysis || !pgn.hasGame) return
  aiScope.value = scope
  if (scope === 'full') return
  if (!firstUseAccepted.value) {
    showFirstUseNotice.value = true
    return
  }
  void analysis.analyzeCurrent(true)
}

function onAcceptFirstUse(): void {
  firstUseAccepted.value = true
  showFirstUseNotice.value = false
  if (aiScope.value === 'current') {
    void analysis.analyzeCurrent(true)
  }
}

function onCancelFirstUse(): void {
  showFirstUseNotice.value = false
}

function onCancelAnalysis(): void {
  analysis.stop()
}

function onRetryAnalysis(): void {
  if (!props.permissions.canRunAnalysis || !pgn.hasGame) return
  void analysis.retry()
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

    <section v-if="lifecycleState === 'off'" class="analysis-off">
      <p>分析默认关闭，不会占用额外计算资源。</p>
      <div class="analysis-actions">
        <ProductButton
          size="small"
          variant="primary"
          :disabled="!pgn.hasGame"
          @click="onStart('current')"
        >
          分析当前局面
        </ProductButton>
        <ProductButton size="small" :disabled="true" @click="onStart('full')">
          分析整局
        </ProductButton>
      </div>
      <p class="analysis-hint">整局分析当前版本暂不支持。</p>
    </section>

    <section v-else-if="lifecycleState === 'running'" class="analysis-running">
      <div class="analysis-progress" aria-hidden="true">
        <span ref="progressEl" />
      </div>
      <div class="analysis-actions">
        <ProductButton size="small" variant="danger" @click="onCancelAnalysis">
          取消分析
        </ProductButton>
      </div>
    </section>

    <section v-else-if="lifecycleState === 'failed'" class="analysis-failed">
      <p role="alert">{{ statusText }}</p>
      <div class="analysis-actions">
        <ProductButton size="small" variant="primary" @click="onRetryAnalysis">
          重试分析
        </ProductButton>
      </div>
    </section>

    <div
      v-else-if="lifecycleState === 'completed' && analysis.current"
      ref="resultEl"
      class="analysis-result"
    >
      <section class="analysis-summary" aria-label="当前局面评估">
        <div>
          <span>白方视角</span>
          <strong>{{ formatWhiteScore(analysis.current.score) }}</strong>
        </div>
        <div>
          <span>行棋方视角</span>
          <strong>{{ formatMoverScore(analysis.current.score) }}</strong>
        </div>
        <div>
          <span>最佳着法</span>
          <strong>{{ analysis.current.bestMove || '—' }}</strong>
        </div>
      </section>

      <section class="analysis-section" aria-label="主要变化">
        <h3>主要变化</h3>
        <p v-if="analysis.current.pv">{{ analysis.current.pv }}</p>
        <p v-else>当前局面没有可显示变化。</p>
        <small v-if="!analysis.current.pvLegal">变化未通过当前局面合法性校验，已隐藏。</small>
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

      <div class="analysis-actions">
        <ProductButton size="small" variant="primary" @click="onStart('current')">
          重新分析
        </ProductButton>
      </div>
    </div>

    <ProductConfirmDialog
      v-model:show="showFirstUseNotice"
      title="开启 AI 分析"
      body="AI 分析会使用设备的处理器和电量，也可能影响课堂中的操作流畅度。只有你确认后才会开始。"
      confirm-text="了解并开启"
      cancel-text="暂不开启"
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

.analysis-hint {
  margin: 0;
  color: var(--text-faint);
  font-size: var(--fs-xs);
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
.candidate-list span {
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

.candidate-list {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.candidate-list li {
  display: grid;
  grid-template-columns: minmax(var(--board-touch-target-min), max-content) minmax(var(--board-touch-target-min), max-content) minmax(0, 1fr);
  gap: var(--s-2);
  align-items: baseline;
  min-width: 0;
  padding: var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-2);
}

.candidate-list li span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text);
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
