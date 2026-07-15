<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import TeachingWorkspace from '@/features/teaching-workspace/TeachingWorkspace.vue'
import {
  readWorkspaceHandoffContext,
  workspaceModeContextFromHandoff,
} from '@/persistence/workspace/workspaceHandoff'

import { provideWorkspaceModeContext } from './workspaceModeContext'
import { resolveWorkspaceModeRouteContext } from './workspaceModeQuery'
import type { WorkspaceModeContext } from './workspaceModeTypes'

const route = useRoute()
const workspaceModeContext = computed(() => {
  const handoffId = queryText(route.query.handoff)

  if (handoffId) {
    const handoff = readWorkspaceHandoffContext(handoffId)
    if (handoff) {
      return workspaceModeContextFromHandoff(handoff)
    }
    return blockedContext()
  }

  return resolveWorkspaceModeRouteContext({
    name: route.name,
    query: route.query,
  })
})

function blockedContext(): WorkspaceModeContext {
  return {
    mode: 'unknown',
    source: 'unknown',
    readonly: true,
    competitionId: '',
    groupId: '',
    roundId: '',
    boardId: '',
    qrcode: '',
    serialNumber: '',
    gameId: '',
    matchId: '',
    view: '',
    warnings: ['handoff unavailable'],
  }
}

provideWorkspaceModeContext(workspaceModeContext)

defineExpose({ workspaceModeContext })

function queryText(value: unknown): string {
  if (Array.isArray(value)) return value.find((item) => typeof item === 'string')?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}
</script>

<template>
  <TeachingWorkspace />
</template>
