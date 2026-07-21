<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'

const props = withDefaults(
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
  keyDown: [event: KeyboardEvent]
}>()

const gripEl = ref<HTMLElement | null>(null)

function gripEmphasisScale(): number {
  const grip = gripEl.value
  const rest = motionScalar(grip, '--workspace-splitter-grip-w')
  const active = motionScalar(grip, '--workspace-splitter-grip-w-active')

  return rest > 0 && active > rest ? active / rest : 1
}

function emphasizeGrip(active: boolean): void {
  const grip = gripEl.value
  if (!grip) return

  gsap.killTweensOf(grip)
  gsap.to(grip, {
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
    scaleY: active ? gripEmphasisScale() : 1,
    duration: motionDuration(grip, '--workspace-motion-duration-fast'),
    ease: motionEase(grip, '--workspace-motion-ease-state'),
    overwrite: true,
    ...(active ? {} : { clearProps: 'transform' }),
  })
}

const KEYBOARD_EMPHASIS_KEYS = new Set(['ArrowUp', 'Up', 'ArrowDown', 'Down', 'Home', 'End'])

function onKeyDown(event: KeyboardEvent): void {
  const grip = gripEl.value

  if (grip && !event.repeat && KEYBOARD_EMPHASIS_KEYS.has(event.key)) {
    gsap.killTweensOf(grip)
    gsap
      .timeline()
      .to(grip, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        scaleY: gripEmphasisScale(),
        duration: motionDuration(grip, '--workspace-motion-duration-fast'),
        ease: motionEase(grip, '--workspace-motion-ease-state'),
      })
      .to(grip, {
        scaleY: 1,
        duration: motionDuration(grip, '--workspace-motion-duration-base'),
        ease: motionEase(grip, '--workspace-motion-ease-state'),
        clearProps: 'transform',
      })
  }

  emit('keyDown', event)
}

watch(
  () => props.dragging,
  (dragging) => emphasizeGrip(dragging)
)

onBeforeUnmount(() => {
  const grip = gripEl.value
  if (grip) {
    gsap.killTweensOf(grip)
    gsap.set(grip, { clearProps: 'transform' })
  }
})
</script>

<template>
  <button
    class="workspace-splitter"
    type="button"
    :class="{ dragging }"
    :disabled="disabled"
    :aria-label="label"
    role="separator"
    aria-orientation="horizontal"
    aria-valuemin="0"
    aria-valuemax="100"
    @pointerdown="emit('pointerDown', $event)"
    @keydown="onKeyDown"
  >
    <span ref="gripEl" aria-hidden="true" />
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
.workspace-splitter.dragging span,
.workspace-splitter:focus-visible span {
  width: var(--workspace-splitter-grip-w-active);
  background: var(--accent);
}

.workspace-splitter:focus-visible {
  outline: var(--workspace-focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--workspace-focus-ring-offset);
}

.workspace-splitter:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}
</style>
