<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    titleId?: string
    skipTargetId?: string
  }>(),
  {
    subtitle: '',
    titleId: '',
    skipTargetId: '',
  }
)

const instanceId = useId().replace(/[^A-Za-z0-9_-]/gu, '')
const routeTitleId = computed(() => props.titleId || `venue-display-title-${instanceId}`)
const routeContentId = computed(() => {
  if (props.skipTargetId && props.skipTargetId !== routeTitleId.value) return props.skipTargetId
  return `venue-display-stage-${instanceId}`
})
const titleRef = ref<HTMLHeadingElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  titleRef.value?.focus()
})

function focusTitle(): void {
  titleRef.value?.focus()
}

function focusStage(event: MouseEvent): void {
  event.preventDefault()
  stageRef.value?.focus({ preventScroll: true })
}

defineExpose({ focusTitle })
</script>

<template>
  <main class="venue-display-shell">
    <a :href="`#${routeContentId}`" class="skip-link" @click="focusStage">跳转到主要内容</a>

    <div class="venue-display-hud hud-top" aria-label="大屏信息">
      <div class="display-title-block">
        <h1 :id="routeTitleId" ref="titleRef" class="display-title" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="display-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots['controls']" class="display-hud-controls">
        <slot name="controls" />
      </div>
      <div v-if="$slots['header-actions']" class="display-hud-actions">
        <slot name="header-actions" />
      </div>
    </div>

    <section
      :id="routeContentId"
      ref="stageRef"
      class="venue-display-stage"
      tabindex="-1"
      :aria-labelledby="routeTitleId"
    >
      <slot />
    </section>

    <div class="venue-display-hud hud-bottom" aria-live="polite">
      <slot name="status" />
    </div>
  </main>
</template>

<style scoped>
.venue-display-shell {
  position: relative;
  width: 100vw;
  height: var(--workspace-viewport-h);
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}

.skip-link {
  position: absolute;
  top: -100%;
  left: var(--s-4);
  z-index: calc(var(--workspace-shell-z-raised) + 1);
  padding: var(--s-2) var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}

.skip-link:focus {
  top: var(--s-3);
}

.venue-display-hud {
  position: absolute;
  left: 0;
  right: 0;
  z-index: var(--workspace-shell-z-raised);
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  padding: 0 var(--s-5);
  border: 0 solid var(--border);
  background: var(--venue-display-hud-bg);
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.hud-top {
  top: 0;
  height: var(--venue-display-hud-h);
  border-bottom-width: var(--workspace-border-w);
}

.hud-bottom {
  bottom: 0;
  height: var(--venue-display-status-h);
  border-top-width: var(--workspace-border-w);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.display-title-block {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.display-title {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-lg);
  outline: none;
}

.display-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

.display-hud-controls,
.display-hud-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.venue-display-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: var(--venue-display-hud-h) var(--s-5) var(--venue-display-status-h);
  overflow: hidden;
  outline: none;
}

/* Synchronized with --route-bp-narrow in tokens.css. */
@media (width <= 760px) {
  .venue-display-hud {
    flex-wrap: wrap;
    height: auto;
    min-height: var(--venue-display-hud-h);
    padding: var(--s-2) var(--s-4);
  }

  .display-title-block {
    flex: 1 1 auto;
  }
}
</style>
