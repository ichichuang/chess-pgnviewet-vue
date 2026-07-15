<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { formatMoverScore, formatWhiteScore } from '@/features/analysis/domain/formatAnalysis'
import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import { useAnalysisStore, usePgnStore } from '@/stores'

const analysis = useAnalysisStore()
const pgn = usePgnStore()

const statusText = computed(() => {
  if (!pgn.hasGame) {
    return '请先加载真实 PGN'
  }

  if (analysis.phase === 'initializing') {
    return '正在初始化本地分析'
  }

  if (analysis.phase === 'ready') {
    return '本地分析已就绪'
  }

  if (analysis.phase === 'analyzing') {
    return '正在分析当前局面'
  }

  if (analysis.phase === 'unavailable') {
    return analysis.unavailableReason ?? '本地分析不可用'
  }

  if (analysis.phase === 'error') {
    return analysis.error ?? '分析失败'
  }

  if (analysis.current) {
    return '当前局面分析完成'
  }

  return '等待当前节点'
})

const runtimeText = computed(() => {
  if (analysis.workerMode === 'worker') {
    return `并行分析 × ${analysis.workerCount}`
  }

  if (analysis.workerMode === 'main-thread-fallback') {
    return '主线程后备'
  }

  return '未初始化'
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
</script>

<template>
  <section ref="rootEl" class="analysis-panel" aria-labelledby="workspace-analysis-title">
    <header class="analysis-header">
      <div>
        <h2 id="workspace-analysis-title">AI 分析</h2>
        <p role="status">{{ statusText }}</p>
      </div>
      <div class="analysis-actions">
        <button
          class="analysis-button primary"
          type="button"
          :disabled="!pgn.hasGame || analysis.running"
          @click="analysis.analyzeCurrent(true)"
        >
          分析当前
        </button>
        <button
          v-if="analysis.running"
          class="analysis-button"
          type="button"
          @click="analysis.stop()"
        >
          取消
        </button>
        <button
          v-else-if="analysis.canRetry"
          class="analysis-button"
          type="button"
          @click="analysis.retry()"
        >
          重试
        </button>
      </div>
    </header>

    <div class="analysis-meta" aria-label="分析运行时状态">
      <span>{{ runtimeText }}</span>
      <span
        >任务 {{ analysis.current?.requestId ?? analysis.activeRequest?.requestId ?? '—' }}</span
      >
      <span
        >节点 {{ analysis.current?.positionId ?? analysis.activeRequest?.positionId ?? '—' }}</span
      >
      <span>丢弃过期 {{ analysis.staleRejected }}</span>
    </div>

    <div v-if="analysis.running" class="analysis-progress" aria-hidden="true">
      <span ref="progressEl" />
    </div>

    <p
      v-if="analysis.phase === 'error' || analysis.phase === 'unavailable'"
      class="analysis-error"
      role="alert"
    >
      {{ statusText }}
    </p>

    <div v-if="analysis.current" ref="resultEl" class="analysis-result">
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
    </div>

    <div v-else-if="!analysis.running" class="analysis-empty">
      <p>{{ pgn.hasGame ? '选择或行走一步后会分析当前节点。' : '加载 PGN 后可启用本地分析。' }}</p>
    </div>
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
.analysis-empty p,
.analysis-error {
  margin: 0;
}

.analysis-header h2 {
  font-size: var(--fs-md);
}

.analysis-header p,
.analysis-meta,
.analysis-section small,
.analysis-empty {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.analysis-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-1);
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

.analysis-meta {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-2);
}

.analysis-meta span {
  padding: var(--s-1) var(--s-2);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-xs);
  background: var(--surface-2);
}

.analysis-progress {
  position: relative;
  flex: 0 0 6px;
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
  grid-template-columns: minmax(44px, max-content) minmax(48px, max-content) minmax(0, 1fr);
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
