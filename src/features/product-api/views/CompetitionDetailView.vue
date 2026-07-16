<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { tournamentRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import type { CompetitionPairing } from '@/api/productTypes'
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import ResourceState from '@/features/product-api/components/ResourceState.vue'
import { resourceError } from '@/features/product-api/domain/resourceError'
import {
  buildRootWorkspaceRouteFromHandoff,
  createWorkspaceHandoffContext,
  saveWorkspaceHandoffContext,
} from '@/persistence/workspace/workspaceHandoff'
import {
  ProductButton,
  ProductField,
  ProductRouteShell,
  ProductSelect,
  ProductSheet,
  ProductStateBanner,
} from '@/ui'
import type { ProductSelectOption } from '@/ui/ProductSelect.vue'

const PAGE_SIZE = 50

const route = useRoute()
const router = useRouter()

interface ParsedQueryState {
  group: string
  round: string
  pairingSearch: string
  page: number
  correction: string | null
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function parseRouteQuery(query: LocationQuery): ParsedQueryState {
  const state: ParsedQueryState = {
    group: '',
    round: '',
    pairingSearch: '',
    page: 1,
    correction: null,
  }

  if (typeof query.group === 'string') {
    const value = query.group.trim()
    if (/^[A-Za-z0-9_-]{1,128}$/u.test(value)) {
      state.group = value
    } else {
      state.correction = '组别选择已清除'
    }
  }

  if (typeof query.round === 'string') {
    const value = query.round.trim()
    if (/^[A-Za-z0-9_-]{1,128}$/u.test(value)) {
      state.round = value
    } else {
      state.correction = '轮次选择已清除'
    }
  }

  if (typeof query.pairing_search === 'string') {
    const value = query.pairing_search.trim()
    if (value.length <= 80 && !hasControlCharacter(value)) {
      state.pairingSearch = value
    } else {
      state.correction = '搜索条件已清除'
    }
  }

  if (typeof query.page === 'string') {
    const parsed = Number(query.page)
    if (Number.isInteger(parsed) && parsed >= 1) {
      state.page = parsed
    } else {
      state.correction = '页码已校正为第 1 页'
    }
  }

  return state
}

function buildQuery(state: Omit<ParsedQueryState, 'correction'>): LocationQuery {
  const query: Record<string, string> = {}
  if (state.group) query.group = state.group
  if (state.round) query.round = state.round
  if (state.pairingSearch) query.pairing_search = state.pairingSearch
  if (state.page !== 1) query.page = String(state.page)
  return query
}

const routeState = computed(() => parseRouteQuery(route.query))
const correctionNotice = ref<string | null>(null)

watch(
  () => routeState.value.correction,
  (correction) => {
    if (correction) {
      correctionNotice.value = correction
      void router.replace({ query: buildQuery(routeState.value) })
    }
  },
  { immediate: true }
)

function routeText(value: unknown): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

const hdid = computed(() => routeText(route.params.hdid))
const hdidValid = computed(() => /^[A-Za-z0-9_-]{1,128}$/u.test(hdid.value))

const detailQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitionDetail(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => tournamentRepository.detail(hdid.value, signal),
  enabled: computed(() => hdidValid.value),
})

const groupsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitionGroups(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => tournamentRepository.groups(hdid.value, signal),
  enabled: computed(() => hdidValid.value),
  placeholderData: keepPreviousData,
})

const groups = computed(() => groupsQuery.data.value ?? [])
const groupOptions = computed<ProductSelectOption[]>(() =>
  groups.value.map((group) => ({ label: group.name, value: group.id }))
)

const selectedGroupId = computed(() => {
  const urlGroup = routeState.value.group
  if (urlGroup && groups.value.some((g) => g.id === urlGroup || g.ticketId === urlGroup)) {
    return urlGroup
  }
  return groups.value[0]?.id ?? ''
})

