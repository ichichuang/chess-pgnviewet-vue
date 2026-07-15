<script setup lang="ts">
import { NSwitch } from 'naive-ui'

const { modelValue, label = '', disabled = false } = defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="product-switch">
    <span v-if="label" class="switch-label">{{ label }}</span>
    <NSwitch
      :value="modelValue"
      :disabled="disabled ?? false"
      @update:value="emit('update:modelValue', $event)"
    />
  </label>
</template>

<style scoped>
.product-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-height: var(--control-h-sm);
}

.switch-label {
  color: var(--text);
  font-size: var(--fs-base);
}
</style>
