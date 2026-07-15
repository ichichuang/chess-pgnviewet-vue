<script setup lang="ts">
import { ProductRouteShell, ProductStateBanner } from '@/ui'
</script>

<template>
  <ProductRouteShell title="页面不可用" subtitle="当前入口无法解析">
    <section class="not-found-state" aria-live="polite">
      <ProductStateBanner status="warning" title="页面不可用">
        当前入口不存在或尚未支持，请返回赛事列表或统一工作区。
      </ProductStateBanner>
      <nav class="not-found-actions">
        <RouterLink class="not-found-link" :to="{ name: 'workspace' }">统一工作区</RouterLink>
        <RouterLink class="not-found-link" :to="{ name: 'competitions' }">赛事列表</RouterLink>
      </nav>
    </section>
  </ProductRouteShell>
</template>

<style scoped>
.not-found-state {
  display: grid;
  gap: var(--s-4);
  padding: var(--s-5);
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
}

.not-found-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-4);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}

.not-found-link:hover {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
  color: var(--accent-strong);
}
</style>
