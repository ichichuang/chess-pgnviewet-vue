<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { competitionDisplayRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import { useFlipGridMotion } from '@/features/motion/useFlipGridMotion'
import { useRouteEntryMotion } from '@/features/motion/useRouteEntryMotion'
import {
  resolveDisplayRound,
  type DisplayRoundResolution,
  type DisplayRoundSelectionSource,
} from '@/features/product-api/domain/competitionRoundPolicy'
import { resourceError } from '@/features/product-api/domain/resourceError'
import { ProductButton, ProductSelect, ProductStateBanner } from '@/ui'

import ResourceState from '../components/ResourceState.vue'
import VenueDisplayMatch from '../components/VenueDisplayMatch.vue'
import VenueDisplayShell from '../components/VenueDisplayShell.vue'
import { useVenueDisplayLayout } from '../composables/useVenueDisplayLayout.ts'

const route = useRoute()
const router = useRouter()
const hdid = computed(() => routeText(route.params.hdid))
const routeRootEl = ref<HTMLElement | null>(null)
const stageFocusRef = ref<HTMLElement | null>(null)
const displayGridRef = ref<HTMLElement | null>(null)
const playerHeaderProbeRef = ref<HTMLElement | null>(null)

useRouteEntryMotion(routeRootEl)

const detailQuery = useQuery({
  queryKey: computed(() => productQueryKeys.displayDetail(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => competitionDisplayRepository.detail(hdid.value, signal),
  enabled: computed(() => Boolean(hdid.value)),
})

const groupsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.displayGroups(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => competitionDisplayRepository.groups(hdid.value, signal),
  enabled: computed(() => Boolean(hdid.value)),
})

const groups = computed(() => groupsQuery.data.value ?? [])
const groupOptions = computed(() =>
  groups.value.map((group) => ({ label: group.name, value: group.ticketId }))
)
const explicitGroupId = computed(() => routeText(route.query.group))
const selectedGroupId = computed(() => {
  const explicitGroup = groups.value.find(
    (group) => group.id === explicitGroupId.value || group.ticketId === explicitGroupId.value
  )
  return explicitGroup?.ticketId ?? groups.value[0]?.ticketId ?? ''
})

const roundsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.displayRounds(hdid.value, selectedGroupId.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    competitionDisplayRepository.rounds(hdid.value, selectedGroupId.value, signal),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value)),
})

const rounds = computed(() =>
  (roundsQuery.data.value ?? []).filter((round) => round.groupId === selectedGroupId.value)
)
const roundOptions = computed(() =>
  rounds.value.map((round) => ({ label: round.name, value: round.id }))
)
const explicitRoundId = computed(() => routeText(route.query.round))
const roundResolution = computed<DisplayRoundResolution>(() =>
  resolveDisplayRound(rounds.value, explicitRoundId.value)
)
const selectedRound = computed(() =>
  roundResolution.value.kind === 'selected' ? roundResolution.value.round : undefined
)
const selectedRoundId = computed(() => selectedRound.value?.id ?? '')
const selectedRoundName = computed(() => selectedRound.value?.name ?? '')
const hasExplicitRoundOverride = computed(
  () => roundResolution.value.kind === 'selected' && roundResolution.value.source === 'explicit'
)

const pairingsQuery = useQuery({
  queryKey: computed(() =>
    productQueryKeys.displayPairings(hdid.value, selectedGroupId.value, selectedRoundId.value)
  ),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    competitionDisplayRepository.pairings(
      {
        hdid: hdid.value,
        ticketid: selectedGroupId.value,
        roundId: selectedRoundId.value,
        pageSize: 100,
      },
      signal
    ),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value && selectedRoundId.value)),
  refetchInterval: (query) => {
    const error = resourceError(query.state.error)
    return error && !error.retryable ? false : 30_000
  },
})

const rawPairings = computed(() => pairingsQuery.data.value?.items ?? [])
const pairingCount = computed(() => rawPairings.value.length)
const { columns, rows, boardSize, tileWidth, tileHeight, style: layoutStyle } =
  useVenueDisplayLayout(displayGridRef, playerHeaderProbeRef, pairingCount)

// Flip observes committed layouts only: it runs when the ordered tile identity
// set changes (not on every 30s poll with identical keys). Source order, equal
// geometry, and board size stay owned by Vue and useVenueDisplayLayout.
const displayTileOrder = computed(() => rawPairings.value.map((pairing) => pairing.id).join('|'))
useFlipGridMotion(displayGridRef, '.venue-match', displayTileOrder)

