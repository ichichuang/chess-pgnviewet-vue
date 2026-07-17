<script setup lang="ts">
import { Chess } from 'chess.js'
import { computed } from 'vue'

import type { CompetitionPairing } from '@/api/productTypes'
import type { ChessboardCapabilities } from '@/features/board/domain/boardCapabilities'
import { CanonicalChessBoard } from '@/ui'

type VenueBoardState =
  | 'loading'
  | 'waiting'
  | 'ongoing'
  | 'completed'
  | 'stale'
  | 'disconnected'
  | 'partial-failure'
  | 'failed'
  | 'bye'
  | 'contract-blocked'

const props = defineProps<{
  pairing: CompetitionPairing
  position?: string
  lastMove?: readonly [string, string]
  boardState?: VenueBoardState
}>()

const validatedPosition = computed(() => {
  const position = props.position?.trim()
  if (!position) return ''

  try {
    return new Chess(position).fen()
  } catch {
    return ''
  }
})

const boardNoLabel = computed(() =>
  props.pairing.boardNo ? `第 ${props.pairing.boardNo} 台` : '台号待确认'
)
const resultOrStatus = computed(() => props.pairing.result || props.pairing.status)
const hasAuthoritativePosition = computed(() => Boolean(validatedPosition.value))
const effectiveBoardState = computed<VenueBoardState>(() => {
  if (props.position?.trim() && !validatedPosition.value) return 'failed'
  if (!validatedPosition.value) {
    return props.pairing.lifecycle === 'bye' ? 'bye' : 'contract-blocked'
  }
  if (props.boardState) return props.boardState

  switch (props.pairing.lifecycle) {
    case 'waiting':
    case 'ongoing':
    case 'completed':
    case 'bye':
      return props.pairing.lifecycle
    case 'unknown':
      return 'contract-blocked'
  }
})

const blockedTitle = computed(() => {
  if (effectiveBoardState.value === 'bye') return '本台轮空'
  if (effectiveBoardState.value === 'failed') return '局面数据无法验证'
  if (props.pairing.lifecycle === 'ongoing') return '实时局面暂不可用'
  if (props.pairing.lifecycle === 'completed') return '最终局面暂不可用'
  if (props.pairing.lifecycle === 'waiting') return '起始局面尚未提供'
  return '棋盘局面暂不可用'
})

const blockedDescription = computed(() => {
  if (effectiveBoardState.value === 'bye') return '来源确认本台轮空，没有可展示的棋盘局面。'
  if (effectiveBoardState.value === 'failed') return '来源局面未通过校验，未显示回退棋盘。'
  if (props.pairing.lifecycle === 'ongoing') return '来源尚未提供权威实时 FEN。'
  if (props.pairing.lifecycle === 'completed') return '来源尚未提供权威最终 FEN。'
  if (props.pairing.lifecycle === 'waiting') return '来源没有提供起始 FEN，未使用默认局面。'
  return '来源尚未提供可验证的权威 FEN。'
})

const overlayLabel = computed(() => {
  switch (effectiveBoardState.value) {
    case 'loading':
      return '正在获取最新局面'
    case 'stale':
      return '当前显示最后可信局面，数据已陈旧'
    case 'disconnected':
      return '连接已断开，保留最后可信局面'
    case 'partial-failure':
      return '本台部分数据未能更新，保留最后可信局面'
    case 'failed':
      return '本台局面更新失败，保留最后可信局面'
    default:
      return ''
  }
})

const boardCapabilities = computed<ChessboardCapabilities>(() => ({
  position: {
    visible: true,
    playable: false,
    readOnly: true,
    controlled: true,
  },
  interaction: {
    click: false,
    drag: false,
    touch: true,
    keyboard: true,
  },
  coordinates: { visible: true },
  promotion: { enabled: false },
  animation: {
    move: { enabled: false },
    snapback: { enabled: false },
    reducedMotion: 'system',
  },
  annotations: {
    enabled: false,
    drawing: false,
    emitModelUpdates: false,
    canUndo: false,
    canRedo: false,
    canClear: false,
  },
  radialMenu: { enabled: false },
  editor: { available: false, active: false, freePlacement: false },
  wheelNavigation: { enabled: false, blocked: true, consume: 'never' },
  responsive: { enabled: true, fit: 'contain' },
  accessibility: {
    labels: {
      board: `${boardNoLabel.value}，${props.pairing.whiteName} 对 ${props.pairing.blackName}，只读棋盘`,
    },
  },
}))
</script>

