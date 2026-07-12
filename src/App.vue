<!--
Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
- Page height: 100dvh
- Modules: app root only (neutral shell)
- Scroll owner: none (P0 empty bootstrap)
-->
<template>
  <main class="app-shell">
    <p data-p0-bootstrap>Application bootstrap ready.</p>
    <RouterView />
  </main>
</template>

<style scoped>
.app-shell {
  height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--bg);
  color: var(--text);
}
</style>
