<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { gsap } from 'gsap'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { tournamentRepository } from '@/api/productApi'
import { productQueryKeys, publicQueryMeta } from '@/api/queryClient'
import {
  motionDuration,
  motionEase,
  motionScalar,
  prefersReducedMotion,
} from '@/features/motion/gsapTokens'
import { useResultsRefreshMotion } from '@/features/motion/useResultsRefreshMotion'
import { useRouteEntryMotion } from '@/features/motion/useRouteEntryMotion'
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

const routeRootEl = ref<HTMLElement | null>(null)
const resultRegionEl = ref<HTMLElement | null>(null)

useRouteEntryMotion(routeRootEl)

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
  query.status = ALLOWED_STATUS.has(state.status) ? state.status : DEFAULT_STATUS
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
const focusResultsAfterSheetClose = ref(false)
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

// Retained-refresh feedback: animate only on a new truthy data identity so
// error transitions (data dropping to undefined) never dip retained content.
const resultsRefreshIdentity = ref<unknown>(null)
watch(
  () => competitionQuery.data.value,
  (data) => {
    if (data) resultsRefreshIdentity.value = data
  }
)
useResultsRefreshMotion(resultRegionEl, resultsRefreshIdentity)

// Delegated press feedback for the result row detail links (plain
// anchors, not ProductButton). Transform-only, fast, and owned by a local
// gsap.context; navigation itself is never touched.
let resultLinkPressContext: gsap.Context | null = null

function animateResultLinkPress(event: Event): void {
  if (prefersReducedMotion()) return
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest('a')
  if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('disabled')) return
  gsap.killTweensOf(link)
  resultLinkPressContext?.add(() => {
    gsap.fromTo(
      link,
      { scale: motionScalar(resultRegionEl.value, '--workspace-motion-press-scale') },
      {
        scale: 1,
        duration: motionDuration(resultRegionEl.value, '--workspace-motion-duration-fast'),
        ease: motionEase(resultRegionEl.value, '--workspace-motion-ease-state'),
        overwrite: true,
        clearProps: 'transform',
      }
    )
  })
}

function onResultLinkKeyDown(event: KeyboardEvent): void {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
  animateResultLinkPress(event)
}

onMounted(() => {
  const region = resultRegionEl.value
  if (!region) return
  resultLinkPressContext = gsap.context(() => undefined, region)
  region.addEventListener('pointerdown', animateResultLinkPress, { capture: true })
  region.addEventListener('keydown', onResultLinkKeyDown, { capture: true })
})

onBeforeUnmount(() => {
  const region = resultRegionEl.value
  if (region) {
    region.removeEventListener('pointerdown', animateResultLinkPress, { capture: true })
    region.removeEventListener('keydown', onResultLinkKeyDown, { capture: true })
  }
  resultLinkPressContext?.revert()
  resultLinkPressContext = null
})
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

function statusBadgeClass(status: string): string {
  if (status === '比赛中') return 'status-ongoing'
  if (status === '报名中') return 'status-enrolling'
  if (status === '已结束') return 'status-ended'
  return 'status-unknown'
}

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

async function focusAppliedResults(): Promise<void> {
  await nextTick()
  resultHeadingRef.value?.focus()
}

