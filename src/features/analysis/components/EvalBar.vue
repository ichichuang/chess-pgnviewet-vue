<script setup lang="ts">
import { computed } from 'vue'

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

const fillStyle = computed(() =>
  whiteAtBottom.value
    ? { height: `${whitePct.value}%`, bottom: '0', top: 'auto' }
    : { height: `${whitePct.value}%`, top: '0', bottom: 'auto' }
)

const bandStyle = computed(() => {
  const low = Math.min(50, whitePct.value)
  const height = Math.abs(whitePct.value - 50)

  return whiteAtBottom.value
    ? { bottom: `${low}%`, top: 'auto', height: `${height}%` }
    : { top: `${low}%`, bottom: 'auto', height: `${height}%` }
})

const boundaryStyle = computed(() =>
  whiteAtBottom.value
    ? { bottom: `${whitePct.value}%`, top: 'auto' }
    : { top: `${whitePct.value}%`, bottom: 'auto' }
)

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
</script>

<template>
  <aside class="eval-bar" :class="`lead-${leader}`" aria-label="当前分析评估栏">
    <span class="eval-end" :class="{ lead: leader === topSide }">{{ topLabel }}</span>
    <div class="eval-track">
      <div class="eval-light-side" :style="fillStyle" />
      <div class="eval-mid" />
      <div v-if="whiteScore != null && leader !== 'equal'" class="eval-band" :style="bandStyle" />
      <div v-if="whiteScore != null" class="eval-boundary" :style="boundaryStyle" />
    </div>
    <strong class="eval-score">{{ scoreText }}</strong>
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
  transition:
    height var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard),
    top var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard),
    bottom var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard);
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
