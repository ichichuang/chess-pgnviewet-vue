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

const route = useRoute()
const workspaceModeContext = computed(() => {
  const handoffId = queryText(route.query.handoff)
  const handoff = handoffId ? readWorkspaceHandoffContext(handoffId) : null

  if (handoff) {
    return workspaceModeContextFromHandoff(handoff)
  }

  return resolveWorkspaceModeRouteContext({
    name: route.name,
    query: route.query,
  })
})

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
