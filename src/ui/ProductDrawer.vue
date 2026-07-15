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
    autoFocus?: boolean
  }>(),
  {
    placement: 'right',
    width: 'var(--drawer-w)',
    closable: true,
    autoFocus: true,
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
    :auto-focus="autoFocus"
    :mask-closable="true"
    :close-on-esc="true"
    @update:show="emit('update:show', $event)"
  >
    <NDrawerContent :title="title" :closable="closable">
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
