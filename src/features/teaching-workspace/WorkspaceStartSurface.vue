<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
const competitionsCardEl = ref<HTMLElement | null>(null)

function setCompetitionsCardEl(el: unknown): void {
  const cardEl = (el as { $el?: unknown } | null)?.$el
  competitionsCardEl.value = cardEl instanceof HTMLElement ? cardEl : null
}
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
    <h1 id="workspace-start-title" class="sr-only">开始工作区</h1>

    <div class="start-card-surface">
      <button
        ref="localCardEl"
        class="start-card start-card-primary"
        type="button"
        :disabled="!props.canOpenLocalPgnAsNewSource"
        @click="emit('action', 'openLocal')"
      >
        <strong>导入本地 PGN</strong>
        <span>打开本地棋谱文件进行教学、批注与分析</span>
      </button>

      <div class="start-secondary-row">
        <button
          ref="editorCardEl"
          class="start-card start-card-secondary"
          type="button"
          :disabled="!props.canEnterBoardEditor"
          @click="emit('action', 'enterBoardEditor')"
        >
          <strong>创建手动局面</strong>
          <span>自由摆放棋子，创建教学起点</span>
        </button>

        <RouterLink
          :ref="setCompetitionsCardEl"
          class="start-card start-card-tertiary"
          :to="{ name: 'competitions' }"
        >
          <strong>浏览公开赛事</strong>
          <span>查看赛事、组别、轮次与对阵</span>
        </RouterLink>
      </div>

      <p class="start-unavailable-note">
        云端棋谱、分享链接、实时观战与棋局回放暂不支持；未来可用时将明确提示创建本地副本。
      </p>
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
  overflow: hidden;
}

.start-card-surface {
  display: grid;
  gap: var(--s-4);
  width: min(100%, calc(var(--workspace-list-w) * 2 + var(--s-4)));
}

.start-secondary-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
}

.start-card {
  display: grid;
  gap: var(--s-2);
  min-height: var(--control-h);
  padding: var(--s-4);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
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

.start-card:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.start-card:hover:not(:disabled) {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
}

.start-card-primary {
  border-color: var(--accent-line);
  background: var(--accent-bg);
}

.start-card-primary strong {
  color: var(--accent-strong);
}

.start-card-primary:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-bg-2);
}

.start-card-tertiary {
  border-style: dashed;
  background: transparent;
}

.start-card-tertiary:hover {
  background: var(--surface-2);
}

.start-unavailable-note {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Synchronized with --workspace-bp-mobile in tokens.css. */
@media (width <= 560px) {
  .start-secondary-row {
    grid-template-columns: 1fr;
  }
}
</style>
