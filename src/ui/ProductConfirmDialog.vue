<script setup lang="ts">
import ProductButton from './ProductButton.vue'
import ProductDialog from './ProductDialog.vue'
import type { ProductOverlayReturnFocus } from './productOverlayFocus'

const props = withDefaults(
  defineProps<{
    show: boolean
    title: string
    body: string
    confirmText?: string
    cancelText?: string
    dangerous?: boolean
    busy?: boolean
    returnFocus?: ProductOverlayReturnFocus | undefined
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    dangerous: false,
    busy: false,
    returnFocus: undefined,
  }
)

const emit = defineEmits<{
  'update:show': [show: boolean]
  confirm: []
  cancel: []
}>()

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
</script>

<template>
  <ProductDialog
    :show="show"
    :title="title"
    :description="body"
    :role="dangerous ? 'alertdialog' : 'dialog'"
    :closable="!busy"
    :mask-closable="!busy"
    :close-on-esc="!busy"
    :return-focus="returnFocus"
    initial-focus="safe-action"
    @update:show="emit('update:show', $event)"
  >
    <template #footer>
      <ProductButton
        variant="secondary"
        :busy="busy"
        data-product-overlay-safe
        data-product-overlay-initial
        @click="onCancel"
      >
        {{ cancelText }}
      </ProductButton>
      <ProductButton
        :variant="dangerous ? 'danger' : 'primary'"
        :busy="busy"
        :data-product-overlay-danger="dangerous ? 'true' : undefined"
        @click="onConfirm"
      >
        {{ confirmText }}
      </ProductButton>
    </template>
  </ProductDialog>
</template>
