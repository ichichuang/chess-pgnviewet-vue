<script setup lang="ts">
import { NPopover } from 'naive-ui'

type PopoverPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end'

withDefaults(
  defineProps<{
    trigger?: 'click' | 'hover' | 'focus'
    placement?: PopoverPlacement
    disabled?: boolean
  }>(),
  {
    trigger: 'click',
    placement: 'bottom',
  }
)

const emit = defineEmits<{
  updateShow: [show: boolean]
}>()
</script>

<template>
  <NPopover
    :trigger="trigger"
    :placement="(placement as any)"
    :disabled="disabled"
    :show-arrow="true"
    @update:show="emit('updateShow', $event)"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <slot />
  </NPopover>
</template>
