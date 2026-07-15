<script setup lang="ts">
import type { WorkspaceToolbarAction } from './workspaceToolbarTypes'

const props = defineProps<{
  canImportLocalPgn: boolean
  canEnterBoardEditor: boolean
}>()

const emit = defineEmits<{
  action: [name: WorkspaceToolbarAction]
}>()
</script>

<template>
  <section class="start-surface" aria-labelledby="workspace-start-title">
    <h1 id="workspace-start-title" class="start-title">统一工作区</h1>
    <p class="start-subtitle">选择一种来源开始教学、讲解或分析。</p>

    <div class="start-options">
      <button
        class="start-card"
        type="button"
        :disabled="!props.canImportLocalPgn"
        @click="emit('action', 'openLocal')"
      >
        <strong>本地 PGN</strong>
        <span>导入本地棋谱文件进行教学与批注</span>
      </button>

      <button
        class="start-card"
        type="button"
        :disabled="!props.canEnterBoardEditor"
        @click="emit('action', 'enterBoardEditor')"
      >
        <strong>手动局面</strong>
        <span>自由摆放棋子，创建教学起点</span>
      </button>

      <RouterLink class="start-card" :to="{ name: 'competitions' }">
        <strong>从赛事进入</strong>
        <span>浏览公开赛事，进入讲解或观战</span>
      </RouterLink>

      <div class="start-card disabled" aria-disabled="true">
        <strong>云端棋谱</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>分享/链接棋谱</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>实时观战</strong>
        <span>当前版本暂不支持</span>
      </div>

      <div class="start-card disabled" aria-disabled="true">
        <strong>棋局回放</strong>
        <span>当前版本暂不支持</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.start-surface {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  padding: var(--s-5);
  overflow: auto;
  text-align: center;
}

.start-title {
  margin: 0 0 var(--s-2);
  color: var(--text);
  font-size: var(--fs-2xl);
}

.start-subtitle {
  margin: 0 0 var(--s-6);
  color: var(--text-muted);
  font-size: var(--fs-md);
}

.start-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--workspace-list-w-compact), 1fr));
  gap: var(--s-4);
  width: 100%;
  max-width: calc(var(--workspace-list-w) * 2 + var(--s-4));
}

.start-card {
  display: grid;
  gap: var(--s-2);
  min-height: var(--control-h);
  padding: var(--s-5);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard),
    background-color var(--workspace-motion-duration-fast) var(--workspace-motion-ease-standard);
}

.start-card strong {
  font-size: var(--fs-lg);
}

.start-card span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.start-card:disabled,
.start-card.disabled {
  cursor: default;
  opacity: var(--workspace-disabled-opacity);
}

.start-card:hover:not(:disabled, .disabled) {
  border-color: var(--accent-soft);
  background: var(--state-hover-bg);
}

@media (width <= 560px) {
  .start-options {
    grid-template-columns: 1fr;
  }
}
</style>
