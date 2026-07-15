<script setup lang="ts">
import { computed } from 'vue'
import { NModal } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    closable?: boolean
    maskClosable?: boolean
    closeOnEsc?: boolean
  }>(),
  {
    closable: true,
    maskClosable: true,
    closeOnEsc: true,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
  afterEnter: []
}>()

const titleId = computed(() => `pd-title-${props.title.replace(/\W+/g, '-').toLowerCase()}`)
</script>

<template>
  <NModal
    :show="show"
    :closable="closable"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :trap-focus="true"
    :auto-focus="false"
    @update:show="emit('update:show', $event)"
    @after-enter="emit('afterEnter')"
  >
    <div class="product-dialog-card" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <header class="product-dialog-header">
        <h2 :id="titleId" class="product-dialog-title">{{ title }}</h2>
        <button
          v-if="closable"
          type="button"
          class="product-dialog-close"
          aria-label="关闭"
          @click="emit('update:show', false)"
        >
          ×
        </button>
      </header>
      <div class="product-dialog-body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="product-dialog-footer">
        <slot name="footer" />
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.product-dialog-card {
  display: grid;
  gap: var(--s-4);
  width: min(calc(100vw - var(--s-8)), var(--dialog-max-w));
  max-height: calc(100dvh - var(--s-8));
  padding: var(--s-5);
  overflow: auto;
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
}

.product-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
}

.product-dialog-title {
  margin: 0;
  font-size: var(--fs-lg);
}

.product-dialog-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--control-h-sm);
  height: var(--control-h-sm);
  padding: 0;
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.product-dialog-body {
  min-width: 0;
}

.product-dialog-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-3);
}
</style>