const title = computed(() => detailQuery.data.value?.title || `赛事 ${hdid.value}`)
const hasContextData = computed(
  () => Boolean(detailQuery.data.value || groups.value.length || rounds.value.length)
)
const isInitialPending = computed(
  () =>
    detailQuery.isLoading.value ||
    groupsQuery.isLoading.value ||
    (Boolean(selectedGroupId.value) && roundsQuery.isLoading.value) ||
    (Boolean(selectedRoundId.value) &&
      pairingsQuery.isLoading.value &&
      rawPairings.value.length === 0)
)
const isRetainedFetching = computed(
  () =>
    detailQuery.isFetching.value ||
    groupsQuery.isFetching.value ||
    roundsQuery.isFetching.value ||
    pairingsQuery.isFetching.value
)
const errorState = computed(() =>
  resourceError(
    detailQuery.error.value ??
      groupsQuery.error.value ??
      roundsQuery.error.value ??
      pairingsQuery.error.value
  )
)
const hasPartialFailure = computed(
  () => Boolean(errorState.value) && rawPairings.value.length > 0
)
const roundUnavailableText = computed(() => {
  if (roundResolution.value.kind === 'selected') return ''

  switch (roundResolution.value.reason) {
    case 'no-rounds':
      return '当前没有可展示的轮次'
    case 'no-completed-round':
      return '最新轮次尚未开始，且没有可用的已完成轮次'
    case 'lifecycle-unknown':
      return '轮次生命周期尚未确认，且没有可用的已完成轮次'
  }
})
const roundSelectionText = computed(() => {
  if (roundResolution.value.kind !== 'selected') return roundUnavailableText.value
  return selectionSourceText(roundResolution.value.source)
})

const updatedAtText = computed(() => {
  const timestamp = pairingsQuery.dataUpdatedAt.value
  if (!timestamp) return '尚未更新'
  return new Date(timestamp).toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

watch(
  [
    groups,
    rounds,
    selectedGroupId,
    () => groupsQuery.isSuccess.value,
    () => roundsQuery.isSuccess.value,
    () => route.query.group,
    () => route.query.round,
    () => route.query.page,
    () => route.query.focus,
  ],
  async () => {
    if (!selectedGroupId.value || !groupsQuery.isSuccess.value) return

    const query = buildQuery()
    let changed = false

    if (explicitGroupId.value !== selectedGroupId.value) {
      query.group = selectedGroupId.value
      changed = true
    }

    if (
      explicitRoundId.value &&
      roundsQuery.isSuccess.value &&
      !rounds.value.some((round) => round.id === explicitRoundId.value)
    ) {
      query.round = undefined
      changed = true
    }

    if (route.query.page !== undefined) {
      query.page = undefined
      changed = true
    }

    if (route.query.focus !== undefined) {
      query.focus = undefined
      changed = true
    }

    if (changed) await router.replace({ query })
  },
  { immediate: true }
)

function routeText(value: unknown): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

function buildQuery(): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(route.query)) {
    const text = routeText(value)
    if (text) result[key] = text
  }
  return result
}

function selectionSourceText(source: DisplayRoundSelectionSource): string {
  switch (source) {
    case 'explicit':
      return '显式轮次覆盖'
    case 'automatic-last-ongoing':
      return '自动选择：最后一轮正在进行'
    case 'automatic-last-completed':
      return '自动选择：最后一轮已完成'
    case 'automatic-previous-completed':
      return '自动选择：最后一轮未开始，显示前一已完成轮次'
    case 'automatic-latest-confirmed-completed':
      return '自动选择：末轮状态未知，显示最新确认已完成轮次'
  }
}

async function selectGroup(groupId: string | number | null): Promise<void> {
  if (!groupId || String(groupId) === selectedGroupId.value) return
  const query = buildQuery()
  query.group = String(groupId)
  query.round = undefined
  query.page = undefined
  query.focus = undefined
  await router.push({ query })
  await focusRoundResult()
}

async function selectRound(roundId: string | number | null): Promise<void> {
  if (!roundId || String(roundId) === explicitRoundId.value) return
  const query = buildQuery()
  query.group = selectedGroupId.value
  query.round = String(roundId)
  query.page = undefined
  query.focus = undefined
  await router.push({ query })
  await focusRoundResult()
}

async function restoreAutomaticRound(): Promise<void> {
  if (!explicitRoundId.value) return
  const query = buildQuery()
  query.round = undefined
  await router.push({ query })
  await focusRoundResult()
}

async function focusRoundResult(): Promise<void> {
  await nextTick()
  stageFocusRef.value?.focus()
}

function retryCurrentContext(): void {
  if (detailQuery.error.value) void detailQuery.refetch()
  if (groupsQuery.error.value) void groupsQuery.refetch()
  if (roundsQuery.error.value) void roundsQuery.refetch()
  if (pairingsQuery.error.value) void pairingsQuery.refetch()
}

const backToDetail = computed<RouteLocationRaw>(() => ({
  name: 'competition-detail',
  params: { hdid: hdid.value },
  query: {
    group: selectedGroupId.value || undefined,
    round: hasExplicitRoundOverride.value ? selectedRoundId.value : undefined,
  },
}))
</script>

