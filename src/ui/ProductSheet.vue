<script setup lang="ts">
import type { ProductOverlayInitialFocus, ProductOverlayReturnFocus } from './productOverlayFocus'
import ProductDrawer from './ProductDrawer.vue'

withDefaults(
  defineProps<{
    show: boolean
    title: string
    height?: string | number
    closable?: boolean
    autoFocus?: boolean
    maskClosable?: boolean
    closeOnEsc?: boolean
    initialFocus?: ProductOverlayInitialFocus
    returnFocus?: ProductOverlayReturnFocus | undefined
  }>(),
  {
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
</script>

<template>
  <ProductDrawer
    :show="show"
    :title="title"
    placement="bottom"
    :height="height ?? 'auto'"
    :closable="closable ?? true"
    :auto-focus="autoFocus ?? true"
    :mask-closable="maskClosable ?? true"
    :close-on-esc="closeOnEsc ?? true"
    :initial-focus="initialFocus ?? 'safe-action'"
    :return-focus="returnFocus"
    @update:show="emit('update:show', $event)"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ProductDrawer>
</template>
