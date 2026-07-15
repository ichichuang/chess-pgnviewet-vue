<script setup lang="ts">
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

export interface ProductSelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string | number | null
  options: ProductSelectOption[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const selectProps = computed(() => {
  const result: Record<string, unknown> = {
    value: props.modelValue,
    options: props.options as any,
    disabled: props.disabled ?? false,
    'onUpdate:value': (value: string | number | null) => emit('update:modelValue', value),
  }
  if (props.placeholder !== undefined) result.placeholder = props.placeholder
  if (props.error) result.status = 'error'
  return result
})
</script>

<template>
  <div class="product-select">
    <label v-if="label" class="select-label">{{ label }}</label>
    <NSelect v-bind="selectProps" />
    <p v-if="error" class="select-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.product-select {
  display: grid;
  gap: var(--s-1);
}

.select-label {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.select-error {
  margin: 0;
  color: var(--danger);
  font-size: var(--fs-sm);
}
</style>
