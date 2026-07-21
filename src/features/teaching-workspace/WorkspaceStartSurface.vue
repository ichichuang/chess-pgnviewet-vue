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
const localActionEl = ref<HTMLElement | null>(null)
const editorActionEl = ref<HTMLElement | null>(null)
const competitionsActionEl = ref<HTMLElement | null>(null)

function setCompetitionsActionEl(el: unknown): void {
  const actionEl = (el as { $el?: unknown } | null)?.$el
  competitionsActionEl.value = actionEl instanceof HTMLElement ? actionEl : null
}

let context: ReturnType<typeof gsap.context> | null = null

usePressMotion(localActionEl, () => props.canOpenLocalPgnAsNewSource)
usePressMotion(editorActionEl, () => props.canEnterBoardEditor)
usePressMotion(competitionsActionEl, () => true)

onMounted(() => {
  const root = rootEl.value

  if (!root) return

  context = gsap.context(() => undefined, root)
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-start-entry]'))

  context.add(() => {
    gsap.fromTo(
      targets,
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
    <div class="start-content">
      <header data-start-entry class="start-header">
        <h1 id="workspace-start-title">尚未选择棋局</h1>
        <p>导入本地棋谱、设置教学局面，或从公开赛事中选择一盘棋。</p>
      </header>

      <div data-start-entry class="start-primary-actions">
        <button
          ref="localActionEl"
          class="start-action primary"
          type="button"
          :disabled="!props.canOpenLocalPgnAsNewSource"
          @click="emit('action', 'openLocal')"
        >
          <strong>导入本地 PGN</strong>
          <span>选择一个或多个棋谱文件开始教学</span>
        </button>

        <button
          ref="editorActionEl"
          class="start-action"
          type="button"
          :disabled="!props.canEnterBoardEditor"
          @click="emit('action', 'enterBoardEditor')"
        >
          <strong>设置局面</strong>
          <span>自由摆放棋子并创建新的教学起点</span>
        </button>
      </div>

      <RouterLink
        :ref="setCompetitionsActionEl"
        data-start-entry
        class="competition-entry"
        :to="{ name: 'competitions' }"
      >
        浏览公开赛事并选择讲解对局
        <span aria-hidden="true">→</span>
      </RouterLink>

      <aside data-start-entry class="future-sources" aria-label="尚未开放的来源">
        <strong>其他来源</strong>
        <span>云端棋谱、分享链接、实时观战和远程回放将在对应服务可用后开放。</span>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.start-surface {
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-width: 0;
  min-height: 0;
  padding: var(--s-6);
  overflow: auto;
}

.start-content {
  display: grid;
  gap: var(--s-5);
  width: min(100%, calc(var(--workspace-list-w) * 2));
}

.start-header {
  display: grid;
  gap: var(--s-2);
  text-align: center;
}

.start-header h1,
.start-header p {
  margin: 0;
}

.start-header h1 {
  color: var(--text);
  font-size: var(--fs-2xl);
}

.start-header p {
  color: var(--text-muted);
  font-size: var(--fs-md);
}

.start-primary-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
}

.start-action {
  display: grid;
  gap: var(--s-2);
  min-height: calc(var(--control-h) * 2);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    background-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.start-action.primary {
  border-color: var(--accent-line);
  background: var(--accent-bg);
}

.start-action strong {
  font-size: var(--fs-lg);
}

.start-action span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.start-action:hover:not(:disabled),
.start-action:focus-visible {
  border-color: var(--accent);
  background: var(--state-hover-bg);
}

.start-action:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.competition-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-height: var(--control-h);
  color: var(--accent-strong);
  font-weight: 600;
  text-decoration: none;
}

.competition-entry:hover,
.competition-entry:focus-visible {
  text-decoration: underline;
}

.future-sources {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--s-2);
  padding-top: var(--s-4);
  border-top: var(--workspace-border-w) solid var(--border);
  color: var(--text-muted);
  font-size: var(--fs-sm);
  text-align: center;
}

.future-sources strong {
  flex: 0 0 auto;
  color: var(--text-2);
}
</style>
