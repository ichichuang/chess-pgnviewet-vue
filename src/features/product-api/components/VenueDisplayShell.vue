<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    skipTargetId?: string
  }>(),
  {
    subtitle: '',
    skipTargetId: 'display-stage',
  }
)

const titleRef = ref<HTMLHeadingElement | null>(null)

onMounted(async () => {
  await nextTick()
  titleRef.value?.focus()
})

function focusTitle(): void {
  titleRef.value?.focus()
}

defineExpose({ focusTitle })
</script>

<template>
  <main class="venue-display-shell">
    <a :href="`#${skipTargetId}`" class="skip-link">跳转到主要内容</a>

    <header class="venue-display-header">
      <div class="display-title-block">
        <h1 :id="skipTargetId" ref="titleRef" class="display-title" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="display-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots['header-actions']" class="display-header-actions">
        <slot name="header-actions" />
      </div>
    </header>

    <div class="venue-display-controls" aria-label="大屏操作">
      <slot name="controls" />
    </div>

    <section :id="skipTargetId" class="venue-display-stage" tabindex="-1" aria-label="大屏展示舞台">
      <slot />
    </section>

    <footer class="venue-display-status" aria-live="polite">
      <slot name="status" />
    </footer>
  </main>
</template>

<style scoped>
.venue-display-shell {
  display: flex;
  flex-direction: column;
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

.venue-display-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-height: var(--route-header-min-h);
  min-width: 0;
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.display-title-block {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.display-title {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-xl);
  outline: none;
}

.display-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.display-header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.venue-display-controls {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.venue-display-stage {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  padding: var(--route-body-pad);
  overflow: hidden;
  outline: none;
}

.venue-display-status {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  padding: var(--s-3) var(--s-5);
  border-top: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

/* Synchronized with --route-bp-narrow in tokens.css. */
@media (width <= 760px) {
  .venue-display-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .display-header-actions {
    flex-wrap: wrap;
  }
}
</style>
