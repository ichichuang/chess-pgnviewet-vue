<script setup lang="ts">
withDefaults(
  defineProps<{
    pending?: boolean
    empty?: boolean
    errorText?: string
    loadingText?: string
    emptyText?: string
  }>(),
  {
    pending: false,
    empty: false,
    errorText: '',
    loadingText: '加载中',
    emptyText: '暂无数据',
  }
)

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <section v-if="pending || errorText || empty" class="resource-state" aria-live="polite">
    <strong v-if="pending">{{ loadingText }}</strong>
    <template v-else-if="errorText">
      <strong>加载失败</strong>
      <p>{{ errorText }}</p>
      <button type="button" @click="emit('retry')">重试</button>
    </template>
    <strong v-else>{{ emptyText }}</strong>
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
