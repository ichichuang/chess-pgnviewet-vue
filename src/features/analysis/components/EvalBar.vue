<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase } from '@/features/motion/gsapTokens'
import { useAnalysisStore, useWorkspaceStore } from '@/stores'
import { BOARD_ORIENTATION_WHITE } from '@/features/board/domain/boardTypes'

const analysis = useAnalysisStore()
const workspace = useWorkspaceStore()

const MAX_CP = 800

const whiteScore = computed(() => {
  const score = analysis.current?.score

  if (!score) {
    return null
  }

  if (score.kind === 'mate') {
    return Math.sign(score.whiteValue) * MAX_CP
  }

  return Math.max(-MAX_CP, Math.min(MAX_CP, score.whiteValue))
})

const whitePct = computed(() => 50 + ((whiteScore.value ?? 0) / MAX_CP) * 50)
const whiteAtBottom = computed(() => workspace.boardOrientation === BOARD_ORIENTATION_WHITE)
const topLabel = computed(() => (whiteAtBottom.value ? '黑' : '白'))
const bottomLabel = computed(() => (whiteAtBottom.value ? '白' : '黑'))

const leader = computed<'w' | 'b' | 'equal' | 'na'>(() => {
  const score = whiteScore.value

  if (score == null) {
    return 'na'
  }

  if (Math.abs(score) < 20) {
    return 'equal'
  }

  return score > 0 ? 'w' : 'b'
})

const topSide = computed<'w' | 'b'>(() => (whiteAtBottom.value ? 'b' : 'w'))
const bottomSide = computed<'w' | 'b'>(() => (whiteAtBottom.value ? 'w' : 'b'))
const rootEl = ref<HTMLElement | null>(null)
const lightEl = ref<HTMLElement | null>(null)
const bandEl = ref<HTMLElement | null>(null)
const boundaryEl = ref<HTMLElement | null>(null)
const scoreEl = ref<HTMLElement | null>(null)
let context: ReturnType<typeof gsap.context> | null = null
let reducedMotionQuery: MediaQueryList | null = null

const scoreText = computed(() => {
  const score = analysis.current?.score

  if (!score) {
    return '—'
  }

  if (score.kind === 'mate') {
    return `#${score.whiteValue}`
  }

  const pawns = score.whiteValue / 100

  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`
})

async function syncRail(immediate = false): Promise<void> {
  await nextTick()
  const root = rootEl.value
  const light = lightEl.value
  const boundary = boundaryEl.value

  if (!root || !light || !boundary || !context) return

  const low = Math.min(50, whitePct.value)
  const bandHeight = Math.abs(whitePct.value - 50)
  const duration = immediate ? 0 : motionDuration(root, '--workspace-motion-duration-analysis')
  const ease = motionEase(root, '--workspace-motion-ease-state')
  const targets = [light, boundary, ...(bandEl.value ? [bandEl.value] : [])]
  gsap.killTweensOf(targets)

  context.add(() => {
    gsap.set(
      light,
      whiteAtBottom.value ? { bottom: 0, top: 'auto' } : { bottom: 'auto', top: 0 }
    )
    gsap.to(light, { height: `${whitePct.value}%`, duration, ease, overwrite: true })
    gsap.set(
      boundary,
      whiteAtBottom.value
        ? { bottom: `${whitePct.value}%`, top: 'auto' }
        : { bottom: 'auto', top: `${whitePct.value}%` }
    )

    if (bandEl.value) {
      gsap.set(
        bandEl.value,
        whiteAtBottom.value
          ? { bottom: `${low}%`, top: 'auto' }
          : { bottom: 'auto', top: `${low}%` }
      )
      gsap.to(bandEl.value, { height: `${bandHeight}%`, duration, ease, overwrite: true })
    }

    if (!immediate && scoreEl.value) {
      gsap.killTweensOf(scoreEl.value)
      gsap.fromTo(
        scoreEl.value,
        { autoAlpha: 0.45, yPercent: -8 },
        {
          autoAlpha: 1,
          yPercent: 0,
          duration,
          ease,
          overwrite: true,
          clearProps: 'opacity,transform',
        }
      )
    }
  })
}

watch([whitePct, whiteAtBottom, leader], () => void syncRail())

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', onReducedMotionChange)
  }

  void syncRail(true)
})

function onReducedMotionChange(): void {
  void syncRail(true)
}

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener('change', onReducedMotionChange)
  reducedMotionQuery = null
  const targets = [lightEl.value, bandEl.value, boundaryEl.value, scoreEl.value].filter(
    (target): target is HTMLElement => target !== null
  )
  gsap.killTweensOf(targets)
  gsap.set(targets, { clearProps: 'opacity,transform' })
  context?.revert()
  context = null
})
</script>

<template>
  <aside ref="rootEl" class="eval-bar" :class="`lead-${leader}`" aria-label="当前分析评估栏">
    <span class="eval-end" :class="{ lead: leader === topSide }">{{ topLabel }}</span>
    <div class="eval-track">
      <div ref="lightEl" class="eval-light-side" />
      <div class="eval-mid" />
      <div v-if="whiteScore != null && leader !== 'equal'" ref="bandEl" class="eval-band" />
      <div v-if="whiteScore != null" ref="boundaryEl" class="eval-boundary" />
    </div>
    <strong ref="scoreEl" class="eval-score">{{ scoreText }}</strong>
    <span class="eval-end" :class="{ lead: leader === bottomSide }">{{ bottomLabel }}</span>
  </aside>
</template>

<style scoped>
.eval-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
  min-height: 0;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-1);
  border-right: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.eval-end {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-weight: 700;
  text-align: center;
}

.eval-end.lead {
  color: var(--accent-strong);
}

.eval-track {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--r-full);
  background: var(--analysis-rail-dark-fill);
  box-shadow: inset 0 0 0 var(--workspace-border-w) var(--border-strong);
}

.eval-light-side,
.eval-band,
.eval-boundary,
.eval-mid {
  position: absolute;
  right: 0;
  left: 0;
}

.eval-light-side {
  background: var(--analysis-rail-light-fill);
}

.eval-mid {
  top: 50%;
  border-top: var(--workspace-border-w) dashed var(--border-strong);
}

.eval-band {
  background: var(--accent);
  opacity: 0.55;
}

.eval-boundary {
  height: 2px;
  margin-top: var(--analysis-rail-boundary-offset);
  margin-bottom: var(--analysis-rail-boundary-offset);
  background: var(--accent-strong);
  box-shadow: 0 0 6px 1px var(--accent);
}

.eval-score {
  color: var(--accent-strong);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.lead-na .eval-score {
  color: var(--text-muted);
}

.lead-equal .eval-score {
  color: var(--text-2);
}
</style>
