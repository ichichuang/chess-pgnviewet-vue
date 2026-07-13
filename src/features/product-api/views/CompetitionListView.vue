<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { apiErrorMessage } from '@/api/client'
import { fetchCompetitionList } from '@/api/productApi'
import { productQueryKeys } from '@/api/queryClient'
import ResourceState from '@/features/product-api/components/ResourceState.vue'
import RouteHeader from '@/features/product-api/components/RouteHeader.vue'

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
  queryFn: ({ signal }) =>
    fetchCompetitionList(
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
const canGoPrevious = computed(() => page.value > 0)
const canGoNext = computed(() => (page.value + 1) * pageSize < total.value)
const errorText = computed(() =>
  competitionQuery.error.value ? apiErrorMessage(competitionQuery.error.value) : ''
)

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

function previousPage(): void {
  if (canGoPrevious.value) page.value -= 1
}

function nextPage(): void {
  if (canGoNext.value) page.value += 1
}
</script>

<template>
  <main class="product-route">
    <RouteHeader title="赛事" subtitle="生产赛事列表、组别、轮次与对阵入口" />

    <section class="route-body" aria-labelledby="competition-list-title">
      <form class="filters" @submit.prevent="applyFilters">
        <h2 id="competition-list-title">赛事列表</h2>
        <label>
          <span>搜索</span>
          <input v-model.trim="search" />
        </label>
        <label>
          <span>状态</span>
          <select v-model="actflag">
            <option value="20">报名中</option>
            <option value="21">比赛中</option>
            <option value="22">已结束</option>
            <option value="">全部</option>
          </select>
        </label>
        <label>
          <span>类型</span>
          <select v-model="type">
            <option value="">全部</option>
            <option value="1">线下赛</option>
            <option value="4">免费赛</option>
            <option value="1024">线上赛</option>
          </select>
        </label>
        <label>
          <span>月份</span>
          <input v-model.trim="month" inputmode="numeric" />
        </label>
        <label>
          <span>年份</span>
          <input v-model.trim="year" inputmode="numeric" />
        </label>
        <button type="submit">查询</button>
      </form>

      <ResourceState
        :pending="listPending"
        :error-text="errorText"
        :empty="!listPending && competitions.length === 0"
        empty-text="没有返回赛事"
        @retry="competitionQuery.refetch()"
      />

      <section v-if="competitions.length > 0" class="table-region" aria-label="赛事结果">
        <div class="result-meta">
          <span>共 {{ total }} 项</span>
          <div class="pagination">
            <button type="button" :disabled="!canGoPrevious" @click="previousPage">上一页</button>
            <span>第 {{ page + 1 }} 页</span>
            <button type="button" :disabled="!canGoNext" @click="nextPage">下一页</button>
          </div>
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

.filters label {
  display: grid;
  gap: var(--s-1);
}

td span,
.result-meta,
.filters span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.filters input,
.filters select,
.filters button,
.pagination button,
td a {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
}

@media (pointer: coarse), (width <= 1024px) {
  .filters input,
  .filters select,
  .filters button,
  .pagination button,
  td a {
    min-height: var(--board-touch-target-min);
  }
}

.filters button,
.pagination button,
td a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
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

.pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
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