<template>
  <article
    class="venue-match"
    :aria-label="`${boardNoLabel}：${pairing.whiteName} 对 ${pairing.blackName}`"
    :data-match-lifecycle="pairing.lifecycle"
    :data-board-state="effectiveBoardState"
    :data-has-authoritative-position="hasAuthoritativePosition"
  >
    <header class="match-player-header">
      <section class="competitor competitor-left" :aria-label="`左方选手：${pairing.whiteName}`">
        <strong class="competitor-name" :title="pairing.whiteName">{{ pairing.whiteName }}</strong>
        <span v-if="pairing.whiteRating" class="competitor-meta"
          >等级分 {{ pairing.whiteRating }}</span
        >
        <span v-if="pairing.whiteTeam" class="competitor-meta" :title="pairing.whiteTeam">
          {{ pairing.whiteTeam }}
        </span>
      </section>

      <section class="match-versus" aria-label="对阵信息">
        <strong class="versus-label">VS</strong>
        <span class="board-number">{{ boardNoLabel }}</span>
        <span class="match-status">{{ resultOrStatus }}</span>
      </section>

      <section class="competitor competitor-right" :aria-label="`右方选手：${pairing.blackName}`">
        <strong class="competitor-name" :title="pairing.blackName">{{ pairing.blackName }}</strong>
        <span v-if="pairing.blackRating" class="competitor-meta"
          >等级分 {{ pairing.blackRating }}</span
        >
        <span v-if="pairing.blackTeam" class="competitor-meta" :title="pairing.blackTeam">
          {{ pairing.blackTeam }}
        </span>
      </section>
    </header>

    <div class="match-board-slot">
      <div class="match-board-frame">
        <CanonicalChessBoard
          v-if="validatedPosition"
          :position="validatedPosition"
          v-bind="lastMove ? { lastMove } : {}"
          :capabilities="boardCapabilities"
        />
        <div v-else class="unavailable-board-stage" :aria-label="blockedTitle">
          <strong>{{ blockedTitle }}</strong>
          <span>{{ blockedDescription }}</span>
        </div>
        <div v-if="validatedPosition && overlayLabel" class="board-state-overlay" role="status">
          {{ overlayLabel }}
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.venue-match {
  display: grid;
  grid-template-rows: var(--venue-display-player-header-h) minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

.match-player-header {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) minmax(0, var(--venue-display-versus-min-inline)) minmax(0, 1fr);
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  height: var(--venue-display-player-header-h);
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.competitor {
  display: grid;
  align-content: center;
  gap: var(--s-1);
  min-width: 0;
}

.competitor-left {
  text-align: left;
}

.competitor-right {
  text-align: right;
}

.competitor-name,
.competitor-meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.competitor-name {
  min-height: var(--venue-display-player-text-min-h);
  color: var(--text);
  font-size: var(--fs-lg);
}

.competitor-meta {
  min-height: var(--venue-display-player-meta-min-h);
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.match-versus {
  display: grid;
  place-items: center;
  min-width: 0;
  text-align: center;
}

.versus-label {
  color: var(--accent-strong);
  font-size: var(--fs-lg);
  line-height: 1;
}

.board-number,
.match-status {
  max-width: 100%;
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-status {
  color: var(--text-2);
  font-weight: 700;
}

.match-board-slot {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--surface-2);
}

.match-board-frame {
  position: relative;
  width: var(--venue-display-board-size);
  height: var(--venue-display-board-size);
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1 / 1;
}

.unavailable-board-stage {
  display: grid;
  place-content: center;
  gap: var(--s-2);
  width: 100%;
  height: 100%;
  padding: var(--venue-display-state-overlay-pad);
  overflow: hidden;
  border: var(--workspace-border-w) dashed var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text-muted);
  text-align: center;
}

.unavailable-board-stage strong,
.unavailable-board-stage span {
  width: min(100%, var(--venue-display-contract-copy-max-inline));
  margin-inline: var(--venue-display-contract-copy-margin-inline);
}

.unavailable-board-stage strong {
  color: var(--text-2);
  font-size: var(--fs-sm);
}

.unavailable-board-stage span {
  font-size: var(--fs-xs);
}

.board-state-overlay {
  position: absolute;
  right: var(--venue-display-state-overlay-pad);
  bottom: var(--venue-display-state-overlay-pad);
  left: var(--venue-display-state-overlay-pad);
  padding: var(--s-2) var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text-2);
  font-size: var(--fs-xs);
  font-weight: 700;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .venue-match,
  .board-state-overlay {
    transition: none;
  }
}
</style>
