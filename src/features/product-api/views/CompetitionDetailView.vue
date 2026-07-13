<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { apiErrorMessage } from '@/api/client'
import { tournamentRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import type { CompetitionPairing } from '@/api/productTypes'
import ResourceState from '@/features/product-api/components/ResourceState.vue'
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import {
  buildRootWorkspaceRouteFromHandoff,
  createWorkspaceHandoffContext,
  saveWorkspaceHandoffContext,
} from '@/persistence/workspace/workspaceHandoff'

const route = useRoute()
const router = useRouter()
const hdid = computed(() => routeText(route.params.hdid))
const selectedGroupId = ref(routeText(route.query.group))
const selectedRoundId = ref(routeText(route.query.round))
const pairingSearch = ref('')
const appliedPairingSearch = ref('')

const detailQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitionDetail(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => tournamentRepository.detail(hdid.value, signal),
  enabled: computed(() => Boolean(hdid.value)),
})

const groupsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitionGroups(hdid.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) => tournamentRepository.groups(hdid.value, signal),
  enabled: computed(() => Boolean(hdid.value)),
})

const groups = computed(() => groupsQuery.data.value ?? [])
const selectedGroup = computed(
  () =>
    groups.value.find(
      (group) => group.ticketId === selectedGroupId.value || group.id === selectedGroupId.value
    ) ?? null
)

const roundsQuery = useQuery({
  queryKey: computed(() =>
    productQueryKeys.competitionRounds(hdid.value, selectedGroupId.value)
  ),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    tournamentRepository.rounds(hdid.value, selectedGroupId.value, signal),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value)),
})

const rounds = computed(() => roundsQuery.data.value ?? [])
const pairingsQuery = useQuery({
  queryKey: computed(() =>
    productQueryKeys.competitionPairings(
      hdid.value,
      selectedGroupId.value,
      selectedRoundId.value,
      appliedPairingSearch.value
    )
  ),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    tournamentRepository.pairings(
      {
        hdid: hdid.value,
        ticketid: selectedGroupId.value,
        roundId: selectedRoundId.value,
        name: appliedPairingSearch.value,
      },
      signal
    ),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value && selectedRoundId.value)),
})

const pairings = computed(() => pairingsQuery.data.value?.items ?? [])
const title = computed(() => detailQuery.data.value?.title || `赛事 ${hdid.value}`)
const detailStatus = computed(() => detailQuery.data.value?.status || '状态未返回')
const detailStartTime = computed(() => detailQuery.data.value?.startTime || '')
const loading = computed(
  () => detailQuery.isFetching.value || groupsQuery.isFetching.value || roundsQuery.isFetching.value
)
const pairingsPending = computed(() => pairingsQuery.isFetching.value)
const primaryErrorText = computed(
  () =>
    [detailQuery.error.value, groupsQuery.error.value, roundsQuery.error.value]
      .filter(Boolean)
      .map(apiErrorMessage)
      .at(0) ?? ''
)
const pairingErrorText = computed(() =>
  pairingsQuery.error.value ? apiErrorMessage(pairingsQuery.error.value) : ''
)

watch(
  groups,
  (items) => {
    if (items.some((group) => group.ticketId === selectedGroupId.value)) return
    selectedGroupId.value = items[0]?.ticketId ?? ''
  },
  { immediate: true }
)

watch(
  () => [routeText(route.query.group), routeText(route.query.round)] as const,
  ([groupId, roundId]) => {
    if (groupId && groupId !== selectedGroupId.value) selectedGroupId.value = groupId
    if (roundId && roundId !== selectedRoundId.value) selectedRoundId.value = roundId
  }
)

watch(
  [selectedGroupId, selectedRoundId],
  ([groupId, roundId]) => {
    if (
      routeText(route.query.group) === groupId &&
      routeText(route.query.round) === roundId
    ) {
      return
    }

    const query = { ...route.query }
    if (groupId) query.group = groupId
    else delete query.group
    if (roundId) query.round = roundId
    else delete query.round
    void router.replace({ query })
  },
  { flush: 'post' }
)

watch(
  rounds,
  (items) => {
    if (items.some((round) => round.id === selectedRoundId.value)) return
    selectedRoundId.value =
      items.find((round) => round.id === round.sourceCurrentRoundId)?.id ?? items[0]?.id ?? ''
  },
  { immediate: true }
)

function routeText(value: unknown): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

function refreshPairings(): void {
  if (pairingSearch.value !== appliedPairingSearch.value) {
    appliedPairingSearch.value = pairingSearch.value
    return
  }
  void pairingsQuery.refetch()
}

function retryCompetitionData(): void {
  void detailQuery.refetch()
  void groupsQuery.refetch()
  if (selectedGroupId.value) void roundsQuery.refetch()
}

function displayRoute() {
  return {
    name: 'competition-display',
    params: { hdid: hdid.value },
    query: {
      group: selectedGroupId.value,
      round: selectedRoundId.value,
    },
  }
}

