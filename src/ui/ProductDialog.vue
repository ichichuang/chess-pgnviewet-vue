<script setup lang="ts">
import { computed, nextTick, ref, useSlots, watch } from 'vue'
import { NModal } from 'naive-ui'

import {
  captureProductOverlayFocus,
  focusProductOverlayTarget,
  restoreProductOverlayFocus,
  type ProductOverlayInitialFocus,
  type ProductOverlayReturnFocus,
} from './productOverlayFocus'

type ProductDialogRole = 'dialog' | 'alertdialog'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    description?: string
    role?: ProductDialogRole
    closable?: boolean
    maskClosable?: boolean
    closeOnEsc?: boolean
    initialFocus?: ProductOverlayInitialFocus
    returnFocus?: ProductOverlayReturnFocus | undefined
  }>(),
  {
    description: '',
    role: 'dialog',
    closable: true,
    maskClosable: true,
    closeOnEsc: true,
    initialFocus: 'safe-action',
    returnFocus: undefined,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
  afterEnter: []
}>()

const slots = useSlots()
const instanceId = `product-dialog-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
const titleId = `${instanceId}-title`
const descriptionId = `${instanceId}-description`
const bodyId = `${instanceId}-body`
const actionsId = `${instanceId}-actions`

const dialogCardRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
let focusEntry: ReturnType<typeof captureProductOverlayFocus> | null = null

const hasBody = computed(() => Boolean(slots.default))
const hasDescription = computed(() => props.description.trim().length > 0)
const describedBy = computed(() => {
  const ids = []
  if (hasDescription.value) ids.push(descriptionId)
  if (hasBody.value) ids.push(bodyId)
  return ids.length > 0 ? ids.join(' ') : undefined
})

function focusActiveDialog(): boolean {
  return focusProductOverlayTarget(dialogCardRef.value, titleRef.value, props.initialFocus)
}

async function restoreFocus(): Promise<void> {
  const entry = focusEntry
  focusEntry = null
  if (!entry) return
  await nextTick()
  restoreProductOverlayFocus(entry)
}

function onAfterEnter(): void {
  void nextTick(() => {
    focusActiveDialog()
    emit('afterEnter')
  })
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      focusEntry = captureProductOverlayFocus(
        props.returnFocus
          ? { fallback: props.returnFocus, focusActive: focusActiveDialog }
          : { focusActive: focusActiveDialog }
      )
      void nextTick(focusActiveDialog)
      return
    }

    void restoreFocus()
  }
)
</script>

<template>
  <NModal
    :show="show"
    :closable="closable"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :trap-focus="true"
    :auto-focus="false"
    :block-scroll="true"
    @update:show="emit('update:show', $event)"
    @after-enter="onAfterEnter"
  >
    <div
      ref="dialogCardRef"
      class="product-dialog-card"
      :role="role"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="describedBy"
    >
      <header class="product-dialog-header">
        <h2 :id="titleId" ref="titleRef" class="product-dialog-title" tabindex="-1">
          {{ title }}
        </h2>
        <p v-if="hasDescription" :id="descriptionId" class="product-dialog-description">
          {{ description }}
        </p>
        <button
          v-if="closable"
          type="button"
          class="product-dialog-close"
          aria-label="关闭"
          data-product-overlay-safe
          @click="emit('update:show', false)"
        >
          ×
        </button>
      </header>
      <div v-if="$slots.default" :id="bodyId" class="product-dialog-body">
        <slot />
      </div>
      <div v-if="$slots.footer" :id="actionsId" class="product-dialog-footer">
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
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--s-3);
  min-width: 0;
}

.product-dialog-title {
  margin: 0;
  font-size: var(--fs-lg);
  outline: none;
}

.product-dialog-title:focus {
  border-radius: var(--r-xs);
  box-shadow: var(--state-focus-ring);
}

.product-dialog-description {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--text-2);
  font-size: var(--fs-base);
  line-height: 1.6;
}

.product-dialog-close {
  grid-column: 2;
  grid-row: 1;
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
