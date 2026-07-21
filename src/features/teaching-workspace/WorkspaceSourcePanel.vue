<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from '@/features/motion/gsapTokens'
import {
  completeLeaveImmediately,
  createStateEnterHook,
} from '@/features/motion/stateEnterHooks'
import PgnGameList from '@/features/pgn/components/PgnGameList.vue'
import type { PgnNavigationIntent } from '@/features/pgn/pgnWorkspaceTypes'
import { usePgnStore } from '@/stores'

import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const props = defineProps<{
  modeLabel: string
  sourceLabel: string
  sourceIdentityLabel: string
  localChangeDescription: string
  sourceUnavailable: boolean
  unavailableReason: string | null
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
  canCreateEditableLocalCopy: boolean
  canEnterBoardEditor: boolean
}>()

const emit = defineEmits<{
  action: [name: WorkspaceToolbarAction]
  navigate: [intent: PgnNavigationIntent]
}>()

const pgn = usePgnStore()

const rootEl = ref<HTMLElement | null>(null)
const onStateEnter = createStateEnterHook(rootEl)
let context: ReturnType<typeof gsap.context> | null = null

// Genuine source switch: dip the whole panel container to the refresh token
// opacity and back, once — never per render and never per item.
async function animateSourceRefresh(): Promise<void> {
  await nextTick()
  const root = rootEl.value

  if (!root || !context) return

  const half = motionDuration(root, '--workspace-motion-duration-fast') / 2

  context.add(() => {
    gsap.to(root, {
      keyframes: [
        { autoAlpha: motionScalar(root, '--workspace-motion-refresh-dip-opacity'), duration: half },
        { autoAlpha: 1, duration: half },
      ],
      ease: motionEase(root, '--workspace-motion-ease-state'),
      overwrite: true,
      clearProps: 'opacity,visibility',
    })
  })
}

watch(
  () => [props.sourceLabel, props.sourceIdentityLabel],
  () => void animateSourceRefresh(),
  { flush: 'post' }
)

onMounted(() => {
  if (rootEl.value) context = gsap.context(() => undefined, rootEl.value)
})

onBeforeUnmount(() => {
  if (rootEl.value) gsap.killTweensOf(rootEl.value)
  context?.revert()
  context = null
})
</script>

<template>
  <section ref="rootEl" class="source-panel" aria-label="来源">
    <header class="source-panel-head">
      <div class="source-panel-identity">
        <span class="source-panel-mode">{{ props.modeLabel }}</span>
        <span class="source-panel-source">{{ props.sourceLabel }}</span>
        <span v-if="props.sourceIdentityLabel" class="source-panel-source-identity">
          {{ props.sourceIdentityLabel }}
        </span>
      </div>
      <p v-if="props.sourceUnavailable && props.unavailableReason" class="source-panel-unavailable">
        {{ props.unavailableReason }}
      </p>
      <p v-if="props.localChangeDescription" class="source-panel-local-change" aria-live="polite">
        {{ props.localChangeDescription }}
      </p>
    </header>

    <div class="source-panel-actions">
      <button
        class="source-panel-action"
        type="button"
        :disabled="!props.canOpenLocalPgnAsNewSource"
        @click="emit('action', 'openLocal')"
      >
        导入本地 PGN
      </button>
      <button
        v-if="props.canCreateEditableLocalCopy"
        class="source-panel-action"
        type="button"
        @click="emit('action', 'createEditableLocalCopy')"
      >
        创建本地可编辑副本
      </button>
      <button
        class="source-panel-action"
        type="button"
        :disabled="!props.canEnterBoardEditor"
        @click="emit('action', 'enterBoardEditor')"
      >
        手动局面
      </button>
      <RouterLink class="source-panel-action" :to="{ name: 'competitions' }">从赛事进入</RouterLink>
    </div>

    <Transition :css="false" @enter="onStateEnter" @leave="completeLeaveImmediately">
      <PgnGameList
        v-if="pgn.hasGame"
        :can-open-local-pgn-as-new-source="props.canOpenLocalPgnAsNewSource"
        :can-insert-local-pgn-into-current-source="props.canInsertLocalPgnIntoCurrentSource"
        @action="emit('action', $event)"
        @navigate="emit('navigate', $event)"
      />
    </Transition>
  </section>
</template>

<style scoped>
.source-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--surface);
  color: var(--text);
}

.source-panel-head {
  flex: 0 0 auto;
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface-2);
}

.source-panel-identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2);
  min-width: 0;
}

.source-panel-mode {
  color: var(--text);
  font-size: var(--fs-md);
  font-weight: 700;
}

.source-panel-source {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.source-panel-source-identity {
  color: var(--accent-strong);
  font-size: var(--fs-xs);
}

.source-panel-unavailable {
  margin: 0;
  color: var(--warning);
  font-size: var(--fs-sm);
}

.source-panel-local-change {
  margin: 0;
  color: var(--warning);
  font-size: var(--fs-sm);
}

.source-panel-actions {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--workspace-border-w) solid var(--border);
}

.source-panel-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.source-panel-action:disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.source-panel-action:hover:not(:disabled) {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}
</style>
