<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    backTo?: string
    skipTargetId?: string
  }>(),
  {
    subtitle: '',
    backTo: '',
    skipTargetId: 'main-content',
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
  <main class="product-route-shell">
    <a :href="`#${skipTargetId}`" class="skip-link">跳转到主要内容</a>
    <header class="product-route-header">
      <slot name="header">
        <div class="route-title-block">
          <h1 :id="skipTargetId" ref="titleRef" class="route-title" tabindex="-1">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="route-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="route-actions">
          <slot name="actions" />
        </div>
      </slot>
    </header>
    <section :id="skipTargetId" class="product-route-body" tabindex="-1" aria-label="页面内容">
      <slot />
    </section>
  </main>
</template>

<style scoped>
.product-route-shell {
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

.product-route-header {
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

.route-title-block {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.route-title {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-xl);
  outline: none;
}

.route-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.route-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.product-route-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--route-body-pad);
  overflow: auto;
  outline: none;
}

@media (width <= 760px) {
  .product-route-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .route-actions {
    flex-wrap: wrap;
  }
}
</style>
