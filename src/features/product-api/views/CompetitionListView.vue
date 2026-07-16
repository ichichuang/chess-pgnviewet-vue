<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

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
  ProductSheet,
  ProductStateBanner,
} from '@/ui'
import type { ProductSelectOption } from '@/ui/ProductSelect.vue'

const now = new Date()
const pageSize = 20
const DEFAULT_STATUS = '21'

const route = useRoute()
const router = useRouter()

const defaultDate = () => ({
  year: String(now.getFullYear()),
  month: String(now.getMonth() + 1),
})

const ALLOWED_STATUS = new Set(['', '20', '21', '22'])
const ALLOWED_TYPES = new Set(['', '1', '4', '1024'])

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

interface ParsedQueryState {
  search: string
  status: string
  type: string
  year: string
  month: string
  page: number
  correction: string | null
}

function parseRouteQuery(query: LocationQuery): ParsedQueryState {
  const state: ParsedQueryState = {
    search: '',
    status: DEFAULT_STATUS,
    type: '',
    ...defaultDate(),
    page: 1,
    correction: null,
  }

  if (typeof query.search === 'string') {
    state.search = query.search.trim()
    if (state.search.length > 80 || hasControlCharacter(state.search)) {
      state.search = ''
      state.correction = '搜索条件已清除'
    }
  }

  if (typeof query.status === 'string') {
    if (ALLOWED_STATUS.has(query.status)) {
      state.status = query.status
    } else {
      state.correction = '状态筛选已重置为“比赛中”'
    }
  } else if (query.status === undefined) {
    state.status = DEFAULT_STATUS
  }

  if (typeof query.type === 'string') {
    if (ALLOWED_TYPES.has(query.type)) {
      state.type = query.type
    } else {
      state.correction = '类型筛选已重置'
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

  if (typeof query.date === 'string') {
    const match = /^(\d{4})-(\d{1,2})$/u.exec(query.date)
    if (match) {
      const parsedYear = Number(match[1])
      const parsedMonth = Number(match[2])
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        state.year = String(parsedYear)
        state.month = String(parsedMonth)
      } else {
        state.correction = '日期已校正为当前月份'
      }
    } else if (query.date !== '') {
      state.correction = '日期已校正为当前月份'
    }
  }

  return state
}

function buildQuery(state: Omit<ParsedQueryState, 'correction'>): LocationQuery {
  const query: Record<string, string> = {}
  if (state.search) query.search = state.search
  query.status = state.status === DEFAULT_STATUS || state.status === '' ? state.status : DEFAULT_STATUS
  if (state.type) query.type = state.type
  query.date = `${state.year}-${String(state.month).padStart(2, '0')}`
  if (state.page !== 1) query.page = String(state.page)
  return query
}

const routeState = computed(() => parseRouteQuery(route.query))

const draft = reactive({
  search: '',
  status: DEFAULT_STATUS,
  type: '',
  ...defaultDate(),
})

watch(
  () => route.query,
  (query) => {
    const parsed = parseRouteQuery(query)
    draft.search = parsed.search
    draft.status = parsed.status
    draft.type = parsed.type
    draft.year = parsed.year
    draft.month = parsed.month
  },
  { immediate: true }
)

const validation = ref<{ year?: string; month?: string }>({})
const yearFieldRef = ref<{ focus: () => void } | null>(null)
const monthFieldRef = ref<{ focus: () => void } | null>(null)
const resultHeadingRef = ref<HTMLHeadingElement | null>(null)
const filterSheetOpen = ref(false)
const correctionNotice = ref<string | null>(null)

const filters = computed(() => ({
  search: routeState.value.search,
  actflag: routeState.value.status,
  type: routeState.value.type,
  month: routeState.value.month,
  year: routeState.value.year,
}))

const pageIndex = computed(() => routeState.value.page - 1)

const competitionQuery = useQuery({
  queryKey: computed(() => productQueryKeys.competitions(filters.value, pageIndex.value)),
  meta: publicQueryMeta,
  queryFn: ({ signal }) =>
    tournamentRepository.list(
      {
        start: pageIndex.value * pageSize,
        max: pageSize,
        ...filters.value,
      },
      signal
    ),
  placeholderData: keepPreviousData,
})

const competitions = computed(() => competitionQuery.data.value?.items ?? [])
const total = computed(() => competitionQuery.data.value?.total ?? 0)
const pageCount = computed(() => Math.ceil(total.value / pageSize))
const pageOneBased = computed(() => routeState.value.page)

const isPending = computed(() => competitionQuery.isPending.value)
const isFetching = computed(() => competitionQuery.isFetching.value)
const queryError = computed(() => competitionQuery.error.value)
const hasData = computed(() => competitions.value.length > 0)
const hasAnyData = computed(() => competitionQuery.data.value !== undefined)

const errorState = computed(() => resourceError(queryError.value))
const initialLoading = computed(() => isPending.value && !hasAnyData.value)
const partialFailure = computed(() => queryError.value !== null && hasAnyData.value)
const completeFailure = computed(() => queryError.value !== null && !hasAnyData.value)
const completeEmpty = computed(
  () => !isPending.value && !queryError.value && competitions.value.length === 0 && hasAnyData.value
)

const defaultState = computed(() => ({
  search: '',
  status: DEFAULT_STATUS,
  type: '',
  ...defaultDate(),
  page: 1,
}))

const appliedState = computed(() => ({
  search: routeState.value.search,
  status: routeState.value.status,
  type: routeState.value.type,
  year: routeState.value.year,
  month: routeState.value.month,
  page: routeState.value.page,
}))

const canReset = computed(() => {
  const d = defaultState.value
  const a = appliedState.value
  return (
    a.search !== d.search ||
    a.status !== d.status ||
    a.type !== d.type ||
    a.year !== d.year ||
    a.month !== d.month ||
    a.page !== d.page
  )
})

const appliedSummaryText = computed(() => {
  const parts: string[] = []
  const statusLabel = statusOptions.find((option) => option.value === routeState.value.status)?.label ?? '全部'
  const typeLabel = typeOptions.find((option) => option.value === routeState.value.type)?.label ?? '全部'
  parts.push(`状态：${statusLabel}`)
  parts.push(`类型：${typeLabel}`)
  parts.push(`日期：${routeState.value.year}年${routeState.value.month}月`)
  if (routeState.value.search) parts.push(`搜索：${routeState.value.search}`)
  return parts.join('；')
})

const resultMetaText = computed(() => {
  if (isPending.value && !hasAnyData.value) return '正在加载…'
  if (total.value === 0) return '暂无赛事'
  return `共 ${total.value} 项，第 ${pageOneBased.value} / ${pageCount.value || 1} 页`
})

watch(pageOneBased, () => {
  void nextTick(() => resultHeadingRef.value?.focus())
})

watch(pageCount, (count) => {
  if (count > 0 && pageOneBased.value > count) {
    void router.replace({ query: buildQuery({ ...routeState.value, page: count }) })
  }
})

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

const statusOptions: ProductSelectOption[] = [
  { label: '全部', value: '' },
  { label: '报名中', value: '20' },
  { label: '比赛中', value: '21' },
  { label: '已结束', value: '22' },
]

const typeOptions: ProductSelectOption[] = [
  { label: '全部', value: '' },
  { label: '线下赛', value: '1' },
  { label: '免费赛', value: '4' },
  { label: '线上赛', value: '1024' },
]

function validateDraft(): { year?: string; month?: string } {
  const errors: { year?: string; month?: string } = {}
  const yearNum = Number(draft.year)
  const monthNum = Number(draft.month)

  if (!/^\d{4}$/u.test(draft.year) || Number.isNaN(yearNum)) {
    errors.year = '请输入 4 位年份。'
  }
  if (!/^\d{1,2}$/u.test(draft.month) || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    errors.month = '请输入 1–12 的月份。'
  }
  return errors
}

async function focusFirstInvalid(invalid: { year?: string; month?: string }): Promise<void> {
  await nextTick()
  if (invalid.month) {
    monthFieldRef.value?.focus()
  } else if (invalid.year) {
    yearFieldRef.value?.focus()
  }
}

function applyFilters(): void {
  validation.value = validateDraft()
  if (validation.value.year || validation.value.month) {
    void focusFirstInvalid(validation.value)
    return
  }

  correctionNotice.value = null
  void router.push({
    query: buildQuery({
      search: draft.search.trim(),
      status: draft.status,
      type: draft.type,
      year: draft.year,
      month: draft.month,
      page: 1,
    }),
  })
  filterSheetOpen.value = false
  void nextTick(() => resultHeadingRef.value?.focus())
}

function resetFilters(): void {
  correctionNotice.value = null
  const d = defaultState.value
  void router.push({
    query: buildQuery({
      search: d.search,
      status: d.status,
      type: d.type,
      year: d.year,
      month: d.month,
      page: 1,
    }),
  })
}

function updatePage(next: number): void {
  void router.push({ query: buildQuery({ ...routeState.value, page: next }) })
}
</script>

<template>
  <ProductRouteShell title="赛事" subtitle="查找公开赛事并查看组别、轮次和对阵。">
    <template #header="{ titleId, registerTitle }">
      <RouteHeader
        settings-page="competition-list"
        title="赛事"
        :title-id="titleId"
        subtitle="查找公开赛事并查看组别、轮次和对阵。"
        :register-title="registerTitle"
      />
    </template>

    <section class="list-content" aria-labelledby="competition-list-title">
      <h2 id="competition-list-title" class="page-title">赛事列表</h2>

      <form class="filters desktop-filters" @submit.prevent="applyFilters">
        <ProductField v-model="draft.search" label="搜索" placeholder="赛事名称" />
        <ProductSelect v-model="draft.status" label="状态" :options="statusOptions" />
        <ProductSelect v-model="draft.type" label="类型" :options="typeOptions" />
        <div class="date-fields">
          <ProductField
            ref="yearFieldRef"
            v-model="draft.year"
            label="年份"
            input-mode="numeric"
            :error="validation.year"
          />
          <ProductField
            ref="monthFieldRef"
            v-model="draft.month"
            label="月份"
            input-mode="numeric"
            :error="validation.month"
          />
        </div>
        <ProductButton native-type="submit" variant="primary" :busy="isFetching"
          >查询</ProductButton
        >
        <ProductButton
          native-type="button"
          variant="secondary"
          :disabled="!canReset"
          @click="resetFilters"
        >
          清除筛选
        </ProductButton>
      </form>

      <form class="filters mobile-filters" @submit.prevent="applyFilters">
        <ProductField v-model="draft.search" label="搜索" placeholder="赛事名称" />
        <ProductButton native-type="submit" variant="primary" :busy="isFetching"
          >查询</ProductButton
        >
        <ProductButton
          native-type="button"
          variant="secondary"
          :disabled="!canReset"
          @click="filterSheetOpen = true"
        >
          筛选
        </ProductButton>
      </form>

      <ProductSheet v-model:show="filterSheetOpen" title="筛选赛事">
        <div class="sheet-fields">
          <ProductSelect v-model="draft.status" label="状态" :options="statusOptions" />
          <ProductSelect v-model="draft.type" label="类型" :options="typeOptions" />
          <ProductField
            ref="yearFieldRef"
            v-model="draft.year"
            label="年份"
            input-mode="numeric"
            :error="validation.year"
          />
          <ProductField
            ref="monthFieldRef"
            v-model="draft.month"
            label="月份"
            input-mode="numeric"
            :error="validation.month"
          />
        </div>
        <div class="sheet-actions">
          <ProductButton variant="primary" :busy="isFetching" @click="applyFilters"
            >应用</ProductButton
          >
          <ProductButton variant="secondary" @click="filterSheetOpen = false">取消</ProductButton>
        </div>
      </ProductSheet>

      <section class="applied-summary" aria-label="当前筛选">
        <p>{{ appliedSummaryText }}</p>
        <ProductButton
          v-if="canReset"
          variant="text"
          size="small"
          native-type="button"
          @click="resetFilters"
        >
          清除筛选
        </ProductButton>
      </section>

      <ProductStateBanner v-if="correctionNotice" status="warning" title="筛选条件已校正">
        {{ correctionNotice }}
      </ProductStateBanner>

      <ProductStateBanner v-if="partialFailure" status="warning" title="更新失败">
        当前显示上一次可用结果。请稍后重试。
      </ProductStateBanner>

      <section class="result-region" aria-labelledby="result-heading">
        <div class="result-meta">
          <h3 id="result-heading" ref="resultHeadingRef" class="result-heading" tabindex="-1">
            赛事结果
          </h3>
          <span aria-live="polite">{{ resultMetaText }}</span>
          <ProductPagination
            :page="pageOneBased"
            :page-count="pageCount || 1"
            :disabled="isFetching || completeFailure"
            @update:page="updatePage"
          />
        </div>

        <ResourceState
          v-if="initialLoading || completeFailure || completeEmpty"
          :pending="initialLoading"
          :error-text="errorState?.text ?? ''"
          :error-kind="errorState?.kind ?? 'error'"
          :retryable="errorState?.retryable ?? false"
          :empty="completeEmpty"
          loading-text="正在加载赛事列表"
          empty-text="暂无赛事"
          @retry="competitionQuery.refetch()"
        />

        <template v-if="hasData">
          <table class="desktop-table">
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
                <td>{{ competition.status || '信息暂缺' }}</td>
                <td>{{ competition.startTime || '信息暂缺' }}</td>
                <td>{{ competition.organizer || '信息暂缺' }}</td>
                <td>
                  <RouterLink
                    :to="{ name: 'competition-detail', params: { hdid: competition.id } }"
                  >
                    查看详情
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>

          <ul class="narrow-list">
            <li v-for="competition in competitions" :key="competition.id">
              <div class="narrow-item">
                <div class="narrow-primary">
                  <strong>{{ competition.title }}</strong>
                  <span>{{ competition.status || '信息暂缺' }}</span>
                </div>
                <div class="narrow-secondary">
                  <span>{{ competition.startTime || '信息暂缺' }}</span>
                  <span>{{ competition.organizer || '信息暂缺' }}</span>
                  <span
                    >{{ competition.countSummary || competition.category || competition.type }}</span
                  >
                </div>
                <RouterLink :to="{ name: 'competition-detail', params: { hdid: competition.id } }">
                  查看详情
                </RouterLink>
              </div>
            </li>
          </ul>
        </template>
      </section>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.list-content {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  height: 100%;
  min-height: 0;
}

.page-title {
  margin: 0;
  font-size: var(--fs-lg);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--s-3);
}

