<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { NPagination } from 'naive-ui'
import { gsap } from 'gsap'

import {
  motionDuration,
  motionEase,
  motionScalar,
  prefersReducedMotion,
} from '@/features/motion/gsapTokens'

const props = defineProps<{
  page: number
  pageSize?: number
  pageCount?: number
  itemCount?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const paginationProps = computed(() => {
  const result: Record<string, unknown> = {
    page: props.page,
    disabled: props.disabled ?? false,
    'onUpdate:page': (page: number) => emit('update:page', page),
  }
  if (props.pageSize !== undefined) result.pageSize = props.pageSize
  if (props.pageCount !== undefined) result.pageCount = props.pageCount
  if (props.itemCount !== undefined) result.itemCount = props.itemCount
  return result
})

const rootEl = ref<HTMLElement | null>(null)
let pressContext: gsap.Context | null = null

// Delegated press feedback for Naive UI pagination items. Page/prev/next
// items render as non-button `.n-pagination-item` elements, so this adapter
// owns a local delegated listener; disabled items never animate and the page
// commit itself is never touched.
function pressTarget(event: Event): HTMLElement | null {
  const target = event.target
  if (!(target instanceof Element)) return null
  const item = target.closest('button, .n-pagination-item')
  if (!(item instanceof HTMLElement)) return null
  if (item instanceof HTMLButtonElement && item.disabled) return null
  if (item.hasAttribute('disabled')) return null
  if (item.classList.contains('n-pagination-item--disabled')) return null
  return item
}

function animateItemPress(event: Event): void {
  if (prefersReducedMotion()) return
  const item = pressTarget(event)
  if (!item) return
  gsap.killTweensOf(item)
  pressContext?.add(() => {
    gsap.fromTo(
      item,
      { scale: motionScalar(rootEl.value, '--workspace-motion-press-scale') },
      {
        scale: 1,
        duration: motionDuration(rootEl.value, '--workspace-motion-duration-fast'),
        ease: motionEase(rootEl.value, '--workspace-motion-ease-state'),
        overwrite: true,
        clearProps: 'transform',
      }
    )
  })
}

function onItemKeyDown(event: KeyboardEvent): void {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
  animateItemPress(event)
}

onMounted(() => {
  const root = rootEl.value
  if (!root) return
  pressContext = gsap.context(() => undefined, root)
  root.addEventListener('pointerdown', animateItemPress, { capture: true })
  root.addEventListener('keydown', onItemKeyDown, { capture: true })
})

onBeforeUnmount(() => {
  const root = rootEl.value
  if (root) {
    root.removeEventListener('pointerdown', animateItemPress, { capture: true })
    root.removeEventListener('keydown', onItemKeyDown, { capture: true })
  }
  pressContext?.revert()
  pressContext = null
})
</script>

<template>
  <NPagination
    :ref="(el) => { rootEl = (el as any)?.$el ?? null }"
    v-bind="paginationProps"
  />
</template>