function onFilterSheetAfterLeave(): void {
  if (!focusResultsAfterSheetClose.value) return
  focusResultsAfterSheetClose.value = false
  void focusAppliedResults()
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
  focusResultsAfterSheetClose.value = filterSheetOpen.value
  filterSheetOpen.value = false
  if (!focusResultsAfterSheetClose.value) void focusAppliedResults()
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
  <ProductRouteShell
    :ref="(el) => { routeRootEl = (el as any)?.$el ?? null }"
    title="赛事"
    subtitle="查找公开赛事并查看组别、轮次和对阵。"
  >
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
      <h1 id="competition-list-title" class="sr-only">赛事列表</h1>

      <form class="filter-bar" @submit.prevent="applyFilters">
        <ProductField
          v-model="draft.search"
          class="filter-search"
          label="搜索"
          placeholder="赛事名称"
        />
        <ProductSelect
          v-model="draft.status"
          class="filter-status"
          label="状态"
          :options="statusOptions"
        />
        <ProductButton native-type="submit" variant="primary" :busy="isFetching">
          查询
        </ProductButton>
        <ProductButton
          native-type="button"
          variant="secondary"
          :aria-expanded="filterSheetOpen"
          aria-controls="competition-filter-sheet"
          @click="filterSheetOpen = true"
        >
          更多筛选
        </ProductButton>
      </form>

      <ProductSheet
        id="competition-filter-sheet"
        v-model:show="filterSheetOpen"
        title="筛选赛事"
        height="80vh"
        @after-leave="onFilterSheetAfterLeave"
      >
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
          <ProductButton variant="primary" :busy="isFetching" @click="applyFilters">
            应用
          </ProductButton>
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

      <section ref="resultRegionEl" class="result-region" aria-labelledby="result-heading">
        <header class="result-region-header">
          <h2 id="result-heading" ref="resultHeadingRef" class="result-heading" tabindex="-1">
            赛事结果
          </h2>
          <span class="result-meta" aria-live="polite">{{ resultMetaText }}</span>
        </header>

        <div class="result-body">
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

          <table v-if="hasData" class="desktop-table">
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
                  <RouterLink
                    class="row-title-link"
                    :to="{ name: 'competition-detail', params: { hdid: competition.id } }"
                  >
                    <strong>{{ competition.title }}</strong>
                  </RouterLink>
                  <span class="row-meta">
                    {{ competition.countSummary || competition.category || competition.type }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="statusBadgeClass(competition.status)">
                    {{ competition.status || '信息暂缺' }}
                  </span>
                </td>
                <td>{{ competition.startTime || '信息暂缺' }}</td>
                <td>{{ competition.organizer || '信息暂缺' }}</td>
                <td>
                  <RouterLink
                    class="row-entry-link"
                    :to="{ name: 'competition-detail', params: { hdid: competition.id } }"
                  >
                    查看详情
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>

          <ul v-if="hasData" class="narrow-list">
            <li v-for="competition in competitions" :key="competition.id">
              <div class="narrow-item">
                <div class="narrow-primary">
                  <strong>{{ competition.title }}</strong>
                  <span class="status-badge" :class="statusBadgeClass(competition.status)">
                    {{ competition.status || '信息暂缺' }}
                  </span>
                </div>
                <div class="narrow-secondary">
                  <span>{{ competition.startTime || '信息暂缺' }}</span>
                  <span>{{ competition.organizer || '信息暂缺' }}</span>
                  <span
                    >{{ competition.countSummary || competition.category || competition.type }}</span
                  >
                </div>
                <RouterLink
                  class="row-entry-link"
                  :to="{ name: 'competition-detail', params: { hdid: competition.id } }"
                >
                  查看详情
                </RouterLink>
              </div>
            </li>
          </ul>
        </div>

        <footer class="result-region-footer">
          <ProductPagination
            :page="pageOneBased"
            :page-count="pageCount || 1"
            :disabled="isFetching || completeFailure"
            @update:page="updatePage"
          />
        </footer>
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

.sr-only {
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

.filter-bar {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  align-items: end;
  gap: var(--s-3);
  min-width: 0;
}

.filter-search {
  flex: 1 1 auto;
  min-width: 0;
}

.filter-status {
  flex: 0 0 8rem;
  min-width: 0;
}

.applied-summary {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.applied-summary p {
  margin: 0;
}

.result-region {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  overflow: hidden;
}

.result-region-header {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.result-heading {
  margin: 0;
  font-size: var(--fs-md);
  outline: none;
}

.result-meta {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.result-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.result-region-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding: var(--s-3) var(--s-4);
  border-top: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.desktop-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

.desktop-table th,
.desktop-table td {
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
  text-align: left;
  vertical-align: top;
}

.desktop-table thead th {
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--fs-sm);
  font-weight: 600;
}

.desktop-table tbody tr {
  transition: background-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.desktop-table tbody tr:hover {
  background: var(--state-hover-bg);
}

.desktop-table td:first-child {
  display: grid;
  gap: var(--s-1);
}

.row-title-link {
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.row-title-link:hover {
  color: var(--accent-strong);
  text-decoration: underline;
}

.row-meta {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-2);
  border-radius: var(--r-xs);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--fs-xs);
  font-weight: 600;
}

.status-badge.status-ongoing {
  background: var(--accent-bg);
  color: var(--accent-strong);
}

.status-badge.status-enrolling {
  background: var(--info-bg);
  color: var(--info);
}

.status-badge.status-ended {
  background: var(--surface-3);
  color: var(--text-muted);
}

.row-entry-link {
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
  font-size: var(--fs-sm);
  text-decoration: none;
  cursor: pointer;
}

.row-entry-link:hover {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}

.narrow-list {
  display: none;
  margin: 0;
  padding: 0;
  list-style: none;
}

.narrow-list li {
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
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
  .row-entry-link {
    min-height: var(--board-touch-target-min);
  }
}

@media (width <= 900px) {
  .filter-bar {
    flex-wrap: wrap;
  }

  .filter-search {
    flex: 1 1 100%;
  }

  .filter-status {
    flex: 1 1 auto;
  }
}

@media (width <= 760px) {
  .desktop-table {
    display: none;
  }

  .narrow-list {
    display: grid;
    gap: var(--s-2);
  }

  .result-region-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
