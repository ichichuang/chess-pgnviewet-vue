<script setup lang="ts">
import { computed, ref } from 'vue'

import SettingsSurface from '@/features/settings'
import { useAuthStore } from '@/stores'
import { ProductButton } from '@/ui'

defineProps<{
  title: string
  subtitle?: string
}>()

const auth = useAuthStore()
const sessionLabel = computed(() => auth.accountLabel)
const settingsOpen = ref(false)
const settingsButtonRef = ref<InstanceType<typeof ProductButton> | null>(null)

function logout(): void {
  auth.logout()
}
</script>

<template>
  <header class="route-header">
    <div class="route-title">
      <RouterLink class="workspace-link" :to="{ name: 'workspace' }">工作区</RouterLink>
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <nav class="route-actions" aria-label="产品入口">
      <RouterLink :to="{ name: 'competitions' }">赛事</RouterLink>
      <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'login' }">登录</RouterLink>
      <button v-else type="button" @click="logout">退出</button>
      <ProductButton
        ref="settingsButtonRef"
        variant="text"
        size="small"
        @click="settingsOpen = true"
      >
        设置
      </ProductButton>
      <span>{{ sessionLabel }}</span>
    </nav>

    <SettingsSurface
      v-model:show="settingsOpen"
      :on-return-focus="() => settingsButtonRef?.focus()"
    />
  </header>
</template>

<style scoped>
.route-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-width: 0;
  padding: var(--s-4) var(--s-5);
  border-bottom: var(--workspace-border-w) solid var(--border);
  background: var(--surface);
}

.route-title {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  min-width: 0;
}

.route-title h1,
.route-title p {
  margin: 0;
}

.route-title h1 {
  color: var(--text);
  font-size: var(--fs-xl);
}

.route-title p {
  margin-top: var(--s-1);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.workspace-link,
.route-actions a,
.route-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-h-sm);
  padding: 0 var(--s-3);
  border: var(--workspace-border-w) solid var(--border-strong);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.route-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--s-2);
}

.route-actions span {
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

@media (width <= 760px) {
  .route-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .route-actions {
    flex-wrap: wrap;
  }

  .workspace-link,
  .route-actions a,
  .route-actions button {
    min-height: var(--board-touch-target-min);
  }
}
</style>
