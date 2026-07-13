<script setup lang="ts">
withDefaults(
  defineProps<{
    dragging: boolean
    disabled?: boolean
    label: string
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  pointerDown: [event: PointerEvent]
}>()
</script>

<template>
  <button
    class="workspace-splitter"
    type="button"
    :class="{ dragging }"
    :disabled="disabled"
    :aria-label="label"
    @pointerdown="emit('pointerDown', $event)"
  >
    <span aria-hidden="true" />
  </button>
</template>

<style scoped>
.workspace-splitter {
  position: relative;
  flex: 0 0 var(--workspace-splitter-h);
  width: 100%;
  min-height: var(--workspace-splitter-h);
  padding: 0;
  border: 0;
  border-top: var(--workspace-border-w) solid var(--border);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
  cursor: row-resize;
  touch-action: none;
}

.workspace-splitter::before {
  position: absolute;
  inset: var(--workspace-splitter-hit-offset) 0;
  content: '';
}

.workspace-splitter span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--workspace-splitter-grip-w);
  height: var(--workspace-splitter-grip-h);
  border-radius: var(--r-full);
  background: var(--text-muted);
  transform: translate(-50%, -50%);
  transition:
    background var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard),
    width var(--workspace-motion-duration-base) var(--workspace-motion-ease-standard);
}

.workspace-splitter:hover span,
.workspace-splitter.dragging span {
  width: var(--workspace-splitter-grip-w-active);
  background: var(--accent);
}

.workspace-splitter:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}
</style>
