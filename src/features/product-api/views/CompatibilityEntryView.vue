<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import RouteHeader from '@/features/product-api/components/RouteHeader.vue'
import {
  buildRootWorkspaceRouteFromHandoff,
  createWorkspaceHandoffContext,
  saveWorkspaceHandoffContext,
} from '@/persistence/workspace/workspaceHandoff'

const route = useRoute()
const router = useRouter()
const failed = ref(false)

function routeText(value: unknown): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

onMounted(async () => {
  const name = String(route.name ?? '')
  const isCloud = name === 'cloud'
  const identifier =
    routeText(route.params.key) || routeText(route.params.uuid) || routeText(route.params.fileid)
  const context = createWorkspaceHandoffContext({
    mode: 'analysis',
    source: isCloud ? 'cloud_pgn' : 'backend_handoff_pgn',
    readonly: false,
    matchId: identifier,
    gameId: name === 'match' ? identifier : '',
    returnRoute: route.fullPath,
  })

  if (!identifier || !saveWorkspaceHandoffContext(context)) {
    failed.value = true
    return
  }

  await router.replace(buildRootWorkspaceRouteFromHandoff(context))
})
</script>

<template>
  <main class="handoff-route">
    <RouteHeader title="兼容入口" subtitle="正在进入统一工作区" />
    <section class="handoff-state" aria-live="polite">
      <strong v-if="failed">兼容入口参数无效</strong>
      <strong v-else>正在进入工作区</strong>
    </section>
  </main>
</template>

<style scoped>
.handoff-route {
  display: flex;
  flex-direction: column;
  min-height: var(--workspace-viewport-h);
  background: var(--bg);
  color: var(--text);
}

.handoff-state {
  padding: var(--s-5);
}
</style>
