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
  const context = createWorkspaceHandoffContext({
    mode: 'live_spectator',
    source: 'electronic_board_live',
    readonly: true,
    competitionId: routeText(route.params.hdid),
    groupId: routeText(route.query.group),
    roundId: routeText(route.query.round),
    boardId: routeText(route.query.board),
    qrcode: routeText(route.query.qrcode),
    serialNumber: routeText(route.query.sn),
    returnRoute: route.fullPath,
  })

  if (!saveWorkspaceHandoffContext(context)) {
    failed.value = true
    return
  }

  await router.replace(buildRootWorkspaceRouteFromHandoff(context))
})
</script>

<template>
  <ProductRouteShell title="直播入口" subtitle="正在进入统一工作区">
    <section class="handoff-state" aria-live="polite">
      <ProductStateBanner v-if="failed" status="error" title="直播入口参数无效">
        链接缺少必要信息，无法安全进入实时观战。
      </ProductStateBanner>
      <ProductStateBanner v-else status="info" title="正在进入工作区">
        正在准备实时观战上下文，请稍候。
      </ProductStateBanner>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.handoff-state {
  padding: var(--s-5);
}
</style>
