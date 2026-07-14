<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { competitionDisplayRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import ResourceState from '@/features/product-api/components/ResourceState.vue'
import { resourceError } from '@/features/product-api/domain/resourceError'
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'

const route = useRoute()
const router = useRouter()
const hdid = computed(() => routeText(route.params.hdid))
const selectedGroupId = ref(routeText(route.query.group))
const selectedRoundId = ref(routeText(route.query.round))

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
const roundsQuery = useQuery({
  queryKey: computed(() => productQueryKeys.displayRounds(hdid.value, selectedGroupId.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    competitionDisplayRepository.rounds(hdid.value, selectedGroupId.value, signal),
  enabled: computed(() => Boolean(hdid.value && selectedGroupId.value)),
})
const rounds = computed(() => roundsQuery.data.value ?? [])

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

const pairings = computed(() => pairingsQuery.data.value?.items ?? [])
const title = computed(() => detailQuery.data.value?.title || `赛事 ${hdid.value}`)
const pairingsPending = computed(
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
</script>

<template>
  <main class="display-route">
    <RouteHeader :title="`${title} 大屏`" subtitle="生产对阵数据只读展示" />

    <section class="display-body" aria-label="大屏对阵">
      <ResourceState
        :pending="pairingsPending"
        :error-text="errorState?.text ?? ''"
        :error-kind="errorState?.kind ?? 'error'"
        :retryable="errorState?.retryable ?? false"
        :empty="!pairingsPending && pairings.length === 0"
        empty-text="没有返回大屏对阵"
        @retry="pairingsQuery.refetch()"
      />

      <div v-if="pairings.length > 0" class="display-grid">
        <article v-for="pairing in pairings" :key="pairing.id" class="display-row">
          <strong>{{ pairing.boardNo || pairing.id }}</strong>
          <span>{{ pairing.whiteName }}</span>
          <b>{{ pairing.result || pairing.status || '未定' }}</b>
          <span>{{ pairing.blackName }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.display-route {
  display: flex;
  flex-direction: column;
  min-height: var(--workspace-viewport-h);
  background: var(--bg);
  color: var(--text);
}

.display-body {
  display: grid;
  gap: var(--s-4);
  min-height: 0;
  padding: var(--s-5);
  overflow: auto;
}

.display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--s-3);
}

.display-row {
  display: grid;
  grid-template-columns: minmax(52px, auto) minmax(0, 1fr) minmax(76px, auto) minmax(0, 1fr);
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-4);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.display-row strong {
  color: var(--accent-strong);
  font-size: var(--fs-lg);
}

.display-row span {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: var(--fs-lg);
}

.display-row b {
  justify-self: center;
  color: var(--text);
  font-size: var(--fs-xl);
}

@media (width <= 620px) {
  .display-grid,
  .display-row {
    grid-template-columns: 1fr;
  }

  .display-row b {
    justify-self: start;
  }
}
</style>
