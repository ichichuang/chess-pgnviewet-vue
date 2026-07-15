<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { competitionDisplayRepository } from '@/api/productApi'
import type { CompetitionPairing } from '@/api/productTypes'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import { resourceError } from '@/features/product-api/domain/resourceError'
import {
  ProductButton,
  ProductPagination,
  ProductSelect,
  ProductStateBanner,
} from '@/ui'

import VenueDisplayShell from '../components/VenueDisplayShell.vue'
import ResourceState from '../components/ResourceState.vue'
import { useVenueDisplayLayout } from '../composables/useVenueDisplayLayout.ts'

const route = useRoute()
const router = useRouter()
const hdid = computed(() => routeText(route.params.hdid))

const stageRef = ref<HTMLElement | null>(null)
const { columns, pageSize } = useVenueDisplayLayout(stageRef)

const selectedGroupId = ref(routeText(route.query.group))
const selectedRoundId = ref(routeText(route.query.round))
const isPaused = ref(false)
const lastFocusedId = ref('')
const returnFocusRef = ref<HTMLElement | null>(null)

const pageFromQuery = computed(() => {
  const n = Number(route.query.page)
  return Number.isInteger(n) && n > 0 ? n : 1
})
const focusedPairingId = computed(() => routeText(route.query.focus))

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



const roundsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.displayRounds(hdid.value, selectedGroupId.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    competitionDisplayRepository.rounds(hdid.value, selectedGroupId.value, signal),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value)),
})