watch(
  [() => routeState.value.group, groups],
  ([urlGroup, groupsData]) => {
    if (!urlGroup || !groupsData.length) return
    const exists = groupsData.some((g) => g.id === urlGroup || g.ticketId === urlGroup)
    if (!exists) {
      correctionNotice.value = '所选组别不存在，已使用默认组别'
      const query = { ...route.query }
      delete query.group
      delete query.round
      delete query.page
      void router.replace({ query })
    }
  }
)

const roundsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitionRounds(hdid.value, selectedGroupId.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => tournamentRepository.rounds(hdid.value, selectedGroupId.value, signal),
  enabled: computed(() => hdidValid.value && Boolean(selectedGroupId.value)),
  placeholderData: keepPreviousData,
})

const rounds = computed(() => roundsQuery.data.value ?? [])
const roundOptions = computed<ProductSelectOption[]>(() =>
  rounds.value.map((round) => ({ label: round.name, value: round.id }))
)

const selectedRoundId = computed(() => {
  const urlRound = routeState.value.round
  if (urlRound && rounds.value.some((r) => r.id === urlRound)) {
    return urlRound
  }
  const sourceCurrentRoundId = rounds.value[0]?.sourceCurrentRoundId ?? ''
  return rounds.value.find((r) => r.id === sourceCurrentRoundId)?.id ?? rounds.value[0]?.id ?? ''
})

watch(
  [() => routeState.value.round, rounds],
  ([urlRound, roundsData]) => {
    if (!urlRound || !roundsData.length) return
    if (!roundsData.some((r) => r.id === urlRound)) {
      correctionNotice.value = '所选轮次不存在，已使用默认轮次'
      const query = { ...route.query }
      delete query.round
      delete query.page
      void router.replace({ query })
    }
  }
)

const pageIndex = computed(() => routeState.value.page - 1)

