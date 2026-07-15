<script setup lang="ts">
import ProductDrawer from './ProductDrawer.vue'

withDefaults(
  defineProps<{
    show: boolean
    title: string
    height?: string | number
    closable?: boolean
  }>(),
  {
    height: 'auto',
    closable: true,
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
    @update:show="emit('update:show', $event)"
  >
    <slot />
  </ProductDrawer>
</template>
