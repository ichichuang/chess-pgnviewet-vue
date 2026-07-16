<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import type {
  PgnImportFailureReason,
  PgnImportFileResult,
  PgnImportSessionState,
} from '@/features/pgn/pgnImportTypes'
import { ProductButton, ProductDialog } from '@/ui'
import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

const props = defineProps<{
  session: PgnImportSessionState | null
  returnFocus?: ProductOverlayReturnFocus | undefined
}>()

const emit = defineEmits<{
  cancel: []
  close: []
  confirmPartial: []
  retry: []
}>()

const resultHeadingRef = ref<HTMLHeadingElement | null>(null)
const cancelButtonRef = ref<InstanceType<typeof ProductButton> | null>(null)
const lastTitle = ref('正在导入本地 PGN')
const lastDescription = ref('文件只在本机解析，不会上传。')

const FAILURE_LABELS: Record<PgnImportFailureReason, string> = {
  unreadable: '无法读取文件',
  empty: '文件内容为空',
  'invalid-pgn': 'PGN 格式或走法无效',
  'unsupported-content': '文件内容不是受支持的 PGN',
  'cancelled-read': '读取已取消',
  'stale-target': '导入目标已变化',
}

function titleForPhase(phase: PgnImportSessionState['phase']): string {
  switch (phase) {
    case 'awaiting-partial-confirmation':
      return '部分文件可以导入'
    case 'completed':
      return '本地 PGN 导入完成'
    case 'cancelled':
      return '已取消本地 PGN 导入'
    case 'failed':
      return '本地 PGN 未导入'
    default:
      return '正在导入本地 PGN'
  }
}

function descriptionForSession(session: PgnImportSessionState): string {
  const applicationCopy =
    session.intent === 'insert-into-current-source'
    ? '有效棋谱只会在全部检查完成后一次性插入当前本地来源。'
    : '有效棋谱只会在全部检查完成后一次性打开为新的本地来源。'

  return `正在本机解析 ${session.total} 个文件，已完成 ${session.completed} 个。文件不会上传。${applicationCopy}`
}

const title = computed(() =>
  props.session ? titleForPhase(props.session.phase) : lastTitle.value
)

const description = computed(() =>
  props.session ? descriptionForSession(props.session) : lastDescription.value
)

const canCancel = computed(() => {
  const phase = props.session?.phase
  return (
    phase === 'idle' ||
    phase === 'reading' ||
    phase === 'parsing' ||
    phase === 'awaiting-partial-confirmation'
  )
})

const isBusy = computed(
  () => props.session?.phase === 'cancelling' || props.session?.phase === 'applying'
)

const showResultActions = computed(() => {
  const phase = props.session?.phase
  return phase === 'completed' || phase === 'cancelled' || phase === 'failed'
})

const progressValue = computed(() => {
  const current = props.session
  if (!current) return 0
  const fraction =
    current.currentBytesTotal > 0
      ? Math.min(1, current.currentBytesLoaded / current.currentBytesTotal)
      : 0
  return Math.min(current.total, current.completed + fraction)
})

const progressNow = computed(() => progressValue.value.toFixed(2))

function requestClose(): void {
  if (canCancel.value) {
    emit('cancel')
    return
  }
  if (!isBusy.value) emit('close')
}

function resultLabel(result: PgnImportFileResult): string {
  if (result.status === 'success') return `成功，${result.gameCount} 盘棋`
  if (result.failureReason) return FAILURE_LABELS[result.failureReason]
  if (result.status === 'reading') return '正在读取'
  if (result.status === 'parsing') return '正在解析'
  return '等待处理'
}

function focusCurrentOutcome(): void {
  if (showResultActions.value || props.session?.phase === 'awaiting-partial-confirmation') {
    resultHeadingRef.value?.focus({ preventScroll: true })
    return
  }
  cancelButtonRef.value?.focus()
}

watch(
  () => props.session?.phase,
  async (phase) => {
    if (props.session) {
      lastTitle.value = titleForPhase(props.session.phase)
      lastDescription.value = descriptionForSession(props.session)
    }
    if (
      phase !== 'awaiting-partial-confirmation' &&
      phase !== 'completed' &&
      phase !== 'cancelled' &&
      phase !== 'failed'
    ) {
      return
    }
    await nextTick()
    focusCurrentOutcome()
  }
)