const rounds = computed(() => roundsQuery.data.value ?? [])
const roundOptions = computed(() =>
  rounds.value.map((round) => ({ label: round.name, value: round.id }))
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
const sortedPairings = computed(() => stableSortPairings(rawPairings.value))

const pageCount = computed(() => Math.max(1, Math.ceil(sortedPairings.value.length / pageSize.value)))
const safePage = computed(() => Math.min(pageFromQuery.value, pageCount.value))

const pagedPairings = computed(() => {
  const start = (safePage.value - 1) * pageSize.value
  return sortedPairings.value.slice(start, start + pageSize.value)
})

const focusedPairing = computed(() =>
  sortedPairings.value.find((p) => p.id === focusedPairingId.value)
)

const title = computed(() => detailQuery.data.value?.title || `赛事 ${hdid.value}`)
const hasData = computed(() => groups.value.length > 0)
const isInitialPending = computed(
  () =>
    (detailQuery.isLoading.value ||
      groupsQuery.isLoading.value ||
      roundsQuery.isLoading.value ||
      pairingsQuery.isLoading.value) &&
    !hasData.value
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

const updatedAtText = computed(() => {
  const ts = pairingsQuery.dataUpdatedAt.value
  if (!ts) return '尚未更新'
  return new Date(ts).toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

watch(
  groups,
  (items) => {
    if (selectedGroupId.value && items.some((group) => group.ticketId === selectedGroupId.value)) {
      return
    }
    selectedGroupId.value = items[0]?.ticketId ?? ''
  },
  { immediate: true }
)

watch(
  () => [routeText(route.query.group), routeText(route.query.round), pageFromQuery.value] as const,
  ([groupId, roundId, page]) => {
    if (groupId && groupId !== selectedGroupId.value) selectedGroupId.value = groupId
    if (roundId && roundId !== selectedRoundId.value) selectedRoundId.value = roundId
    if (page !== pageFromQuery.value) {
      // route already owns page; local ref not needed
    }
  }
)

watch(
  [selectedGroupId, selectedRoundId],
  ([groupId, roundId], [prevGroupId, prevRoundId]) => {
    const changed = groupId !== prevGroupId || roundId !== prevRoundId
    if (
      routeText(route.query.group) === groupId &&
      routeText(route.query.round) === roundId
    ) {
      return
    }

    const query = buildQuery()
    query.group = groupId || undefined
    query.round = roundId || undefined
    if (changed) {
      query.page = '1'
      query.focus = undefined
    }
    void router.replace({ query })
  },
  { flush: 'post' }
)

watch(
  rounds,
  (items) => {
    if (selectedRoundId.value && items.some((round) => round.id === selectedRoundId.value)) {
      return
    }
    // Display round default: explicit URL is already handled by watcher above.
    // Fallback order: source current round, latest round, first round.
    const sourceCurrentId = items[0]?.sourceCurrentRoundId
    const latestRound = items[items.length - 1]
    selectedRoundId.value =
      (sourceCurrentId && items.some((r) => r.id === sourceCurrentId)
        ? sourceCurrentId
        : latestRound?.id) ?? items[0]?.id ?? ''
  },
  { immediate: true }
)

watch(
  [safePage, focusedPairingId],
  ([page, focus]) => {
    const query = buildQuery()
    let changed = false
    if (Number(route.query.page) !== page) {
      query.page = String(page)
      changed = true
    }
    if (focus) {
      if (route.query.focus !== focus) {
        query.focus = focus
        changed = true
      }
    } else if (route.query.focus) {
      query.focus = undefined
      changed = true
    }
    if (changed) {
      void router.replace({ query })
    }
  },
  { flush: 'post' }
)

watch(focusedPairingId, async (id) => {
  if (id) {
    lastFocusedId.value = id
    await nextTick()
    returnFocusRef.value?.focus()
  }
})

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

function updatePage(page: number): void {
  const clamped = Math.max(1, Math.min(page, pageCount.value))
  if (clamped === pageFromQuery.value) return
  const query = buildQuery()
  query.page = String(clamped)
  void router.replace({ query })
}

function focusPairing(id: string): void {
  lastFocusedId.value = id
  const query = buildQuery()
  query.focus = id
  void router.replace({ query })
}

function exitFocus(): void {
  const id = lastFocusedId.value
  const query = buildQuery()
  query.focus = undefined
  void router.replace({ query }).then(async () => {
    await nextTick()
    const trigger = stageRef.value?.querySelector(`[data-focus-id="${id}"] button`)
    if (trigger instanceof HTMLElement) {
      trigger.focus()
    }
  })
}

function togglePause(): void {
  isPaused.value = !isPaused.value
}

function handleStageKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && focusedPairingId.value) {
    event.preventDefault()
    exitFocus()
    return
  }

  const target = event.target as HTMLElement | null
  const isTyping =
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.getAttribute('role') === 'combobox')

  if (isTyping) return

  if (event.key === 'PageDown') {
    event.preventDefault()
    updatePage(safePage.value + 1)
  } else if (event.key === 'PageUp') {
    event.preventDefault()
    updatePage(safePage.value - 1)
  }
}

function stableSortPairings(items: readonly CompetitionPairing[]): CompetitionPairing[] {
  const order = (status: string): number => {
    if (status === '进行中') return 0
    if (status === '已结束') return 1
    if (status === '未开始') return 2
    return 3
  }
  return [...items].sort((a, b) => {
    const byStatus = order(a.status) - order(b.status)
    if (byStatus !== 0) return byStatus
    return Number(a.boardNo) - Number(b.boardNo)
  })
}

const backToDetail = computed<RouteLocationRaw>(() => ({
  name: 'competition-detail',
  params: { hdid: hdid.value },
  query: {
    group: selectedGroupId.value || undefined,
    round: selectedRoundId.value || undefined,
  },
}))
</script>

<template>
  <VenueDisplayShell
    :title="`${title} 大屏`"
    subtitle="公开对阵数据只读展示"
    @keydown="handleStageKeydown"
  >
    <template #header-actions>
      <ProductButton variant="secondary" size="small" @click="$router.push(backToDetail)">
        返回赛事详情
      </ProductButton>
    </template>

    <template #controls>
      <div class="display-control-group">
        <ProductSelect
          v-model="selectedGroupId"
          label="组别"
          placeholder="选择组别"
          :options="groupOptions"
          :disabled="groupsQuery.isLoading.value"
        />
        <ProductSelect
          v-model="selectedRoundId"
          label="轮次"
          placeholder="选择轮次"
          :options="roundOptions"
          :disabled="roundsQuery.isLoading.value"
        />
      </div>

      <div class="display-control-group">
        <ProductButton
          variant="secondary"
          size="small"
          :title="isPaused ? '继续轮换' : '暂停轮换'"
          @click="togglePause"
        >
          {{ isPaused ? '继续轮换' : '暂停轮换' }}
        </ProductButton>
        <ProductPagination
          :page="safePage"
          :page-count="pageCount"
          :disabled="sortedPairings.length === 0"
          @update:page="updatePage"
        />
      </div>
    </template>

    <div ref="stageRef" class="stage-measure">
      <ResourceState
        v-if="isInitialPending || (errorState && rawPairings.length === 0) || (!isInitialPending && rawPairings.length === 0 && !isRetainedFetching)"
        :pending="isInitialPending"
        :error-text="errorState?.text ?? ''"
        :error-kind="errorState?.kind ?? 'error'"
        :retryable="errorState?.retryable ?? false"
        :empty="!isInitialPending && !errorState && rawPairings.length === 0"
        empty-text="当前条件下没有可显示的赛事对阵"
        loading-text="正在获取赛事展示"
        @retry="pairingsQuery.refetch()"
      />

      <template v-else-if="focusedPairing">
        <section class="focus-view" aria-label="单台聚焦">
          <div class="focus-context">
            <h2>第 {{ focusedPairing.boardNo }} 台</h2>
            <p>{{ focusedPairing.whiteName }} — {{ focusedPairing.blackName }}</p>
            <p class="focus-status">
              {{ focusedPairing.result || focusedPairing.status || '未定' }}
            </p>
          </div>

          <div class="focus-board-area" aria-label="实时棋盘暂不可用">
            <ProductStateBanner status="info" title="实时棋盘暂不可用">
              当前版本暂不支持此能力，当前不会发起请求，也不显示占位棋盘或棋钟。
            </ProductStateBanner>
          </div>

          <div class="focus-actions">
            <ProductButton ref="returnFocusRef" variant="primary" size="large" @click="exitFocus">
              返回总览
            </ProductButton>
          </div>
        </section>
      </template>

      <template v-else>
        <ProductStateBanner v-if="hasPartialFailure" status="warning" title="部分内容未完成">
          {{ rawPairings.length }} 项已可用，加载失败项可在网络恢复后重试。
        </ProductStateBanner>

        <div
          class="display-grid"
          :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
        >
          <article
            v-for="pairing in pagedPairings"
            :key="pairing.id"
            class="display-card"
            :aria-label="`第 ${pairing.boardNo} 台`"
          >
            <div class="display-card-header">
              <strong>第 {{ pairing.boardNo }} 台</strong>
              <span class="card-status">{{ pairing.status }}</span>
            </div>

            <div class="display-card-body">
              <div class="display-card-players">
                <div class="player-row">
                  <span class="player-color side-a" aria-hidden="true" />
                  <span class="player-name">{{ pairing.whiteName }}</span>
                </div>
                <div class="player-row">
                  <span class="player-color side-b" aria-hidden="true" />
                  <span class="player-name">{{ pairing.blackName }}</span>
                </div>
              </div>

              <div class="display-card-result">
                {{ pairing.result || '未定' }}
              </div>
            </div>

            <div class="display-card-actions" :data-focus-id="pairing.id">
              <ProductButton variant="ghost" size="small" @click="focusPairing(pairing.id)">
                聚焦第 {{ pairing.boardNo }} 台
              </ProductButton>
            </div>
          </article>
        </div>
      </template>
    </div>

    <template #status>
      <span class="status-left">
        第 {{ safePage }} 页，共 {{ pageCount }} 页 · {{ sortedPairings.length }} 台
        <template v-if="isPaused">· 已暂停轮换</template>
        <template v-if="isRetainedFetching && hasData">· 正在更新</template>
      </span>
      <span class="status-right">
        <span v-if="hasPartialFailure" class="status-warning">部分内容未完成</span>
        <span>实时棋盘暂不可用</span>
        <span>最后更新 {{ updatedAtText }}</span>
      </span>
    </template>
  </VenueDisplayShell>
</template>

<style scoped>
.stage-measure {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  width: 100%;
  height: 100%;
  min-height: 0;
}

.display-control-group {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-3);
  min-width: 0;
}

