<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'

export interface ProductTabPaneDef {
  name: string | number
  tab: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    type?: 'line' | 'segment'
    animated?: boolean
    panes: ProductTabPaneDef[]
  }>(),
  {
    type: 'segment',
    animated: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function enabledPaneIndexes(): number[] {
  return props.panes
    .map((pane, index) => ({ pane, index }))
    .filter(({ pane }) => !pane.disabled)
    .map(({ index }) => index)
}

function currentEnabledIndex(): number {
  const enabled = enabledPaneIndexes()
  const current = enabled.findIndex((index) => props.panes[index]?.name === props.modelValue)
  return current >= 0 ? current : 0
}

function activateByOffset(offset: number): void {
  const enabled = enabledPaneIndexes()
  if (enabled.length === 0) return

  const current = currentEnabledIndex()
  const next = (current + offset + enabled.length) % enabled.length
  const pane = props.panes[enabled[next] ?? 0]
  if (pane) emit('update:modelValue', pane.name)
}

function activateFirst(): void {
  const enabled = enabledPaneIndexes()
  const firstIndex = enabled[0]
  const pane = firstIndex !== undefined ? props.panes[firstIndex] : undefined
  if (pane) emit('update:modelValue', pane.name)
}

function activateLast(): void {
  const enabled = enabledPaneIndexes()
  const lastIndex = enabled[enabled.length - 1]
  const pane = lastIndex !== undefined ? props.panes[lastIndex] : undefined
  if (pane) emit('update:modelValue', pane.name)
}

function onKeyDown(event: KeyboardEvent): void {
  const key = event.key
  let handled = false

  if (key === 'ArrowRight' || key === 'ArrowDown') {
    activateByOffset(1)
    handled = true
  } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
    activateByOffset(-1)
    handled = true
  } else if (key === 'Home') {
    activateFirst()
    handled = true
  } else if (key === 'End') {
    activateLast()
    handled = true
  }

  if (handled) {
    event.preventDefault()
    event.stopPropagation()
  }
}
</script>

<template>
  <div
    class="product-tabs"
    role="tablist"
    tabindex="0"
    :aria-label="`标签页，共 ${panes.length} 项`"
    @keydown="onKeyDown"
  >
    <NTabs
      :value="modelValue"
      :type="type"
      :animated="animated"
      @update:value="emit('update:modelValue', $event)"
    >
      <NTabPane
        v-for="pane in panes"
        :key="pane.name"
        :name="pane.name"
        :tab="pane.tab"
        :disabled="pane.disabled ?? false"
      >
        <slot :name="String(pane.name)" />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.product-tabs {
  outline: none;
}

.product-tabs:focus-visible {
  border-radius: var(--r-sm);
  outline: var(--workspace-focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--workspace-focus-ring-offset);
}
</style>
