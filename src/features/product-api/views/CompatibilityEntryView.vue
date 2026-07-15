<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  ProductRouteShell,
  ProductStateBanner,
} from '@/ui'
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
  <ProductRouteShell title="兼容入口" subtitle="正在进入统一工作区">
    <section class="handoff-state" aria-live="polite">
      <ProductStateBanner v-if="failed" status="error" title="兼容入口参数无效">
        链接缺少必要信息，无法安全进入工作区。
      </ProductStateBanner>
      <ProductStateBanner v-else status="info" title="正在进入工作区">
        正在准备统一工作区上下文，请稍候。
      </ProductStateBanner>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.handoff-state {
  padding: var(--s-5);
}
</style>
