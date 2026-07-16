<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute } from 'vue-router'

type RouteTitleRef = ComponentPublicInstance | Element | null

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    backTo?: string
    titleId?: string
    contentId?: string
    skipTargetId?: string
  }>(),
  {
    subtitle: '',
    backTo: '',
    titleId: '',
    contentId: '',
    skipTargetId: '',
  }
)

defineSlots<{
  header?: (props: {
    titleId: string
    contentId: string
    registerTitle: (element: RouteTitleRef) => void
    focusTitle: () => void
  }) => unknown
  actions?: () => unknown
  default?: () => unknown
}>()

const route = useRoute()
const instanceId = useId().replace(/[^A-Za-z0-9_-]/gu, '')
const generatedTitleId = `product-route-title-${instanceId}`
const generatedContentId = `product-route-content-${instanceId}`

const routeTitleId = computed(() => props.titleId || generatedTitleId)
const routeContentId = computed(() => {
  const requestedContentId = props.contentId || props.skipTargetId
  if (requestedContentId && requestedContentId !== routeTitleId.value) return requestedContentId
  return generatedContentId
})

const titleRef = ref<HTMLHeadingElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

async function focusTitleAfterRender(): Promise<void> {
  await nextTick()
  focusTitle()
}

function focusTitle(): void {
  titleRef.value?.focus()
}

function registerTitle(element: RouteTitleRef): void {
  if (element instanceof HTMLHeadingElement) {
    titleRef.value = element
    return
  }

  const componentElement =
    element && '$el' in element && element.$el instanceof HTMLHeadingElement
      ? element.$el
      : null
  titleRef.value = componentElement
}

async function focusContent(event: MouseEvent): Promise<void> {
  event.preventDefault()
  await nextTick()
  contentRef.value?.focus()
}

onMounted(() => {
  void focusTitleAfterRender()
})

watch(
  () => route.path,
  () => {
    void focusTitleAfterRender()
  }
)

defineExpose({ focusTitle })
</script>

<template>
  <div class="product-route-shell">
    <a :href="`#${routeContentId}`" class="skip-link" @click="focusContent">跳转到主要内容</a>
    <header class="product-route-header">
      <slot
        name="header"
        :title-id="routeTitleId"
        :content-id="routeContentId"
        :register-title="registerTitle"
        :focus-title="focusTitle"
      >
        <div class="route-title-block">
          <h1 :id="routeTitleId" :ref="registerTitle" class="route-title" tabindex="-1">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="route-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="route-actions">
          <slot name="actions" />
        </div>
      </slot>
    </header>
    <main
      :id="routeContentId"
      ref="contentRef"
      class="product-route-body"
      tabindex="-1"
      :aria-labelledby="routeTitleId"
    >
      <slot />
    </main>
  </div>
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

.route-title:focus {
  border-radius: var(--r-xs);
  box-shadow: var(--state-focus-ring);
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

/* Synchronized with --route-bp-narrow in tokens.css. */
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
