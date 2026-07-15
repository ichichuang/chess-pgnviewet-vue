<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton } from 'naive-ui'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'text'
type ButtonSize = 'small' | 'medium' | 'large'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    busy?: boolean
    disabled?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
    title?: string
  }>(),
  {
    variant: 'secondary',
    size: 'medium',
    nativeType: 'button',
    title: '',
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<InstanceType<typeof NButton> | null>(null)

function focus(): void {
  const el = buttonRef.value?.$el
  if (el instanceof HTMLElement) el.focus()
}

defineExpose({ focus })

const naiveType = computed(() => {
  if (props.variant === 'danger') return 'error'
  if (props.variant === 'primary') return 'primary'
  return 'default'
})

const isSecondary = computed(() => props.variant === 'secondary')
const isTertiary = computed(() => props.variant === 'text')
const isGhost = computed(() => props.variant === 'ghost')
</script>

<template>
  <NButton
    ref="buttonRef"
    :type="naiveType"
    :size="size"
    :secondary="isSecondary"
    :tertiary="isTertiary"
    :ghost="isGhost"
    :loading="busy"
    :disabled="disabled || busy"
    :native-type="nativeType"
    :title="title"
    :focusable="true"
    @click="emit('click', $event)"
  >
    <slot />
  </NButton>
</template>
