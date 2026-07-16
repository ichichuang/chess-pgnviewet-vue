<script setup lang="ts">
import { computed, ref } from 'vue'
import { NInput } from 'naive-ui'

const props = defineProps<{
  modelValue: string
  label?: string
  description?: string
  id?: string
  type?: 'text' | 'password'
  multiline?: boolean
  rows?: number
  placeholder?: string
  error?: string | undefined
  disabled?: boolean
  autocomplete?: string
  inputMode?: string
  enterkeyhint?: string
  spellcheck?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
}>()

const inputRef = ref<InstanceType<typeof NInput> | null>(null)
const inputId = computed(() => props.id ?? `pf-${Math.random().toString(36).slice(2, 9)}`)

function nativeInput(): HTMLInputElement | HTMLTextAreaElement | null {
  const el = inputRef.value?.$el
  if (!(el instanceof HTMLElement)) return null
  return el.querySelector('input, textarea') ?? null
}

function focus(): void {
  nativeInput()?.focus()
}

function blur(): void {
  nativeInput()?.blur()
}

defineExpose({ focus, blur })

const inputProps = computed(() => {
  const result: Record<string, unknown> = {
    id: inputId.value,
    value: props.modelValue,
    type: props.multiline ? 'textarea' : (props.type ?? 'text'),
    disabled: props.disabled ?? false,
    'aria-invalid': props.error ? true : undefined,
    'onUpdate:value': (value: string) => emit('update:modelValue', value),
    onFocus: () => emit('focus'),
    onBlur: () => emit('blur'),
  }
  if (props.placeholder !== undefined) result.placeholder = props.placeholder
  if (props.rows !== undefined) result.rows = props.rows
  if (props.autocomplete !== undefined) result.autocomplete = props.autocomplete
  if (props.inputMode !== undefined) result.inputMode = props.inputMode
  if (props.enterkeyhint !== undefined) result.enterkeyhint = props.enterkeyhint
  if (props.spellcheck !== undefined) result.spellcheck = props.spellcheck
  const describedBy = []
  if (props.description) describedBy.push(`${inputId.value}-description`)
  if (props.error) describedBy.push(`${inputId.value}-error`)
  if (describedBy.length > 0) result['aria-describedby'] = describedBy.join(' ')
  if (props.error) {
    result.status = 'error'
  }
  return result
})
</script>

<template>
  <div class="product-field">
    <label v-if="label" class="field-label" :for="inputId">{{ label }}</label>
    <p v-if="description" :id="`${inputId}-description`" class="field-description">
      {{ description }}
    </p>
    <NInput ref="inputRef" v-bind="inputProps">
      <template v-if="$slots.suffix" #suffix>
        <slot name="suffix" />
      </template>
    </NInput>
    <p v-if="error" :id="`${inputId}-error`" class="field-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.product-field {
  display: grid;
  gap: var(--s-1);
}

.field-label {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.field-description {
  margin: 0;
  color: var(--text-2);
  font-size: var(--fs-sm);
}

.field-error {
  margin: 0;
  color: var(--danger);
  font-size: var(--fs-sm);
}
</style>