const pairingsQuery = useQuery({
  queryKey: computed(() =>
    productQueryKeys.competitionPairings(
      hdid.value,
      selectedGroupId.value,
      selectedRoundId.value,
      routeState.value.pairingSearch,
      routeState.value.page
    )
  ),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    tournamentRepository.pairings(
      {
        hdid: hdid.value,
        ticketid: selectedGroupId.value,
        roundId: selectedRoundId.value,
        name: routeState.value.pairingSearch,
        start: pageIndex.value * PAGE_SIZE,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  enabled: computed(() => hdidValid.value && Boolean(selectedGroupId.value && selectedRoundId.value)),
  placeholderData: keepPreviousData,
})

const pairings = computed(() => pairingsQuery.data.value?.items ?? [])

const title = computed(() => detailQuery.data.value?.title || '赛事详情')
const eventStatus = computed(() => detailQuery.data.value?.status || '状态待确认')
const eventTime = computed(() => detailQuery.data.value?.startTime || '')
const eventOrganizer = computed(() => detailQuery.data.value?.organizer || '')
const eventAddress = computed(() => detailQuery.data.value?.address || '')
const eventDescription = computed(() => detailQuery.data.value?.description || '')

const selectedGroupName = computed(() => {
  const group = groups.value.find(
    (g) => g.id === selectedGroupId.value || g.ticketId === selectedGroupId.value
  )
  return group?.name ?? ''
})

const selectedRoundName = computed(() => {
  const round = rounds.value.find((r) => r.id === selectedRoundId.value)
  return round?.name ?? ''
})

const detailError = computed(() => resourceError(detailQuery.error.value))
const groupsError = computed(() => resourceError(groupsQuery.error.value))
const roundsError = computed(() => resourceError(roundsQuery.error.value))
const pairingsError = computed(() => resourceError(pairingsQuery.error.value))

const detailLoading = computed(() => detailQuery.isPending.value && !detailQuery.data.value)
const groupsLoading = computed(() => groupsQuery.isPending.value && !groupsQuery.data.value)
const roundsLoading = computed(() => roundsQuery.isPending.value && !roundsQuery.data.value)
const pairingsLoading = computed(() => pairingsQuery.isPending.value && !pairingsQuery.data.value)
const pairingsRefreshing = computed(() => pairingsQuery.isFetching.value && !pairingsLoading.value)

const hasUsableGroup = computed(() => Boolean(selectedGroupId.value))
const hasUsableRound = computed(() => Boolean(selectedRoundId.value))

const searchDraft = reactive({ value: '' })

watch(
  () => routeState.value.pairingSearch,
  (value) => {
    searchDraft.value = value
  },
  { immediate: true }
)

const selectedPairingId = ref<string | null>(null)
const selectedPairing = computed(() => pairings.value.find((p) => p.id === selectedPairingId.value) ?? null)

const hierarchySheetOpen = ref(false)

function selectGroup(groupId: string | number | null): void {
  if (!groupId || groupId === selectedGroupId.value) return
  void router.push({
    query: buildQuery({
      group: String(groupId),
      round: '',
      pairingSearch: routeState.value.pairingSearch,
      page: 1,
    }),
  })
  selectedPairingId.value = null
}

function selectRound(roundId: string | number | null): void {
  if (!roundId || roundId === selectedRoundId.value) return
  void router.push({
    query: buildQuery({
      group: selectedGroupId.value,
      round: String(roundId),
      pairingSearch: routeState.value.pairingSearch,
      page: 1,
    }),
  })
  selectedPairingId.value = null
}

function submitSearch(): void {
  const value = searchDraft.value.trim()
  if (value.length > 80 || hasControlCharacter(value)) {
    correctionNotice.value = '搜索条件已清除'
    searchDraft.value = ''
  }
  void router.push({
    query: buildQuery({
      group: selectedGroupId.value,
      round: selectedRoundId.value,
      pairingSearch: value,
      page: 1,
    }),
  })
  selectedPairingId.value = null
}

function clearSearch(): void {
  searchDraft.value = ''
  void router.push({
    query: buildQuery({
      group: selectedGroupId.value,
      round: selectedRoundId.value,
      pairingSearch: '',
      page: 1,
    }),
  })
}

function selectPairing(pairing: CompetitionPairing): void {
  selectedPairingId.value = pairing.id
}

function displayRoute(): { name: string; params: Record<string, string>; query: LocationQuery } {
  return {
    name: 'competition-display',
    params: { hdid: hdid.value },
    query: buildQuery({
      group: selectedGroupId.value,
      round: selectedRoundId.value,
      pairingSearch: '',
      page: 1,
    }),
  }
}

async function enterCommentary(): Promise<void> {
  const input: Record<string, unknown> = {
    mode: 'competition_commentary',
    source: 'competition_pairing',
    readonly: true,
    competitionId: hdid.value,
    groupId: selectedGroupId.value,
    roundId: selectedRoundId.value,
    returnRoute: route.fullPath,
    competitionTitle: title.value,
    groupName: selectedGroupName.value,
    roundLabel: selectedRoundName.value,
  }
  if (selectedPairing.value) {
    input.boardId = selectedPairing.value.boardNo || selectedPairing.value.id
    input.gameId = selectedPairing.value.id
  }
  const context = createWorkspaceHandoffContext(input)
  if (saveWorkspaceHandoffContext(context)) {
    await router.push(buildRootWorkspaceRouteFromHandoff(context))
  }
}

function pairingLifecycle(
  pairing: CompetitionPairing
): 'not-started' | 'ongoing' | 'finished' | 'unknown' {
  if (pairing.status === '已结束') return 'finished'
  if (pairing.status === '进行中') return 'ongoing'
  if (pairing.status === '未开始') return 'not-started'
  return 'unknown'
}

function blockedActionText(pairing: CompetitionPairing): string {
  const lifecycle = pairingLifecycle(pairing)
  if (lifecycle === 'finished') return '回放暂不可用'
  if (lifecycle === 'ongoing') return '实时暂不可用'
  return ''
}

function pairingSummary(pairing: CompetitionPairing): string {
  const parts: string[] = []
  parts.push(`第 ${pairing.boardNo || pairing.id} 台`)
  parts.push(pairing.whiteName)
  if (pairing.whiteRating) parts.push(`(${pairing.whiteRating})`)
  parts.push('vs')
  parts.push(pairing.blackName)
  if (pairing.blackRating) parts.push(`(${pairing.blackRating})`)
  parts.push(pairing.result || pairing.status || '状态待确认')
  return parts.join(' ')
}

function retryRegion(region: 'detail' | 'groups' | 'rounds' | 'pairings'): void {
  if (region === 'detail') void detailQuery.refetch()
  if (region === 'groups') void groupsQuery.refetch()
  if (region === 'rounds') void roundsQuery.refetch()
  if (region === 'pairings') void pairingsQuery.refetch()
}
</script>

<template>
  <ProductRouteShell :title="title" subtitle="选择组别、轮次和对阵，进入讲解或场外大屏">
    <template #header="{ titleId, registerTitle }">
      <RouteHeader
        :title="title"
        :title-id="titleId"
        subtitle="选择组别、轮次和对阵，进入讲解或场外大屏"
        :register-title="registerTitle"
      />
    </template>

    <section class="detail-content" aria-labelledby="competition-detail-title">
      <h2 id="competition-detail-title" class="visually-hidden">{{ title }}</h2>

      <section class="event-summary" aria-label="赛事摘要">
        <div class="summary-primary">
          <h3>{{ title }}</h3>
          <p>
            {{ eventStatus }}
            <span v-if="eventTime"> / {{ eventTime }}</span>
          </p>
        </div>
        <div class="summary-secondary">
          <p v-if="eventOrganizer">组织方：{{ eventOrganizer }}</p>
          <p v-if="eventAddress">地址：{{ eventAddress }}</p>
          <p v-if="eventDescription" class="description">{{ eventDescription }}</p>
        </div>
      </section>

      <div class="primary-actions">
        <RouterLink class="action-link" :to="{ name: 'competitions' }">返回赛事</RouterLink>
        <RouterLink class="action-link" :to="displayRoute()">场外大屏</RouterLink>
        <ProductButton
          variant="primary"
          :disabled="!hasUsableGroup || !hasUsableRound"
          @click="enterCommentary"
        >
          进入讲解
        </ProductButton>
      </div>

      <ProductStateBanner
        v-if="correctionNotice"
        status="warning"
        title="选择已校正"
        :show-icon="true"
      >
        {{ correctionNotice }}
      </ProductStateBanner>

      <section class="controls desktop-controls" aria-label="赛事选择">
        <ProductSelect
          :model-value="selectedGroupId"
          label="组别"
          :options="groupOptions"
          :disabled="groupsLoading || Boolean(groupsError)"
          @update:model-value="selectGroup"
        />
        <ProductSelect
          :model-value="selectedRoundId"
          label="轮次"
          :options="roundOptions"
          :disabled="!hasUsableGroup || roundsLoading || Boolean(roundsError)"
          @update:model-value="selectRound"
        />
        <ProductField
          v-model="searchDraft.value"
          label="对阵搜索"
          placeholder="棋手姓名"
          enterkeyhint="search"
          @keydown.enter.prevent="submitSearch"
        />
        <ProductButton variant="primary" @click="submitSearch">查询对阵</ProductButton>
      </section>

      <section class="mobile-summary" aria-label="当前选择">
        <p>
          当前：{{ selectedGroupName || '未选择组别' }} / {{ selectedRoundName || '未选择轮次' }}
        </p>
        <ProductButton variant="secondary" @click="hierarchySheetOpen = true">
          选择组别与轮次
        </ProductButton>
      </section>

      <ProductSheet v-model:show="hierarchySheetOpen" title="选择组别与轮次" :closable="true">
        <div class="sheet-fields">
          <ProductSelect
            :model-value="selectedGroupId"
            label="组别"
            :options="groupOptions"
            :disabled="groupsLoading || Boolean(groupsError)"
            @update:model-value="selectGroup"
          />
          <ProductSelect
            :model-value="selectedRoundId"
            label="轮次"
            :options="roundOptions"
            :disabled="!hasUsableGroup || roundsLoading || Boolean(roundsError)"
            @update:model-value="selectRound"
          />
        </div>
        <div class="sheet-actions">
          <ProductButton variant="primary" @click="hierarchySheetOpen = false"
            >应用选择</ProductButton
          >
        </div>
      </ProductSheet>

      <div class="regional-states">
        <ResourceState v-if="detailLoading" pending loading-text="正在加载赛事详情" />
        <ResourceState
          v-else-if="detailError"
          :error-text="detailError.text"
          :error-kind="detailError.kind"
          :retryable="detailError.retryable"
          @retry="retryRegion('detail')"
        />
        <ResourceState v-if="groupsLoading" pending loading-text="正在加载组别" />
        <ResourceState
          v-else-if="groupsError"
          :error-text="groupsError.text"
          :error-kind="groupsError.kind"
          :retryable="groupsError.retryable"
          @retry="retryRegion('groups')"
        />
        <ResourceState v-if="roundsLoading" pending loading-text="正在加载轮次" />
        <ResourceState
          v-else-if="roundsError"
          :error-text="roundsError.text"
          :error-kind="roundsError.kind"
          :retryable="roundsError.retryable"
          @retry="retryRegion('rounds')"
        />
      </div>

      <section class="pairing-region" aria-labelledby="pairing-region-title">
        <div class="pairing-region-header">
          <h3 id="pairing-region-title">对阵列表</h3>
          <span v-if="pairingsRefreshing" class="refresh-indicator" aria-live="polite">
            更新中…
          </span>
        </div>

        <ResourceState v-if="pairingsLoading" pending loading-text="正在加载对阵" />
        <ResourceState
          v-else-if="pairingsError"
          :error-text="pairingsError.text"
          :error-kind="pairingsError.kind"
          :retryable="pairingsError.retryable"
          @retry="retryRegion('pairings')"
        />
        <template v-else-if="pairings.length === 0">
          <ResourceState v-if="!routeState.pairingSearch" empty empty-text="当前轮次暂无对阵" />
          <div v-else class="empty-search">
            <ResourceState empty empty-text="当前搜索条件下暂无对阵" />
            <ProductButton variant="secondary" @click="clearSearch">清除搜索</ProductButton>
          </div>
        </template>

        <template v-if="pairings.length > 0">
          <table class="desktop-table">
            <thead>
              <tr>
                <th scope="col">台次</th>
                <th scope="col">白方</th>
                <th scope="col">结果</th>
                <th scope="col">黑方</th>
                <th scope="col">状态</th>
                <th scope="col">选择</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pairing in pairings"
                :key="pairing.id"
                :class="{ selected: selectedPairingId === pairing.id }"
              >
                <td>{{ pairing.boardNo || pairing.id }}</td>
                <td>
                  <strong>{{ pairing.whiteName }}</strong>
                  <span v-if="pairing.whiteRating">{{ pairing.whiteRating }}</span>
                </td>
                <td>{{ pairing.result || pairing.status || '状态待确认' }}</td>
                <td>
                  <strong>{{ pairing.blackName }}</strong>
                  <span v-if="pairing.blackRating">{{ pairing.blackRating }}</span>
                </td>
                <td>{{ pairing.status || '状态待确认' }}</td>
                <td>
                  <ProductButton
                    size="small"
                    :variant="selectedPairingId === pairing.id ? 'primary' : 'secondary'"
                    :aria-pressed="selectedPairingId === pairing.id"
                    @click="selectPairing(pairing)"
                  >
                    {{ selectedPairingId === pairing.id ? '已选择' : '选择' }}
                  </ProductButton>
                </td>
              </tr>
            </tbody>
          </table>

          <ul class="narrow-list">
            <li
              v-for="pairing in pairings"
              :key="pairing.id"
              :class="{ selected: selectedPairingId === pairing.id }"
            >
              <div class="narrow-card">
                <div class="narrow-card-header">
                  <strong>第 {{ pairing.boardNo || pairing.id }} 台</strong>
                  <span>{{ pairing.status || '状态待确认' }}</span>
                </div>
                <div class="narrow-card-row">
                  <span class="narrow-label">白方</span>
                  <strong>{{ pairing.whiteName }}</strong>
                  <span v-if="pairing.whiteRating">{{ pairing.whiteRating }}</span>
                </div>
                <div class="narrow-card-row">
                  <span class="narrow-label">黑方</span>
                  <strong>{{ pairing.blackName }}</strong>
                  <span v-if="pairing.blackRating">{{ pairing.blackRating }}</span>
                </div>
                <div class="narrow-card-result">
                  结果：{{ pairing.result || pairing.status || '状态待确认' }}
                </div>
                <ProductButton
                  size="small"
                  :variant="selectedPairingId === pairing.id ? 'primary' : 'secondary'"
                  :aria-pressed="selectedPairingId === pairing.id"
                  @click="selectPairing(pairing)"
                >
                  {{ selectedPairingId === pairing.id ? '已选择' : '选择第 ' + (pairing.boardNo || pairing.id) + ' 台' }}
                </ProductButton>
              </div>
            </li>
          </ul>
        </template>
      </section>

      <section v-if="selectedPairing" class="selected-summary" aria-label="已选对阵">
        <p>{{ pairingSummary(selectedPairing) }}</p>
        <p v-if="blockedActionText(selectedPairing)" class="blocked-notice">
          {{ blockedActionText(selectedPairing) }}
        </p>
      </section>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  height: 100%;
  min-height: 0;
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

.event-summary,
.primary-actions,
.controls,
.mobile-summary,
.regional-states,
.selected-summary {
  flex: 0 0 auto;
}

.event-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.summary-primary h3 {
  margin: 0;
  font-size: var(--fs-lg);
}

.summary-primary p,
.summary-secondary p {
  margin: var(--s-1) 0 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.summary-secondary {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.description {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
}

.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: end;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.controls > :not(.date-fields) {
  flex: 1 1 12rem;
  min-width: 0;
}

.mobile-summary {
  display: none;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.mobile-summary p {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.sheet-fields {
  display: grid;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}

.sheet-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
}

.regional-states {
  display: grid;
  gap: var(--s-2);
}

.pairing-region {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.pairing-region-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
}

.pairing-region-header h3 {
  margin: 0;
  font-size: var(--fs-md);
}

.refresh-indicator {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.desktop-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

.desktop-table th,
.desktop-table td {
  padding: var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  text-align: left;
  vertical-align: top;
}

.desktop-table tbody tr.selected {
  background: var(--accent-bg);
}

.narrow-card-header span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.desktop-table td:nth-child(2),
.desktop-table td:nth-child(4) {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.desktop-table td:nth-child(2) span,
.desktop-table td:nth-child(4) span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.narrow-list {
  display: none;
  margin: 0;
  padding: 0;
  list-style: none;
}

.narrow-list li {
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.narrow-list li.selected {
  background: var(--accent-bg);
}

.narrow-card {
  display: grid;
  gap: var(--s-2);
}

.narrow-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
}

.narrow-card-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2);
}

.narrow-label {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.narrow-card-result {
  color: var(--accent-strong);
  font-weight: 700;
}

.selected-summary {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.selected-summary p {
  margin: 0;
}

.blocked-notice {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.empty-search {
  display: grid;
  gap: var(--s-3);
  justify-items: start;
}

@media (pointer: coarse), (width <= 1024px) {
  .action-link {
    min-height: var(--board-touch-target-min);
  }
}

@media (width <= 900px) {
  .event-summary {
    grid-template-columns: 1fr;
  }

  .desktop-controls {
    display: none;
  }

  .mobile-summary {
    display: flex;
  }

  .desktop-table {
    display: none;
  }

  .narrow-list {
    display: grid;
    gap: var(--s-2);
  }
}
</style>