<template>
  <VenueDisplayShell
    :ref="(el) => { routeRootEl = (el as any)?.$el ?? null }"
    :title="`${title} 大屏`"
    subtitle="公开对阵数据只读展示"
  >
    <template #header-actions>
      <ProductButton variant="secondary" size="small" @click="$router.push(backToDetail)">
        返回赛事详情
      </ProductButton>
    </template>

    <template #controls>
      <div class="display-control-group">
        <ProductSelect
          :model-value="selectedGroupId"
          label="组别"
          placeholder="选择组别"
          :options="groupOptions"
          :disabled="groupsQuery.isLoading.value"
          @update:model-value="selectGroup"
        />
        <ProductSelect
          :model-value="selectedRoundId"
          label="轮次"
          placeholder="自动选择轮次"
          :options="roundOptions"
          :disabled="roundsQuery.isLoading.value || roundOptions.length === 0"
          @update:model-value="selectRound"
        />
      </div>

      <div class="round-selection-mode">
        <span>{{ roundSelectionText }}</span>
        <ProductButton
          v-if="hasExplicitRoundOverride"
          variant="ghost"
          size="small"
          @click="restoreAutomaticRound"
        >
          恢复自动选择
        </ProductButton>
      </div>
    </template>

    <div
      ref="stageFocusRef"
      class="stage-measure"
      tabindex="-1"
      :aria-label="selectedRoundName ? `${selectedRoundName}全部对阵` : '赛事对阵结果'"
    >
      <ResourceState
        v-if="
          isInitialPending ||
          (errorState && rawPairings.length === 0) ||
          (!isInitialPending && roundResolution.kind === 'unavailable') ||
          (!isInitialPending &&
            roundResolution.kind === 'selected' &&
            rawPairings.length === 0 &&
            !isRetainedFetching)
        "
        :pending="isInitialPending"
        :error-text="errorState?.text ?? ''"
        :error-kind="errorState?.kind ?? 'error'"
        :retryable="errorState?.retryable ?? false"
        :empty="!isInitialPending && !errorState && rawPairings.length === 0"
        :empty-text="roundUnavailableText || '当前轮次没有可显示的赛事对阵'"
        loading-text="正在获取赛事展示"
        @retry="retryCurrentContext"
      />

      <template v-else>
        <ProductStateBanner v-if="hasPartialFailure" status="warning" title="部分内容未完成">
          已验证的 {{ rawPairings.length }} 台保持同屏；本次刷新失败，当前内容仍可查看。
        </ProductStateBanner>

        <div
          ref="displayGridRef"
          class="display-grid"
          :style="layoutStyle"
          :data-pairing-count="rawPairings.length"
          :data-layout-columns="columns"
          :data-layout-rows="rows"
          :data-board-size="boardSize.toFixed(2)"
          :data-tile-width="tileWidth.toFixed(2)"
          :data-tile-height="tileHeight.toFixed(2)"
        >
          <div ref="playerHeaderProbeRef" class="player-header-probe" aria-hidden="true" />
          <VenueDisplayMatch
            v-for="(pairing, sourceIndex) in rawPairings"
            :key="pairing.id"
            :pairing="pairing"
            :data-source-index="sourceIndex"
          />
        </div>
      </template>
    </div>

    <template #status>
      <span class="status-left">
        <template v-if="rawPairings.length">
          {{ rawPairings.length }} 台全部同屏 · {{ columns }} 列 × {{ rows }} 行
        </template>
        <template v-else>0 台</template>
        <template v-if="isRetainedFetching && hasContextData">· 正在更新</template>
      </span>
      <span class="status-right">
        <span v-if="hasPartialFailure" class="status-warning">部分内容未完成</span>
        <span>{{ roundSelectionText }}</span>
        <span>权威实时/最终局面合同尚未提供</span>
        <span>最后更新 {{ updatedAtText }}</span>
      </span>
    </template>
  </VenueDisplayShell>
</template>

<style scoped>
.stage-measure {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.stage-measure:focus {
  outline: none;
  border-radius: var(--r-sm);
  box-shadow: var(--state-focus-ring);
}

.display-control-group {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-3);
  min-width: 0;
}

.round-selection-mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--s-2);
  min-width: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.display-grid {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: repeat(var(--venue-display-grid-columns), minmax(0, 1fr));
  grid-template-rows: repeat(var(--venue-display-grid-rows), minmax(0, 1fr));
  gap: var(--venue-display-grid-gap);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.player-header-probe {
  position: absolute;
  width: 0;
  height: var(--venue-display-player-header-h);
  visibility: hidden;
  pointer-events: none;
}

.status-left,
.status-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
}

.status-right {
  justify-content: flex-end;
}

.status-warning {
  color: var(--warning);
  font-weight: 600;
}

@media (width <= 560px) {
  .round-selection-mode,
  .status-right {
    justify-content: flex-start;
  }
}
</style>
