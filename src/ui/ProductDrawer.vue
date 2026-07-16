<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'

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
let focusEntry: ReturnType<typeof captureProductOverlayFocus> | null = null

function contentElement(): HTMLElement | null {
  const content = contentRef.value
  if (content instanceof HTMLElement) return content
  if (content && '$el' in content && content.$el instanceof HTMLElement) return content.$el
  return null
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
      focusEntry = captureProductOverlayFocus(
        props.returnFocus
          ? { fallback: props.returnFocus, focusActive: focusActiveDrawer }
          : { focusActive: focusActiveDrawer }
      )
      void nextTick(focusActiveDrawer)
      return
    }

    void restoreFocus()
  }
)
</script>

<template>
  <NDrawer
    :show="show"
    :placement="placement"
    v-bind="drawerSizeProps"
    :trap-focus="true"
    :auto-focus="autoFocus"
    :mask-closable="maskClosable"
    :close-on-esc="closeOnEsc"
    :block-scroll="true"
    @update:show="emit('update:show', $event)"
    @after-enter="onAfterEnter"
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
