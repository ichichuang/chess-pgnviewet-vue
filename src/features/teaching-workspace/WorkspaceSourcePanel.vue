<script setup lang="ts">
import PgnGameList from '@/features/pgn/components/PgnGameList.vue'
import { usePgnStore } from '@/stores'

import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const props = defineProps<{
  modeLabel: string
  sourceLabel: string
  sourceIdentityLabel: string
  sourceUnavailable: boolean
  unavailableReason: string | null
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
  canCreateEditableLocalCopy: boolean
  canEnterBoardEditor: boolean
}>()

const emit = defineEmits<{
  action: [name: WorkspaceToolbarAction]
}>()

const pgn = usePgnStore()
</script>

<template>
  <section class="source-panel" aria-label="来源">
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

    <PgnGameList
      v-if="pgn.hasGame"
      :can-open-local-pgn-as-new-source="props.canOpenLocalPgnAsNewSource"
      :can-insert-local-pgn-into-current-source="props.canInsertLocalPgnIntoCurrentSource"
      @action="emit('action', $event)"
    />
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
