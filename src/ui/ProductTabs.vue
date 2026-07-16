<script setup lang="ts">
import { NTab, NTabs } from 'naive-ui'
import { computed, nextTick, ref, useId, watch } from 'vue'

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

const tabsRoot = ref<HTMLElement | null>(null)
const pendingFocusName = ref<string | number | null>(null)
const instanceId = `product-tabs-${useId().replace(/[^A-Za-z0-9_-]/g, '-')}`

const enabledPaneEntries = computed(() =>
  props.panes
    .map((pane, index) => ({ pane, index }))
    .filter(({ pane }) => !pane.disabled)
)

const activeTabName = computed<string | number | null>(() => {
  if (enabledPaneEntries.value.some(({ pane }) => pane.name === props.modelValue)) {
    return props.modelValue
  }

  return nearestEnabledPaneName(props.modelValue)
})

const activeTabsValue = computed(() => activeTabName.value ?? props.modelValue)

function paneIdPart(name: string | number): string {
  const rawName = String(name)
  const readable = rawName
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const encoded = Array.from(`${typeof name}:${rawName}`, (char) =>
    (char.codePointAt(0) ?? 0).toString(36)
  ).join('-')

  return `${readable || 'pane'}-${encoded}`
}

function tabId(name: string | number): string {
  return `${instanceId}-tab-${paneIdPart(name)}`
}

function panelId(name: string | number): string {
  return `${instanceId}-panel-${paneIdPart(name)}`
}

function isActivePane(pane: ProductTabPaneDef): boolean {
  return pane.name === activeTabName.value && !pane.disabled
}

function nearestEnabledPaneName(fromName: string | number): string | number | null {
  const enabled = enabledPaneEntries.value
  if (enabled.length === 0) return null

  const exact = enabled.find(({ pane }) => pane.name === fromName)
  if (exact) return exact.pane.name

  const currentIndex = Math.max(
    0,
    props.panes.findIndex((pane) => pane.name === fromName)
  )
  const next = enabled.find(({ index }) => index >= currentIndex)
  return (next ?? enabled[enabled.length - 1])?.pane.name ?? null
}

function enabledPaneIndex(name: string | number | null): number {
  if (name === null) return -1
  return enabledPaneEntries.value.findIndex(({ pane }) => pane.name === name)
}

function focusTab(name: string | number): void {
  if (typeof document === 'undefined') return

  void nextTick(() => {
    document.getElementById(tabId(name))?.focus({ preventScroll: true })
  })
}

function selectPane(name: string | number, focusAfterSelect: boolean): void {
  const pane = props.panes.find((candidate) => candidate.name === name)
  if (!pane || pane.disabled) return

  if (focusAfterSelect) {
    pendingFocusName.value = name
  }

  emit('update:modelValue', name)

  if (focusAfterSelect) {
    focusTab(name)
  }
}

function tabNameFromElement(element: Element | null): string | number | null {
  const tabElement = element?.closest('[role="tab"]')
  if (!tabElement) return null

  return props.panes.find((pane) => tabId(pane.name) === tabElement.id)?.name ?? null
}

function focusIsOnTab(): boolean {
  if (typeof document === 'undefined') return false

  const activeElement = document.activeElement
  return (
    activeElement instanceof HTMLElement &&
    activeElement.getAttribute('role') === 'tab' &&
    !!tabsRoot.value?.contains(activeElement)
  )
}

function activateByOffset(fromName: string | number | null, offset: number): void {
  const enabled = enabledPaneEntries.value
  if (enabled.length === 0) return

  const current = enabledPaneIndex(fromName)
  const currentIndex = current >= 0 ? current : enabledPaneIndex(activeTabName.value)
  const next = (currentIndex + offset + enabled.length) % enabled.length
  const pane = enabled[next]?.pane
  if (pane) selectPane(pane.name, true)
}

function activateFirst(): void {
  const pane = enabledPaneEntries.value[0]?.pane
  if (pane) selectPane(pane.name, true)
}

function activateLast(): void {
  const pane = enabledPaneEntries.value[enabledPaneEntries.value.length - 1]?.pane
  if (pane) selectPane(pane.name, true)
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.isComposing) return

  const key = event.key
  let handled = false
  const focusedName = tabNameFromElement(event.target instanceof Element ? event.target : null)

  if (focusedName === null) return

  if (key === 'ArrowRight') {
    activateByOffset(focusedName, 1)
    handled = true
  } else if (key === 'ArrowLeft') {
    activateByOffset(focusedName, -1)
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

function onMouseSelect(name: string | number, event: MouseEvent): void {
  if (props.panes.find((pane) => pane.name === name)?.disabled) return

  pendingFocusName.value = name
  const target = event.currentTarget
  if (target instanceof HTMLElement) {
    void nextTick(() => target.focus({ preventScroll: true }))
  }
}

watch(
  () => [props.modelValue, props.panes.map((pane) => `${String(pane.name)}:${pane.disabled}`)],
  () => {
    const fallback = activeTabName.value
    if (fallback !== null && fallback !== props.modelValue) {
      emit('update:modelValue', fallback)
    }
  },
  { immediate: true, flush: 'post' }
)

watch(
  activeTabName,
  (name) => {
    if (name === null) return

    if (pendingFocusName.value === name || focusIsOnTab()) {
      focusTab(name)
    }

    pendingFocusName.value = null
  },
  { flush: 'post' }
)
</script>

<template>
  <div ref="tabsRoot" class="product-tabs">
    <NTabs
      class="product-tabs-nav"
      role="tablist"
      aria-orientation="horizontal"
      :aria-label="`标签页，共 ${panes.length} 项`"
      :value="activeTabsValue"
      :type="type"
      :animated="animated"
      @keydown="onKeyDown"
      @update:value="selectPane($event, false)"
    >
      <NTab
        v-for="pane in panes"
        :id="tabId(pane.name)"
        :key="pane.name"
        :name="pane.name"
        :tab="pane.tab"
        :disabled="pane.disabled ?? false"
        role="tab"
        :tabindex="isActivePane(pane) ? 0 : -1"
        :aria-selected="isActivePane(pane) ? 'true' : 'false'"
        :aria-controls="panelId(pane.name)"
        :aria-disabled="pane.disabled ? 'true' : undefined"
        @click="onMouseSelect(pane.name, $event)"
      />
    </NTabs>

    <div class="product-tabs-panels">
      <section
        v-for="pane in panes"
        :id="panelId(pane.name)"
        :key="panelId(pane.name)"
        class="product-tab-panel"
        role="tabpanel"
        :aria-labelledby="tabId(pane.name)"
        :aria-hidden="isActivePane(pane) ? undefined : 'true'"
        :data-active="isActivePane(pane) ? 'true' : undefined"
        :hidden="!isActivePane(pane)"
      >
        <slot :name="String(pane.name)" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.product-tabs {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.product-tabs-nav {
  flex: 0 0 auto;
}

.product-tabs-panels,
.product-tab-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.product-tab-panel[hidden] {
  display: none;
}

.product-tabs-nav :deep(.n-tabs-tab[role='tab']:focus-visible) {
  border-radius: var(--r-sm);
  outline: var(--workspace-border-w) solid var(--border-focus);
  outline-offset: var(--workspace-border-w);
  box-shadow: var(--state-focus-ring);
}
</style>