async function openReplay(pairing: CompetitionPairing): Promise<void> {
  const handoffInput: Record<string, unknown> = {
    mode: 'replay',
    source: 'replay_only',
    readonly: true,
    competitionId: hdid.value,
    groupId: selectedGroupId.value,
    roundId: selectedRoundId.value,
    boardId: pairing.boardNo,
    gameId: pairing.id,
    matchId: pairing.id,
    returnRoute: route.fullPath,
    competitionTitle: title.value,
  }
  const groupName = selectedGroup.value?.name
  const roundLabel = rounds.value.find((round) => round.id === selectedRoundId.value)?.name

  if (groupName) handoffInput.groupName = groupName
  if (roundLabel) handoffInput.roundLabel = roundLabel

  const context = createWorkspaceHandoffContext(handoffInput)

  if (saveWorkspaceHandoffContext(context)) {
    await router.push(buildRootWorkspaceRouteFromHandoff(context))
  }
}
</script>

<template>
  <main class="product-route">
    <RouteHeader :title="title" subtitle="组别、轮次、对阵和已完成对局回放" />

    <section class="route-body" aria-labelledby="competition-detail-title">
      <div class="detail-toolbar">
        <div>
          <h2 id="competition-detail-title">{{ title }}</h2>
          <p>
            {{ detailStatus }}
            <span v-if="detailStartTime"> / {{ detailStartTime }}</span>
          </p>
        </div>
        <RouterLink :to="displayRoute()">大屏</RouterLink>
      </div>

      <ResourceState
        :pending="loading"
        :error-text="primaryErrorText"
        @retry="retryCompetitionData"
      />

      <section class="controls" aria-label="赛事筛选">
        <label>
          <span>组别</span>
          <select v-model="selectedGroupId">
            <option v-for="group in groups" :key="group.id" :value="group.ticketId">
              {{ group.name }}
            </option>
          </select>
        </label>
        <label>
          <span>轮次</span>
          <select v-model="selectedRoundId">
            <option v-for="round in rounds" :key="round.id" :value="round.id">
              {{ round.name }}
            </option>
          </select>
        </label>
        <label>
          <span>棋手</span>
          <input v-model.trim="pairingSearch" />
        </label>
        <button type="button" @click="refreshPairings">查询对阵</button>
      </section>

      <ResourceState
        :pending="pairingsPending"
        :error-text="pairingErrorText"
        :empty="!pairingsPending && pairings.length === 0"
        empty-text="没有返回对阵"
        @retry="refreshPairings"
      />

      <section v-if="pairings.length > 0" class="pairing-list" aria-label="对阵列表">
        <article v-for="pairing in pairings" :key="pairing.id" class="pairing-row">
          <div class="board-no">
            <strong>{{ pairing.boardNo || pairing.id }}</strong>
            <span>{{ pairing.status || '状态未返回' }}</span>
          </div>
          <div class="players">
            <strong>{{ pairing.whiteName }}</strong>
            <span>{{ pairing.whiteRating || '白方' }}</span>
          </div>
          <div class="result">{{ pairing.result || '未定' }}</div>
          <div class="players">
            <strong>{{ pairing.blackName }}</strong>
            <span>{{ pairing.blackRating || '黑方' }}</span>
          </div>
          <button type="button" @click="openReplay(pairing)">打开回放</button>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.product-route {
  display: flex;
  flex-direction: column;
  min-height: var(--workspace-viewport-h);
  background: var(--bg);
  color: var(--text);
}

.route-body {
  display: grid;
  gap: var(--s-4);
  min-height: 0;
  padding: var(--s-5);
  overflow: auto;
}

.detail-toolbar,
.controls,
.pairing-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.detail-toolbar {
  justify-content: space-between;
}

.detail-toolbar h2,
.detail-toolbar p {
  margin: 0;
}

.detail-toolbar h2 {
  font-size: var(--fs-lg);
}

.detail-toolbar p,
.controls span,
.players span,
.board-no span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.detail-toolbar a,
.controls button,
.pairing-row button,
.controls input,
.controls select {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
}

@media (pointer: coarse), (width <= 1024px) {
  .detail-toolbar a,
  .controls button,
  .pairing-row button,
  .controls input,
  .controls select {
    min-height: var(--board-touch-target-min);
  }
}

.detail-toolbar a,
.controls button,
.pairing-row button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
}

.controls {
  flex-wrap: wrap;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.controls label {
  display: grid;
  gap: var(--s-1);
}

.pairing-list {
  display: grid;
  gap: var(--s-2);
}

.pairing-row {
  display: grid;
  grid-template-columns: minmax(80px, 120px) minmax(0, 1fr) minmax(80px, 120px) minmax(0, 1fr) auto;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.board-no,
.players {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.result {
  place-self: center;
  color: var(--accent-strong);
  font-weight: 700;
}

@media (width <= 860px) {
  .pairing-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .result {
    justify-self: start;
  }
}
</style>
