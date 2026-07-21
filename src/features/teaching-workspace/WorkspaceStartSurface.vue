<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import { usePressMotion } from '@/features/motion/usePressMotion'

import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const props = defineProps<{
  canOpenLocalPgnAsNewSource: boolean
  canEnterBoardEditor: boolean
}>()

const emit = defineEmits<{
  action: [name: WorkspaceToolbarAction]
}>()

const rootEl = ref<HTMLElement | null>(null)
const localCardEl = ref<HTMLElement | null>(null)
const editorCardEl = ref<HTMLElement | null>(null)
const competitionsCardRef = ref<InstanceType<typeof RouterLink> | null>(null)
const competitionsCardEl = computed(() =>
  competitionsCardRef.value?.$el instanceof HTMLElement ? competitionsCardRef.value.$el : null
)
let context: ReturnType<typeof gsap.context> | null = null

// Press feedback only on actionable cards; disabled or contract-blocked cards
// keep their static disabled presentation.
usePressMotion(localCardEl, () => props.canOpenLocalPgnAsNewSource)
usePressMotion(editorCardEl, () => props.canEnterBoardEditor)
usePressMotion(competitionsCardEl, () => true)

onMounted(() => {
  const root = rootEl.value

  if (!root) return

  context = gsap.context(() => undefined, root)
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.start-card'))

  context.add(() => {
    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: motionScalar(root, '--workspace-motion-distance-panel') },
      {
        autoAlpha: 1,
        y: 0,
        duration: motionDuration(root, '--workspace-motion-duration-panel'),
        ease: motionEase(root, '--workspace-motion-ease-enter'),
        stagger: motionDuration(root, '--workspace-motion-stagger-panel'),
        overwrite: true,
        clearProps: 'opacity,transform,visibility',
      }
    )
  })
})

onBeforeUnmount(() => {
  context?.revert()
  context = null
})
</script>

<template>
  <section ref="rootEl" class="start-surface" aria-labelledby="workspace-start-title">
    <h1 id="workspace-start-title" class="start-title">统一工作区</h1>
    <p class="start-subtitle">选择一种来源开始教学、讲解或分析。</p>

    <div class="start-options">
      <button
        ref="localCardEl"
        class="start-card"
        type="button"
        :disabled="!props.canOpenLocalPgnAsNewSource"
        @click="emit('action', 'openLocal')"
      >
        <strong>本地 PGN</strong>
        <span>导入本地棋谱文件进行教学与批注</span>
      </button>

      <button
        ref="editorCardEl"
        class="start-card"
        type="button"
        :disabled="!props.canEnterBoardEditor"
        @click="emit('action', 'enterBoardEditor')"
      >
        <strong>手动局面</strong>
        <span>自由摆放棋子，创建教学起点</span>
      </button>

      <RouterLink ref="competitionsCardRef" class="start-card" :to="{ name: 'competitions' }">
        <strong>从赛事进入</strong>
        <span>浏览公开赛事，进入讲解或观战</span>
      </RouterLink>

      <div class="start-card disabled" aria-disabled="true">
        <strong>云端棋谱</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>分享/链接棋谱</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>实时观战</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>棋局回放</strong>
        <span>当前版本暂不支持</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.start-surface {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  padding: var(--s-5);
  overflow: auto;
  text-align: center;
}

.start-title {
  margin: 0 0 var(--s-2);
  color: var(--text);
  font-size: var(--fs-2xl);
}

.start-subtitle {
  margin: 0 0 var(--s-6);
  color: var(--text-muted);
  font-size: var(--fs-md);
}

.start-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--workspace-list-w-compact), 1fr));
  gap: var(--s-4);
  width: 100%;
  max-width: calc(var(--workspace-list-w) * 2 + var(--s-4));
}

.start-card {
  display: grid;
  gap: var(--s-2);
  min-height: var(--control-h);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    background-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.start-card strong {
  font-size: var(--fs-lg);
}

.start-card span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.start-card:disabled,
.start-card.disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.start-card:hover:not(:disabled, .disabled) {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
}

@media (width <= 560px) {
  .start-options {
    grid-template-columns: 1fr;
  }
}
</style>