.focus-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-5);
  width: 100%;
  height: 100%;
  min-height: 0;
  text-align: center;
}

.focus-context h2 {
  margin: 0 0 var(--s-2);
  color: var(--text);
  font-size: var(--fs-2xl);
}

.focus-context p {
  margin: 0;
  color: var(--text-2);
  font-size: var(--fs-xl);
}

.focus-status {
  margin-top: var(--s-3);
  color: var(--accent-strong);
  font-size: var(--fs-2xl);
  font-weight: 700;
}

.focus-board-area {
  width: 100%;
  max-width: var(--workspace-panel-w);
}

.focus-actions {
  display: flex;
  gap: var(--s-3);
}

.display-grid {
  display: grid;
  gap: var(--s-3);
  width: 100%;
  min-height: 0;
}

.display-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  min-height: 0;
  padding: var(--s-4);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
}

.display-card-body {
  display: grid;
  gap: var(--s-3);
  min-width: 0;
}

.display-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  min-width: 0;
}

.display-card-header strong {
  color: var(--accent-strong);
  font-size: var(--fs-xl);
}

.card-status {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.display-card-players {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.player-row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.player-color {
  flex: 0 0 auto;
  width: var(--s-3);
  height: var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-full);
}

.player-color.side-a {
  background: var(--surface-2);
}

.player-color.side-b {
  background: var(--text);
}

.player-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--fs-lg);
}

.display-card-result {
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--fs-xl);
  font-weight: 700;
  text-align: center;
}

.display-card-actions {
  display: flex;
  justify-content: center;
}

.status-left {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.status-right {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
}

.status-warning {
  color: var(--warning);
  font-weight: 600;
}

@media (width <= 560px) {
  .focus-context h2 {
    font-size: var(--fs-xl);
  }

  .focus-context p {
    font-size: var(--fs-lg);
  }

  .focus-status {
    font-size: var(--fs-xl);
  }
}
</style>
