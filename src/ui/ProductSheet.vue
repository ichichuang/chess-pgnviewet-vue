<script setup lang="ts">
import ProductDrawer from './ProductDrawer.vue'

withDefaults(
  defineProps<{
    show: boolean
    title: string
    height?: string | number
    closable?: boolean
    autoFocus?: boolean
  }>(),
  {
    height: 'auto',
    closable: true,
    autoFocus: true,
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
    :width="height ?? 'auto'"
    :closable="closable ?? true"
    :auto-focus="autoFocus ?? true"
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
