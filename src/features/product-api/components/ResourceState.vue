<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  completeLeaveImmediately,
  createStateEnterHook,
} from '@/features/motion/stateEnterHooks'
import type { ResourceErrorKind } from '@/features/product-api/domain/resourceError'

const props = withDefaults(
  defineProps<{
    pending?: boolean
    empty?: boolean
    errorText?: string
    errorKind?: ResourceErrorKind
    retryable?: boolean
    loadingText?: string
    emptyText?: string
  }>(),
  {
    pending: false,
    empty: false,
    errorText: '',
    errorKind: 'error',
    retryable: false,
    loadingText: '加载中',
    emptyText: '暂无数据',
  }
)

const errorTitle = computed(() => {
  if (props.errorKind === 'authentication') return '需要认证'
  if (props.errorKind === 'permission') return '权限不足'
  if (props.errorKind === 'unavailable') return '服务不可用'
  return '加载失败'
})

const emit = defineEmits<{
  retry: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const onStateEnter = createStateEnterHook(rootEl)
</script>

<template>
  <section
    v-if="pending || errorText || empty"
    ref="rootEl"
    class="resource-state"
    aria-live="polite"
  >
    <Transition :css="false" @enter="onStateEnter" @leave="completeLeaveImmediately">
      <strong v-if="pending" key="pending">{{ loadingText }}</strong>
      <div v-else-if="errorText" key="error" class="resource-state-detail">
        <strong>{{ errorTitle }}</strong>
        <p>{{ errorText }}</p>
        <button v-if="retryable" type="button" @click="emit('retry')">重试</button>
      </div>
      <strong v-else key="empty">{{ emptyText }}</strong>
    </Transition>
  </section>
</template>

<style scoped>
.resource-state {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
  padding: var(--s-4);
  border: var(--workspace-border-w) solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text);
}

.resource-state-detail {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
}

.resource-state p {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.resource-state button {
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

@media (pointer: coarse), (width <= 1024px) {
  .resource-state button {
    min-height: var(--board-touch-target-min);
  }
}
</style>
