<script setup lang="ts">
import { computed, ref } from 'vue'

import ProductButton from './ProductButton.vue'
import ProductField from './ProductField.vue'

const props = defineProps<{
  modelValue: string
  label?: string
  id?: string
  placeholder?: string
  error?: string | undefined
  disabled?: boolean
  autocomplete?: string
  enterkeyhint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
}>()

const fieldRef = ref<InstanceType<typeof ProductField> | null>(null)
const visible = ref(false)

function focus(): void {
  fieldRef.value?.focus()
}

function blur(): void {
  fieldRef.value?.blur()
}

defineExpose({ focus, blur })

const fieldProps = computed(() => {
  const result: Record<string, unknown> = {
    modelValue: props.modelValue,
    type: visible.value ? 'text' : 'password',
    disabled: props.disabled ?? false,
    enterkeyhint: props.enterkeyhint ?? 'go',
  }
  if (props.id !== undefined) result.id = props.id
  if (props.label !== undefined) result.label = props.label
  if (props.placeholder !== undefined) result.placeholder = props.placeholder
  if (props.error !== undefined) result.error = props.error
  if (props.autocomplete !== undefined) result.autocomplete = props.autocomplete
  return result
})
</script>

<template>
  <ProductField
    ref="fieldRef"
    v-bind="(fieldProps as any)"
    @update:model-value="emit('update:modelValue', $event)"
    @focus="emit('focus')"
    @blur="emit('blur')"
  >
    <template #suffix>
      <ProductButton
        variant="text"
        size="small"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="visible = !visible"
      >
        {{ visible ? '隐藏' : '显示' }}
      </ProductButton>
    </template>
  </ProductField>
</template>
