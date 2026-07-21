<script setup lang="ts">
import { computed, ref } from 'vue'

import { formatWhiteScore } from '@/features/analysis/domain/formatAnalysis'
import type { AnalysisPositionResult } from '@/stores/analysis'

const props = defineProps<{
  results: readonly AnalysisPositionResult[]
  selectedResult: AnalysisPositionResult | null
}>()

const emit = defineEmits<{
  selectNode: [nodeId: number]
}>()

const MAX_CP = 800
const CLAMP_MATE = 6000

const chartRef = ref<HTMLElement | null>(null)
const hoveredIndex = ref<number | null>(null)

const chartData = computed(() => {
  const points = props.results
    .map((result, index) => {
      const score = result.score
      const isMate = score.kind === 'mate'
      const rawValue = score.whiteValue
      const displayValue = isMate
        ? Math.sign(rawValue) * CLAMP_MATE
        : Math.max(-MAX_CP, Math.min(MAX_CP, rawValue))

      return {
        index,
        nodeId: result.nodeId,
        ply: result.ply,
        label: result.label,
        score,
        rawValue,
        displayValue,
        isSelected:
          props.selectedResult !== null &&
          result.nodeId === props.selectedResult.nodeId &&
          result.positionId === props.selectedResult.positionId,
      }
    })
    .sort((a, b) => a.ply - b.ply)

  return points
})

const selectedIndex = computed(() =>
  chartData.value.findIndex((point) => point.isSelected)
)

const yDomain = computed<[number, number]>(() => {
  const hasMate = chartData.value.some((point) => point.score.kind === 'mate')
  return hasMate ? [-CLAMP_MATE, CLAMP_MATE] : [-MAX_CP, MAX_CP]
})

const viewBoxWidth = 400
const viewBoxHeight = 160
const padding = { top: 12, right: 24, bottom: 28, left: 40 }
const innerWidth = viewBoxWidth - padding.left - padding.right
const innerHeight = viewBoxHeight - padding.top - padding.bottom

function xScale(index: number): number {
  const count = Math.max(1, chartData.value.length - 1)
  return padding.left + (index / count) * innerWidth
}

function yScale(value: number): number {
  const [min, max] = yDomain.value
  const ratio = (value - min) / (max - min)
  return padding.top + innerHeight - ratio * innerHeight
}

function zeroY(): number {
  return yScale(0)
}

const linePath = computed(() => {
  if (chartData.value.length === 0) return ''

  return chartData.value
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(index)} ${yScale(point.displayValue)}`
    })
    .join(' ')
})

const areaPath = computed(() => {
  if (chartData.value.length === 0) return ''

  const top = chartData.value
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(index)} ${yScale(point.displayValue)}`
    })
    .join(' ')

  return `${top} L ${xScale(chartData.value.length - 1)} ${zeroY()} L ${xScale(0)} ${zeroY()} Z`
})

const yTicks = computed(() => {
  const [min, max] = yDomain.value
  const step = max === CLAMP_MATE ? CLAMP_MATE / 2 : MAX_CP / 2
  const ticks: number[] = []
  for (let value = min; value <= max; value += step) {
    ticks.push(value)
  }
  return ticks
})

function formatTick(value: number): string {
  if (Math.abs(value) === CLAMP_MATE) return '杀'
  return `${value > 0 ? '+' : ''}${(value / 100).toFixed(0)}`
}

function handlePointClick(nodeId: number): void {
  emit('selectNode', nodeId)
}

