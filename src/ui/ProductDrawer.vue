<script setup lang="ts">
import { computed } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'

type DrawerPlacement = 'right' | 'left' | 'top' | 'bottom'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    placement?: DrawerPlacement
    width?: string | number
    closable?: boolean
  }>(),
  {
    placement: 'right',
    width: '320px',
    closable: true,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
}>()

const drawerWidth = computed(() => props.width)
</script>

<template>
  <NDrawer
    :show="show"
    :placement="placement"
    :width="drawerWidth"
    :trap-focus="true"
    :auto-focus="true"
    :mask-closable="true"
    :close-on-esc="true"
    @update:show="emit('update:show', $event)"
  >
    <NDrawerContent :title="title" :closable="closable">
      <slot />
    </NDrawerContent>
  </NDrawer>
</template>
