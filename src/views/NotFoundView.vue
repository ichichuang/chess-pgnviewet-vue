<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useRouteEntryMotion } from '@/features/motion/useRouteEntryMotion'
import { ProductRouteShell, ProductUnavailableState } from '@/ui'

const router = useRouter()

const routeRootEl = ref<HTMLElement | null>(null)
useRouteEntryMotion(routeRootEl)

function handleReturn(): void {
  router.push({ name: 'competitions' })
}
</script>

<template>
  <ProductRouteShell :ref="(el) => { routeRootEl = (el as any)?.$el ?? null }" title="页面不可用">
    <div class="not-found-surface">
      <ProductUnavailableState
        kind="invalid"
        title="页面不可用"
        explanation="当前入口不存在或尚未支持，请返回赛事列表或统一工作区。"
        :safe-return="{ name: 'competitions' }"
        @return="handleReturn"
      />
    </div>
  </ProductRouteShell>
</template>

<style scoped>
.not-found-surface {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}
</style>