function handleKeyNavigation(event: KeyboardEvent): void {
  if (chartData.value.length === 0) return

  const current = selectedIndex.value >= 0 ? selectedIndex.value : 0
  let next: number

  if (event.key === 'ArrowLeft') {
    next = Math.max(0, current - 1)
  } else if (event.key === 'ArrowRight') {
    next = Math.min(chartData.value.length - 1, current + 1)
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = chartData.value.length - 1
  } else {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  emit('selectNode', chartData.value[next]?.nodeId ?? 0)
}
</script>

<template>
  <section
    ref="chartRef"
    class="analysis-eval-chart"
    :tabindex="chartData.length > 0 ? 0 : -1"
    aria-label="局面评估走势图"
    role="img"
    aria-roledescription="折线图"
    @keydown="handleKeyNavigation"
  >
    <div class="chart-header">
      <strong>评估走势</strong>
      <span v-if="selectedResult" class="chart-current">
        当前：{{ selectedResult.label }} · {{ formatWhiteScore(selectedResult.score) }}
      </span>
      <span v-else class="chart-current">尚未选择局面</span>
    </div>

    <div class="chart-viewport">
      <svg
        v-if="chartData.length > 0"
        class="chart-svg"
        :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          class="chart-grid-bg"
          :x="padding.left"
          :y="padding.top"
          :width="innerWidth"
          :height="innerHeight"
          fill="none"
        />

        <line
          class="chart-zero-line"
          :x1="padding.left"
          :y1="zeroY()"
          :x2="viewBoxWidth - padding.right"
          :y2="zeroY()"
        />

        <g v-for="(tick, index) in yTicks" :key="`y-${index}`" class="chart-grid-line">
          <line
            :x1="padding.left"
            :y1="yScale(tick)"
            :x2="viewBoxWidth - padding.right"
            :y2="yScale(tick)"
          />
          <text
            :x="padding.left - 6"
            :y="yScale(tick)"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {{ formatTick(tick) }}
          </text>
        </g>

        <path v-if="chartData.length > 1" class="chart-area" :d="areaPath" />
        <path v-if="chartData.length > 1" class="chart-line" :d="linePath" />

        <circle
          v-for="point in chartData"
          :key="`point-${point.index}`"
          class="chart-point"
          :class="{
            'is-selected': point.isSelected,
            'is-mate': point.score.kind === 'mate',
            'is-hover': hoveredIndex === point.index,
          }"
          :cx="xScale(point.index)"
          :cy="yScale(point.displayValue)"
          :r="point.isSelected ? 4.5 : 3"
          @mouseenter="hoveredIndex = point.index"
          @mouseleave="hoveredIndex = null"
          @click="handlePointClick(point.nodeId)"
        />

        <line
          v-if="selectedIndex >= 0"
          class="chart-current-marker"
          :x1="xScale(selectedIndex)"
          :y1="padding.top"
          :x2="xScale(selectedIndex)"
          :y2="viewBoxHeight - padding.bottom"
        />
      </svg>

      <div v-else class="chart-empty">
        <span>当前没有可绘制的评估数据</span>
      </div>
    </div>

    <ul class="visually-hidden" aria-label="评估数据列表">
      <li v-for="point in chartData" :key="`data-${point.index}`">
        {{ point.label }}，白方视角 {{ formatWhiteScore(point.score) }}
        <template v-if="point.isSelected">（当前选择）</template>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.analysis-eval-chart {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-width: 0;
  min-height: 0;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
}

.analysis-eval-chart:focus-visible {
  outline: var(--workspace-focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--workspace-focus-ring-offset);
}

.chart-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-2);
  min-width: 0;
}

.chart-header strong {
  color: var(--text);
  font-size: var(--fs-sm);
}

.chart-current {
  color: var(--text-muted);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
}

.chart-viewport {
  position: relative;
  flex: 0 0 auto;
  aspect-ratio: 5 / 2;
  min-height: 120px;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

.chart-zero-line {
  stroke: var(--border-strong);
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.chart-grid-line line {
  stroke: var(--border);
  stroke-width: 0.5;
}

.chart-grid-line text {
  fill: var(--text-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.chart-area {
  fill: var(--analysis-chart-area-fill);
}

.chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-point {
  fill: var(--accent-strong);
  stroke: var(--surface);
  stroke-width: 1.5;
  cursor: pointer;
  transition: r 0.1s ease;
}

.chart-point.is-selected {
  fill: var(--accent);
  stroke: var(--text-on-accent);
  stroke-width: 2;
}

.chart-point.is-mate {
  fill: var(--danger);
}

.chart-point.is-hover {
  transform: scale(1.5);
}

.chart-current-marker {
  stroke: var(--accent-strong);
  stroke-width: 1.5;
  stroke-dasharray: 2 2;
  pointer-events: none;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
