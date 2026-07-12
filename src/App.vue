<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh
- Modules: app provider root and active workspace route
- Scroll owner: active route modules only
-->
<script setup lang="ts">
import AppProviders from '@/app/providers/AppProviders.vue'
</script>

<template>
  <AppProviders>
    <div class="app-shell">
      <RouterView />
    </div>
  </AppProviders>
</template>

<style scoped>
.app-shell {
  height: var(--workspace-viewport-h);
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}
</style>
