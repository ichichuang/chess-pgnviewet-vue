<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { gsap } from 'gsap'
import { NModal } from 'naive-ui'

import { animateDialogEnter, animateOverlayLeave } from '@/features/motion/overlayMotion'

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
const renderedShow = ref(props.show)
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

async function onAfterLeave(): Promise<void> {
  await restoreFocus()
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      renderedShow.value = true
      focusEntry = captureProductOverlayFocus(
        props.returnFocus
          ? { fallback: props.returnFocus, focusActive: focusActiveDialog }
          : { focusActive: focusActiveDialog }
      )
      void nextTick(() => {
        focusActiveDialog()
        const card = dialogCardRef.value
        if (card) {
          // Cancel any in-flight exit so a rapid reopen re-enters cleanly from
          // the current visual state with no stale inline styles.
          gsap.killTweensOf(card)
          gsap.set(card, { clearProps: 'opacity,transform,visibility' })
          animateDialogEnter(card, card)
        }
      })
      return
    }

    // Restore focus at the moment close starts; the exit animation must never
    // delay focus return. The onAfterLeave path below becomes a harmless no-op.
    void restoreFocus()
    const card = dialogCardRef.value
    if (card && renderedShow.value) {
      animateOverlayLeave(card, card, 'dialog', () => {
        // A reopen may have interrupted this exit; only release the overlay
        // when the owning state is still closed.
        if (!props.show) renderedShow.value = false
      })
    } else {
      renderedShow.value = false
    }
  }
)

onBeforeUnmount(() => {
  const card = dialogCardRef.value
  if (card) {
    gsap.killTweensOf(card)
    gsap.set(card, { clearProps: 'opacity,transform,visibility' })
  }
})
</script>

<template>
  <NModal
    :show="renderedShow"
    :closable="closable"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :trap-focus="true"
    :auto-focus="false"
    :block-scroll="true"
    @update:show="emit('update:show', $event)"
    @after-enter="onAfterEnter"
    @after-leave="onAfterLeave"
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

<!-- Unscoped: neutralizes Naive's own CSS transitions on the teleported card
and mask so GSAP owns the visuals while Naive keeps owning presence/focus
timing. Mask enter fades on a token duration; mask leave is instant so it ends
together with the GSAP card exit. -->
<style>
.product-dialog-card.fade-in-scale-up-transition-enter-active,
.product-dialog-card.fade-in-scale-up-transition-leave-active {
  transition: none;
}

.product-dialog-card.fade-in-scale-up-transition-enter-from,
.product-dialog-card.fade-in-scale-up-transition-leave-to {
  opacity: 1;
  transform: none;
}

.n-modal-mask.fade-in-transition-enter-active {
  transition-duration: var(--workspace-motion-duration-fast);
}

.n-modal-mask.fade-in-transition-leave-active {
  transition: none;
}
</style>