watch(
  () => props.session?.focusRequest,
  async () => {
    await nextTick()
    focusCurrentOutcome()
  }
)
</script>

<template>
  <ProductDialog
    :show="session !== null"
    :title="title"
    :description="description"
    :closable="showResultActions"
    :mask-closable="false"
    :close-on-esc="!isBusy"
    initial-focus="safe-action"
    :return-focus="returnFocus"
    @update:show="requestClose"
  >
    <div v-if="session" class="import-session">
      <div class="progress-block">
        <div class="progress-copy">
          <span>已处理 {{ session.completed }} / {{ session.total }} 个文件</span>
          <span>{{ session.stagedGameCount }} 盘有效棋谱</span>
        </div>
        <progress
          class="import-progress"
          :max="session.total"
          :value="progressValue"
          role="progressbar"
          aria-label="本地 PGN 导入进度"
          aria-valuemin="0"
          :aria-valuemax="session.total"
          :aria-valuenow="progressNow"
        />
      </div>

      <p class="session-status" aria-live="polite">{{ session.statusMessage }}</p>
      <p v-if="session.currentFilename" class="current-file" aria-live="polite">
        当前文件：{{ session.currentFilename }}（{{ session.currentIndex }} / {{ session.total }}）
      </p>

      <section class="result-section" aria-labelledby="pgn-import-result-heading">
        <h3
          id="pgn-import-result-heading"
          ref="resultHeadingRef"
          class="result-heading"
          tabindex="-1"
        >
          文件结果
        </h3>
        <ol class="result-list" tabindex="0" aria-label="本地 PGN 文件导入结果">
          <li v-for="result in session.results" :key="result.id" class="result-item">
            <span class="result-filename">{{ result.filename }}</span>
            <span :class="['result-state', `is-${result.status}`]">
              {{ resultLabel(result) }}
            </span>
          </li>
        </ol>
      </section>
    </div>

    <template #footer>
      <template v-if="session?.phase === 'awaiting-partial-confirmation'">
        <ProductButton ref="cancelButtonRef" data-product-overlay-safe @click="emit('cancel')">
          取消
        </ProductButton>
        <ProductButton variant="primary" @click="emit('confirmPartial')">
          导入成功文件
        </ProductButton>
      </template>
      <template v-else-if="session?.phase === 'failed'">
        <ProductButton data-product-overlay-safe @click="emit('close')">取消</ProductButton>
        <ProductButton ref="cancelButtonRef" variant="primary" @click="emit('retry')">
          重新选择
        </ProductButton>
      </template>
      <ProductButton
        v-else-if="showResultActions"
        ref="cancelButtonRef"
        data-product-overlay-safe
        @click="emit('close')"
      >
        关闭
      </ProductButton>
      <ProductButton
        v-else
        ref="cancelButtonRef"
        data-product-overlay-safe
        :busy="isBusy"
        :disabled="!canCancel"
        @click="emit('cancel')"
      >
        {{ session?.phase === 'cancelling' ? '正在停止' : '停止导入' }}
      </ProductButton>
    </template>
  </ProductDialog>
</template>

<style scoped>
.import-session,
.progress-block,
.result-section {
  display: grid;
  gap: var(--s-3);
}

.progress-copy,
.result-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-3);
}

.progress-copy,
.current-file,
.session-status,
.result-state {
  color: var(--text-2);
}

.import-progress {
  width: 100%;
  accent-color: var(--success);
}

.session-status,
.current-file,
.result-heading {
  margin: 0;
}

.result-heading {
  outline: none;
}

.result-heading:focus {
  border-radius: var(--r-xs);
  box-shadow: var(--state-focus-ring);
}

.result-list {
  display: grid;
  gap: var(--s-2);
  max-block-size: calc(var(--control-h) * 6);
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.result-list:focus-visible {
  border-radius: var(--r-xs);
  box-shadow: var(--state-focus-ring);
  outline: none;
}

.result-item {
  align-items: baseline;
  padding: var(--s-3);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
}

.result-filename {
  min-width: 0;
  overflow-wrap: anywhere;
}

.result-state {
  flex: none;
  text-align: end;
}

.result-state.is-success {
  color: var(--success);
}

.result-state.is-failure,
.result-state.is-cancelled {
  color: var(--danger);
}
</style>