.filters > :not(.date-fields) {
  flex: 1 1 12rem;
  min-width: 0;
}

.desktop-filters .date-fields {
  display: flex;
  flex: 1 1 16rem;
  gap: var(--s-2);
  min-width: 0;
}

.desktop-filters .date-fields > * {
  flex: 1 1 50%;
  min-width: 0;
}

.mobile-filters {
  display: none;
}

.applied-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.applied-summary p {
  margin: 0;
}

.result-region {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
}

.result-heading {
  margin: 0;
  font-size: var(--fs-md);
  outline: none;
}

.result-meta span {
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

.desktop-table td:first-child {
  display: grid;
  gap: var(--s-1);
}

.desktop-table a,
.narrow-list a {
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

.narrow-list {
  display: none;
  margin: 0;
  padding: 0;
  list-style: none;
}

.narrow-list li {
  padding: var(--s-3);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.narrow-item {
  display: grid;
  gap: var(--s-2);
}

.narrow-primary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-2);
}

.narrow-primary span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.desktop-table td:first-child span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.narrow-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
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

@media (pointer: coarse), (width <= 1024px) {
  .desktop-table a,
  .narrow-list a {
    min-height: var(--board-touch-target-min);
  }
}

@media (width <= 960px) {
  .desktop-filters {
    display: none;
  }

  .mobile-filters {
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
