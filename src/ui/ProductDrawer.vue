<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'
import { NDrawer, NDrawerContent } from 'naive-ui'

import { animateDrawerEnter, animateOverlayLeave } from '@/features/motion/overlayMotion'

import {
  captureProductOverlayFocus,
  focusProductOverlayTarget,
  restoreProductOverlayFocus,
  type ProductOverlayInitialFocus,
  type ProductOverlayReturnFocus,
} from './productOverlayFocus'

type DrawerPlacement = 'right' | 'left' | 'top' | 'bottom'
type DrawerContentRef = ComponentPublicInstance | Element | null

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    placement?: DrawerPlacement
    width?: string | number
    height?: string | number
    closable?: boolean
    autoFocus?: boolean
    maskClosable?: boolean
    closeOnEsc?: boolean
    initialFocus?: ProductOverlayInitialFocus
    returnFocus?: ProductOverlayReturnFocus | undefined
  }>(),
  {
    placement: 'right',
    width: 'var(--drawer-w)',
    height: 'auto',
    closable: true,
    autoFocus: true,
    maskClosable: true,
    closeOnEsc: true,
    initialFocus: 'safe-action',
    returnFocus: undefined,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
  'after-leave': []
}>()

const isBlockAxisPlacement = computed(
  () => props.placement === 'top' || props.placement === 'bottom'
)
const drawerSizeProps = computed(() =>
  isBlockAxisPlacement.value
    ? { height: props.height ?? 'auto' }
    : { width: props.width ?? 'var(--drawer-w)' }
)

const contentRef = ref<DrawerContentRef>(null)
const renderedShow = ref(props.show)
let focusEntry: ReturnType<typeof captureProductOverlayFocus> | null = null

function contentElement(): HTMLElement | null {
  const content = contentRef.value
  if (content instanceof HTMLElement) return content
  if (content && '$el' in content && content.$el instanceof HTMLElement) return content.$el
  return null
}

function drawerSurfaceElement(): HTMLElement | null {
  const surface = contentElement()?.closest('.n-drawer')
  return surface instanceof HTMLElement ? surface : null
}

function focusActiveDrawer(): boolean {
  return focusProductOverlayTarget(contentElement(), null, props.initialFocus)
}

async function restoreFocus(): Promise<void> {
  const entry = focusEntry
  focusEntry = null
  if (!entry) return
  await nextTick()
  restoreProductOverlayFocus(entry)
}

function onAfterEnter(): void {
  void nextTick(focusActiveDrawer)
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      renderedShow.value = true
      focusEntry = captureProductOverlayFocus(
        props.returnFocus
          ? { fallback: props.returnFocus, focusActive: focusActiveDrawer }
          : { focusActive: focusActiveDrawer }
      )
      void nextTick(() => {
        focusActiveDrawer()
        const surface = drawerSurfaceElement()
        if (surface) {
          // Cancel any in-flight exit so a rapid reopen re-enters cleanly from
          // the current visual state with no stale inline styles.
          gsap.killTweensOf(surface)
          gsap.set(surface, { clearProps: 'opacity,transform,visibility' })
          animateDrawerEnter(surface, surface, props.placement)
        }
      })
      return
    }

    // Restore focus at the moment close starts; the exit animation must never
    // delay focus return.
    void restoreFocus()
    const surface = drawerSurfaceElement()
    if (surface && renderedShow.value) {
      animateOverlayLeave(surface, surface, props.placement, () => {
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
  const surface = drawerSurfaceElement()
  if (surface) {
    gsap.killTweensOf(surface)
    gsap.set(surface, { clearProps: 'opacity,transform,visibility' })
  }
})
</script>

<template>
  <NDrawer
    :show="renderedShow"
    class="product-drawer-surface"
    :placement="placement"
    v-bind="drawerSizeProps"
    :trap-focus="true"
    :auto-focus="autoFocus"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :block-scroll="true"
    @update:show="emit('update:show', $event)"
    @after-enter="onAfterEnter"
    @after-leave="emit('after-leave')"
  >
    <NDrawerContent
      ref="contentRef"
      class="product-drawer-content"
      :title="title"
      :closable="closable"
    >
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>
      <slot />
      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.product-drawer-content {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  min-height: 0;
}

.product-drawer-content :deep(.n-drawer-header),
.product-drawer-content :deep(.n-drawer-footer) {
  flex: 0 0 auto;
}

.product-drawer-content :deep(.n-drawer-body) {
  min-height: 0;
}

.product-drawer-content :deep(.n-drawer-body-content-wrapper) {
  min-height: 0;
  overflow: auto;
}
</style>

<!-- Unscoped: neutralizes Naive's own CSS transitions on the teleported drawer
surface and mask so GSAP owns the visuals while Naive keeps owning
presence/focus timing. Mask enter fades on a token duration; mask leave is
instant so it ends together with the GSAP surface exit. -->
<style>
.product-drawer-surface.slide-in-from-right-transition-enter-active,
.product-drawer-surface.slide-in-from-right-transition-leave-active,
.product-drawer-surface.slide-in-from-left-transition-enter-active,
.product-drawer-surface.slide-in-from-left-transition-leave-active,
.product-drawer-surface.slide-in-from-top-transition-enter-active,
.product-drawer-surface.slide-in-from-top-transition-leave-active,
.product-drawer-surface.slide-in-from-bottom-transition-enter-active,
.product-drawer-surface.slide-in-from-bottom-transition-leave-active {
  transition: none;
}

.product-drawer-surface.slide-in-from-right-transition-enter-from,
.product-drawer-surface.slide-in-from-right-transition-leave-to,
.product-drawer-surface.slide-in-from-left-transition-enter-from,
.product-drawer-surface.slide-in-from-left-transition-leave-to,
.product-drawer-surface.slide-in-from-top-transition-enter-from,
.product-drawer-surface.slide-in-from-top-transition-leave-to,
.product-drawer-surface.slide-in-from-bottom-transition-enter-from,
.product-drawer-surface.slide-in-from-bottom-transition-leave-to {
  opacity: 1;
  transform: none;
}

.n-drawer-mask.fade-in-transition-enter-active {
  transition-duration: var(--workspace-motion-duration-fast);
}

.n-drawer-mask.fade-in-transition-leave-active {
  transition: none;
}
</style>
