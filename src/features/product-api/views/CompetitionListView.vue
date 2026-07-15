<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { tournamentRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import ResourceState from '@/features/product-api/components/ResourceState.vue'
import { resourceError } from '@/features/product-api/domain/resourceError'
import {
  ProductButton,
  ProductField,
  ProductPagination,
  ProductRouteShell,
  ProductSelect,
} from '@/ui'
import type { ProductSelectOption } from '@/ui/ProductSelect.vue'

const now = new Date()
const pageSize = 20
const page = ref(0)
const search = ref('')
const actflag = ref('21')
const type = ref('')
const month = ref(String(now.getMonth() + 1))
const year = ref(String(now.getFullYear()))
const appliedFilters = ref({
  search: search.value,
  actflag: actflag.value,
  type: type.value,
  month: month.value,
  year: year.value,
})

const competitionQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitions(appliedFilters.value, page.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    tournamentRepository.list(
      {
        start: page.value * pageSize,
        max: pageSize,
        ...appliedFilters.value,
      },
      signal
    ),
})

const competitions = computed(() => competitionQuery.data.value?.items ?? [])
const total = computed(() => competitionQuery.data.value?.total ?? 0)
const listPending = computed(() => competitionQuery.isPending.value)
const pageCount = computed(() => Math.ceil(total.value / pageSize))
const pageOneBased = computed(() => page.value + 1)
const errorState = computed(() => resourceError(competitionQuery.error.value))

const statusOptions: ProductSelectOption[] = [
  { label: '报名中', value: '20' },
  { label: '比赛中', value: '21' },
  { label: '已结束', value: '22' },
  { label: '全部', value: '' },
]

const typeOptions: ProductSelectOption[] = [
  { label: '全部', value: '' },
  { label: '线下赛', value: '1' },
  { label: '免费赛', value: '4' },
  { label: '线上赛', value: '1024' },
]

function applyFilters(): void {
  const nextFilters = {
    search: search.value,
    actflag: actflag.value,
    type: type.value,
    month: month.value,
    year: year.value,
  }
  const changed = JSON.stringify(nextFilters) !== JSON.stringify(appliedFilters.value)
  const pageChanged = page.value !== 0
  page.value = 0
  appliedFilters.value = nextFilters
  if (!changed && !pageChanged) void competitionQuery.refetch()
}

function updatePage(next: number): void {
  page.value = next - 1
}
</script>

<template>
  <ProductRouteShell title="赛事列表" subtitle="公开赛事发现、组别与对阵入口">
    <template #header>
      <RouteHeader title="赛事" subtitle="生产赛事列表、组别、轮次与对阵入口" />
    </template>

    <section class="list-content" aria-labelledby="competition-list-title">
      <form class="filters" @submit.prevent="applyFilters">
        <h2 id="competition-list-title">赛事列表</h2>
        <ProductField v-model="search" label="搜索" placeholder="赛事名称" />
        <ProductSelect v-model="actflag" label="状态" :options="statusOptions" />
        <ProductSelect v-model="type" label="类型" :options="typeOptions" />
        <ProductField v-model="month" label="月份" input-mode="numeric" />
        <ProductField v-model="year" label="年份" input-mode="numeric" />
        <ProductButton native-type="submit" variant="primary">查询</ProductButton>
      </form>

      <ResourceState
        :pending="listPending"
        :error-text="errorState?.text ?? ''"
        :error-kind="errorState?.kind ?? 'error'"
        :retryable="errorState?.retryable ?? false"
        :empty="!listPending && competitions.length === 0"
        empty-text="没有返回赛事"
        @retry="competitionQuery.refetch()"
      />

      <section v-if="competitions.length > 0" class="table-region" aria-label="赛事结果">
        <div class="result-meta">
          <span>共 {{ total }} 项</span>
          <ProductPagination
            :page="pageOneBased"
            :page-count="pageCount"
            :disabled="listPending"
            @update:page="updatePage"
          />
        </div>

        <table>
          <thead>
            <tr>
              <th scope="col">赛事</th>
              <th scope="col">状态</th>
              <th scope="col">时间</th>
              <th scope="col">组织方</th>
              <th scope="col">入口</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="competition in competitions" :key="competition.id">
              <td>
                <strong>{{ competition.title }}</strong>
                <span
                  >{{ competition.countSummary || competition.category || competition.type }}</span
                >
              </td>
              <td>{{ competition.status || '未返回' }}</td>
              <td>{{ competition.startTime || '未返回' }}</td>
              <td>{{ competition.organizer || '未返回' }}</td>
              <td>
                <RouterLink :to="{ name: 'competition-detail', params: { hdid: competition.id } }">
                  查看
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.list-content {
  display: grid;
  gap: var(--s-4);
  min-height: 0;
}

.filters {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) repeat(4, minmax(110px, 160px)) auto;
  gap: var(--s-3);
  align-items: end;
}

.filters h2 {
  grid-column: 1 / -1;
  margin: 0;
  font-size: var(--fs-lg);
}

td span,
.result-meta {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

td a {
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

@media (pointer: coarse), (width <= 1024px) {
  td a {
    min-height: var(--board-touch-target-min);
  }
}

.table-region {
  display: grid;
  gap: var(--s-3);
  min-width: 0;
}

.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

th,
td {
  padding: var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  text-align: left;
  vertical-align: top;
}

td:first-child {
  display: grid;
  gap: var(--s-1);
}

@media (width <= 960px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  table {
    min-width: 760px;
  }

  .table-region {
    overflow-x: auto;
  }
}
</style>
