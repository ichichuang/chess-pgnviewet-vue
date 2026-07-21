<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ProductRouteShell, ProductUnavailableState } from '@/ui'
import { useRouteEntryMotion } from '@/features/motion/useRouteEntryMotion'
import TeachingWorkspace from '@/features/teaching-workspace/TeachingWorkspace.vue'
import {
  readWorkspaceHandoffContext,
  workspaceModeContextFromHandoff,
} from '@/persistence/workspace/workspaceHandoff'

import { provideWorkspaceModeContext } from './workspaceModeContext'
import { resolveWorkspaceModeRouteContext } from './workspaceModeQuery'
import type { WorkspaceModeContext } from './workspaceModeTypes'

const route = useRoute()
const router = useRouter()

const routeRootEl = ref<HTMLElement | null>(null)
useRouteEntryMotion(routeRootEl)

const workspaceModeContext = computed<WorkspaceModeContext>(() => {
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

const handoffInvalid = computed<boolean>(() => {
  const handoffId = queryText(route.query.handoff)
  if (!handoffId) return false
  const handoff = readWorkspaceHandoffContext(handoffId)
  return !handoff
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

function handleReturn(): void {
  router.push({ name: 'competitions' })
}
</script>

<template>
  <ProductRouteShell
    v-if="handoffInvalid"
    :ref="
      (el) => {
        routeRootEl = (el as { $el?: HTMLElement } | null)?.$el ?? null
      }
    "
    title="无法打开此内容"
  >
    <div class="handoff-invalid-surface">
      <ProductUnavailableState
        kind="invalid"
        title="无法打开此内容"
        explanation="这个入口缺少有效信息，或已经失效。你可以返回可用页面重新选择。"
        :safe-return="{ name: 'competitions' }"
        @return="handleReturn"
      />
    </div>
  </ProductRouteShell>
  <TeachingWorkspace v-else />
</template>

<style scoped>
.handoff-invalid-surface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}
</style>
