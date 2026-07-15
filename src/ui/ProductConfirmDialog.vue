<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import ProductButton from './ProductButton.vue'
import ProductDialog from './ProductDialog.vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    body: string
    confirmText?: string
    cancelText?: string
    dangerous?: boolean
    busy?: boolean
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    dangerous: false,
    busy: false,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
  confirm: []
  cancel: []
}>()

const cancelRef = ref<HTMLElement | null>(null)

function close(): void {
  emit('update:show', false)
}

function onCancel(): void {
  if (props.busy) return
  close()
  emit('cancel')
}

function onConfirm(): void {
  if (props.busy) return
  emit('confirm')
}

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      await nextTick()
      cancelRef.value?.focus()
    }
  }
)
</script>

<template>
  <ProductDialog
    :show="show"
    :title="title"
    :closable="!busy"
    :mask-closable="!busy"
    :close-on-esc="!busy"
    @update:show="emit('update:show', $event)"
  >
    <p>{{ body }}</p>
    <template #footer>
      <ProductButton ref="cancelRef" variant="secondary" :busy="busy" @click="onCancel">
        {{ cancelText }}
      </ProductButton>
      <ProductButton :variant="dangerous ? 'danger' : 'primary'" :busy="busy" @click="onConfirm">
        {{ confirmText }}
      </ProductButton>
    </template>
  </ProductDialog>
</template>
